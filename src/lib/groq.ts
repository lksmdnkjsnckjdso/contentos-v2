import Groq from "groq-sdk";
import { z } from "zod";

const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

let groq: Groq | null = null;
function client(): Groq {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

/**
 * Ask the LLM for a single JSON object. Models follow a concrete inline
 * example far better than an abstract schema, so callers pass `example`
 * — a literal example object — which is embedded in the system prompt.
 * A tolerant zod `schema` then validates and normalizes the reply.
 */
export async function chatJSON<T extends z.ZodType>(
  schema: T,
  system: string,
  user: string,
  example: unknown,
  temperature = 0.7,
  maxTokens = 4096
): Promise<z.infer<T>> {
  const sys = `${system}

You MUST reply with a single JSON object, nothing else — no markdown fences, no commentary.

The JSON MUST follow this exact structure (every key required):
${JSON.stringify(example, null, 2)}`;

  const res = await client().chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const text = res.choices[0]?.message?.content ?? "";
  const parsed = schema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`AI returned invalid JSON: ${parsed.error.message}`);
  }
  return parsed.data;
}

const timingLine = z.object({
  seconds: z.string(),
  line: z.string(),
});

export const draftSchema = z.object({
  topic: z.string().min(1),
  angle: z.string().min(1),
  storytellingLevel: z.number().int().min(1).max(6),
  narrative: z.object({
    role: z.string().min(1),
    stakes: z.string().min(1),
    transformation: z.string().min(1),
    openLoop: z.string().min(1),
  }),
  hookVariants: z.array(z.string().min(1)).min(1).max(6),
  script: z
    .object({ timing: z.array(timingLine).min(3) })
    .or(z.array(z.string().min(1)).min(3))
    .or(z.string().min(1)),
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).max(15).default([]),
  cta: z.string().min(1),
  thumbnailIdea: z.string().min(1),
});

export type GeneratedDraft = z.infer<typeof draftSchema>;

export const draftExample = {
  topic: "The 5-minute content ritual that compounds",
  angle: "Reframe daily consistency as an investment, not a chore",
  storytellingLevel: 4,
  narrative: {
    role: "The builder standing at the threshold of a bigger audience",
    stakes: "Another month of posting into the void — or a system that compounds",
    transformation: "From random posting to a ritual that grows while you sleep",
    openLoop: "What will your first saved post unlock?",
  },
  hookVariants: [
    "5 minutes a day. That's all it took.",
    "This 5-minute ritual grew my page 4x",
    "You're overthinking content. Do this instead.",
  ],
  script: {
    timing: [
      { seconds: "0-3s", line: "Five minutes a day grew my page four times." },
      { seconds: "3-10s", line: "Here is the exact ritual I run every morning." },
      { seconds: "10-20s", line: "Step one: one saved idea, rewritten in my voice." },
      { seconds: "20-30s", line: "Step two: one hook, three variants, pick the best." },
      { seconds: "30-40s", line: "Step three: schedule it and walk away." },
      { seconds: "40-45s", line: "Save this for tomorrow's session." },
    ],
  },
  caption:
    "The 5-minute ritual that changed everything. Steal it.\\n\\nWhat blocks you most? Tell me below.",
  hashtags: ["#buildinpublic", "#creatoreconomy", "#solofounder"],
  cta: "Save this for your next planning session",
  thumbnailIdea: "Big timer graphic: 5:00 → 4x growth",
} as const;

export const competitorReportSchema = z.object({
  summary: z.string().min(1),
  positioning: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  contentThemes: z
    .array(
      z.object({
        theme: z.string().min(1),
        share: z.number(),
        engagement: z.number(),
      })
    )
    .min(1),
  gaps: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
  titleIdeas: z.array(z.string().min(1)).max(5),
});

export type CompetitorReport = z.infer<typeof competitorReportSchema>;

