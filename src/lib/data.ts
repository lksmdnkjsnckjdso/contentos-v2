import { prisma } from "@/lib/db";

const SEED_POST_PREFIX = "post-";

export async function getDashboardData() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    include: { brandConfig: true },
  });

  if (!user) return null;

  const account =
    (await prisma.instagramAccount.findFirst({
      where: { userId: user.id, source: { not: "seed" } },
      orderBy: { updatedAt: "desc" },
    })) ??
    (await prisma.instagramAccount.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }));

  if (!account) return null;

  const now = new Date();

  // Once an account is real (scraped/OAuth/demo), hide the seed's fake
  // history so the dashboard never mixes invented numbers with real ones.
  const accountIsReal = account.source !== "seed";
  const snapshotWhere = accountIsReal
    ? { accountId: account.id, source: { not: "seed" } }
    : { accountId: account.id };
  const postWhere = accountIsReal
    ? {
        accountId: account.id,
        OR: [{ igId: null }, { igId: { not: { startsWith: SEED_POST_PREFIX } } }],
      }
    : { accountId: account.id };

  const [snapshots, posts, competitorSnapshot, slots] = await Promise.all([
    prisma.profileSnapshot.findMany({
      where: snapshotWhere,
      orderBy: { date: "asc" },
    }),
    prisma.post.findMany({
      where: postWhere,
      orderBy: { postedAt: "desc" },
    }),
    prisma.competitorSnapshot.findFirst({
      orderBy: { date: "desc" },
      include: { competitor: true },
    }),
    prisma.contentSlot.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1),
        },
      },
      orderBy: { date: "asc" },
      include: { draft: true },
    }),
  ]);

  return { user, account, snapshots, posts, competitorSnapshot, slots };
}

export type DashboardData = NonNullable<Awaited<ReturnType<typeof getDashboardData>>>;
