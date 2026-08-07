"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Sparkles, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { saveBrandConfig } from "@/app/actions/brand-config";
import { connectByHandle } from "@/app/actions/instagram";
import { toast } from "sonner";

type FetchedProfile = {
  username: string;
  fullName: string | null;
  followers: number;
  following: number;
  posts: number;
  bio: string | null;
  engagementRate: number;
  avgLikes: number;
  postingFrequency: number;
  hashtags: string[];
  postsImported: number;
};

const steps = [
  { id: 1, label: "Identity", desc: "Niche & goal" },
  { id: 2, label: "Audience", desc: "Who you talk to" },
  { id: 3, label: "Pillars", desc: "Content categories" },
  { id: 4, label: "Hashtags", desc: "Keyword bank" },
  { id: 5, label: "Schedule", desc: "Cadence & review" },
];

const toneOptions = [
  { value: "warm", label: "Warm & relatable" },
  { value: "direct", label: "Direct & actionable" },
  { value: "edgy", label: "Bold & edgy" },
  { value: "academic", label: "Expert & academic" },
  { value: "storyteller", label: "Storyteller" },
];

const frequencyOptions = [
  { value: "3", label: "3x / week", desc: "Consistent start" },
  { value: "4", label: "4x / week", desc: "Balanced growth" },
  { value: "5", label: "5x / week", desc: "Serious push" },
  { value: "7", label: "Daily", desc: "Maximum volume" },
];

