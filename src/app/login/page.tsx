import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isClerkAuthEnabledForHost } from "@/lib/auth-config";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Demo mode / incompatible host+keys: no Clerk, no sign-in — open app.
  const h = await headers();
  const hostname = h.get("host")?.split(":")[0] ?? null;
  if (!isClerkAuthEnabledForHost(hostname)) {
    redirect("/dashboard");
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}