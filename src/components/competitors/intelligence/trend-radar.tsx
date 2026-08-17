"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IntelligenceData } from "@/lib/intelligence-types";

const STATUS_STYLES = {
  Rising: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: TrendingUp },
  Stable: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: Minus },
  Declining: { cls: "bg-red-500/10 text-red-400 border-red-500/30", icon: TrendingDown },
} as const;

export function TrendRadar({ data }: { data: IntelligenceData }) {
  const trends = [...data.trends].sort(
    (a, b) => Number(b.status === "Rising") - Number(a.status === "Rising") || b.score - a.score
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {trends.map((trend) => {
        const { cls, icon: Icon } = STATUS_STYLES[trend.status];
        return (
          <Card key={trend.topic}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{trend.topic}</p>
                <Badge variant="outline" className={cn("shrink-0 gap-1 px-1.5 py-0 text-[10px]", cls)}>
                  <Icon className="size-3" />
                  {trend.status}
                </Badge>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{trend.score}</p>
                  <p className="text-[11px] text-muted-foreground">trend score</p>
                </div>
                <div className="text-right text-xs tabular-nums text-muted-foreground">
                  <p className={cn("font-semibold", trend.delta >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {trend.delta >= 0 ? "+" : ""}
                    {trend.delta}%
                  </p>
                  <p>{trend.mentions} mentions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}