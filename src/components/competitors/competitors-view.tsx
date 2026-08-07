"use client";

import * as React from "react";
import {
  Radar,
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Upload,
  FileDown,
  Compass,
  Plus,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  analyzeCompetitor,
  importCompetitorsCsv,
  discoverCompetitors,
  addDiscoveredCompetitor,
} from "@/app/actions/competitor";
import { toast } from "sonner";
import type { CompetitorReport, DiscoveryResult, DiscoveredCompetitor } from "@/lib/groq";

type Row = {
  id: string;
  username: string;
  displayName: string | null;
  category: string | null;
  followerRange: string | null;
  engagementQuality: string | null;
  reasonSelected: string | null;
  audienceType: string | null;
  researchPriority: number | null;
  lastAnalyzedAt: string | null;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  postingFrequency: number;
  avgLikes: number;
  topHashtags: string[];
  themes: { theme: string; share: number; engagement: number }[];
  reportJson: string | null;
  source: "SCRAPED" | "CSV" | null;
};

const CSV_TEMPLATE = "username,followers,following,posts,engagement_rate,avg_likes,avg_comments,posting_frequency,top_hashtags\n" +
  "naval_ai,1600000,1800,4200,3.2,42000,810,5.2,\"ai,startups,building\"\n" +
  "lennysan,140000,500,1200,5.1,5100,240,3.5,\"b2b,saas,founders\"\n" +
  "lindynews,88000,300,1500,4.4,2800,150,6.0,\"ai,tools,news\"\n";

const PRIORITY_META: Record<number, { label: string; cls: string }> = {
  1: { label: "Priority 1 · Watch closely", cls: "border-primary/50 text-primary" },
  2: { label: "Priority 2 · Keep an eye", cls: "border-border text-muted-foreground" },
  3: { label: "Priority 3 · Reference", cls: "border-border text-muted-foreground/70" },
};

