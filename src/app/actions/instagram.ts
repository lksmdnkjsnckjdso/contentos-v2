"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { scrapeInstagramProfile, deriveScrapeMetrics } from "@/lib/instagram";
import {
  instagramConfigured,
  instagramDemoMode,
  instagramOAuthUrl,
  exchangeInstagramCode,
  refreshIfNeeded,
  fetchIgProfile,
  fetchIgInsights,
  fetchIgPosts,
} from "@/lib/instagram-graph";

const OAUTH_STATE = "contentos-ig-connect";

function dayKey(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Scrapes a public profile and persists everything: account row, daily
 * snapshot, recent posts. Returns details for the caller to surface.
 */
async function scrapeAndPersist(handleInput: string, user: { id: string }) {
  const handle = handleInput.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle))
    return { ok: false as const, error: "Invalid Instagram handle" };

  let scraped = await scrapeInstagramProfile(handle);
  let demo = false;

  if (scraped.source === "fallback") {
    if (!instagramDemoMode) {
      return {
        ok: false as const,
        error:
          "Instagram blocked the scrape for @" +
          handle +
          " (private account, rate-limited, or login-walled). Use OAuth Connect or a public handle.",
      };
    }
    demo = true;
    const existingAccount = await prisma.instagramAccount.findUnique({
      where: { userId_username: { userId: user.id, username: handle } },
    });
    const last = existingAccount
      ? await prisma.profileSnapshot.findFirst({
          where: { accountId: existingAccount.id },
          orderBy: { date: "desc" },
        })
      : null;
    const followers = (last?.followers ?? 8500) + 17;
    scraped = {
      username: handle,
      fullName: "Demo Creator",
      followers,
      following: 482,
      posts: 64,
      biography: "Building in public · Systems & solo-founder content",
      profilePic: null,
      recentPosts: [
        { caption: "The 3 systems that changed my 2026 #buildinpublic #systems", likes: 412, comments: 23, mediaType: "GraphReel", timestamp: Math.floor(Date.now() / 1000) - 86400 },
        { caption: "How I plan a week of content in 30 minutes #productivity #creator", likes: 388, comments: 19, mediaType: "GraphImage", timestamp: Math.floor(Date.now() / 1000) - 3 * 86400 },
        { caption: "Unpopular opinion about personal branding #creatoreconomy", likes: 301, comments: 41, mediaType: "GraphReel", timestamp: Math.floor(Date.now() / 1000) - 6 * 86400 },
      ],
      source: "scrape",
    };
  }

  const { avgLikes, er, postingFrequency, hashtags } = deriveScrapeMetrics(scraped);

  const account = await prisma.instagramAccount.upsert({
    where: { userId_username: { userId: user.id, username: scraped.username } },
    create: {
      igId: `scrape:${scraped.username}`,
      userId: user.id,
      username: scraped.username,
      displayName: scraped.fullName,
      connected: true,
      source: "scrape",
      followerCount: scraped.followers,
      followingCount: scraped.following,
      mediaCount: scraped.posts,
    },
    update: {
      displayName: scraped.fullName,
      connected: true,
      source: "scrape",
      followerCount: scraped.followers,
      followingCount: scraped.following,
      mediaCount: scraped.posts,
    },
  });

  const snapshotEr = scraped.recentPosts.length > 0 ? Number(er.toFixed(2)) : 0;

  await prisma.profileSnapshot.upsert({
    where: { accountId_date: { accountId: account.id, date: dayKey(new Date()) } },
    create: {
      accountId: account.id,
      date: dayKey(new Date()),
      followers: scraped.followers,
      following: scraped.following,
      mediaCount: scraped.posts,
      engagementRate: snapshotEr,
      reach: 0,
      impressions: 0,
      profileViews: 0,
      source: demo ? "demo" : "scrape",
    },
    update: {
      followers: scraped.followers,
      following: scraped.following,
      mediaCount: scraped.posts,
      engagementRate: snapshotEr,
      reach: 0,
      impressions: 0,
      profileViews: 0,
      source: demo ? "demo" : "scrape",
    },
  });

  let postsImported = 0;
  for (const p of scraped.recentPosts) {
    const postedAt = new Date(p.timestamp * 1000);
    const existing = await prisma.post.findFirst({
      where: { accountId: account.id, caption: p.caption ?? null },
    });
    if (existing) continue;
    await prisma.post.create({
      data: {
        accountId: account.id,
        caption: p.caption,
        mediaType: p.mediaType?.includes("Reel") ? "REEL" : "SINGLE",
        postedAt,
        likes: p.likes,
        comments: p.comments,
      },
    });
    postsImported++;
  }

  return {
    ok: true as const,
    demo,
    scraped,
    metrics: { er, avgLikes, postingFrequency, hashtags },
    postsImported,
  };
}

