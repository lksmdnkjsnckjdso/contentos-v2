"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IntelligenceData } from "@/lib/intelligence-types";

const chartConfig = {
  user: {
    label: "You",
    color: "var(--chart-1)",
  },
  nicheAvg: {
    label: "Niche average",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function PositioningScore({ data }: { data: IntelligenceData }) {
  const weakest = [...data.positioning].sort((a, b) => a.user - b.user)[0];
  const strongest = [...data.positioning].sort((a, b) => b.user - a.user)[0];
  const chartData = data.positioning.map((p) => ({
    axis: p.axis,
    user: p.user,
    nicheAvg: p.nicheAvg,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="p-5">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[380px] w-full">
            <RadarChart data={chartData}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <PolarGrid className="stroke-border/60" />
              <PolarAngleAxis dataKey="axis" className="fill-muted-foreground text-xs" />
              <Radar dataKey="user" fill="var(--chart-1)" fillOpacity={0.45} stroke="var(--chart-1)" />
              <Radar
                dataKey="nicheAvg"
                fill="var(--chart-3)"
                fillOpacity={0.12}
                stroke="var(--chart-3)"
                strokeDasharray="4 4"
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <Card className="border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
              Your edge
            </p>
            <p className="mt-1.5 text-base font-semibold text-foreground">
              {strongest.axis} — {strongest.user}/100
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              You already outperform the niche average on {strongest.axis.toLowerCase()}. Double
              down with content that reinforces this axis.
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/25 bg-red-500/5">
          <CardContent className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500">
              Biggest gap
            </p>
            <p className="mt-1.5 text-base font-semibold text-foreground">
              {weakest.axis} — {weakest.user}/100 vs {weakest.nicheAvg}/100
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              The niche averages {weakest.nicheAvg} on {weakest.axis.toLowerCase()}; you sit at{" "}
              {weakest.user}. This is your fastest path to out-positioning the field.
            </p>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border/70 p-4">
          <div className="space-y-2.5">
            {data.positioning.map((p) => {
              const diff = p.user - p.nicheAvg;
              return (
                <div key={p.axis} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs font-medium text-foreground">{p.axis}</span>
                  <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", diff >= 0 ? "bg-emerald-500" : "bg-red-500/70")}
                      style={{ width: `${p.user}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                    you {p.user} · avg {p.nicheAvg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}