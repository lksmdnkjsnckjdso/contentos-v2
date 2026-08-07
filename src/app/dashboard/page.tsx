import { getDashboardData } from "@/lib/data";
import { requireUser } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import {
  KpiCards,
  FollowerGrowthChart,
  EngagementTrendChart,
  ReachChart,
  BestTimeChart,
  ContentMixChart,
  TopPostsTable,
  CompetitorCompare,
} from "@/components/dashboard/dashboard-charts";
import { AppShell } from "@/components/app-shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Radar } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

  const data = await getDashboardData();

  if (!data) {
    return (
      <AppShell active="/dashboard" title="Dashboard">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-8">
          <p>No data yet. Run the seed first.</p>
        </div>
      </AppShell>
    );
  }

  const sourceLabel =
    data.account.source === "oauth"
      ? "Live insights · OAuth"
      : data.account.source === "scrape"
        ? (process.env.INSTAGRAM_DEMO === "true" ? "Public scrape · demo sandbox" : "Public scrape")
        : "Demo seed data";

  const hasEngagement = data.snapshots.some((s) => s.engagementRate > 0);
  const hasReach = data.snapshots.some((s) => s.reach > 0);
  const hasPosts = data.posts.length > 0;

  return (
    <AppShell
      active="/dashboard"
      title="Dashboard"
      subtitle={`@${data.account.username} · ${sourceLabel}`}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-8 space-y-8">
        <KpiCards data={data} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Follower growth</CardTitle>
              <CardDescription>Last 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <FollowerGrowthChart data={data} />
            </CardContent>
          </Card>

          {hasPosts && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Content mix</CardTitle>
                <CardDescription>Format performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ContentMixChart data={data} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {hasEngagement && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Engagement rate</CardTitle>
                <CardDescription>Daily vs 7-day average</CardDescription>
              </CardHeader>
              <CardContent>
                <EngagementTrendChart data={data} />
              </CardContent>
            </Card>
          )}

          {hasReach && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Reach · last 14 days</CardTitle>
                <CardDescription>Daily total reach</CardDescription>
              </CardHeader>
              <CardContent>
                <ReachChart data={data} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {hasPosts && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Best time to post</CardTitle>
                <CardDescription>Avg engagement by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <BestTimeChart data={data} />
              </CardContent>
            </Card>
          )}

          {hasPosts && (
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2 flex-row items-start justify-between">
                <div>
                  <CardTitle>Top posts</CardTitle>
                  <CardDescription>By engagement</CardDescription>
                </div>
                <div className="rounded-full border border-border bg-accent p-1.5 text-accent-foreground">
                  <Radar className="size-4" strokeWidth={1.75} />
                </div>
              </CardHeader>
              <CardContent>
                <TopPostsTable data={data} />
              </CardContent>
            </Card>
          )}
        </div>

        {data.competitorSnapshot && (
          <Card>
            <CardHeader className="pb-4 flex-row items-start justify-between">
              <div>
                <CardTitle>Head to head</CardTitle>
                <CardDescription>
                  You vs @{data.competitorSnapshot.competitor.username}
                </CardDescription>
              </div>
              <Link
                href="/competitors"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Open analysis →
              </Link>
            </CardHeader>
            <CardContent>
              <CompetitorCompare data={data} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
