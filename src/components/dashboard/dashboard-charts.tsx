"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardData } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const BLUE = "oklch(0.55 0.23 261)";
const BLUE_SOFT = "oklch(0.72 0.15 256)";
const BLUE_PALE = "oklch(0.89 0.05 255)";
const NAVY = "oklch(0.45 0.17 266)";
const MUTED = "oklch(0.6 0.03 258)";
const GRID = "oklch(0.927 0.014 255)";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${n}`;
}

function deltaPct(cur: number, prev: number): number {
  if (prev === 0) return 0;
  return ((cur - prev) / prev) * 100;
}

function Delta({ value, invert }: { value: number; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0;
  const zero = value === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        zero
          ? "bg-muted text-muted-foreground"
          : good
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
      )}
    >
      {value > 0 ? "▲" : value < 0 ? "▼" : "•"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function EmptyChart({
  title,
  hint,
  className,
}: {
  title: string;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-[240px] text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function KpiCards({ data }: { data: DashboardData }) {
  const snaps = data.snapshots;
  const last = snaps[snaps.length - 1];
  const days30 = snaps.slice(-30);
  const days7 = snaps.slice(-7);
  const baseline30 = snaps[snaps.length - 31] ?? snaps[0];
  const trackingDays = snaps.length;

  const growth30 = last.followers - (baseline30?.followers ?? last.followers);
  const hasEr = days30.some((x) => x.engagementRate > 0);
  const er30 = days30.reduce((s, x) => s + x.engagementRate, 0) / days30.length;
  const er7 = days7.reduce((s, x) => s + x.engagementRate, 0) / days7.length;
  const reach30 = days30.reduce((s, x) => s + x.reach, 0);
  const views30 = days30.reduce((s, x) => s + x.profileViews, 0);
  const posts30 = data.posts.filter(
    (p) => p.postedAt.getTime() >= (baseline30?.date.getTime() ?? 0)
  ).length;

  const kpis = [
    {
      label: "Followers",
      value: fmt(last.followers),
      sub:
        trackingDays < 2
          ? "tracking started today"
          : trackingDays < 31
            ? `${growth30 >= 0 ? "+" : ""}${fmt(growth30)} since tracking started`
            : `${growth30 >= 0 ? "+" : ""}${fmt(growth30)} this month`,
      delta: deltaPct(last.followers, baseline30?.followers ?? last.followers),
      icon: "followers",
    },
    {
      label: "Engagement rate",
      value: `${er30.toFixed(1)}%`,
      sub: days30.filter((x) => x.engagementRate > 0).length < 2 ? "latest sync" : "30-day average",
      delta: deltaPct(er7, er30),
      icon: "engagement",
      show: hasEr,
    },
    {
      label: "Reach · 30d",
      value: fmt(reach30),
      sub: `${posts30} posts published`,
      delta: deltaPct(reach30, 0),
      icon: "reach",
      show: reach30 > 0,
    },
    {
      label: "Profile views",
      value: fmt(views30),
      sub: "30-day total",
      delta: deltaPct(views30, 0),
      icon: "views",
      show: views30 > 0,
    },
  ].filter((k) => k.show !== false);

  const gridCols =
    kpis.length === 4
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      : kpis.length === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : kpis.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1";

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {kpis.map((k) => (
        <div
          key={k.label}
          className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-[0_8px_30px_-12px_oklch(0.55_0.23_261/0.25)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">{k.label}</p>
            <Delta value={k.delta} />
          </div>
          <p className="mt-2 text-[28px] font-semibold tracking-tight tabular-nums leading-none">
            {k.value}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}

export function hasEngagementData(data: DashboardData) {
  return data.snapshots.some((s) => s.engagementRate > 0);
}

export function hasReachData(data: DashboardData) {
  return data.snapshots.some((s) => s.reach > 0);
}

const followerConfig = {
  followers: { label: "Followers", color: BLUE },
} satisfies ChartConfig;

export function FollowerGrowthChart({ data }: { data: DashboardData }) {
  const snaps = data.snapshots.slice(-90);
  const chartData = snaps.map((s) => ({
    date: s.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    followers: s.followers,
  }));

  if (snaps.length < 2) {
    return (
      <EmptyChart
        className="h-[300px]"
        title="Growth curve starts with your second sync"
        hint="Follow the daily rhythm: sync each day and the follower curve builds itself."
      />
    );
  }

  return (
    <ChartContainer
      config={followerConfig}
      className="h-[300px] w-full"
    >
      <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="followerFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.28} />
            <stop offset="60%" stopColor={BLUE} stopOpacity={0.06} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          interval={13}
          tickMargin={10}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => fmt(v as number)}
          domain={["dataMin - 200", "dataMax + 200"]}
        />
        <ChartTooltip
          cursor={{ stroke: BLUE_SOFT, strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelKey="date"
              formatter={(value) => (
                <span className="font-semibold tabular-nums">
                  {(value as number).toLocaleString()}
                </span>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="followers"
          stroke={BLUE}
          strokeWidth={2.5}
          fill="url(#followerFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const erConfig = {
  er: { label: "Engagement rate", color: BLUE },
  avg: { label: "7-day avg", color: MUTED },
} satisfies ChartConfig;

export function EngagementTrendChart({ data }: { data: DashboardData }) {
  const snaps = data.snapshots.slice(-30);
  const running: number[] = [];
  const chartData = snaps.map((s) => {
    running.push(s.engagementRate);
    if (running.length > 7) running.shift();
    return {
      date: s.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      er: Number(s.engagementRate.toFixed(2)),
      avg: Number((running.reduce((a, b) => a + b, 0) / running.length).toFixed(2)),
    };
  });

  return (
    <ChartContainer config={erConfig} className="h-[300px] w-full">
      <LineChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 6" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          interval={4}
          tickMargin={10}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          tick={{ fontSize: 11 }}
          domain={["dataMin - 0.5", "dataMax + 0.5"]}
          tickFormatter={(v) => `${v}%`}
        />
        <ChartTooltip
          cursor={{ stroke: BLUE_SOFT, strokeDasharray: "3 3" }}
          content={<ChartTooltipContent />}
        />
        <Line
          type="monotone"
          dataKey="er"
          stroke={BLUE}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
        <Line
          type="monotone"
          dataKey="avg"
          stroke={MUTED}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          activeDot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

const reachConfig = {
  reach: { label: "Reach", color: BLUE },
} satisfies ChartConfig;

export function ReachChart({ data }: { data: DashboardData }) {
  const chartData = data.snapshots.slice(-14).map((s) => ({
    date: s.date.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    reach: s.reach,
  }));

  if (chartData.every((s) => s.reach === 0)) {
    return (
      <EmptyChart
        className="h-[300px]"
        title="No reach data yet"
        hint="Reach comes from Instagram insights. Connect with Instagram and sync to fill this in."
      />
    );
  }

  return (
    <ChartContainer config={reachConfig} className="h-[300px] w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 6" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          interval={2}
          tickMargin={10}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => fmt(v as number)}
        />
        <ChartTooltip
          cursor={{ fill: "oklch(0.96 0.022 252)", radius: 6 }}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-semibold tabular-nums">
                  {(value as number).toLocaleString()}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="engagement" radius={[6, 6, 2, 2]} maxBarSize={28}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={i === chartData.length - 1 ? BLUE : BLUE_SOFT} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const hourlyConfig = {
  engagement: { label: "Avg engagement", color: BLUE },
} satisfies ChartConfig;

export function BestTimeChart({ data }: { data: DashboardData }) {
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const p of data.posts) {
    const h = p.postedAt.getHours();
    const b = buckets.get(h) ?? { sum: 0, count: 0 };
    b.sum += p.likes + p.comments + p.saves + p.shares;
    b.count += 1;
    buckets.set(h, b);
  }
  const chartData = Array.from(buckets.entries())
    .map(([hour, { sum, count }]) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      engagement: Math.round(sum / count),
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const best = chartData.reduce((a, b) => (a.engagement > b.engagement ? a : b), chartData[0]);

  if (!best) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
        <p className="text-sm font-medium text-foreground">No post data yet</p>
        <p className="max-w-[220px] text-xs text-muted-foreground">
          Sync your account and this chart fills in with real posting times.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ChartContainer config={hourlyConfig} className="h-[220px] w-full">
        <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 6" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            interval={2}
            tickMargin={8}
            tick={{ fontSize: 10 }}
          />
          <YAxis hide />
          <ChartTooltip
            cursor={{ fill: "oklch(0.96 0.022 252)", radius: 6 }}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="engagement" radius={[5, 5, 2, 2]} maxBarSize={20}>
            {chartData.map((d) => (
              <Cell key={d.hour} fill={d.hour === best.hour ? BLUE : BLUE_PALE} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="mt-3 text-sm text-muted-foreground">
        Peak window:{" "}
        <span className="font-semibold text-foreground">
          {best.hour.slice(0, 2) === "00" ? "midnight" : `${best.hour} local`}
        </span>{" "}
        — avg {fmt(best.engagement)} engagement per post
      </p>
    </div>
  );
}

const mixConfig = {
  REEL: { label: "Reels", color: BLUE },
  CAROUSEL: { label: "Carousels", color: BLUE_SOFT },
  SINGLE: { label: "Singles", color: BLUE_PALE },
  STORY: { label: "Stories", color: NAVY },
} satisfies ChartConfig;

export function ContentMixChart({ data }: { data: DashboardData }) {
  const counts = new Map<string, { posts: number; er: number[] }>();
  for (const p of data.posts) {
    const c = counts.get(p.mediaType) ?? { posts: 0, er: [] };
    c.posts += 1;
    if (p.impressions > 0) {
      c.er.push((p.likes + p.comments + p.saves) / p.impressions);
    }
    counts.set(p.mediaType, c);
  }
  const rows = Array.from(counts.entries()).map(([type, c]) => ({
    type,
    posts: c.posts,
    er: c.er.length ? (c.er.reduce((a, b) => a + b, 0) / c.er.length) * 100 : null,
  }));
  const total = rows.reduce((s, r) => s + r.posts, 0);

  if (rows.length === 0) {
    return (
      <EmptyChart
        className="h-[190px]"
        title="No posts tracked yet"
        hint="Post captions and formats fill this in once your account is synced."
      />
    );
  }

  return (
    <div className="flex items-center gap-6">
      <ChartContainer config={mixConfig} className="h-[190px] w-[190px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={rows.map((r) => ({ name: r.type, value: r.posts, fill: "var(--color-" + r.type + ")" }))}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
            strokeWidth={0}
          />
        </PieChart>
      </ChartContainer>
      <ul className="flex-1 space-y-2.5">
        {rows.map((r) => (
          <li key={r.type} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2.5 rounded-full"
                style={{ background: `var(--color-${r.type})` }}
              />
              {mixConfig[r.type as keyof typeof mixConfig].label}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round((r.posts / total) * 100)}%
            </span>
          </li>
        ))}
        <li className="pt-1 text-xs text-muted-foreground">
          Avg engagement by format:{" "}
          {rows
            .map((r) =>
              r.er !== null
                ? `${mixConfig[r.type as keyof typeof mixConfig].label} ${r.er.toFixed(1)}%`
                : `${mixConfig[r.type as keyof typeof mixConfig].label} ${r.posts} posts`
            )
            .join(" · ")}
        </li>
      </ul>
    </div>
  );
}

const mediaLabel: Record<string, string> = {
  REEL: "Reel",
  CAROUSEL: "Carousel",
  SINGLE: "Single",
  STORY: "Story",
};

const mediaStyle: Record<string, "default" | "secondary" | "outline"> = {
  REEL: "default",
  CAROUSEL: "secondary",
  SINGLE: "outline",
  STORY: "outline",
};

export function TopPostsTable({ data }: { data: DashboardData }) {
  const rows = data.posts.slice(0, 8).map((p) => {
    const engagement = p.likes + p.comments + p.saves + p.shares;
    const er = p.impressions > 0 ? (engagement / p.impressions) * 100 : null;
    return { ...p, engagement, er };
  });
  const erMax = Math.max(...rows.map((r) => r.er ?? 0), 0.01);
  const engMax = Math.max(
    ...rows.map((r) => (r.er === null ? Math.log10(r.engagement + 1) : 0)),
    0.01
  );

  if (rows.length === 0) {
    return (
      <EmptyChart
        className="h-[240px]"
        title="No posts to rank yet"
        hint="Top performing posts appear here once your account has published content."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-14 text-muted-foreground">Format</TableHead>
          <TableHead className="text-muted-foreground">Post</TableHead>
          <TableHead className="text-right text-muted-foreground">Likes</TableHead>
          <TableHead className="text-right text-muted-foreground">Comments</TableHead>
          <TableHead className="text-right text-muted-foreground">Saves</TableHead>
          <TableHead className="text-right text-muted-foreground w-40">Engagement</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Badge variant={mediaStyle[r.mediaType]} className="font-medium">
                {mediaLabel[r.mediaType]}
              </Badge>
            </TableCell>
            <TableCell className="max-w-[300px]">
              <p className="truncate text-[13px] font-medium">{r.caption ?? "—"}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {r.postedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </TableCell>
            <TableCell className="text-right tabular-nums">{r.likes.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{r.comments.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{r.saves.toLocaleString()}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {r.er !== null ? `${r.er.toFixed(1)}%` : r.engagement.toLocaleString()}
                </span>
                <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${
                        r.er !== null
                          ? (r.er / erMax) * 100
                          : (Math.log10(r.engagement + 1) / engMax) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CompetitorCompare({ data }: { data: DashboardData }) {
  const comp = data.competitorSnapshot;
  if (!comp) return null;
  const me = data.snapshots[data.snapshots.length - 1];
  const weekAgo = new Date(me.date.getTime() - 7 * 86400000);
  const mePostsWeek = data.posts.filter((p) => p.postedAt >= weekAgo).length;
  const meEngagement = data.posts.length
    ? data.posts.reduce((s, p) => s + p.likes + p.comments, 0) / data.posts.length
    : 0;
  const compEngagement = comp.avgLikes + comp.avgComments;

  const rows = [
    { label: "Followers", me: me.followers, comp: comp.followers, meFmt: fmt(me.followers), compFmt: fmt(comp.followers) },
    { label: "Engagement rate", me: me.engagementRate, comp: comp.engagementRate, meFmt: `${me.engagementRate.toFixed(1)}%`, compFmt: `${comp.engagementRate.toFixed(1)}%` },
    { label: "Avg engagement / post", me: meEngagement, comp: compEngagement, meFmt: fmt(Math.round(meEngagement)), compFmt: fmt(Math.round(compEngagement)) },
    { label: "Posts / week", me: mePostsWeek, comp: comp.postingFrequency, meFmt: `${mePostsWeek.toFixed(1)}`, compFmt: `${comp.postingFrequency.toFixed(1)}` },
  ];
  const maxVal = Math.max(...rows.map((r) => Math.max(r.me, r.comp)), 1);

  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const pct = (a: number) => Math.max(6, (a / maxVal) * 100);
        return (
          <div key={r.label} className="grid grid-cols-[110px_1fr_80px] items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">{r.label}</span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${pct(r.me)}%` }} />
                <span className="text-xs font-semibold tabular-nums">{r.meFmt}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-muted-foreground/40" style={{ width: `${pct(r.comp)}%` }} />
                <span className="text-xs tabular-nums text-muted-foreground">{r.compFmt}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-primary">You</span>
              <span className="text-muted-foreground font-normal">/</span>
              <span className="text-muted-foreground">@{comp.competitor.username}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { Delta, fmt };
