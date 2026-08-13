/**
 * Single source of truth for "is Clerk auth actually enabled" on this host.
 *
 * Enabled when ALL of:
 *  1. AUTH_ENABLED / NEXT_PUBLIC_AUTH_ENABLED is "true"
 *  2. Both Clerk keys are present in the environment
 *  3. The host is allowed for this key type:
 *     - live keys (sk_live_/pk_live_): any host
 *     - dev keys (sk_test_/pk_test_): localhost or any *.vercel.app /
 *       *.netlify.app preview domain — Clerk supports development keys on
 *       host-provided preview domains (see "Managing environments" docs).
 *
 * The host check exists to keep auth deterministically off in demo setups
 * that enable AUTH_ENABLED without configuring keys for the running host.
 */

function isLocalHost(hostname: string | null | undefined): boolean {
  return (
    !!hostname &&
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost"))
  );
}

/** Host-provided preview domains where development keys are supported. */
function isPreviewHost(hostname: string | null | undefined): boolean {
  return (
    !!hostname &&
    (hostname.endsWith(".vercel.app") || hostname.endsWith(".netlify.app"))
  );
}

/** Server side: host comes from the request / headers(). */
export function isClerkAuthEnabledForHost(hostname: string | null | undefined): boolean {
  if (process.env.AUTH_ENABLED !== "true") return false;
  const secret = process.env.CLERK_SECRET_KEY ?? "";
  if (!secret || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return false;
  if (secret.startsWith("sk_live_")) return true;
  return isLocalHost(hostname) || isPreviewHost(hostname);
}

/** Client side: host comes from window.location (client components only). */
export function isClerkAuthEnabledClient(): boolean {
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") return false;
  if (typeof window === "undefined") return false;
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (!publishable) return false;
  if (publishable.startsWith("pk_live_")) return true;
  return isLocalHost(window.location.hostname) || isPreviewHost(window.location.hostname);
}