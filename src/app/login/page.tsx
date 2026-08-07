"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LogoMark } from "@/components/app-shell/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("demo@contentos.app");
  const [password, setPassword] = React.useState("demo");
  const [busy, setBusy] = React.useState<"credentials" | "google" | null>(null);

  const doDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("credentials");
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(null);
    if (res?.error) {
      toast.error("Invalid credentials");
      return;
    }
    router.push(searchParams.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-[100dvh]">
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-chart-3 to-[oklch(0.2_0.06_262)] p-10 text-primary-foreground">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <LogoMark />
          </div>
          <span className="text-lg font-semibold tracking-tight">ContentOS</span>
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Your Instagram operating system.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/80">
            Setup guide, analytics, competitor intelligence and an AI content calendar —
            one system for your personal brand.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">
          Plan · Create · Publish · Analyze
        </p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-semibold tracking-tight">
              Content<span className="text-primary">OS</span>
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your content operating system.
          </p>

          <form onSubmit={doDemo} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy !== null}>
              {busy === "credentials" ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            demo access
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("google");
              await signIn("google", { callbackUrl: searchParams.get("callbackUrl") ?? "/dashboard" });
            }}
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo mode: use the prefilled credentials, or configure Google OAuth in{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">.env.local</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
