import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CompetitorsView } from "@/components/competitors/competitors-view";
import { IntelligenceDashboard } from "@/components/competitors/intelligence/intelligence-dashboard";
import { buildIntelligence, type IntelInput } from "@/lib/intelligence-data";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const user = await requireUser();
  if (!user) redirect("/login?callbackUrl=/competitors");

  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    include: { brandConfig: true },
  });
  const competitors = userRow
    ? await prisma.competitor.findMany({
        where: { userId: userRow.id },
        include: { snapshots: { orderBy: { date: "asc" } } },
        orderBy: { lastAnalyzedAt: "desc" },
      })
    : [];

  const research = userRow
    ? await prisma.nicheResearch.findFirst({
        where: { userId: userRow.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const rows = competitors.map((c) => {
    const s = c.snapshots[c.snapshots.length - 1];
    const first = c.snapshots[0];
    const followerDelta30d =
      s && first && first.followers > 0
        ? ((s.followers - first.followers) / first.followers) * 100
        : 0;
    return {
      id: c.id,
      username: c.username,
      displayName: c.displayName ?? null,
      category: c.category ?? null,
      followerRange: c.followerRange ?? null,
      engagementQuality: c.engagementQuality ?? null,
      reasonSelected: c.reasonSelected ?? null,
      audienceType: c.audienceType ?? null,
      researchPriority: c.researchPriority ?? null,
      lastAnalyzedAt: c.lastAnalyzedAt ? c.lastAnalyzedAt.toISOString() : null,
      followers: s?.followers ?? 0,
      following: s?.following ?? 0,
      posts: s?.posts ?? 0,
      engagementRate: s?.engagementRate ?? 0,
      postingFrequency: s?.postingFrequency ?? 0,
      avgLikes: s?.avgLikes ?? 0,
      followerDelta30d,
      topHashtags: s ? JSON.parse(s.topHashtags) : [],
      themes: s ? JSON.parse(s.themes) : [],
      reportJson: s?.reportJson ?? null,
      source: s?.source ?? null,
    };
  });

  const niche = userRow?.brandConfig?.niche ?? "";
  const intelInputs: IntelInput[] = rows.map((r) => ({
    username: r.username,
    displayName: r.displayName,
    category: r.category,
    followers: r.followers,
    engagementRate: r.engagementRate,
    postingFrequency: r.postingFrequency,
    avgLikes: r.avgLikes,
    followerDelta30d: r.followerDelta30d,
    themes: r.themes,
  }));
  const intelligence = buildIntelligence(intelInputs, niche);

  return (
    <AppShell
      active="/competitors"
      title="Creator intelligence"
      subtitle="Out-position the accounts in your niche with data, not guesswork"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-8">
        <IntelligenceDashboard data={intelligence} />
        <div className="mt-14">
          <CompetitorsView
            rows={rows}
            prefill={{
              niche: userRow?.brandConfig?.niche ?? "",
              description: userRow?.brandConfig?.goal ?? "",
              audience: userRow?.brandConfig?.audience ?? "",
            }}
            research={
              research
                ? {
                    nicheSummary: research.nicheSummary,
                    competitors: JSON.parse(research.competitors),
                    emergingCreators: JSON.parse(research.emergingCreators),
                    authorityCreators: JSON.parse(research.authorityCreators),
                    contentOpportunities: JSON.parse(research.contentOpportunities),
                    researchRecommendations: JSON.parse(research.researchRecommendations),
                    createdAt: research.createdAt.toISOString(),
                  }
                : null
            }
          />
        </div>
      </div>
    </AppShell>
  );
}