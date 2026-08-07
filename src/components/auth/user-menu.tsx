"use client";

import { useSession, signOut } from "next-auth/react";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="size-8 rounded-full bg-gradient-to-br from-primary to-chart-3 grid place-items-center text-primary-foreground text-xs font-semibold">
        MR
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block text-right">
        <p className="text-xs font-semibold leading-tight">{session.user.name}</p>
        <p className="text-[11px] leading-tight text-muted-foreground">{session.user.email}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="group grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-chart-3 text-primary-foreground text-xs font-semibold transition-transform hover:scale-105"
        title="Sign out"
      >
        {(session.user.name ?? "U").slice(0, 1).toUpperCase()}
      </button>
      <span className="sr-only">Sign out</span>
    </div>
  );
}
