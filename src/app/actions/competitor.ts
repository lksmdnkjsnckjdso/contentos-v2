"use server";

import { prisma } from "@/lib/db";
import { scrapeInstagramProfile, deriveScrapeMetrics } from "@/lib/instagram";
import { parseCompetitorCsv } from "@/lib/csv";
import {
  chatJSON,
  competitorReportSchema,
  competitorExample,
  discoverySchema,
  discoveryExample,
  type CompetitorReport,
  type DiscoveredCompetitor,
} from "@/lib/groq";

export async function discoverCompetitors(input: {
  niche: string;
  description: string;
  audience: string;
}) {
  const niche = input.niche.trim();
  const description = input.description.trim();
  const audience = input.audience.trim();
  if (!niche) return { ok: false as const, error: "Niche is required" };

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return { ok: false as const, error: "No user — run the seed first" };

  const system = `You are a growth strategist building a competitive intelligence database for a personal brand.

Your goal is NOT to find the biggest accounts. Your goal is to find accounts that are currently producing content patterns worth studying: repeatable viral formats, unusually strong engagement, clear niche positioning.

Think in three buckets:
- Bucket A · Authority Creators: large established creators (study their format, don't copy their position).
- Bucket B · Growth Creators: fast-growing creators with strong momentum.
- Bucket C · Hidden Creators: smaller accounts (under 50k) with unusually strong engagement per follower.

For every competitor identify: content pillars, hook style, audience, and unique positioning.

Score each competitor:
- Niche Relevance (40%) — how directly their content overlaps the user's niche and audience.
- Engagement Quality (30%) — relative engagement, save/comment density, community response.
- Content Consistency (20%) — repeatable cadence and formats.
- Growth Potential (10%) — momentum, freshness, untapped audience.

Priorities:
- Priority 1: strong engagement + repeatable content format + clear niche positioning.
- Priority 2: large audience + good content + moderate relevance.
- Priority 3: low relevance to the user's specific niche.

Rules:
- The competitors array MUST contain EXACTLY 20 entries. Count them before finishing: if you have fewer than 20, add more accounts until you reach 20. Mix authority, growth and hidden creators.
- Prefer engagement over follower count; prefer niche specificity over popularity.
- Prefer real, verifiable Instagram accounts (do not invent usernames).
- contentPillars: 2-4 main themes. researchPriority: 1-3. followerRange: like "10k-50k" or "500k-1M".
- Do NOT generate generic influencer lists. Be specific about why each account matters.

Also return: emerging creators and authority creators as username lists, the content gaps/opportunities nobody covers in this niche (topics, angles, contrarian takes, emerging trends), and concrete research recommendations (what to scrape first, what to track weekly).`;

  const userPrompt = `User Niche:
${niche}

User Description:
${description || "n/a"}

User Target Audience:
${audience || "n/a"}`;

  try {
    const result = await chatJSON(discoverySchema, system, userPrompt, discoveryExample, 0.7, 8192);

    await prisma.nicheResearch.deleteMany({ where: { userId: user.id } });
    const research = await prisma.nicheResearch.create({
      data: {
        userId: user.id,
        nicheSummary: result.nicheSummary,
        competitors: JSON.stringify(result.competitors),
        emergingCreators: JSON.stringify(result.emergingCreators),
        authorityCreators: JSON.stringify(result.authorityCreators),
        contentOpportunities: JSON.stringify(result.contentOpportunities),
        researchRecommendations: JSON.stringify(result.researchRecommendations),
      },
    });

    return { ok: true as const, researchId: research.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Discovery failed";
    return { ok: false as const, error: message };
  }
}

export async function addDiscoveredCompetitor(input: DiscoveredCompetitor) {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return { ok: false as const, error: "No user — run the seed first" };

  const competitor = await prisma.competitor.upsert({
    where: { userId_username: { userId: user.id, username: input.username } },
    create: {
      userId: user.id,
      username: input.username,
      displayName: input.displayName,
      category: input.category,
      followerRange: input.followerRange,
      engagementQuality: input.engagementQuality,
      reasonSelected: input.reasonSelected,
      audienceType: input.audienceType,
      researchPriority: input.researchPriority,
    },
    update: {
      displayName: input.displayName,
      category: input.category,
      followerRange: input.followerRange,
      engagementQuality: input.engagementQuality,
      reasonSelected: input.reasonSelected,
      audienceType: input.audienceType,
      researchPriority: input.researchPriority,
    },
  });

  return { ok: true as const, id: competitor.id, username: competitor.username };
}

export async function importCompetitorsCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "No file provided" };
  if (file.size > 512 * 1024) return { ok: false as const, error: "File too large (max 512 KB)" };

  const text = await file.text();
  const { rows, errors } = parseCompetitorCsv(text);
  if (rows.length === 0) {
    return { ok: false as const, error: errors[0] ?? "No valid rows found", errors };
  }

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return { ok: false as const, error: "No user — run the seed first" };

  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    if (seen.has(r.username)) return false;
    seen.add(r.username);
    return true;
  });

  let added = 0;
  for (const r of deduped) {
    const competitor = await prisma.competitor.upsert({
      where: { userId_username: { userId: user.id, username: r.username } },
      create: { userId: user.id, username: r.username, lastAnalyzedAt: new Date() },
      update: { lastAnalyzedAt: new Date() },
    });
    await prisma.competitorSnapshot.create({
      data: {
        competitorId: competitor.id,
        followers: r.followers,
        following: r.following,
        posts: r.posts,
        engagementRate: r.engagementRate,
        avgLikes: r.avgLikes,
        avgComments: r.avgComments,
        postingFrequency: r.postingFrequency,
        topHashtags: JSON.stringify(r.topHashtags),
        source: "CSV",
      },
    });
    added++;
  }

  return {
    ok: true as const,
    imported: added,
    skipped: rows.length - added,
    errors,
  };
}