export const competitorExample = {
  summary: "Thought-leadership account monetizing brevity in the wisdom niche.",
  positioning:
    "A quote-driven philosophy page that trades depth for shareable one-liners.",
  strengths: [
    "Ultra-consistent 2+ posts/week cadence",
    "Short, brandable, quote-form content",
    "Strong share-through from simple ideas",
  ],
  weaknesses: [
    "No storytelling depth or personal narrative",
    "Low saves vs reach — content is consumable, not useful",
    "Reply-rate is flat; no community mechanics",
  ],
  contentThemes: [
    { theme: "Wisdom quotes", share: 0.43, engagement: 1.8 },
    { theme: "Philosophy", share: 0.27, engagement: 1.7 },
    { theme: "Business", share: 0.19, engagement: 2.0 },
  ],
  gaps: [
    "No long-form breakdowns of a single idea",
    "No carousel systems or frameworks",
    "No weekly narrative deep-dive",
  ],
  recommendations: [
    "Publish a weekly deep-dive that unpacks one concept end-to-end",
    "Package frameworks into saveable carousels",
    "Reply to every comment in the first hour to spike the signal",
  ],
  titleIdeas: [
    "The idea behind the idea",
    "One concept, fully unpacked",
    "The framework I wish I found earlier",
  ],
} as const;

const discoveredCompetitor = z.object({
  username: z.string().min(1),
  displayName: z.string().min(1),
  category: z.string().min(1),
  followerRange: z.string().min(1),
  engagementQuality: z.string().min(1),
  reasonSelected: z.string().min(1),
  contentPillars: z.array(z.string().min(1)).min(1),
  audienceType: z.string().min(1),
  researchPriority: z.number().int().min(1).max(3),
});

export const discoverySchema = z.object({
  nicheSummary: z.string().min(1),
  competitors: z.array(discoveredCompetitor).min(8).max(30),
  emergingCreators: z.array(z.string().min(1)),
  authorityCreators: z.array(z.string().min(1)),
  contentOpportunities: z.array(z.string().min(1)),
  researchRecommendations: z.array(z.string().min(1)),
});

export type DiscoveryResult = z.infer<typeof discoverySchema>;
export type DiscoveredCompetitor = z.infer<typeof discoveredCompetitor>;

export const discoveryExample = {
  nicheSummary:
    "AI agency space: saturated at the top with hype-driven growth talk, but thin on operational depth — pricing, delivery systems and realistic client outcomes.",
  competitors: [
    {
      username: "liamottley",
      displayName: "Liam Ottley",
      category: "AI Agency Owner",
      followerRange: "100k-500k",
      engagementQuality: "High — strong save rates on tactical playbooks",
      reasonSelected: "Repeatable 'AI agency systems' format; teaches exactly what buyers of agency content search for",
      contentPillars: ["Agency systems", "AI automation", "Client acquisition"],
      audienceType: "Aspiring and active AI agency owners",
      researchPriority: 1,
    },
    {
      username: "theaiconomy",
      displayName: "The AI Conomy",
      category: "AI Automation Expert",
      followerRange: "10k-50k",
      engagementQuality: "Very high — replies to comments, tiny follower-to-engagement ratio",
      reasonSelected: "Smaller account with outsized engagement; hidden creator worth studying",
      contentPillars: ["AI workflows", "Tools breakdowns", "No-code"],
      audienceType: "Operators and small teams",
      researchPriority: 1,
    },
    {
      username: "mrhackio",
      displayName: "Mr. Hackio",
      category: "AI Consultants",
      followerRange: "500k-1M",
      engagementQuality: "Medium — broad reach, lower relative engagement",
      reasonSelected: "Large reach for format inspiration; lower priority as direct competitor",
      contentPillars: ["AI tips", "Future of work", "News"],
      audienceType: "General tech audience",
      researchPriority: 3,
    },
  ],
  emergingCreators: [
    "growwithjordan",
    "agentautomationco",
  ],
  authorityCreators: [
    "mrhackio",
    "lukasberlin",
  ],
  contentOpportunities: [
    "Real revenue numbers from AI agency client work (nobody shows the books)",
    "Pricing frameworks for AI retainers",
    "How to fire a bad client as an agency owner",
  ],
  researchRecommendations: [
    "Scrape the Priority 1 list first — every account has a repeatable format to reverse-engineer",
    "Track emerging creators weekly; three of them hit 50k in under a year",
    "Ignore authority creators for direct positioning; borrow their hooks only",
  ],
} as const;
