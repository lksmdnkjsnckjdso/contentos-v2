import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const authEnabled = process.env.AUTH_ENABLED === "true";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  tier: string;
};

/**
 * Resolves the authenticated DB user for server components/actions.
 * Clerk sessions map to the User row via externalId; the row is upserted
 * on first sign-in (profile data comes from Clerk). When auth is disabled
 * (demo mode) the seeded demo user is used, so the app stays fully
 * browsable without Clerk keys.
 */
export async function requireUser(): Promise<CurrentUser | null> {
  if (!authEnabled) {
    const demo = await prisma.user.findUnique({ where: { email: "demo@contentos.app" } });
    if (demo) return pick(demo);
    return { id: "demo", email: "demo@contentos.app", name: "Maya Reyes", image: null, tier: "FREE" };
  }

  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { externalId: userId } });
  if (existing) return pick(existing);

  const { clerkClient } = await import("@clerk/nextjs/server");
  const clerkUser = await (await clerkClient()).users.getUser(userId);
  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
    ?? clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name = clerkUser.fullName ?? clerkUser.username ?? email.split("@")[0];
  const image = clerkUser.imageUrl || null;

  // An account may already exist for this email (e.g. seeded demo user) —
  // claim it by setting externalId instead of colliding on the unique index.
  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    const claimed = await prisma.user.update({
      where: { id: byEmail.id },
      data: { externalId: userId, name, image },
    });
    return pick(claimed);
  }

  try {
    const created = await prisma.user.create({
      data: { externalId: userId, email, name, image },
    });
    return pick(created);
  } catch {
    // Concurrent first sign-in — another request may have just created the row.
    const retried = await prisma.user.findUnique({ where: { externalId: userId } });
    if (retried) return pick(retried);
    throw new Error("Failed to sync Clerk user into the database");
  }
}

/**
 * Convenience for server actions: throws-safe current user or null.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return requireUser();
}

function pick(u: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  tier: string;
}): CurrentUser {
  return { id: u.id, email: u.email, name: u.name, image: u.image, tier: u.tier };
}
