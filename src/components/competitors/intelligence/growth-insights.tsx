"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IntelligenceData } from "@/lib/intelligence-types";

const TONE_STYLES = {
  up: { icon: TrendingUp, cls: "text-emerald-500" },
  down: { icon: TrendingDown, cls: "text-red-500" },
  neutral: { icon: Minus, cls: "text-muted-foreground" },
} as const;

export function GrowthInsights({ data }: { data: IntelligenceData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.insights.map((insight) => {
        const { icon: Icon, cls } = TONE_STYLES[insight.tone];
        return (
          <Card key={insight.id}>
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex items-center justify-between">
                <Icon className={cn("size-4", cls)} />
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {insight.stat}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold leading-snug text-foreground">
                {insight.headline}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {insight.context}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}