export async function analyzeCompetitor(usernameInput: string) {
  const username = usernameInput.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(username))
    return { ok: false as const, error: "Invalid Instagram username" };

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return { ok: false as const, error: "No user — run the seed first" };

  const scraped = await scrapeInstagramProfile(username);

  if (scraped.source === "fallback") {
    return {
      ok: false as const,
      error:
        "Instagram blocked the scrape for @" +
        username +
        ". Add manual data via CSV import instead.",
      scraped,
    };
  }

  const { avgLikes, avgComments, er, postingFrequency, hashtags } = deriveScrapeMetrics(scraped);

  const system = `You are ContentOS's competitive-intelligence strategist.
You analyze an Instagram account and produce a brutal, actionable competitive report for a creator who wants to win in the same niche.
Output must be a single JSON object matching the schema. theme shares must sum to 1.0. Be specific, not generic.`;

  const userPrompt = `Competitor profile:
- Username: @${scraped.username}
- Name: ${scraped.fullName ?? "unknown"}
- Followers: ${scraped.followers.toLocaleString()}
- Following: ${scraped.following}
- Post count: ${scraped.posts}
- Bio: ${scraped.biography ?? "n/a"}
- Estimated engagement rate: ${er.toFixed(2)}%
- Posts per week: ${postingFrequency.toFixed(1)}
- Avg likes: ${avgLikes.toFixed(0)}, avg comments: ${avgComments.toFixed(1)}
- Top hashtags: ${hashtags.join(", ")}

Recent posts (caption | likes | comments | type):
${scraped.recentPosts
  .slice(0, 12)
  .map(
    (p) =>
      `"${(p.caption ?? "").slice(0, 140)}" | ${p.likes} | ${p.comments} | ${p.mediaType}`
  )
  .join("\n")}

Deliver: a positioning summary, explicit strengths/weaknesses, the content themes with share of content and relative engagement, the gaps a challenger can exploit, and 5 concrete recommendations with 5 ready-to-use content title ideas.`;

  try {
    const report: CompetitorReport = await chatJSON(
      competitorReportSchema,
      system,
      userPrompt,
      competitorExample,
      0.6
    );

    const competitor = await prisma.competitor.upsert({
      where: { userId_username: { userId: user.id, username } },
      create: { userId: user.id, username, lastAnalyzedAt: new Date() },
      update: { lastAnalyzedAt: new Date() },
    });

    await prisma.competitorSnapshot.create({
      data: {
        competitorId: competitor.id,
        followers: scraped.followers,
        following: scraped.following,
        posts: scraped.posts,
        engagementRate: Number(er.toFixed(2)),
        avgLikes: Number(avgLikes.toFixed(1)),
        avgComments: Number(avgComments.toFixed(1)),
        postingFrequency: Number(postingFrequency.toFixed(2)),
        topHashtags: JSON.stringify(hashtags),
        themes: JSON.stringify(report.contentThemes),
        reportJson: JSON.stringify(report),
      },
    });

    return { ok: true as const, username, report };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return { ok: false as const, error: message };
  }
}
