"use client";

import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { IntelligenceData } from "@/lib/intelligence-types";

export function HookIntelligence({ data }: { data: IntelligenceData }) {
  const hooks = [...data.hooks].sort((a, b) => b.frequency - a.frequency);

  return (
    <div className="space-y-3">
      {hooks.map((hook, i) => (
        <Card key={hook.pattern}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-xs font-bold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{hook.pattern}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Quote className="size-3 shrink-0" />
                  &ldquo;{hook.example}&rdquo;
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:w-64">
              <Progress value={hook.frequency} className="h-1.5 flex-1" />
              <span className="w-10 text-right text-sm font-semibold tabular-nums text-foreground">
                {hook.frequency}%
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}