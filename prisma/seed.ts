import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

// deterministic RNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const rand = (min: number, max: number) => min + rng() * (max - min);
const randInt = (min: number, max: number) => Math.round(rand(min, max));

async function main() {
  console.log("Seeding ContentOS demo data…");

  await prisma.session.deleteMany();
  await prisma.contentDraft.deleteMany();
  await prisma.contentSlot.deleteMany();
  await prisma.competitorSnapshot.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.post.deleteMany();
  await prisma.profileSnapshot.deleteMany();
  await prisma.instagramAccount.deleteMany();
  await prisma.brandConfig.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "demo@contentos.app",
      name: "Maya Reyes",
      tier: "PRO",
      onboardingStep: 5,
      onboardingDone: true,
      brandConfig: {
        create: {
          niche: "Productivity & creator economy",
          handle: "@maya.builds",
          goal: "Grow from 8k to 50k followers in 12 months",
          audience: "Solo founders and creators building public",
          tone: "Warm, direct, actionable — no fluff",
          pillars: JSON.stringify([
            { name: "Build in public", description: "Weekly progress, wins and failures" },
            { name: "Systems", description: "Frameworks and workflows that scale" },
            { name: "Deep dives", description: "One topic, fully unpacked" },
            { name: "Personal", description: "Behind-the-scenes and perspective" },
          ]),
          hashtagBank: JSON.stringify([
            "#buildinpublic",
            "#creatoreconomy",
            "#solofounder",
            "#productivity",
            "#indiehacker",
            "#contentcreator",
            "#systems",
            "#personalbrand",
          ]),
          postingDays: JSON.stringify([1, 3, 5, 7]),
          postingTime: "18:00",
        },
      },
    },
  });

  const account = await prisma.instagramAccount.create({
    data: {
      userId: user.id,
      igId: "ig-demo-001",
      username: "maya.builds",
      displayName: "Maya Reyes",
      connected: true,
      source: "seed",
      followerCount: 8420,
      followingCount: 318,
      mediaCount: 46,
    },
  });

  // 120 days of daily snapshots with a realistic growth curve
  const snapshots = [];
  const today = new Date();
  let followers = 3400;
  for (let i = 119; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0); // midnight so the sync pipeline's per-day upsert matches
    followers += randInt(6, 85);
    const reach = randInt(2800, 14000);
    snapshots.push({
      accountId: account.id,
      date: d,
      followers,
      following: 318,
      mediaCount: 40 + Math.floor((119 - i) / 3),
      engagementRate: Number(rand(2.4, 7.8).toFixed(2)),
      reach,
      impressions: Math.round(reach * rand(1.4, 2.2)),
      profileViews: randInt(120, 900),
      source: "seed",
    });
  }
  await prisma.profileSnapshot.createMany({ data: snapshots });
  await prisma.instagramAccount.update({
    where: { id: account.id },
    data: { followerCount: followers },
  });

  // 40 posts over the last 120 days
  const captionPool = [
    "The system I use to write 3 reels in 60 minutes (template inside)",
    "Nobody cares about your posting schedule. They care about this.",
    "I grew 4,000 followers in 90 days. Here is exactly what changed.",
    "Stop creating content for the algorithm. Create for this person.",
    "The 5-minute content ritual that compounds",
    "Why your reels get 200 views (and how to fix it)",
    "I asked ChatGPT to roast my bio. It was brutal.",
    "The retention curve is lying to you",
    "A content calendar is a promise to yourself",
    "3 hooks that stopped my scroll",
    "Your first 10 posts are the hardest. Here's why that's a gift",
    "What nobody tells you about the creator grind",
    "The one metric that actually predicts growth",
    "I deleted 40 posts last month. My reach went up.",
    "Systems beat motivation — here is the proof",
  ];
  const mediaTypes = ["REEL", "CAROUSEL", "SINGLE", "REEL", "REEL", "CAROUSEL"];
  const posts = [];
  for (let i = 0; i < 40; i++) {
    const posted = new Date(today);
    posted.setDate(posted.getDate() - randInt(1, 119));
    posted.setHours(randInt(10, 22), randInt(0, 59), 0, 0);
    const likes = randInt(120, 2600);
    posts.push({
      accountId: account.id,
      igId: `post-${i}`,
      caption: pick(captionPool),
      mediaType: pick(mediaTypes) as never,
      postedAt: posted,
      likes,
      comments: randInt(4, 180),
      saves: randInt(10, 400),
      shares: randInt(2, 120),
      reach: randInt(1200, 18000),
      impressions: randInt(1800, 28000),
    });
  }
  await prisma.post.createMany({ data: posts });

  // Competitor with 3 snapshots
  const comp = await prisma.competitor.create({
    data: {
      userId: user.id,
      username: "naval_daily",
      lastAnalyzedAt: new Date(),
    },
  });
  await prisma.competitorSnapshot.createMany({
    data: [
      {
        competitorId: comp.id,
        date: new Date(Date.now() - 28 * 86400000),
        followers: 1240000,
        following: 12,
        posts: 412,
        engagementRate: 1.8,
        avgLikes: 21400,
        avgComments: 310,
        postingFrequency: 2.1,
        topHashtags: JSON.stringify(["#mindset", "#wisdom", "#success", "#productivity"]),
        themes: JSON.stringify([
          { theme: "Wisdom quotes", share: 0.42, engagement: 1.9 },
          { theme: "Philosophy", share: 0.26, engagement: 1.6 },
          { theme: "Business", share: 0.21, engagement: 2.2 },
          { theme: "Personal", share: 0.11, engagement: 1.1 },
        ]),
      },
      {
        competitorId: comp.id,
        date: new Date(Date.now() - 14 * 86400000),
        followers: 1250000,
        following: 13,
        posts: 419,
        engagementRate: 1.7,
        avgLikes: 20900,
        avgComments: 298,
        postingFrequency: 2.0,
        topHashtags: JSON.stringify(["#mindset", "#wisdom", "#success"]),
        themes: JSON.stringify([
          { theme: "Wisdom quotes", share: 0.44, engagement: 1.8 },
          { theme: "Philosophy", share: 0.25, engagement: 1.5 },
          { theme: "Business", share: 0.20, engagement: 2.1 },
          { theme: "Personal", share: 0.11, engagement: 1.0 },
        ]),
      },
      {
        competitorId: comp.id,
        date: new Date(),
        followers: 1260000,
        following: 14,
        posts: 428,
        engagementRate: 1.7,
        avgLikes: 21300,
        avgComments: 305,
        postingFrequency: 2.2,
        topHashtags: JSON.stringify(["#mindset", "#wisdom", "#success", "#stoicism"]),
        themes: JSON.stringify([
          { theme: "Wisdom quotes", share: 0.43, engagement: 1.8 },
          { theme: "Philosophy", share: 0.27, engagement: 1.7 },
          { theme: "Business", share: 0.19, engagement: 2.0 },
          { theme: "Personal", share: 0.11, engagement: 1.2 },
        ]),
        report: `# Competitive Report: @naval_daily\n\n## Positioning\nA thought-leadership account monetizing brevity...`,
        reportJson: JSON.stringify({
          summary: "Thought-leadership account dominating wisdom-quote niche",
          positioning:
            "A quote-driven philosophy page that trades depth for shareable one-liners.",
          strengths: ["Consistent cadence", "Ultra-short formats", "Brandable quotes"],
          weaknesses: [
            "No storytelling depth or personal narrative",
            "Low saves vs reach — consumable, not useful",
            "No community mechanics",
          ],
          contentThemes: [
            { theme: "Wisdom quotes", share: 0.43, engagement: 1.8 },
            { theme: "Philosophy", share: 0.27, engagement: 1.7 },
            { theme: "Business", share: 0.19, engagement: 2.2 },
            { theme: "Personal", share: 0.11, engagement: 1.1 },
          ],
          gaps: [
            "No long-form breakdowns of a single idea",
            "No carousel systems or frameworks",
            "No weekly narrative deep-dive",
          ],
          recommendations: [
            "Own long-form breakdowns of a single idea",
            "Package concepts into carousel systems",
            "Publish a weekly narrative deep-dive",
          ],
          titleIdeas: [
            "The idea behind the idea",
            "One concept, fully unpacked",
            "The framework I wish I found earlier",
          ],
        }),
      },
    ],
  });

  // 6 weeks of calendar slots with drafts (past week posted, next 5 weeks in pipeline)
  const slotState = (weeksFromNow: number): [string, boolean] => {
    if (weeksFromNow < 0) return ["POSTED", true];
    if (weeksFromNow === 0) return ["SCHEDULED", true];
    if (weeksFromNow === 1) return ["READY", true];
    if (weeksFromNow === 2) return ["WRITING", true];
    return ["IDEA", false];
  };

  const topics = [
    "My 90-day content system (full breakdown)",
    "How I write hooks people actually stop on",
    "The retention curve is lying to you",
    "3 tools I use to run my content pipeline",
    "Why building in public compounds",
    "The content pillar framework I use",
    "How to turn one idea into 10 posts",
    "What I learned deleting 40 posts",
    "The 5-minute daily content ritual",
    "Audience-first vs algorithm-first content",
    "My bio rewrite (before & after)",
    "Systems that made me consistent",
    "The first 10 posts are the hardest",
    "How I batch 3 reels in 60 minutes",
    "The one metric that predicts growth",
    "A week in the life of a creator",
    "Stop optimizing reach. Optimize memory.",
    "The comment section is your market research",
    "How I structure a 30-second reel",
    "Content gaps: where opportunity hides",
  ];

  for (let w = -1; w < 5; w++) {
    const days = w === -1 ? [1, 3, 5] : [1, 3, 5, 7];
    for (const dow of days) {
      const d = new Date(today);
      d.setDate(d.getDate() + w * 7 - ((today.getDay() - dow + 7) % 7));
      const [status, hasDraft] = slotState(w);
      const mediaType = pick(["REEL", "REEL", "CAROUSEL", "STORY"]);
      const topic = pick(topics);
      const slot = await prisma.contentSlot.create({
        data: {
          userId: user.id,
          date: d,
          time: "18:00",
          mediaType: mediaType as never,
          pillar: pick(["Build in public", "Systems", "Deep dives", "Personal"]),
          status: status as never,
        },
      });
      if (hasDraft) {
        await prisma.contentDraft.create({
          data: {
            slotId: slot.id,
            topic,
            hookVariants: JSON.stringify([
              `I grew 4,000 followers in 90 days. Here's the system.`,
              `This is the exact calendar I use to stay consistent.`,
              `Nobody tells you how hard the first 10 posts are.`,
            ]),
            script: `0-3s: Hook: "This system took me 90 days to build."\n3-10s: Context: what changed when I started using it\n10-20s: Step 1: pillar planning, one hour per month\n20-32s: Step 2: batch writing, 3 slots, 60 minutes\n32-40s: Step 3: schedule + forget, never chase the algorithm\n40-48s: CTA: save this for your next planning session`,
            caption: `${topic}\n\nThis is the system that changed everything for me. Swipe through and steal what works.\n\nWhat's your biggest content blocker? Tell me below 👇`,
            hashtags: JSON.stringify([
              "#buildinpublic",
              "#creatoreconomy",
              "#solofounder",
              "#contentstrategy",
            ]),
            cta: "Save this post for your next planning session",
            thumbnailIdea: "Split screen: messy notes vs clean calendar, bold yellow caption",
            aiParams: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              generated: true,
              storytellingLevel: 4,
              narrative: {
                role: "The builder standing at the threshold of a bigger audience",
                stakes: "Another month of posting into the void — or a system that compounds",
                transformation: "From random posting to a ritual that grows while you sleep",
                openLoop: "What will your first saved post unlock?",
              },
            }),
          },
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log(`  User: demo@contentos.app`);
  console.log(`  Account: @maya.builds (${followers.toLocaleString()} followers)`);
  console.log(`  Snapshots: ${snapshots.length}, Posts: ${posts.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
