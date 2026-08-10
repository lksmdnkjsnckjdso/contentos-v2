import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, KeyRound, Zap } from "lucide-react";
import { InstagramCard } from "@/components/settings/instagram-card";
import { instagramConfigured, instagramDemoMode } from "@/lib/instagram-graph";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ig?: string; reason?: string; username?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login?callbackUrl=/settings");

  const params = await searchParams;
  const account = user
    ? await prisma.instagramAccount.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } })
    : null;

  const queryNotice =
    params.ig === "connected"
      ? { kind: "connected" as const, message: `Connected as @${params.username ?? "instagram"}` }
      : params.ig === "error"
        ? { kind: "error" as const, message: `Instagram connect failed: ${params.reason ?? "unknown error"}` }
        : null;

  const items = [
    {
      icon: KeyRound,
      title: "Groq AI",
      desc: "Powers draft generation, captions and competitor reports.",
      state: process.env.GROQ_API_KEY ? "Configured" : "Missing key",
      ok: !!process.env.GROQ_API_KEY,
      detail: process.env.GROQ_MODEL,
    },
    {
      icon: Zap,
      title: "Pro plan",
      desc: "Unlimited drafts, 5 competitors, advanced analytics.",
      state: user?.tier ?? "FREE",
      ok: true,
      detail: null,
    },
  ];

  return (
    <AppShell active="/settings" title="Settings">
      <div className="mx-auto max-w-[900px] px-4 sm:px-8 py-8 space-y-6">
        <InstagramCard
          connected={!!account?.connected}
          username={account?.username ?? null}
          followerCount={account?.followerCount ?? 0}
          source={account?.source ?? null}
          updatedAt={account?.updatedAt ?? null}
          queryNotice={queryNotice}
          liveEnabled={instagramConfigured}
        />
        {!instagramConfigured && (
          <p className="text-xs text-muted-foreground">
            {instagramDemoMode ? (
              <>
                Demo mode — profile sync uses public scrape. To enable{" "}
                <span className="font-medium text-foreground">live sync</span> (official Instagram Graph API data), add
                Meta app credentials:{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INSTAGRAM_CLIENT_ID</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INSTAGRAM_CLIENT_SECRET</code> and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INSTAGRAM_REDIRECT_URI</code> in{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">.env.local</code>, then set{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INSTAGRAM_DEMO=false</code>.
              </>
            ) : (
              <>
                Live sync is disabled — set{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INSTAGRAM_CLIENT_ID</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INSTAGRAM_CLIENT_SECRET</code> and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INSTAGRAM_REDIRECT_URI</code> in{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">.env.local</code> to enable it. For
                a sandboxed demo, set <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INSTAGRAM_DEMO=true</code>.
              </>
            )}
          </p>
        )}
        {items.map((it) => (
          <Card key={it.title}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <it.icon className="size-4.5" strokeWidth={1.75} />
                </div>
                <div>
                  <CardTitle className="text-base">{it.title}</CardTitle>
                  <CardDescription>{it.desc}</CardDescription>
                </div>
              </div>
              <Badge variant={it.ok ? "secondary" : "outline"} className="gap-1.5">
                {it.ok ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-red-500" />}
                {it.state}
              </Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">{it.detail}</p>
              <Button variant={it.ok ? "outline" : "default"} size="sm">
                {it.ok ? "Manage" : "Connect"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
