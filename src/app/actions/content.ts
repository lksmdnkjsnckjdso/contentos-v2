"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { chatJSON, draftSchema, draftExample } from "@/lib/groq";

export async function createSlot(input: {
  date: string;
  time: string;
  mediaType: "REEL" | "CAROUSEL" | "STORY" | "SINGLE";
  pillar: string | null;
}) {
  const parsed = z
    .object({
      date: z.string().min(1),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      mediaType: z.enum(["REEL", "CAROUSEL", "STORY", "SINGLE"]),
      pillar: z.string().nullable(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid slot data" };

  const user = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const slot = await prisma.contentSlot.create({
    data: {
      userId: user.id,
      date: new Date(parsed.data.date),
      time: parsed.data.time,
      mediaType: parsed.data.mediaType,
      pillar: parsed.data.pillar,
      status: "IDEA",
    },
  });

  return { ok: true as const, slotId: slot.id };
}

export async function generateDraft(slotId: string) {
  const slot = await prisma.contentSlot.findUnique({
    where: { id: slotId },
    include: {
      user: { include: { brandConfig: true } },
      draft: true,
    },
  });

  if (!slot) return { ok: false as const, error: "Slot not found" };
  if (!slot.user.brandConfig)
    return { ok: false as const, error: "Complete the Setup Guide first" };
  if (slot.draft && slot.draft.topic) return { ok: false as const, error: "Draft already generated" };

  const bc = slot.user.brandConfig;
  const pillars = JSON.parse(bc.pillars) as { name: string; description: string }[];
  const hashtagBank = JSON.parse(bc.hashtagBank) as string[];

  const system = `You are ContentOS, a world-class Instagram growth strategist and Level 6 storyteller.
You write scroll-stopping reels and carousels for personal brands.
Output must be a single JSON object matching the schema. Be specific, concrete and human.
Never invent hashtags — only use the ones provided.
The script timing must total roughly 30-45 seconds.

## Storytelling system (Level 6 method)
Every piece of content is a story. Pick the storytelling level that fits the pillar, media type and audience, then build the script on its beat map:

Level 1 · Informational — beats: hook -> claim -> 3 concrete steps -> proof -> CTA
Level 2 · Emotional — beats: hook -> the pain -> a relatable turning moment -> the shift -> CTA
Level 3 · Subtextual — beats: surface image -> the hidden truth beneath it -> the realization -> CTA
Level 4 · Archetypal — beats: the threshold -> the mentor/allies -> trials -> transformation -> return with the reward -> CTA
Level 5 · Interactive — beats: hook -> two paths -> the cost of each -> invitation to choose -> CTA
Level 6 · Generative Reality — beats: the viewer's world -> their current quest phase -> the next command -> rising stakes -> a co-created payoff -> CTA

## Level selection rules
- Personal / build-in-public pillars: prefer Level 4 or 6 (the viewer is the hero of their own journey).
- Deep-dive pillars: prefer Level 3 or 4 (subtext and mythic resonance).
- Systems / how-to pillars: prefer Level 1 or 2 (logic plus emotional stakes).
- Community-building goals or interactive formats (STORY, polls): prefer Level 5 or 6.
- Short reels (under 30s): Level 1-2 keeps the pace; long-form reels and carousels can carry Level 3-6.

## Non-negotiable rules
- Symbiotic metanarrative: the viewer IS the protagonist. Always write "you" — never a fictional character. Their audience, goal and daily reality (from the brand profile) are the story's world.
- Keep an open loop: an unanswered question or unfinished quest that the CTA resolves (the hook opens it, the CTA closes it).
- Every line must earn its second — no filler, no generic "in today's video".`;

  const user = `Brand profile:
- Niche: ${bc.niche}
- Audience: ${bc.audience}
- Tone: ${bc.tone}
- Goal: ${bc.goal}
- Content pillars: ${pillars.map((p) => p.name).join(", ")}
- Available hashtags: ${hashtagBank.join(", ")}

Create content for this slot:
- Media type: ${slot.mediaType}
- Pillar: ${slot.pillar ?? "any"}
- Topic: ${slot.draft?.topic || "pick the strongest topic for this pillar"}
- Publish date: ${slot.date.toDateString()} at ${slot.time}

Generate: 1) a focused topic, 2) the angle, 3) the storytelling level (1-6) that fits this post, 4) the narrative architecture (the viewer's role in this story, what's at stake, the transformation, the open loop), 5) 3 hook variants (max 8 words each, scroll-stopping), 6) a timed script following the level's beat map, 7) a caption with the hook variant chosen, 8) hashtags from the bank only, 9) a clear CTA that resolves the open loop, 10) a thumbnail/cover idea.`;

  try {
    const draft = await chatJSON(draftSchema, system, user, draftExample, 0.8);

    const scriptText =
      typeof draft.script === "string"
        ? draft.script
        : Array.isArray(draft.script)
          ? draft.script.map((l, i) => `Line ${i + 1}: ${l}`).join("\n")
          : draft.script.timing.map((t) => `${t.seconds}: ${t.line}`).join("\n");

    const updated = await prisma.contentDraft.upsert({
      where: { slotId: slot.id },
      create: {
        slotId: slot.id,
        topic: draft.topic,
        hookVariants: JSON.stringify(draft.hookVariants),
        script: scriptText,
        caption: draft.caption,
        hashtags: JSON.stringify(draft.hashtags),
        cta: draft.cta,
        thumbnailIdea: draft.thumbnailIdea,
        aiParams: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          storytellingLevel: draft.storytellingLevel,
          narrative: draft.narrative,
        }),
      },
      update: {},
    });

    await prisma.contentSlot.update({
      where: { id: slot.id },
      data: { status: "READY" },
    });

    return { ok: true as const, draft: updated };
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI generation failed";
    return { ok: false as const, error: message };
  }
}
