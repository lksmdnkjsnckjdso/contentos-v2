import type {
  ActionItem,
  CalendarPost,
  ContentGap,
  GrowthInsight,
  HookPattern,
  IntelligenceData,
  IntelCompetitor,
  Opportunity,
  PositioningAxis,
  Trend,
  ViralReel,
} from "@/lib/intelligence-types";

export type IntelInput = {
  username: string;
  displayName: string | null;
  category: string | null;
  followers: number;
  engagementRate: number;
  postingFrequency: number;
  avgLikes: number;
  followerDelta30d: number; // % growth over ~30d window
  themes: { theme: string; share: number; engagement: number }[];
};

/** Deterministic PRNG so mock intelligence stays stable between reloads. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(rng() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}k`;
  return `${n}`;
}

const INSIGHT_TEMPLATES: Array<Omit<GrowthInsight, "id">> = [
  {
    stat: "2.3x",
    headline: "Case studies outperform other formats",
    context: "Competitors that break down real results get 2.3x more engagement than talking-head posts.",
    tone: "up",
  },
  {
    stat: "1.8x",
    headline: "Storytelling reels dominate this niche",
    context: "Short-form narrative reels drive 1.8x the average engagement of educational carousels.",
    tone: "up",
  },
  {
    stat: "6–9 PM",
    headline: "Most competitors publish in the evening",
    context: "72% of top posts are published between 6 PM and 9 PM — your audience is most active then.",
    tone: "neutral",
  },
  {
    stat: "34%",
    headline: "Hooks decide virality",
    context: "Posts opening with a contrarian or curiosity hook capture 34% more profile visits than generic intros.",
    tone: "up",
  },
  {
    stat: "2.1x",
    headline: "Mistake breakdowns build trust",
    context: "\"What I got wrong\" posts earn 2.1x more saves — proof of value, not vanity.",
    tone: "up",
  },
  {
    stat: "-0.4%",
    headline: "Engagement is plateauing for low-frequency posters",
    context: "Accounts posting fewer than 3x/week see declining engagement rates over the last 30 days.",
    tone: "down",
  },
];

const HOOK_POOL = [
  "Nobody talks about this…",
  "The reason you're stuck…",
  "I analyzed 100 accounts so you don't have to",
  "Stop doing this if you want to grow",
  "The truth about building in public",
  "3 things I wish I knew sooner",
  "Why your content isn't converting",
  "This one change doubled my reach",
  "I tested this for 30 days",
  "What nobody tells you about consistency",
];

const WHY_POOL = [
  "Opens with a curiosity gap — viewers stay for the payoff.",
  "Specific, personal numbers make it feel credible and shareable.",
  "Contrarian framing triggers debate in the comments.",
  "Directly addresses a pain point the audience already has.",
  "Pattern-interrupt hook stops the scroll within the first second.",
  "Builds a serial narrative — viewers binge the rest of the profile.",
  "Turns a failure into a lesson, which earns trust and saves.",
  "Actionable list format — high save rate and revisit value.",
];

const FORMAT_POOL = ["Storytelling Reel", "Case Study Reel", "Talking Head", "POV Reel", "Carousel Breakdown"];

const TREND_POOL: Array<{ topic: string; status: Trend["status"]; base: number }> = [
  { topic: "AI Automation", status: "Rising", base: 88 },
  { topic: "Build in Public", status: "Rising", base: 84 },
  { topic: "Founder Stories", status: "Rising", base: 79 },
  { topic: "Case Studies", status: "Stable", base: 74 },
  { topic: "Productivity Systems", status: "Stable", base: 68 },
  { topic: "Personal Branding", status: "Stable", base: 63 },
  { topic: "Mistake Breakdowns", status: "Declining", base: 57 },
  { topic: "Hype / Motivation", status: "Declining", base: 41 },
  { topic: "Generic Tips", status: "Declining", base: 33 },
];

const GAP_TOPICS = ["Founder Stories", "Case Studies", "Mistake Breakdowns", "AI Automation", "Personal Branding"];

const OPPORTUNITY_TEMPLATES: Array<{
  topic: string;
  reasons: string[];
  difficulty: Opportunity["difficulty"];
  baseVirality: number;
}> = [
  {
    topic: "AI Automation For Agencies",
    reasons: ["High engagement among competitors", "Low saturation in this niche", "Strong save rate on related topics"],
    difficulty: "Medium",
    baseVirality: 92,
  },
  {
    topic: "Behind-The-Scenes Founder Life",
    reasons: ["Audience requests this format in comments", "Competitors rarely share it", "High watch-time retention"],
    difficulty: "Low",
    baseVirality: 84,
  },
  {
    topic: "Zero-to-1 Case Study Series",
    reasons: ["Case studies earn 2.3x engagement", "Serial format boosts profile visits", "Clear proof-of-value angle"],
    difficulty: "Medium",
    baseVirality: 89,
  },
  {
    topic: "Client Wins Breakdown",
    reasons: ["Authority-building proof content", "Low competition in your niche", "High shareability"],
    difficulty: "Medium",
    baseVirality: 78,
  },
  {
    topic: "Rapid-Fire Myth Busting",
    reasons: ["Contrarian hooks drive comments", "Short-form friendly", "Easy to produce weekly"],
    difficulty: "Low",
    baseVirality: 81,
  },
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function buildIntelligence(inputs: IntelInput[], niche: string): IntelligenceData {
  const seed = hashString(inputs.map((c) => c.username).join("|") + niche);
  const rng = mulberry32(seed);

  const competitors: IntelCompetitor[] = inputs.map((c) => {
    const growthScore = clamp(
      Math.round(40 + c.engagementRate * 6 + Math.max(0, c.followerDelta30d) * 3),
      12,
      98
    );
    return {
      username: c.username,
      displayName: c.displayName,
      category: c.category,
      followers: c.followers,
      engagementRate: c.engagementRate,
      postingFrequency: c.postingFrequency,
      avgLikes: c.avgLikes,
      growthScore,
      followerDelta30d: c.followerDelta30d,
      themes: c.themes.slice(0, 3),
    };
  });

  const insights: GrowthInsight[] = INSIGHT_TEMPLATES.map((t, i) => ({ ...t, id: `insight-${i}` }));

  const viralReels: ViralReel[] = inputs.slice(0, 8).map((c, i) => {
    const views = Math.round(c.avgLikes * (2.5 + rng() * 4));
    return {
      id: `reel-${i}`,
      competitorUsername: c.username,
      views,
      hook: pick(rng, HOOK_POOL),
      topic: c.themes[0]?.theme ?? pick(rng, GAP_TOPICS),
      format: pick(rng, FORMAT_POOL),
      whyItWorked: pick(rng, WHY_POOL),
      postedDaysAgo: Math.floor(rng() * 14),
    };
  });

  const gaps: ContentGap[] = GAP_TOPICS.map((topic, i) => {
    const competitorsPost = i < 3;
    const userPosts = i === 2;
    return {
      topic,
      competitorsPost,
      userPosts,
      opportunity: !competitorsPost || !userPosts ? "HIGH" : "MEDIUM",
    };
  });

  const opportunities: Opportunity[] = OPPORTUNITY_TEMPLATES.map((t, i) => {
    const competitorCount = 1 + Math.floor(rng() * 3);
    return {
      id: `opp-${i}`,
      priority: t.baseVirality >= 84 ? "HIGH" : "MEDIUM",
      topic: t.topic,
      reasons: t.reasons,
      difficulty: t.difficulty,
      viralityPotential: clamp(t.baseVirality + Math.round(rng() * 6 - 3), 60, 98),
      competitors: pickN(rng, inputs.map((c) => c.username), competitorCount),
    };
  });

  const hooks: HookPattern[] = [
    { pattern: "Curiosity gap opener", example: "Nobody talks about this…", frequency: 34 },
    { pattern: "Contrarian take", example: "The reason you're stuck…", frequency: 27 },
    { pattern: "Data / analysis opener", example: "I analyzed 100 accounts…", frequency: 18 },
    { pattern: "Numbered list", example: "3 things I wish I knew…", frequency: 13 },
    { pattern: "Direct challenge", example: "Stop doing this…", frequency: 8 },
  ];

  const trends: Trend[] = TREND_POOL.map((t) => ({
    topic: t.topic,
    status: t.status,
    score: clamp(t.base + Math.round(rng() * 8 - 4), 20, 99),
    delta: Math.round(rng() * 30 - 10),
    mentions: Math.round((2 + rng() * 8) * 10),
  }));

  const calendar: CalendarPost[] = [];
  const days = DAY_NAMES.map((_, d) => d);
  inputs.forEach((c, ci) => {
    const postsPerWeek = clamp(Math.round(c.postingFrequency), 1, 7);
    const usedDays = pickN(rng, days, postsPerWeek);
    usedDays.forEach((day, di) => {
      const hour = 17 + Math.floor(rng() * 4); // 5–8 PM window
      const minute = [0, 15, 30, 45][Math.floor(rng() * 4)];
      calendar.push({
        id: `cal-${ci}-${di}`,
        day,
        time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        competitorUsername: c.username,
        topic: c.themes[di % Math.max(1, c.themes.length)]?.theme ?? pick(rng, GAP_TOPICS),
        format: pick(rng, FORMAT_POOL),
      });
    });
  });
  calendar.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));

  const nicheAvg = {
    Authority: 72,
    Consistency: 68,
    Virality: 61,
    Storytelling: 66,
    Educational: 74,
  };
  const userBase = { Authority: 55, Consistency: 47, Virality: 52, Storytelling: 63, Educational: 49 };
  const jitter = () => Math.round(rng() * 8 - 4);
  const positioning: PositioningAxis[] = (
    ["Authority", "Consistency", "Virality", "Storytelling", "Educational"] as const
  ).map((axis) => ({
    axis,
    user: clamp(userBase[axis] + jitter(), 20, 95),
    nicheAvg: clamp(nicheAvg[axis] + jitter(), 30, 95),
  }));

  const worstAxis = [...positioning].sort((a, b) => a.user - b.user)[0];
  const strongestHook = hooks[0];
  const avgFreq =
    inputs.length > 0
      ? inputs.reduce((s, c) => s + c.postingFrequency, 0) / inputs.length
      : 3;

  const actions: ActionItem[] = [
    {
      id: 1,
      title: "Create 3 founder-story reels",
      detail: "Storytelling formats earn 1.8x average engagement in this niche. Start with your origin story.",
      impact: "High",
      category: "Content",
    },
    {
      id: 2,
      title: "Test curiosity-based hooks",
      detail: `\u201c${strongestHook.example}\u201d-style openers capture 34% more profile visits. Test 2 per week.`,
      impact: "High",
      category: "Hooks",
    },
    {
      id: 3,
      title: `Increase posting frequency from 3 to ${Math.ceil(avgFreq)} reels`,
      detail: "Competitors posting more than 3x/week sustain engagement; low-frequency accounts are plateauing.",
      impact: "High",
      category: "Consistency",
    },
    {
      id: 4,
      title: "Publish between 6 PM and 9 PM",
      detail: "72% of top competitor posts land in the evening window when your audience is active.",
      impact: "Medium",
      category: "Timing",
    },
    {
      id: 5,
      title: "Ship your first case study",
      detail: "Case studies earn 2.3x engagement and are the #1 gap in your current content mix.",
      impact: "High",
      category: "Content",
    },
    {
      id: 6,
      title: "Raise your Consistency score",
      detail: `You're at ${worstAxis.user}/100 vs ${worstAxis.nicheAvg}/100 niche average — commit to a weekly cadence.`,
      impact: "High",
      category: "Positioning",
    },
    {
      id: 7,
      title: "Add a mistake breakdown to the calendar",
      detail: "\u201cWhat I got wrong\u201d posts earn 2.1x more saves and build audience trust.",
      impact: "Medium",
      category: "Content",
    },
    {
      id: 8,
      title: "Repurpose top insight into a carousel",
      detail: "Educational carousels complement your reels and improve your Educational Content score.",
      impact: "Medium",
      category: "Format Mix",
    },
    {
      id: 9,
      title: "Engage with rising-topic creators",
      detail: `Comment and collaborate on ${trends[0]?.topic ?? "AI Automation"} content while it's trending up.`,
      impact: "Medium",
      category: "Networking",
    },
    {
      id: 10,
      title: "Turn your best reel into a series",
      detail: "Serial content boosts profile visits and earns follow-through — one thread, weekly updates.",
      impact: "Medium",
      category: "Content",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    niche,
    competitors,
    insights,
    viralReels,
    gaps,
    opportunities,
    hooks,
    trends,
    calendar,
    positioning,
    actions,
  };
}

export { fmtNum, DAY_NAMES };