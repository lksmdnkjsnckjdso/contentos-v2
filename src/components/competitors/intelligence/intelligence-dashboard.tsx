"use client";

import * as React from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Eye,
  Flame,
  Gauge,
  Lightbulb,
  Radar as RadarIcon,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntelligenceData } from "@/lib/intelligence-types";
import { SectionHeader } from "@/components/competitors/intelligence/section-header";
import { CompetitorOverview } from "@/components/competitors/intelligence/competitor-overview";
import { GrowthInsights } from "@/components/competitors/intelligence/growth-insights";
import { ViralContent } from "@/components/competitors/intelligence/viral-content";
import { ContentGaps } from "@/components/competitors/intelligence/content-gaps";
import { OpportunityEngine } from "@/components/competitors/intelligence/opportunity-engine";
import { HookIntelligence } from "@/components/competitors/intelligence/hook-intelligence";
import { TrendRadar } from "@/components/competitors/intelligence/trend-radar";
import { ContentCalendar } from "@/components/competitors/intelligence/content-calendar";
import { PositioningScore } from "@/components/competitors/intelligence/positioning-score";
import { ActionPlan } from "@/components/competitors/intelligence/action-plan";

const NAV = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "viral", label: "Viral Content", icon: Flame },
  { id: "gaps", label: "Content Gaps", icon: Target },
  { id: "opportunities", label: "Opportunities", icon: Lightbulb },
  { id: "hooks", label: "Hooks", icon: Activity },
  { id: "trends", label: "Trends", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "positioning", label: "Positioning", icon: RadarIcon },
  { id: "actions", label: "Action Plan", icon: Sparkles },
];

function ChipNav() {
  return (
    <nav className="sticky top-0 z-30 -mx-4 sm:-mx-8 border-b border-border/70 bg-background/85 px-4 sm:px-8 backdrop-blur-md">
      <div className="flex gap-1.5 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#intel-${id}`}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </a>
        ))}
        <a
          href="#intel-overview"
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80"
        >
          View analysis <ArrowRight className="size-3" />
        </a>
      </div>
    </nav>
  );
}

export function IntelligenceDashboard({ data }: { data: IntelligenceData }) {
  const competitorCount = data.competitors.length;

  return (
    <div className="space-y-16 pb-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Eye className="size-3.5 text-primary" />
        Intelligence generated from {competitorCount} tracked competitor{competitorCount === 1 ? "" : "s"}
      </div>

      <ChipNav />

      <section id="intel-overview" className="scroll-mt-24">
        <SectionHeader
          eyebrow="01 · Competitor Overview"
          title="The field you're playing against"
          description="Live metrics across your tracked accounts, ranked by growth velocity — not vanity."
        />
        <CompetitorOverview data={data} />
      </section>

      <section id="intel-growth" className="scroll-mt-24">
        <SectionHeader
          eyebrow="02 · Growth Insights"
          title="What actually moves the needle"
          description="Patterns extracted from competitor content — each one is a lever you can pull this week."
        />
        <GrowthInsights data={data} />
      </section>

      <section id="intel-viral" className="scroll-mt-24">
        <SectionHeader
          eyebrow="03 · Viral Content Breakdown"
          title="Why their top posts won"
          description="Deconstructing the highest-performing reels across your niche — hook, topic, format, and the reason it worked."
        />
        <ViralContent data={data} />
      </section>

      <section id="intel-gaps" className="scroll-mt-24">
        <SectionHeader
          eyebrow="04 · Content Gap Analysis"
          title="Where competitors post and you don't"
          description="Topics your rivals publish consistently while your own feed stays quiet — the easiest wins in the niche."
        />
        <ContentGaps data={data} />
      </section>

      <section id="intel-opportunities" className="scroll-mt-24">
        <SectionHeader
          eyebrow="05 · Opportunity Engine"
          title="High-leverage content ideas"
          description="Ranked opportunities scored by virality potential and difficulty, with the competitors already winning on them."
        />
        <OpportunityEngine data={data} />
      </section>

      <section id="intel-hooks" className="scroll-mt-24">
        <SectionHeader
          eyebrow="06 · Hook Intelligence"
          title="The openers that stop the scroll"
          description="Hook patterns across every top-performing post in the niche, with their frequency of success."
        />
        <HookIntelligence data={data} />
      </section>

      <section id="intel-trends" className="scroll-mt-24">
        <SectionHeader
          eyebrow="07 · Trend Radar"
          title="Topics moving in your niche"
          description="Rising, stable, and fading conversation topics — trend score and momentum for each."
        />
        <TrendRadar data={data} />
      </section>

      <section id="intel-calendar" className="scroll-mt-24">
        <SectionHeader
          eyebrow="08 · Competitor Content Calendar"
          title="This week, in their feeds"
          description="Where competitors publish, when, and on what — borrow the rhythm, not the posts."
        />
        <ContentCalendar data={data} />
      </section>

      <section id="intel-positioning" className="scroll-mt-24">
        <SectionHeader
          eyebrow="09 · Creator Positioning Score"
          title="Your brand vs. the niche average"
          description="A five-axis view of how your personal brand is positioned against the accounts you track."
        />
        <PositioningScore data={data} />
      </section>

      <section id="intel-actions" className="scroll-mt-24">
        <SectionHeader
          eyebrow="10 · Action Plan"
          title="Your next 10 moves"
          description="Prioritized, specific actions built from everything above. Do these in order and you out-position the niche."
        />
        <ActionPlan data={data} />
      </section>
    </div>
  );
}