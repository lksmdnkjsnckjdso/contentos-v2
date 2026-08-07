import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Radar,
  Compass,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Content Calendar", icon: CalendarDays },
  { href: "/competitors", label: "Competitors", icon: Radar },
  { href: "/onboarding", label: "Setup Guide", icon: Compass },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-7 rounded-lg bg-primary grid place-items-center text-primary-foreground shadow-[0_2px_10px_-2px_oklch(0.55_0.23_261/0.5)]",
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
        <path
          d="M4 8.5C4 6.57 5.57 5 7.5 5h9C18.43 5 20 6.57 20 8.5v7c0 1.93-1.57 3.5-3.5 3.5h-9C5.57 19 4 17.43 4 15.5v-7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      </svg>
    </div>
  );
}

export function Sidebar({ active }: { active: string }) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border/70">
        <LogoMark />
        <span className="font-semibold tracking-tight text-[15px]">
          Content<span className="text-primary">OS</span>
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4.5" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pb-4">
        <div className="rounded-xl border border-border bg-muted/60 p-3.5">
          <p className="text-[13px] font-semibold leading-snug">Pro plan</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            5 competitors · Unlimited drafts
          </p>
        </div>
      </div>
    </aside>
  );
}

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 backdrop-blur px-4 sm:px-8">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          @maya.builds
        </span>
        <UserMenu />
      </div>
    </header>
  );
}
