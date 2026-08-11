import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  const authEnabled = process.env.AUTH_ENABLED === "true";
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        {authEnabled ? <ClerkProvider>{children}</ClerkProvider> : children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
