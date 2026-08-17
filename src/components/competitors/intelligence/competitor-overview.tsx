"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fmtNum } from "@/lib/intelligence-data";
import type { IntelligenceData } from "@/lib/intelligence-types";

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-fuchsia-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

function gradientFor(username: string): string {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function CompetitorOverview({ data }: { data: IntelligenceData }) {
  const competitors = [...data.competitors].sort((a, b) => b.growthScore - a.growthScore);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {competitors.map((c) => (
        <Card key={c.username} className="overflow-hidden">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size="lg" className="size-11">
                  <AvatarFallback
                    className={`bg-gradient-to-br ${gradientFor(c.username)} font-bold text-white`}
                  >
                    {initials(c.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {c.displayName ?? `@${c.username}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{c.username}</p>
                  {c.category ? (
                    <Badge variant="secondary" className="mt-1.5 px-1.5 py-0 text-[10px]">
                      {c.category}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Growth score
                </p>
                <p className="text-2xl font-bold tabular-nums text-primary">{c.growthScore}</p>
              </div>
            </div>

            <Progress value={c.growthScore} className="h-1.5" />

            <div className="grid grid-cols-3 gap-3 border-t border-border/70 pt-4">
              <Stat
                label="Followers"
                value={fmtNum(c.followers)}
                sub={`${c.followerDelta30d >= 0 ? "+" : ""}${c.followerDelta30d.toFixed(1)}% / 30d`}
              />
              <Stat label="Eng. rate" value={`${c.engagementRate.toFixed(1)}%`} />
              <Stat label="Posts / wk" value={c.postingFrequency.toFixed(1)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}