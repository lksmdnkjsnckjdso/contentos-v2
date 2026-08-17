"use client";

import { CheckCircle2, Circle } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IntelligenceData } from "@/lib/intelligence-types";

export function ActionPlan({ data }: { data: IntelligenceData }) {
  const [done, setDone] = React.useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progress = Math.round((done.size / data.actions.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4">
        <div className="text-2xl font-bold tabular-nums text-foreground">{progress}%</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {done.size} of {data.actions.length} actions complete
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.actions.map((action, i) => {
          const isDone = done.has(action.id);
          return (
            <Card
              key={action.id}
              className={cn("transition-opacity", isDone && "opacity-60")}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <button
                  type="button"
                  onClick={() => toggle(action.id)}
                  aria-label={isDone ? "Mark as not done" : "Mark as done"}
                  className="mt-0.5 shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/50" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p
                      className={cn(
                        "text-sm font-semibold text-foreground",
                        isDone && "line-through decoration-muted-foreground/50"
                      )}
                    >
                      {action.title}
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {action.detail}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-1.5 py-0 text-[10px]",
                      action.impact === "High"
                        ? "border-primary/40 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {action.impact} impact
                  </Badge>
                  <span className="text-[10px] text-muted-foreground/70">{action.category}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setDone(new Set())}
        >
          Reset plan
        </Button>
      </div>
    </div>
  );
}