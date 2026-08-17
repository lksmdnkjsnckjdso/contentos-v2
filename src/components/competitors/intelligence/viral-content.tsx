"use client";

import * as React from "react";
import { Eye, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fmtNum } from "@/lib/intelligence-data";
import type { IntelligenceData, ViralReel } from "@/lib/intelligence-types";

function ReelThumb({ index }: { index: number }) {
  const gradients = [
    "from-blue-600/80 to-indigo-800/80",
    "from-fuchsia-600/80 to-purple-800/80",
    "from-emerald-600/80 to-teal-800/80",
    "from-orange-600/80 to-rose-800/80",
    "from-cyan-600/80 to-sky-800/80",
  ];
  return (
    <div
      className={`flex aspect-[4/5] w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradients[index % gradients.length]} sm:w-24`}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
        <Play className="size-3.5 fill-white text-white" />
      </span>
    </div>
  );
}

export function ViralContent({ data }: { data: IntelligenceData }) {
  const [selected, setSelected] = React.useState<ViralReel | null>(null);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.viralReels.map((reel, i) => (
          <Card key={reel.id}>
            <CardContent className="flex items-start gap-4 p-4">
              <ReelThumb index={i} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    @{reel.competitorUsername}
                  </p>
                  <Badge
                    variant="outline"
                    className="shrink-0 gap-1 px-1.5 py-0 text-[10px] tabular-nums"
                  >
                    <Eye className="size-3" />
                    {fmtNum(reel.views)} views
                  </Badge>
                </div>
                <p className="text-sm font-medium leading-snug text-foreground">
                  &ldquo;{reel.hook}&rdquo;
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {reel.topic}
                  </Badge>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {reel.format}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">
                    {reel.postedDaysAgo === 0 ? "Today" : `${reel.postedDaysAgo}d ago`}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelected(reel)}
                  >
                    View analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Why this reel won</DialogTitle>
            <DialogDescription>
              {selected ? (
                <>
                  @{selected.competitorUsername} · {fmtNum(selected.views)} views ·{" "}
                  {selected.postedDaysAgo === 0 ? "posted today" : `${selected.postedDaysAgo} days ago`}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Hook
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">&ldquo;{selected.hook}&rdquo;</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Topic
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{selected.topic}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Format
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{selected.format}</p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  Why it worked
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {selected.whyItWorked}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}