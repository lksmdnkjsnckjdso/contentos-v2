import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CompetitorsView } from "@/components/competitors/competitors-view";

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
        include: { snapshots: { orderBy: { date: "desc" }, take: 1 } },
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
    const s = c.snapshots[0];
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
      topHashtags: s ? JSON.parse(s.topHashtags) : [],
      themes: s ? JSON.parse(s.themes) : [],
      reportJson: s?.reportJson ?? null,
      source: s?.source ?? null,
    };
  });

  return (
    <AppShell
      active="/competitors"
      title="Competitor intelligence"
      subtitle="Discover, scrape, analyze, and out-position the accounts in your niche"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-8">
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
    </AppShell>
  );
}
