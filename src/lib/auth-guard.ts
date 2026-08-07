import { auth, authEnabled, demoUser } from "@/lib/auth";

/**
 * Returns the current user for server components.
 * When auth is disabled (demo mode) the seeded demo user is used,
 * so the app stays fully browsable without OAuth keys.
 */
export async function requireUser() {
  if (!authEnabled) return demoUser;
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}
