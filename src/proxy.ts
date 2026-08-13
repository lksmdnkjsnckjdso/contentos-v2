import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { isClerkAuthEnabledForHost } from "@/lib/auth-config";

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // Demo mode / incompatible host+keys run without Clerk — don't initialize
  // it here (dev keys reject non-localhost origins and cause redirect loops).
  if (!isClerkAuthEnabledForHost(request.nextUrl.hostname)) return NextResponse.next();
  return clerkMiddleware()(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};