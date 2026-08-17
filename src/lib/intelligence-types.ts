export type IntelCompetitor = {
  username: string;
  displayName: string | null;
  category: string | null;
  followers: number;
  engagementRate: number;
  postingFrequency: number;
  avgLikes: number;
  growthScore: number;
  followerDelta30d: number;
  themes: { theme: string; share: number; engagement: number }[];
};

export type GrowthInsight = {
  id: string;
  stat: string;
  headline: string;
  context: string;
  tone: "up" | "down" | "neutral";
};

export type ViralReel = {
  id: string;
  competitorUsername: string;
  views: number;
  hook: string;
  topic: string;
  format: string;
  whyItWorked: string;
  postedDaysAgo: number;
};

export type ContentGap = {
  topic: string;
  competitorsPost: boolean;
  userPosts: boolean;
  opportunity: "HIGH" | "MEDIUM" | "LOW";
};

export type Opportunity = {
  id: string;
  priority: "HIGH" | "MEDIUM";
  topic: string;
  reasons: string[];
  difficulty: "Low" | "Medium" | "High";
  viralityPotential: number;
  competitors: string[];
};

export type HookPattern = {
  pattern: string;
  example: string;
  frequency: number;
};

export type Trend = {
  topic: string;
  status: "Rising" | "Stable" | "Declining";
  score: number;
  delta: number;
  mentions: number;
};

export type CalendarPost = {
  id: string;
  day: number; // 0 = Monday
  time: string; // "18:30"
  competitorUsername: string;
  topic: string;
  format: string;
};

export type PositioningAxis = {
  axis: "Authority" | "Consistency" | "Virality" | "Storytelling" | "Educational";
  user: number;
  nicheAvg: number;
};

export type ActionItem = {
  id: number;
  title: string;
  detail: string;
  impact: "High" | "Medium";
  category: string;
};

export type IntelligenceData = {
  generatedAt: string;
  niche: string;
  competitors: IntelCompetitor[];
  insights: GrowthInsight[];
  viralReels: ViralReel[];
  gaps: ContentGap[];
  opportunities: Opportunity[];
  hooks: HookPattern[];
  trends: Trend[];
  calendar: CalendarPost[];
  positioning: PositioningAxis[];
  actions: ActionItem[];
};