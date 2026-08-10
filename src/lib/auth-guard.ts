import { auth, authEnabled } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  tier: string;
};

/**
 * Resolves the authenticated DB user for server components/actions.
 * When auth is disabled (demo mode) the seeded demo user is used,
 * so the app stays fully browsable without OAuth keys.
 */
export async function requireUser(): Promise<CurrentUser | null> {
  if (!authEnabled) {
    const demo = await prisma.user.findUnique({ where: { email: "demo@contentos.app" } });
    if (demo) return pick(demo);
    return { id: "demo", email: "demo@contentos.app", name: "Maya Reyes", image: null, tier: "FREE" };
  }
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return pick(user);
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
