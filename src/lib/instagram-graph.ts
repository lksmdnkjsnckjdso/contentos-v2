export type IgProfile = {
  igId: string;
  username: string;
  accountType: string;
  followers: number;
  following: number;
  mediaCount: number;
};

export type IgInsights = {
  reach: number;
  impressions: number;
  profileViews: number;
  engagementRate: number;
};

export type IgPost = {
  igId: string;
  caption: string | null;
  mediaType: "REEL" | "CAROUSEL" | "SINGLE" | "STORY";
  mediaUrl: string | null;
  timestamp: string;
  likes: number;
  comments: number;
  saves: number;
  reach: number;
  impressions: number;
};

const GRAPH = "https://graph.instagram.com";
const FB_GRAPH = "https://graph.facebook.com/v21.0";
const API_VERSION = "v21.0";

export const instagramConfigured =
  !!process.env.INSTAGRAM_CLIENT_ID && !!process.env.INSTAGRAM_CLIENT_SECRET;
export const instagramDemoMode = process.env.INSTAGRAM_DEMO === "true";

export function instagramOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID!,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
    response_type: "code",
    scope: "instagram_basic,instagram_insights,instagram_content_publish,pages_show_list",
    state,
  });
  return `${FB_GRAPH}/dialog/oauth?${params}`;
}

async function graphGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GRAPH}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Instagram Graph API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function exchangeInstagramCode(code: string): Promise<{
  accessToken: string;
  expiresAt: Date;
  userId: string;
}> {
  const short = await fetch(
    `${FB_GRAPH}/oauth/access_token?client_id=${process.env.INSTAGRAM_CLIENT_ID}&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI!)}&scope=instagram_basic,instagram_insights,instagram_content_publish,pages_show_list`,
    { cache: "no-store", signal: AbortSignal.timeout(15_000) }
  );
  if (!short.ok) throw new Error(`Code exchange failed (${short.status})`);
  const shortJson = (await short.json()) as { access_token?: string; user_id?: string };

  const long = await fetch(
    `${FB_GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.INSTAGRAM_CLIENT_ID}&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&fb_exchange_token=${encodeURIComponent(shortJson.access_token ?? "")}`,
    { cache: "no-store", signal: AbortSignal.timeout(15_000) }
  );
  if (!long.ok) throw new Error(`Token upgrade failed (${long.status})`);
  const longJson = (await long.json()) as { access_token?: string; expires_in?: number };

  return {
    accessToken: longJson.access_token ?? "",
    expiresAt: new Date(Date.now() + (longJson.expires_in ?? 60 * 24 * 3600) * 1000),
    userId: String(shortJson.user_id ?? ""),
  };
}

export async function refreshIfNeeded(account: {
  accessToken: string | null;
  tokenExpiresAt: Date | null;
}): Promise<{ accessToken: string; expiresAt: Date }> {
  let accessToken = account.accessToken ?? "";
  let expiresAt = account.tokenExpiresAt ?? new Date(0);
  if (!accessToken) throw new Error("No access token stored");
  if (expiresAt.getTime() - Date.now() < 7 * 24 * 3600 * 1000) {
    const res = await fetch(
      `${FB_GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.INSTAGRAM_CLIENT_ID}&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&fb_exchange_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store", signal: AbortSignal.timeout(15_000) }
    );
    if (res.ok) {
      const json = (await res.json()) as { access_token?: string; expires_in?: number };
      if (json.access_token) {
        accessToken = json.access_token;
        expiresAt = new Date(Date.now() + (json.expires_in ?? 60 * 24 * 3600) * 1000);
      }
    }
  }
  return { accessToken, expiresAt };
}

export async function fetchIgProfile(token: string): Promise<IgProfile> {
  const me = await graphGet<{
    id?: string;
    username?: string;
    account_type?: string;
    media_count?: number;
    followers_count?: number;
  }>(`/${API_VERSION}/me?fields=id,username,account_type,media_count,followers_count`, token);

  if (!me.id) throw new Error("Instagram returned no user id");
  return {
    igId: me.id,
    username: me.username ?? "",
    accountType: me.account_type ?? "BUSINESS",
    followers: me.followers_count ?? 0,
    following: 0, // not exposed by the Instagram Graph API
    mediaCount: me.media_count ?? 0,
  };
}

export async function fetchIgInsights(token: string): Promise<IgInsights> {
  try {
    const res = await graphGet<{
      data?: { name?: string; values?: { value?: number }[] }[];
    }>(`/${API_VERSION}/me?metric=reach,impressions,profile_views,follower_count,engagement`, token);

    const get = (name: string) =>
      res.data?.find((d) => d.name === name)?.values?.[0]?.value ?? 0;
    const reach = get("reach");
    const impressions = get("impressions");
    const profileViews = get("profile_views");
    const followerCount = get("follower_count");
    const engagement = get("engagement");

    return {
      reach,
      impressions,
      profileViews,
      engagementRate:
        followerCount > 0 ? Number(((engagement / followerCount) * 100).toFixed(2)) : 0,
    };
  } catch {
    return { reach: 0, impressions: 0, profileViews: 0, engagementRate: 0 };
  }
}

export async function fetchIgPosts(token: string, limit = 12): Promise<IgPost[]> {
  const list = await graphGet<{
    data?: {
      id?: string;
      caption?: string | null;
      media_type?: string;
      media_url?: string | null;
      timestamp?: string;
      like_count?: number;
      comments_count?: number;
    }[];
  }>(`/${API_VERSION}/me/media?fields=id,caption,media_type,media_url,timestamp,like_count,comments_count&limit=${limit}`, token);

  const posts: IgPost[] = [];
  for (const m of list.data ?? []) {
    let saves = 0;
    let reach = 0;
    let impressions = 0;
    try {
      const ins = await graphGet<{ data?: { name?: string; values?: { value?: number }[] }[] }>(
        `/${API_VERSION}/${m.id}/insights?metric=reach,impressions,saved`,
        token
      );
      const get = (name: string) =>
        ins.data?.find((d) => d.name === name)?.values?.find((v) => v.value !== undefined)?.value ?? 0;
      reach = get("reach");
      impressions = get("impressions");
      saves = get("saved");
    } catch {
      // older media may not expose insights — metrics stay 0
    }
    posts.push({
      igId: m.id ?? "",
      caption: m.caption ?? null,
      mediaType: mapMediaType(m.media_type),
      mediaUrl: m.media_url ?? null,
      timestamp: m.timestamp ?? new Date().toISOString(),
      likes: m.like_count ?? 0,
      comments: m.comments_count ?? 0,
      saves,
      reach,
      impressions,
    });
  }
  return posts;
}

function mapMediaType(t: string | undefined): IgPost["mediaType"] {
  switch (t) {
    case "REELS":
      return "REEL";
    case "CAROUSEL_ALBUM":
      return "CAROUSEL";
    case "STORY":
      return "STORY";
    default:
      return "SINGLE";
  }
}
