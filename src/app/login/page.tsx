"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { LogoMark } from "@/components/app-shell/sidebar";

function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = React.useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );

  const appearance = {
    elements: {
      card: "shadow-none border border-border rounded-xl",
      headerTitle: "text-xl font-semibold tracking-tight",
      headerSubtitle: "text-sm text-muted-foreground",
      formButtonPrimary:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none rounded-md font-medium",
      formFieldInput:
        "rounded-md border-border bg-background text-sm h-9 px-3 shadow-none",
      formFieldLabel: "text-xs font-medium text-muted-foreground",
      dividerLine: "bg-border",
      dividerText: "text-xs text-muted-foreground",
      footerActionLink: "text-primary font-medium",
      footerActionText: "text-sm text-muted-foreground",
      socialButtonsBlockButton:
        "rounded-md border-border text-foreground bg-background hover:bg-muted/50 font-medium",
    },
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

          <div className="mt-8">
            {mode === "signin" ? (
              <SignIn
                appearance={appearance}
                routing="hash"
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
                signUpUrl="/login?mode=signup"
              />
            ) : (
              <SignUp
                appearance={appearance}
                routing="hash"
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
                signInUrl="/login"
              />
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
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
