"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Sparkles, Wand2, Clock, Film, Images, Square, Bookmark, Hash, MousePointerClick, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { generateDraft } from "@/app/actions/content";
import { toast } from "sonner";
import { useState } from "react";

export type SlotDTO = {
  id: string;
  date: string;
  time: string;
  mediaType: string;
  pillar: string | null;
  status: string;
  topic: string | null;
  hookVariants: string | null;
  script: string | null;
  caption: string | null;
  hashtags: string | null;
  cta: string | null;
  thumbnailIdea: string | null;
  storytelling: {
    level: number;
    role?: string;
    stakes?: string;
    transformation?: string;
    openLoop?: string;
  } | null;
};

const LEVEL_NAMES = [
  "Informational",
  "Emotional",
  "Subtextual",
  "Archetypal",
  "Interactive",
  "Generative Reality",
];

const LEVEL_DESC = [
  "Facts, features and logic — the story is the clarity",
  "Empathy and relatability — the story is the feeling",
  "Metaphor and nuance — the story hides beneath the words",
  "Mythic resonance — the viewer is on the hero's journey",
  "Choice and agency — the viewer decides the path",
  "The viewer IS the protagonist — content as a living quest",
];

const statusMeta: Record<string, { label: string; card: string; dot: string }> = {
  IDEA: { label: "Idea", card: "border-dashed border-border bg-card", dot: "bg-muted-foreground/50" },
  WRITING: { label: "Writing", card: "border-primary/40 bg-accent/40", dot: "bg-primary" },
  READY: { label: "Ready", card: "border-primary/60 bg-accent", dot: "bg-primary" },
  SCHEDULED: { label: "Scheduled", card: "border-primary bg-primary/90 text-primary-foreground", dot: "bg-primary-foreground" },
  POSTED: { label: "Posted", card: "border-border bg-muted/60 opacity-70", dot: "bg-emerald-500" },
};

const mediaIcon: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  REEL: Film,
  CAROUSEL: Images,
  STORY: Square,
  SINGLE: ImageIcon,
};

