import { NextRequest, NextResponse } from "next/server";
import { completeInstagramConnect } from "@/app/actions/instagram";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") ?? "";
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/settings?ig=error&reason=${encodeURIComponent(error ?? "missing code")}`, req.nextUrl.origin)
    );
  }

  try {
    const res = await completeInstagramConnect(code, state);
    if (!res.ok) throw new Error(res.error);
    return NextResponse.redirect(new URL(`/settings?ig=connected&username=${encodeURIComponent(res.account.username)}`, req.nextUrl.origin));
  } catch (e) {
    const reason = e instanceof Error ? e.message : "unknown";
    return NextResponse.redirect(new URL(`/settings?ig=error&reason=${encodeURIComponent(reason)}`, req.nextUrl.origin));
  }
}
