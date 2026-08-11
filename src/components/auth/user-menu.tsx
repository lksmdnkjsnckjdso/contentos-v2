"use client";

import { useUser, useClerk } from "@clerk/nextjs";

const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

export function UserMenu() {
  // Demo mode (no ClerkProvider mounted) — static placeholder.
  if (!authEnabled) return <DemoAvatar />;
  return <ClerkUserMenu />;
}

function DemoAvatar() {
  return (
    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-chart-3 grid place-items-center text-primary-foreground text-xs font-semibold">
      MR
    </div>
  );
}

function ClerkUserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return <DemoAvatar />;

  const name = user.fullName ?? user.username ?? user.emailAddresses[0]?.emailAddress ?? "User";

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block text-right">
        <p className="text-xs font-semibold leading-tight">{name}</p>
        <p className="text-[11px] leading-tight text-muted-foreground">
          {user.emailAddresses[0]?.emailAddress}
        </p>
      </div>
      <button
        onClick={() => signOut({ redirectUrl: "/login" })}
        className="group grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-chart-3 text-primary-foreground text-xs font-semibold transition-transform hover:scale-105"
        title="Sign out"
      >
        {(user.fullName ?? user.username ?? "U").slice(0, 1).toUpperCase()}
      </button>
      <span className="sr-only">Sign out</span>
    </div>
  );
}
