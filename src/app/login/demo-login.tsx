import Link from "next/link";
import { LogoMark } from "@/components/app-shell/sidebar";

export function DemoLogin() {
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

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Authentication is in demo mode — the workspace is fully open, no account needed.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  demo@contentos.app
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  (disabled in demo mode)
                </div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="mt-6 block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Continue to dashboard
            </Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Demo build — sign-in/sign-up with real accounts returns with live Clerk keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}