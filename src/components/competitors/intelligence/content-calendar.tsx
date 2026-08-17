"use client";

import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DAY_NAMES } from "@/lib/intelligence-data";
import type { IntelligenceData } from "@/lib/intelligence-types";

export function ContentCalendar({ data }: { data: IntelligenceData }) {
  return (
    <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
      {DAY_NAMES.map((dayName, day) => {
        const posts = data.calendar.filter((p) => p.day === day);
        const jsDay = new Date().getDay(); // 0=Sun..6=Sat
        const isToday = day === (jsDay === 0 ? 6 : jsDay - 1);

        return (
          <Card
            key={dayName}
            className={cn(
              "min-h-40 md:min-h-56",
              isToday && "border-primary/50 bg-primary/5"
            )}
          >
            <CardContent className="flex h-full flex-col p-3">
              <div className="mb-2 flex items-center justify-between">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {dayName}
                </p>
                <span className="text-[10px] tabular-nums text-muted-foreground/70">
                  {posts.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {posts.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/50">—</p>
                ) : (
                  posts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="rounded-md border border-border/60 bg-card p-1.5"
                    >
                      <p className="flex items-center gap-1 text-[10px] tabular-nums text-primary">
                        <Clock className="size-2.5" />
                        {p.time}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
                        {p.topic}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        @{p.competitorUsername} · {p.format}
                      </p>
                    </div>
                  ))
                )}
                {posts.length > 3 ? (
                  <p className="text-[10px] text-muted-foreground">
                    +{posts.length - 3} more
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}