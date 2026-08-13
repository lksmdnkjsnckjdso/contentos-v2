/**
 * Single source of truth for "is Clerk auth actually enabled" on this host.
 *
 * Auth is enabled only when BOTH:
 *  1. AUTH_ENABLED / NEXT_PUBLIC_AUTH_ENABLED is "true", AND
 *  2. the host is localhost (dev keys work there) OR the keys are live
 *     (pk_live_ / sk_live_ — required for any non-localhost origin).
 *
 * Clerk dev instances reject every origin except localhost, so running
 * AUTH_ENABLED=true with dev keys on a deployed domain (Vercel etc.)
 * causes an endless redirect loop. This keeps the app loadable in demo
 * mode there, and flips to real auth automatically once live keys are set.
 */

function isLocalHost(hostname: string | null | undefined): boolean {
  return (
    !!hostname &&
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost"))
  );
}

/** Server side: host comes from the request / headers(). */
export function isClerkAuthEnabledForHost(hostname: string | null | undefined): boolean {
  if (process.env.AUTH_ENABLED !== "true") return false;
  const secret = process.env.CLERK_SECRET_KEY ?? "";
  const isLive = secret.startsWith("sk_live_");
  return isLive || isLocalHost(hostname);
}

/** Client side: host comes from window.location (client components only). */
export function isClerkAuthEnabledClient(): boolean {
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") return false;
  if (typeof window === "undefined") return false;
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const isLive = publishable.startsWith("pk_live_");
  return isLive || isLocalHost(window.location.hostname);
}
