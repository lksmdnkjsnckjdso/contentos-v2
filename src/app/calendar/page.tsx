import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CalendarGrid, type SlotDTO } from "@/components/calendar/calendar-grid";
import { NewSlotButton } from "@/components/calendar/new-slot-button";

export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekDays(offset: number) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1 + offset * 7);
  const days: { label: string; date: Date; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      label: DAYS[d.getDay()],
      date: d,
      isToday: d.toDateString() === now.toDateString(),
    });
  }
  return days;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login?callbackUrl=/calendar");

  const params = await searchParams;
  const offset = Math.min(Math.max(parseInt(params.week ?? "0", 10) || 0, -4), 8);
  const days = weekDays(offset);

  const slots = await prisma.contentSlot.findMany({
    where: {
      date: {
        gte: days[0].date,
        lt: new Date(days[6].date.getTime() + 86400000),
      },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    include: { draft: true },
  });

  const grouped = days.map((day) => ({
    ...day,
    date: day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    slots: slots
      .filter((s) => s.date.toDateString() === day.date.toDateString())
      .map(
        (s): SlotDTO => {
          let storytelling: SlotDTO["storytelling"] = null;
          try {
            const p = s.draft?.aiParams ? JSON.parse(s.draft.aiParams) : null;
            if (p?.storytellingLevel) {
              storytelling = { level: p.storytellingLevel, ...(p.narrative ?? {}) };
            }
          } catch {
            storytelling = null;
          }
          return {
            id: s.id,
            date: s.date.toISOString(),
            time: s.time,
            mediaType: s.mediaType,
            pillar: s.pillar,
            status: s.status,
            topic: s.draft?.topic ?? null,
            hookVariants: s.draft?.hookVariants ?? null,
            script: s.draft?.script ?? null,
            caption: s.draft?.caption ?? null,
            hashtags: s.draft?.hashtags ?? null,
            cta: s.draft?.cta ?? null,
            thumbnailIdea: s.draft?.thumbnailIdea ?? null,
            storytelling,
          };
        }
      ),
  }));

  const weekLabel = `${days[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <AppShell
      active="/calendar"
      title="Content calendar"
      subtitle="Every slot ships with a full AI package: hook, script, caption"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-8">
        <div className="mb-4 flex justify-end">
          <NewSlotButton weekStart={days[0].date.toISOString()} />
        </div>
        <CalendarGrid
          slots={{ days: grouped }}
          weekLabel={weekLabel}
          hrefPrev={`/calendar?week=${offset - 1}`}
          hrefNext={`/calendar?week=${offset + 1}`}
        />
      </div>
    </AppShell>
  );
}
