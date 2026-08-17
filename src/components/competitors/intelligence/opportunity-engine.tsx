"use client";

import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { IntelligenceData } from "@/lib/intelligence-types";

const PRIORITY_STYLES = {
  HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/30",
} as const;

const DIFFICULTY_STYLES = {
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  High: "bg-red-500/10 text-red-400 border-red-500/30",
} as const;

export function OpportunityEngine({ data }: { data: IntelligenceData }) {
  const opportunities = [...data.opportunities].sort(
    (a, b) => Number(b.priority === "HIGH") - Number(a.priority === "HIGH") || b.viralityPotential - a.viralityPotential
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {opportunities.map((opp) => (
        <Card
          key={opp.id}
          className={cn(
            "relative overflow-hidden",
            opp.priority === "HIGH" && "border-rose-500/30"
          )}
        >
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", PRIORITY_STYLES[opp.priority])}>
                {opp.priority} PRIORITY
              </Badge>
              <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", DIFFICULTY_STYLES[opp.difficulty])}>
                {opp.difficulty} difficulty
              </Badge>
            </div>

            <h3 className="text-base font-semibold text-foreground">{opp.topic}</h3>

            <ul className="space-y-1.5">
              {opp.reasons.map((r) => (
                <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                  {r}
                </li>
              ))}
            </ul>

            <div className="space-y-1.5 border-t border-border/70 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Flame className="size-3.5 text-rose-400" />
                  Virality potential
                </span>
                <span className="tabular-nums text-muted-foreground">{opp.viralityPotential}/100</span>
              </div>
              <Progress value={opp.viralityPotential} className="h-1.5" />
            </div>

            <p className="text-xs text-muted-foreground">
              Winning on this:{" "}
              {opp.competitors.map((c) => `@${c}`).join(", ")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}