export function OnboardingWizard({ existing }: { existing?: {
  niche: string; handle: string; goal: string; audience: string; tone: string;
  pillars: string; hashtagBank: string; postingDays: string; postingTime: string;
} }) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);

  const [niche, setNiche] = React.useState(existing?.niche ?? "");
  const [handle, setHandle] = React.useState(existing?.handle ?? "@");
  const [goal, setGoal] = React.useState(existing?.goal ?? "");
  const [audience, setAudience] = React.useState(existing?.audience ?? "");
  const [tone, setTone] = React.useState(existing?.tone ?? "warm");
  const [pillars, setPillars] = React.useState<string[]>(
    existing ? JSON.parse(existing.pillars).map((p: { name: string }) => p.name) : []
  );
  const [pillarInput, setPillarInput] = React.useState("");
  const [hashtags, setHashtags] = React.useState<string[]>(
    existing ? JSON.parse(existing.hashtagBank) : []
  );
  const [tagInput, setTagInput] = React.useState("");
  const [days, setDays] = React.useState<number[]>(existing ? JSON.parse(existing.postingDays) : [1, 3, 5]);
  const [time, setTime] = React.useState(existing?.postingTime ?? "18:00");
  const [saving, setSaving] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);
  const [fetched, setFetched] = React.useState<FetchedProfile | null>(null);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const addPillar = () => {
    const v = pillarInput.trim();
    if (v && pillars.length < 4 && !pillars.includes(v)) {
      setPillars([...pillars, v]);
      setPillarInput("");
    }
  };

  const addTag = () => {
    const v = tagInput.trim().replace(/^#/, "");
    if (v && hashtags.length < 10 && !hashtags.includes(v)) {
      setHashtags([...hashtags, v]);
      setTagInput("");
    }
  };

  const toggleDay = (d: number) =>
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());

  const bioPreview = () => {
    const parts: string[] = [];
    parts.push(`I help ${audience || "creators"} grow with ${niche || "consistent content"}.`);
    if (goal) parts.push(`Currently: ${goal}`);
    parts.push(`Posting ${days.length}x a week${time ? ` at ${time}` : ""}.`);
    return parts.join("\n");
  };

  const canContinue = () => {
    switch (step) {
      case 1: return niche.trim().length > 2 && goal.trim().length > 3;
      case 2: return audience.trim().length > 2;
      case 3: return pillars.length > 0;
      case 4: return true;
      default: return true;
    }
  };

  const doFetch = async () => {
    setFetching(true);
    const res = await connectByHandle(handle);
    setFetching(false);
    if (res.ok) {
      setFetched(res.profile);
      toast.success(
        (res.demo ? "Demo data — " : "") +
          `Scraped @${res.profile.username}: ${res.profile.followers.toLocaleString()} followers`
      );
    } else {
      toast.error(res.error ?? "Fetch failed");
    }
  };

  const save = async () => {
    setSaving(true);
    const res = await saveBrandConfig({
      niche, handle, goal, audience, tone,
      pillars: pillars.map((name) => ({ name, description: "" })),
      hashtagBank: hashtags,
      postingDays: days,
      postingTime: time,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Brand profile saved");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to save");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-8">
      {/* Steps rail */}
      <ol className="space-y-1">
        {steps.map((s) => {
          const state = s.id < step ? "done" : s.id === step ? "active" : "todo";
          return (
            <li key={s.id}>
              <button
                onClick={() => setStep(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  state === "active" ? "bg-accent" : "hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                    state === "done" && "border-primary bg-primary text-primary-foreground",
                    state === "active" && "border-primary text-primary",
                    state === "todo" && "border-border text-muted-foreground"
                  )}
                >
                  {state === "done" ? <Check className="size-3.5" strokeWidth={2.5} /> : s.id}
                </span>
                <span>
                  <span className={cn("block text-sm font-medium", state === "todo" && "text-muted-foreground")}>
                    {s.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{s.desc}</span>
                </span>
              </button>
            </li>
          );
        })}
        <li className="mt-6 px-3">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Setup progress</span>
            <span className="font-semibold text-foreground">{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </li>
      </ol>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Your identity</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything downstream — calendar, hooks, captions — is built on this.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche">Niche</Label>
              <Input
                id="niche"
                placeholder="e.g. Productivity, fitness, personal finance"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">One to two areas max. Depth beats breadth.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  <Input
                    id="handle"
                    className="pl-8"
                    value={handle}
                    onChange={(e) => {
                      setHandle(e.target.value);
                      setFetched(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && doFetch()}
                  />
                </div>
                <Button
                  type="button"
                  variant={fetched ? "secondary" : "outline"}
                  onClick={doFetch}
                  disabled={fetching || handle.trim().replace(/^@/, "").length < 2}
                >
                  {fetching ? <Loader2 className="size-4 animate-spin" /> : fetched ? <Check className="size-4" /> : <Sparkles className="size-4" />}
                  {fetching ? "Scraping…" : fetched ? "Fetched" : "Fetch profile"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pulls your public profile — followers, bio, recent posts. The numbers populate your page at a glance.
              </p>
              {fetched && (
                <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    <span><b className="tabular-nums">{fetched.followers.toLocaleString()}</b> followers</span>
                    <span><b className="tabular-nums">{fetched.posts}</b> posts</span>
                    <span><b className="tabular-nums">{fetched.engagementRate.toFixed(1)}%</b> ER</span>
                    <span><b className="tabular-nums">{fetched.postingFrequency.toFixed(1)}</b> posts/wk</span>
                  </div>
                  {fetched.bio && <p className="mt-2 text-xs text-muted-foreground">“{fetched.bio.slice(0, 140)}”</p>}
                  {fetched.postsImported > 0 && (
                    <p className="mt-2 text-xs text-primary">{fetched.postsImported} recent posts imported into your analytics</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">The goal</Label>
              <Input
                id="goal"
                placeholder="e.g. Grow from 8k to 50k followers in 12 months"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Who are you talking to?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The algorithm follows the audience. Get this specific.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Textarea
                id="audience"
                placeholder="e.g. Solo founders in their 20s and 30s who want to build a personal brand but feel overwhelmed by content creation"
                rows={4}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Voice & tone</Label>
              <RadioGroup value={tone} onValueChange={setTone} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {toneOptions.map((t) => (
                  <div key={t.value}>
                    <RadioGroupItem value={t.value} id={`tone-${t.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`tone-${t.value}`}
                      className={cn(
                        "flex cursor-pointer items-center rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors",
                        tone === t.value
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {t.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Content pillars</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Max 4. Each pillar is a recurring series your audience can rely on.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {pillars.map((p) => (
                <Badge key={p} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  {p}
                  <button
                    onClick={() => setPillars(pillars.filter((x) => x !== p))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ))}
              {pillars.length === 0 && (
                <p className="text-sm text-muted-foreground">No pillars yet — add 2 to 4 below.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Build in public"
                value={pillarInput}
                onChange={(e) => setPillarInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addPillar(); }
                }}
              />
              <Button type="button" variant="secondary" onClick={addPillar} disabled={pillars.length >= 4}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
            <div className="rounded-lg bg-accent/60 p-4 text-sm text-accent-foreground">
              <p className="font-medium flex items-center gap-1.5">
                <Sparkles className="size-4" /> Strong pillar formula
              </p>
              <p className="mt-1 text-[13px] leading-relaxed">
                One recurring promise · one format · one payoff. e.g. “Monday deep-dive: one
                framework, fully unpacked.”
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Hashtag bank</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Up to 10 rotating tags. Reused across every post so the algorithm learns your lane.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="buildinpublic"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                }}
              />
              <Button type="button" variant="secondary" onClick={addTag} disabled={hashtags.length >= 10}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((t) => (
                <Badge key={t} className="gap-1.5 px-3 py-1.5 text-sm">
                  #{t}
                  <button
                    onClick={() => setHashtags(hashtags.filter((x) => x !== t))}
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="rounded-lg bg-accent/60 p-4 text-sm text-accent-foreground">
              <p className="font-medium flex items-center gap-1.5">
                <Sparkles className="size-4" /> Mix rule
              </p>
              <p className="mt-1 text-[13px] leading-relaxed">
                3 broad (#contentcreator) + 5 mid (#buildinpublic) + 2 hyper-niche
                (#solofounderdaily). Broad finds, niche converts.
              </p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Posting schedule</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your calendar will be pre-filled around this cadence.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Days per week</Label>
              <RadioGroup
                value={String(days.length)}
                onValueChange={(v) =>
                  setDays(v === "7" ? [1, 2, 3, 4, 5, 6, 7] : v === "5" ? [1, 2, 3, 4, 5] : v === "4" ? [1, 3, 5, 7] : [1, 3, 5])
                }
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {frequencyOptions.map((f) => (
                  <div key={f.value}>
                    <RadioGroupItem value={f.value} id={`freq-${f.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`freq-${f.value}`}
                      className={cn(
                        "flex cursor-pointer flex-col items-center rounded-lg border px-3 py-3 text-center transition-colors",
                        String(days.length) === f.value
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <span className="text-sm font-semibold">{f.label}</span>
                      <span className="text-xs text-muted-foreground">{f.desc}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((d, i) => (
                <button
                  key={d}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "size-10 rounded-full border text-sm font-medium transition-colors",
                    days.includes(i)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Preferred posting time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bio preview
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {bioPreview()}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="size-4" /> Back
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canContinue()}>
              Continue <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save brand profile"}
            </Button>
          )}
        </div>
      </div>

      {/* Live outputs */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Your page at a glance
          </p>
          <div className="mt-3 rounded-lg bg-gradient-to-br from-accent to-white p-4 dark:from-accent/40 dark:to-card">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {handle.replace("@", "").slice(0, 1).toUpperCase() || "Y"}
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{handle}</p>
                <p className="text-xs text-muted-foreground">{niche || "Your niche"}</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{bioPreview()}</p>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span><b className="text-foreground">{fetched ? fetched.posts : 0}</b> posts</span>
              <span><b className="text-foreground">{fetched ? fetched.followers.toLocaleString() : 0}</b> followers</span>
              <span><b className="text-foreground">{days.length}x</b> / week</span>
            </div>
          </div>
        </div>
        {pillars.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pillars → weekly rhythm
            </p>
            <ul className="mt-3 space-y-2.5">
              {pillars.map((p, i) => (
                <li key={p} className="flex items-center gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-accent text-[11px] font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
