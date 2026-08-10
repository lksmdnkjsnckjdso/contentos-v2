"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";

const inputSchema = z.object({
  niche: z.string(),
  handle: z.string(),
  goal: z.string(),
  audience: z.string(),
  tone: z.string(),
  pillars: z.array(z.object({ name: z.string(), description: z.string() })),
  hashtagBank: z.array(z.string()),
  postingDays: z.array(z.number()),
  postingTime: z.string(),
});

export async function saveBrandConfig(input: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const user = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  await prisma.brandConfig.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data, pillars: JSON.stringify(parsed.data.pillars), hashtagBank: JSON.stringify(parsed.data.hashtagBank), postingDays: JSON.stringify(parsed.data.postingDays) },
    update: { ...parsed.data, pillars: JSON.stringify(parsed.data.pillars), hashtagBank: JSON.stringify(parsed.data.hashtagBank), postingDays: JSON.stringify(parsed.data.postingDays) },
  });

  return { ok: true };
}
