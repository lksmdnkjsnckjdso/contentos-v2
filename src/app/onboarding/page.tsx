import { getDashboardData } from "@/lib/data";
import { requireUser } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (!user) redirect("/login?callbackUrl=/onboarding");

  const data = await getDashboardData();
  const bc = data?.user.brandConfig;

  return (
    <AppShell
      active="/onboarding"
      title="Page setup guide"
      subtitle="A step-by-step blueprint for your personal brand"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-8">
        <OnboardingWizard
          existing={
            bc
              ? {
                  niche: bc.niche,
                  handle: bc.handle,
                  goal: bc.goal,
                  audience: bc.audience,
                  tone: bc.tone,
                  pillars: bc.pillars,
                  hashtagBank: bc.hashtagBank,
                  postingDays: bc.postingDays,
                  postingTime: bc.postingTime,
                }
              : undefined
          }
        />
      </div>
    </AppShell>
  );
}
