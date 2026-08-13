import { Suspense } from "react";
import { headers } from "next/headers";
import { isClerkAuthEnabledForHost } from "@/lib/auth-config";
import { LoginForm } from "./login-form";
import { DemoLogin } from "./demo-login";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // No Clerk on this host/keys: show the branded demo sign-in page instead.
  const h = await headers();
  const hostname = h.get("host")?.split(":")[0] ?? null;
  if (!isClerkAuthEnabledForHost(hostname)) {
    return <DemoLogin />;
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}