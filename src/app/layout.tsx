import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { isClerkAuthEnabledForHost } from "@/lib/auth-config";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContentOS — Your Instagram operating system",
  description:
    "Setup guide, analytics, competitor intelligence and an AI content calendar for your personal brand.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const h = await headers();
  const hostname = h.get("host")?.split(":")[0] ?? null;
  const authEnabled = isClerkAuthEnabledForHost(hostname);
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {authEnabled ? <ClerkProvider>{children}</ClerkProvider> : children}
        </ThemeProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}