/**
 * Scrapes the user's own public profile by handle and persists everything.
 * Used as the no-credentials path (OAuth Connect is the upgrade).
 */
export async function connectByHandle(handleInput: string) {
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const res = await scrapeAndPersist(handleInput, user);
  if (!res.ok) return res;

  return {
    ok: true as const,
    demo: res.demo,
    profile: {
      username: res.scraped.username,
      fullName: res.scraped.fullName,
      followers: res.scraped.followers,
      following: res.scraped.following,
      posts: res.scraped.posts,
      bio: res.scraped.biography,
      engagementRate: Number(res.metrics.er.toFixed(2)),
      avgLikes: Number(res.metrics.avgLikes.toFixed(0)),
      postingFrequency: Number(res.metrics.postingFrequency.toFixed(1)),
      hashtags: res.metrics.hashtags,
      postsImported: res.postsImported,
    },
  };
}

export async function connectInstagram() {
  if (!instagramConfigured) {
    return {
      ok: false as const,
      error: "Instagram not configured — set INSTAGRAM_CLIENT_ID / INSTAGRAM_CLIENT_SECRET / INSTAGRAM_REDIRECT_URI in .env.local",
    };
  }
  return { ok: true as const, url: instagramOAuthUrl(OAUTH_STATE) };
}

export async function completeInstagramConnect(code: string, state: string) {
  if (state !== OAUTH_STATE) return { ok: false as const, error: "Invalid OAuth state" };
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const exchanged = await exchangeInstagramCode(code);
  const profile = await fetchIgProfile(exchanged.accessToken);

  const existing = await prisma.instagramAccount.findUnique({
    where: { userId_username: { userId: user.id, username: profile.username } },
  });
  const account = existing
    ? await prisma.instagramAccount.update({
        where: { id: existing.id },
        data: {
          igId: profile.igId,
          username: profile.username,
          displayName: profile.username,
          accessToken: exchanged.accessToken,
          tokenExpiresAt: exchanged.expiresAt,
          connected: true,
          source: "oauth",
          followerCount: profile.followers,
          followingCount: profile.following,
          mediaCount: profile.mediaCount,
        },
      })
    : await prisma.instagramAccount.create({
        data: {
          igId: profile.igId,
          userId: user.id,
          username: profile.username,
          displayName: profile.username,
          accessToken: exchanged.accessToken,
          tokenExpiresAt: exchanged.expiresAt,
          connected: true,
          source: "oauth",
          followerCount: profile.followers,
          followingCount: profile.following,
          mediaCount: profile.mediaCount,
        },
      });

  await prisma.profileSnapshot.upsert({
    where: { accountId_date: { accountId: account.id, date: dayKey(new Date()) } },
    create: {
      accountId: account.id,
      date: dayKey(new Date()),
      followers: profile.followers,
      following: profile.following,
      mediaCount: profile.mediaCount,
      source: "oauth",
    },
    update: {
      followers: profile.followers,
      following: profile.following,
      mediaCount: profile.mediaCount,
      source: "oauth",
    },
  });

  return { ok: true as const, account: { username: profile.username } };
}