export function CalendarGrid({
  slots,
  weekLabel,
  hrefPrev,
  hrefNext,
}: {
  slots: { days: { label: string; date: string; isToday: boolean; slots: SlotDTO[] }[] };
  weekLabel: string;
  hrefPrev: string;
  hrefNext: string;
}) {
  const [selected, setSelected] = useState<SlotDTO | null>(null);
  const [generating, setGenerating] = useState(false);

  const runGenerate = async (slotId: string) => {
    setGenerating(true);
    const res = await generateDraft(slotId);
    setGenerating(false);
    if (res.ok) {
      toast.success("Draft generated");
      window.location.reload();
    } else {
      toast.error(res.error ?? "Generation failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Link href={hrefPrev} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronLeft className="size-4" />
          </Link>
          <span className="w-44 text-center text-sm font-semibold tabular-nums">{weekLabel}</span>
          <Link href={hrefNext} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {Object.entries(statusMeta).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", v.dot)} /> {v.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {slots.days.map((day) => (
          <div key={day.date} className="rounded-xl border border-border bg-muted/30 p-2 min-h-[180px]">
            <div className="mb-2 flex items-center justify-between px-1 pt-1">
              <span className="text-xs font-semibold text-muted-foreground">{day.label}</span>
              <span
                className={cn(
                  "text-xs tabular-nums font-medium",
                  day.isToday ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {day.date}
              </span>
            </div>
            <div className="space-y-2">
              {day.slots.map((slot) => {
                const meta = statusMeta[slot.status] ?? statusMeta.IDEA;
                const Icon = mediaIcon[slot.mediaType] ?? ImageIcon;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelected(slot)}
                    className={cn(
                      "w-full rounded-lg border px-2.5 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                      meta.card
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 text-[11px] font-medium opacity-80">
                        <Clock className="size-3" strokeWidth={1.75} />
                        {slot.time}
                      </span>
                      <Icon className="size-3.5 opacity-70" strokeWidth={1.75} />
                    </div>
                    <p className={cn("mt-1.5 line-clamp-2 text-[12.5px] font-semibold leading-snug", slot.status === "SCHEDULED" && "text-primary-foreground")}>
                      {slot.topic ?? slot.pillar ?? "Open slot"}
                    </p>
                    {slot.topic && slot.status !== "POSTED" && slot.status !== "SCHEDULED" && (
                      <p className="mt-1 flex items-center gap-1 text-[10.5px] opacity-70">
                        <Sparkles className="size-3" /> AI draft
                      </p>
                    )}
                  </button>
                );
              })}
              {day.slots.length === 0 && (
                <button
                  className="w-full rounded-lg border border-dashed border-border px-2.5 py-6 text-center text-xs text-muted-foreground/70 transition-colors hover:bg-card"
                  onClick={() => {}}
                >
                  + Add slot
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge>{mediaLabel(selected.mediaType)}</Badge>
                <Badge variant="secondary">{statusMeta[selected.status]?.label}</Badge>
                {selected.pillar && <Badge variant="outline">{selected.pillar}</Badge>}
                {selected.storytelling && (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Story · Lv {selected.storytelling.level} · {LEVEL_NAMES[selected.storytelling.level - 1]}
                  </Badge>
                )}
              </div>
              <DialogTitle className="mt-2">{selected.topic ?? "Untitled slot"}</DialogTitle>
              <DialogDescription>
                {new Date(selected.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · {selected.time}
              </DialogDescription>
            </DialogHeader>

            {selected.hookVariants ? (
              <div className="space-y-5">
                {selected.storytelling && (
                  <section>
                    <SectionLabel icon={Sparkles}>Narrative architecture</SectionLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          The viewer is
                        </p>
                        <p className="mt-1 text-[13px]">{selected.storytelling.role}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          At stake
                        </p>
                        <p className="mt-1 text-[13px]">{selected.storytelling.stakes}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          The transformation
                        </p>
                        <p className="mt-1 text-[13px]">{selected.storytelling.transformation}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Open loop
                        </p>
                        <p className="mt-1 text-[13px]">{selected.storytelling.openLoop}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {LEVEL_NAMES[selected.storytelling.level - 1]}:{" "}
                      {LEVEL_DESC[selected.storytelling.level - 1]}
                    </p>
                  </section>
                )}
                <section>
                  <SectionLabel icon={Sparkles}>Hook variants</SectionLabel>
                  <ul className="space-y-2">
                    {JSON.parse(selected.hookVariants).map((h: string, i: number) => (
                      <li key={i} className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
                        {h}
                      </li>
                    ))}
                  </ul>
                </section>
                {selected.script && (
                  <section>
                    <SectionLabel icon={Film}>Script</SectionLabel>
                    <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 font-sans text-[13px] leading-relaxed">
                      {selected.script}
                    </pre>
                  </section>
                )}
                {selected.caption && (
                  <section>
                    <SectionLabel icon={Bookmark}>Caption</SectionLabel>
                    <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 font-sans text-[13px] leading-relaxed">
                      {selected.caption}
                    </pre>
                  </section>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selected.hashtags && (
                    <section>
                      <SectionLabel icon={Hash}>Hashtags</SectionLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {JSON.parse(selected.hashtags).map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}
                  {selected.cta && (
                    <section>
                      <SectionLabel icon={MousePointerClick}>CTA</SectionLabel>
                      <p className="text-sm">{selected.cta}</p>
                    </section>
                  )}
                </div>
                {selected.thumbnailIdea && (
                  <section>
                    <SectionLabel icon={ImageIcon}>Cover idea</SectionLabel>
                    <p className="text-sm">{selected.thumbnailIdea}</p>
                  </section>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Wand2 className="size-5" />
                </div>
                <p className="mt-3 text-sm font-medium">No draft yet</p>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted-foreground">
                  Generate the full package — hook variants, timed script, caption, hashtags, CTA
                  and cover idea — in one shot.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              {!selected.hookVariants ? (
                <Button onClick={() => runGenerate(selected.id)} disabled={generating} className="w-full sm:w-auto">
                  <Wand2 className="size-4" />
                  {generating ? "Writing…" : "Generate with AI"}
                </Button>
              ) : (
                <Button variant="outline" onClick={() => runGenerate(selected.id)} disabled={generating}>
                  <Wand2 className="size-4" />
                  Regenerate
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="size-3.5 text-primary" /> {children}
    </p>
  );
}

function mediaLabel(t: string) {
  return { REEL: "Reel", CAROUSEL: "Carousel", STORY: "Story", SINGLE: "Post" }[t] ?? t;
}
