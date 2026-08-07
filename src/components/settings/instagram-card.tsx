"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AtSign, CheckCircle2, XCircle, Loader2, RefreshCw, Unlink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { connectInstagram, syncInstagram, disconnectInstagram, connectByHandle } from "@/app/actions/instagram";
import { toast } from "sonner";

export function InstagramCard({
  connected,
  username,
  followerCount,
  source,
  updatedAt,
  queryNotice,
}: {
  connected: boolean;
  username: string | null;
  followerCount: number;
  source: string | null;
  updatedAt: Date | null;
  queryNotice: { kind: "connected" | "error"; message: string } | null;
}) {
  const router = useRouter();
  const [handle, setHandle] = React.useState(username ? `@${username}` : "@");
  const [busy, setBusy] = React.useState<null | "connect" | "fetch" | "sync" | "disconnect">(null);

  React.useEffect(() => {
    if (!queryNotice) return;
    if (queryNotice.kind === "connected") toast.success(queryNotice.message);
    else toast.error(queryNotice.message);
    router.replace("/settings");
  }, [queryNotice, router]);

  const doConnect = async () => {
    setBusy("connect");
    const res = await connectInstagram();
    setBusy(null);
    if (res.ok) {
      window.location.href = res.url;
    } else {
      toast.error(res.error);
    }
  };

  const doFetch = async () => {
    setBusy("fetch");
    const res = await connectByHandle(handle);
    setBusy(null);
    if (res.ok) {
      const p = res.profile;
      toast.success(
        (res.demo ? "Demo data — " : "") +
          `@${p.username}: ${p.followers.toLocaleString()} followers · ${p.posts} posts` +
          (p.postsImported ? ` · ${p.postsImported} recent posts imported` : "")
      );
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const doSync = async () => {
    setBusy("sync");
    const res = await syncInstagram();
    setBusy(null);
    if (res.ok) {
      toast.success(`Synced — ${res.followers.toLocaleString()} followers` + (res.postsSynced ? `, ${res.postsSynced} posts` : ""));
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const doDisconnect = async () => {
    setBusy("disconnect");
    const res = await disconnectInstagram();
    setBusy(null);
    if (res.ok) {
      toast.success("Instagram disconnected");
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
            <AtSign className="size-4.5" strokeWidth={1.75} />
          </div>
          <div>
            <CardTitle className="text-base">Instagram account</CardTitle>
            <CardDescription>Enter your handle to pull your public profile, or connect via OAuth for live insights.</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {source === "scrape" && (
            <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
              Public data
            </Badge>
          )}
          <Badge variant={connected ? "secondary" : "outline"} className="gap-1.5">
            {connected ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-red-500" />}
            {connected ? "Connected" : "Not connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <p className="text-sm text-muted-foreground">
          {connected
            ? `@${username} · ${followerCount.toLocaleString()} followers` +
              (updatedAt ? ` · synced ${updatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "")
            : "Scrapes followers, bio and recent posts from your public profile."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <Input
              className="pl-8"
              placeholder="your handle…"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doFetch()}
            />
          </div>
          <Button variant="outline" size="sm" onClick={doFetch} disabled={busy !== null || handle.trim().replace(/^@/, "").length < 2}>
            {busy === "fetch" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Fetch profile
          </Button>
          {connected ? (
            <>
              <Button variant="outline" size="sm" onClick={doSync} disabled={busy !== null}>
                {busy === "sync" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Sync now
              </Button>
              <Button variant="ghost" size="sm" onClick={doDisconnect} disabled={busy !== null} className="text-muted-foreground">
                <Unlink className="size-4" /> Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={doConnect} disabled={busy !== null}>
              {busy === "connect" ? <Loader2 className="size-4 animate-spin" /> : <AtSign className="size-4" />}
              OAuth Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