export function CompetitorsView({
  rows,
  prefill,
  research: initialResearch,
}: {
  rows: Row[];
  prefill: { niche: string; description: string; audience: string };
  research: (Omit<DiscoveryResult, "competitors"> & {
    competitors: DiscoveredCompetitor[];
    createdAt: string;
  }) | null;
}) {
  const [username, setUsername] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<{ username: string; data: CompetitorReport } | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [research] = React.useState(initialResearch);
  const [added, setAdded] = React.useState<Set<string>>(new Set());
  const [discoverOpen, setDiscoverOpen] = React.useState(false);

  const runAnalysis = async (name: string) => {
    setAnalyzing(name);
    const res = await analyzeCompetitor(name);
    setAnalyzing(null);
    if (res.ok) {
      toast.success(`@${res.username} analyzed`);
      setReport({ username: res.username, data: res.report });
      window.location.reload();
    } else {
      toast.error(res.error ?? "Analysis failed");
    }
  };

  const runImport = async () => {
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await importCompetitorsCsv(fd);
    setImporting(false);
    if (res.ok) {
      toast.success(
        `Imported ${res.imported} competitor${res.imported === 1 ? "" : "s"}` +
          (res.skipped ? `, skipped ${res.skipped} duplicate${res.skipped === 1 ? "" : "s"}` : "")
      );
      res.errors.forEach((e) => toast.warning(e));
      setImportOpen(false);
      setFile(null);
      window.location.reload();
    } else {
      toast.error(res.error ?? "Import failed");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "competitors-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdd = async (c: DiscoveredCompetitor) => {
    const res = await addDiscoveredCompetitor(c);
    if (res.ok) {
      setAdded((s) => new Set(s).add(c.username));
      toast.success(`@${c.username} added to watchlist`);
    } else {
      toast.error(res.error ?? "Could not add competitor");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-3 pt-6">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <Input
              className="pl-8"
              placeholder="competitor username…"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAnalysis(username)}
            />
          </div>
          <Button onClick={() => runAnalysis(username)} disabled={!username.trim() || !!analyzing}>
            {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
            {analyzing ? "Analyzing…" : "Analyze competitor"}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Import CSV
          </Button>
          <Button onClick={() => setDiscoverOpen(true)}>
            <Compass className="size-4" /> Discover competitors
          </Button>
        </CardContent>
      </Card>

      {research && (
        <ResearchSection
          research={research}
          added={added}
          onAdd={handleAdd}
          onRerun={() => setDiscoverOpen(true)}
        />
      )}

      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
            <Radar className="size-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No competitors yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Discover the accounts worth studying in your niche, or add one and ContentOS scrapes its
            public data and maps its positioning, themes and gaps you can exploit.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {rows.map((row) => {
          const latest = row.themes.length
            ? row.themes.reduce((a, b) => (a.share > b.share ? a : b))
            : null;
          const hasSnapshot = row.posts > 0 || row.followers > 0 || row.lastAnalyzedAt !== null;
          return (
            <Card key={row.id} className="overflow-hidden">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    @{row.username}
                    {row.source === "CSV" && (
                      <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                        CSV import
                      </Badge>
                    )}
                    {row.researchPriority && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-normal",
                          PRIORITY_META[row.researchPriority].cls
                        )}
                      >
                        P{row.researchPriority}
                      </Badge>
                    )}
                    {row.lastAnalyzedAt && (
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        Analyzed{" "}
                        {new Date(row.lastAnalyzedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {hasSnapshot
                      ? `${row.followers.toLocaleString()} followers · ${row.posts.toLocaleString()} posts`
                      : (row.displayName ?? row.category ?? row.followerRange) + " · not analyzed yet"}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => runAnalysis(row.username)} disabled={!!analyzing}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasSnapshot ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <MiniStat label="Engagement" value={`${row.engagementRate.toFixed(1)}%`} />
                      <MiniStat label="Posts / week" value={row.postingFrequency.toFixed(1)} />
                      <MiniStat label="Avg likes" value={Math.round(row.avgLikes).toLocaleString()} />
                    </div>
                    {latest && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Dominant theme
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-sm font-medium">{latest.theme}</span>
                          <Progress value={latest.share * 100} className="h-1.5 flex-1" />
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {Math.round(latest.share * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2 text-sm">
                    {row.category && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{row.category}</span>
                        {row.followerRange ? ` · ${row.followerRange} followers` : ""}
                      </p>
                    )}
                    {row.audienceType && (
                      <p className="text-muted-foreground">Audience: {row.audienceType}</p>
                    )}
                    {row.engagementQuality && (
                      <p className="text-muted-foreground">Engagement: {row.engagementQuality}</p>
                    )}
                    {row.reasonSelected && <p className="text-muted-foreground">{row.reasonSelected}</p>}
                    <Button variant="outline" size="sm" onClick={() => runAnalysis(row.username)} disabled={!!analyzing}>
                      <Radar className="size-3.5" /> Analyze to fetch real data
                    </Button>
                  </div>
                )}
                {row.reportJson && (() => {
                  let parsed: CompetitorReport | null = null;
                  try {
                    parsed = JSON.parse(row.reportJson!);
                  } catch {
                    parsed = null;
                  }
                  return parsed ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      onClick={() => setReport({ username: row.username, data: parsed! })}
                    >
                      <Target className="size-4" /> View full analysis
                    </Button>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {report && <ReportModal username={report.username} data={report.data} onClose={() => setReport(null)} />}

      <DiscoverDialog
        open={discoverOpen}
        onOpenChange={setDiscoverOpen}
        prefill={prefill}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import competitors from CSV</DialogTitle>
            <DialogDescription>
              Used when scraping is blocked. One row per competitor — username is required,
              metrics are optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : "Choose a .csv file"}
              </span>
              <span className="text-xs text-muted-foreground">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "up to 512 KB"}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80"
            >
              <FileDown className="size-3.5" /> Download template
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={runImport} disabled={!file || importing}>
              {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {importing ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResearchSection({
  research,
  added,
  onAdd,
  onRerun,
}: {
  research: NonNullable<Parameters<typeof CompetitorsView>[0]["research"]>;
  added: Set<string>;
  onAdd: (c: DiscoveredCompetitor) => void;
  onRerun: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const byPriority: Record<number, DiscoveredCompetitor[]> = { 1: [], 2: [], 3: [] };
  for (const c of research.competitors) {
    byPriority[c.researchPriority]?.push(c);
  }
  const emerging = new Set(research.emergingCreators.map((u) => u.toLowerCase()));
  const authority = new Set(research.authorityCreators.map((u) => u.toLowerCase()));

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Compass className="size-4 text-primary" /> Niche research
            <Badge variant="secondary" className="text-[11px] font-normal">
              {research.competitors.length} accounts mapped
            </Badge>
          </CardTitle>
          <CardDescription className="mt-1 max-w-3xl">{research.nicheSummary}</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRerun}>
          <RefreshCw className="size-3.5" /> Re-run
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          {[1, 2, 3].map((p) =>
            byPriority[p]?.length ? (
              <div key={p}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {PRIORITY_META[p].label}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(expanded ? byPriority[p] : byPriority[p].slice(0, expanded ? 99 : p === 1 ? 2 : 1)).map((c) => {
                    const inEmerging = emerging.has(c.username.toLowerCase());
                    const inAuthority = authority.has(c.username.toLowerCase());
                    return (
                      <div key={c.username} className="rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">
                              @{c.username}
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {c.displayName}
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {c.category} · {c.followerRange}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={added.has(c.username) ? "secondary" : "outline"}
                            disabled={added.has(c.username)}
                            onClick={() => onAdd(c)}
                            className="shrink-0"
                          >
                            {added.has(c.username) ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                            {added.has(c.username) ? "Added" : "Add"}
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {inEmerging && (
                            <Badge variant="outline" className="text-[10px] font-normal text-emerald-600">
                              Emerging
                            </Badge>
                          )}
                          {inAuthority && (
                            <Badge variant="outline" className="text-[10px] font-normal text-amber-600">
                              Authority
                            </Badge>
                          )}
                          {c.contentPillars.slice(0, 3).map((pill) => (
                            <Badge key={pill} variant="secondary" className="text-[10px] font-normal">
                              {pill}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">Why: </span>
                          {c.reasonSelected}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Engagement: </span>
                          {c.engagementQuality} · {c.audienceType}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null
          )}
        </div>

        {research.competitors.length > 4 && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-primary">
            {expanded ? "Show less" : `Show all ${research.competitors.length} accounts`}
          </Button>
        )}

        {research.contentOpportunities.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Content opportunities
            </p>
            <ul className="space-y-1.5">
              {research.contentOpportunities.map((o) => (
                <li key={o} className="flex gap-2 text-sm text-muted-foreground">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" /> {o}
                </li>
              ))}
            </ul>
          </div>
        )}

        {research.researchRecommendations.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Research recommendations
            </p>
            <ul className="space-y-1.5">
              {research.researchRecommendations.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-muted-foreground">
                  <Target className="mt-0.5 size-3.5 shrink-0 text-primary" /> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DiscoverDialog({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prefill: { niche: string; description: string; audience: string };
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="size-4 text-primary" /> Discover competitors
          </DialogTitle>
          <DialogDescription>
            The AI maps your niche, finds 20+ accounts worth studying — authority, growth and
            hidden creators — and scores them by relevance and engagement. Not a popularity list.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <DiscoverForm
            key="discover-form"
            prefill={prefill}
            onDone={() => {
              toast.success("Competitor research complete");
              onOpenChange(false);
              window.location.reload();
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DiscoverForm({
  prefill,
  onDone,
  onCancel,
}: {
  prefill: { niche: string; description: string; audience: string };
  onDone: () => void;
  onCancel: () => void;
}) {
  const [niche, setNiche] = React.useState(prefill.niche);
  const [description, setDescription] = React.useState(prefill.description);
  const [audience, setAudience] = React.useState(prefill.audience);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async () => {
    if (!niche.trim()) {
      setError("Niche is required");
      return;
    }
    setRunning(true);
    setError(null);
    const res = await discoverCompetitors({ niche, description, audience });
    setRunning(false);
    if (!res.ok) {
      setError(res.error ?? "Discovery failed");
      return;
    }
    onDone();
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Niche</label>
          <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. AI agency for local businesses" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Your description / positioning</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="e.g. Building an AI automation agency for restaurants and gyms"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Target audience</label>
          <Textarea
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            rows={2}
            placeholder="e.g. Local business owners who want AI workflows without hiring an engineer"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter className="gap-2 mt-6">
        <Button variant="outline" onClick={onCancel} disabled={running}>
          Cancel
        </Button>
        <Button onClick={run} disabled={running || !niche.trim()}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Compass className="size-4" />}
          {running ? "Researching…" : "Run research"}
        </Button>
      </DialogFooter>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function ReportModal({
  username,
  data,
  onClose,
}: {
  username: string;
  data: CompetitorReport;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<"insights" | "ideas">("insights");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Competitive report · @{username}</h3>
            <p className="text-xs text-muted-foreground">{data.positioning || data.summary || "No summary yet"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-border px-6 pt-4">
          {(["insights", "ideas"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-t-lg px-4 py-2 text-sm font-medium",
                tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "insights" ? "Insights" : "Your plays"}
            </button>
          ))}
        </div>

        <div className="space-y-5 px-6 py-5">
          {tab === "insights" ? (
            <>
              {(data.strengths ?? []).length > 0 && (
                <Section title="Strengths">
                  {data.strengths.map((s, i) => (
                    <Li key={i} icon={<TrendingUp className="size-3.5" />}>{s}</Li>
                  ))}
                </Section>
              )}
              {(data.weaknesses ?? []).length > 0 && (
                <Section title="Weaknesses">
                  {data.weaknesses.map((w, i) => (
                    <Li key={i} icon={<TrendingDown className="size-3.5" />}>{w}</Li>
                  ))}
                </Section>
              )}
              {(data.contentThemes ?? []).length > 0 && (
                <Section title="Content themes">
                  <ul className="space-y-2">
                    {data.contentThemes.map((t) => (
                      <li key={t.theme} className="flex items-center gap-3 text-sm">
                        <span className="w-40 shrink-0 font-medium">{t.theme}</span>
                        <Progress value={t.share * 100} className="h-1.5 flex-1" />
                        <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {Math.round(t.share * 100)}% · ER {t.engagement.toFixed(1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {(data.strengths ?? []).length === 0 &&
                (data.weaknesses ?? []).length === 0 &&
                (data.contentThemes ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No insights yet — refresh this analysis.</p>
                )}
            </>
          ) : (
            <>
              {(data.gaps ?? []).length > 0 && (
                <Section title="Gaps you can exploit">
                  {data.gaps.map((g, i) => (
                    <Li key={i} icon={<Target className="size-3.5" />}>{g}</Li>
                  ))}
                </Section>
              )}
              {(data.recommendations ?? []).length > 0 && (
                <Section title="Recommendations">
                  {data.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      {r}
                    </li>
                  ))}
                </Section>
              )}
              {(data.titleIdeas ?? []).length > 0 && (
                <Section title="Ready-to-use title ideas">
                  <div className="flex flex-wrap gap-2">
                    {data.titleIdeas.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

function Li({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      {children}
    </li>
  );
}
