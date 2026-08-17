"use client";

import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IntelligenceData } from "@/lib/intelligence-types";

const OPP_STYLES = {
  HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  LOW: "bg-muted text-muted-foreground border-border",
} as const;

export function ContentGaps({ data }: { data: IntelligenceData }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {data.gaps.map((gap) => (
        <Card key={gap.topic}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{gap.topic}</p>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  {gap.competitorsPost ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <X className="size-3.5 text-muted-foreground/60" />
                  )}
                  Competitors
                </span>
                <span className="inline-flex items-center gap-1">
                  {gap.userPosts ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <X className="size-3.5 text-muted-foreground/60" />
                  )}
                  You
                </span>
              </div>
            </div>
            <Badge variant="outline" className={cn("shrink-0", OPP_STYLES[gap.opportunity])}>
              {gap.opportunity}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}