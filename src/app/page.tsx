import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isClerkAuthEnabledForHost } from "@/lib/auth-config";

export default async function Home() {
  const h = await headers();
  const hostname = h.get("host")?.split(":")[0] ?? null;
  // Sign-in page first (demo card or real Clerk form); dashboard after entry.
  if (!isClerkAuthEnabledForHost(hostname)) {
    redirect("/login");
  }
  redirect("/dashboard");
}