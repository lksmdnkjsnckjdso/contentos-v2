import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  // Demo mode: no Clerk, no sign-in — the app is fully open.
  if (process.env.AUTH_ENABLED !== "true") {
    redirect("/dashboard");
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