export async function syncInstagram() {
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const account = await prisma.instagramAccount.findFirst({ where: { userId: user.id } });
  if (!account || !account.connected) {
    return { ok: false as const, error: "No connected Instagram account" };
  }

  if (account.source === "scrape") {
    const res = await scrapeAndPersist(account.username, user);
    if (!res.ok) return res;
    return {
      ok: true as const,
      demo: res.demo,
      followers: res.scraped.followers,
      mediaCount: res.scraped.posts,
      postsSynced: res.postsImported,
    };
  }

  if (instagramDemoMode) {
    return demoSync(user.id, account.id);
  }
  if (!instagramConfigured) {
    return { ok: false as const, error: "Instagram not configured — set INSTAGRAM_CLIENT_ID / INSTAGRAM_CLIENT_SECRET in .env.local" };
  }

  try {
    const refreshed = await refreshIfNeeded(account);
    const [profile, insights, posts] = await Promise.all([
      fetchIgProfile(refreshed.accessToken),
      fetchIgInsights(refreshed.accessToken),
      fetchIgPosts(refreshed.accessToken),
    ]);

    const updated = await prisma.instagramAccount.update({
      where: { id: account.id },
      data: {
        username: profile.username,
        accessToken: refreshed.accessToken,
        tokenExpiresAt: refreshed.expiresAt,
        followerCount: profile.followers,
        followingCount: profile.following,
        mediaCount: profile.mediaCount,
      },
    });

    await prisma.profileSnapshot.upsert({
      where: { accountId_date: { accountId: account.id, date: dayKey(new Date()) } },
      create: {
        accountId: account.id,
        date: dayKey(new Date()),
        followers: profile.followers,
        following: profile.following,
        mediaCount: profile.mediaCount,
        engagementRate: insights.engagementRate,
        reach: insights.reach,
        impressions: insights.impressions,
        profileViews: insights.profileViews,
        source: "oauth",
      },
      update: {
        followers: profile.followers,
        following: profile.following,
        mediaCount: profile.mediaCount,
        engagementRate: insights.engagementRate,
        reach: insights.reach,
        impressions: insights.impressions,
        profileViews: insights.profileViews,
        source: "oauth",
      },
    });

    let postsSynced = 0;
    for (const p of posts) {
      if (!p.igId) continue;
      await prisma.post.upsert({
        where: { igId: p.igId },
        create: {
          accountId: account.id,
          igId: p.igId,
          caption: p.caption,
          mediaType: p.mediaType,
          mediaUrl: p.mediaUrl,
          postedAt: new Date(p.timestamp),
          likes: p.likes,
          comments: p.comments,
          saves: p.saves,
          reach: p.reach,
          impressions: p.impressions,
        },
        update: {
          likes: p.likes,
          comments: p.comments,
          saves: p.saves,
          reach: p.reach,
          impressions: p.impressions,
        },
      });
      postsSynced++;
    }

    return {
      ok: true as const,
      followers: updated.followerCount,
      mediaCount: updated.mediaCount,
      postsSynced,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    return { ok: false as const, error: message };
  }
}

export async function disconnectInstagram() {
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  await prisma.instagramAccount.updateMany({
    where: { userId: user.id },
    data: { connected: false, accessToken: null, tokenExpiresAt: null },
  });
  return { ok: true as const };
}

async function demoSync(_userId: string, accountId: string) {
  const last = await prisma.profileSnapshot.findFirst({
    where: { accountId },
    orderBy: { date: "desc" },
  });
  const base = last?.followers ?? 8500;
  const followers = base + Math.floor(Math.random() * 40) + 5;
  const mediaCount = (last?.mediaCount ?? 64) + 1;
  const reach = Math.round(followers * (2.2 + Math.random() * 0.8));
  const impressions = Math.round(reach * 1.8);
  const engagementRate = Number((3.1 + Math.random() * 0.9).toFixed(2));

  await prisma.instagramAccount.update({
    where: { id: accountId },
    data: { followerCount: followers, mediaCount, connected: true },
  });
  await prisma.profileSnapshot.upsert({
    where: { accountId_date: { accountId, date: dayKey(new Date()) } },
    create: {
      accountId,
      date: dayKey(new Date()),
      followers,
      following: 482,
      mediaCount,
      engagementRate,
      reach,
      impressions,
      profileViews: Math.round(impressions * 0.35),
      source: "demo",
    },
    update: {
      followers,
      mediaCount,
      engagementRate,
      reach,
      impressions,
      source: "demo",
    },
  });
  return { ok: true as const, followers, mediaCount, postsSynced: 0 };
}
