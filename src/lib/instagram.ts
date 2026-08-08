export type ScrapedProfile = {
  username: string;
  fullName: string | null;
  followers: number;
  following: number;
  posts: number;
  biography: string | null;
  profilePic: string | null;
  recentPosts: {
    caption: string | null;
    likes: number;
    comments: number;
    mediaType: string | null;
    timestamp: number;
  }[];
  source: "scrape" | "fallback";
};

export function deriveScrapeMetrics(scraped: ScrapedProfile) {
  const posts = scraped.recentPosts;
  const avgLikes = posts.length
    ? posts.reduce((s, p) => s + p.likes, 0) / posts.length
    : 0;
  const avgComments = posts.length
    ? posts.reduce((s, p) => s + p.comments, 0) / posts.length
    : 0;
  const er =
    scraped.followers > 0 && posts.length
      ? ((avgLikes + avgComments) / scraped.followers) * 100
      : 0;
  const weekSpan = posts.length > 1
    ? Math.max(
        1,
        (posts[0].timestamp - posts[posts.length - 1].timestamp) / (7 * 86400)
      )
    : 1;
  const postingFrequency = posts.length / weekSpan;
  const hashtags = [
    ...new Set(
      posts.flatMap((p) =>
        (p.caption ?? "")
          .match(/#[\w\u00C0-\u024F]+/g)
          ?.map((t) => t.replace("#", "").toLowerCase()) ?? []
      )
    ),
  ].slice(0, 8);

  return {
    avgLikes,
    avgComments,
    er,
    postingFrequency,
    hashtags,
  };
}

/**
 * Tries to scrape a public Instagram profile. Instagram actively blocks
 * unauthenticated access, so this is best-effort: the internal API first,
 * then the mobile web page (real counts), and finally a `fallback`-flagged
 * stub so the pipeline (and the UI) never breaks.
 */
export async function scrapeInstagramProfile(
  username: string
): Promise<ScrapedProfile> {
  const fromApi = await tryApiProfile(username);
  if (fromApi) return fromApi;

  const fromWeb = await tryMobileWebProfile(username);
  if (fromWeb) return fromWeb;

  const fromApify = await tryApifyProfile(username);
  if (fromApify) return fromApify;

  return {
    username: username.replace("@", ""),
    fullName: null,
    followers: 0,
    following: 0,
    posts: 0,
    biography: null,
    profilePic: null,
    recentPosts: [],
    source: "fallback",
  };
}

/**
 * Hosted Instagram scraper (Apify actor) — the fallback that works from
 * serverless hosts like Vercel, where Instagram blocks direct requests.
 * Requires APIFY_TOKEN (and optionally APIFY_ACTOR_ID, default:
 * clockworks/free-instagram-scraper).
 */
async function tryApifyProfile(username: string): Promise<ScrapedProfile | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;
  const actorId = process.env.APIFY_ACTOR_ID ?? "clockworks/free-instagram-scraper";
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=120`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ usernames: [username.replace("@", "")] }),
        cache: "no-store",
        signal: AbortSignal.timeout(120_000),
      }
    );
    if (!res.ok) throw new Error(`Apify returned ${res.status}`);
    const items = (await res.json()) as {
      username?: string;
      fullName?: string | null;
      followersCount?: number;
      followingCount?: number;
      postsCount?: number;
      biography?: string | null;
      isPrivate?: boolean;
      recentPosts?: { caption?: string | null; likesCount?: number; commentsCount?: number; timestamp?: string; mediaType?: string }[];
    }[];
    const item = items[0];
    if (!item?.username) throw new Error("Apify returned no profile");

    return {
      username: item.username,
      fullName: item.fullName ?? null,
      followers: item.followersCount ?? 0,
      following: item.followingCount ?? 0,
      posts: item.postsCount ?? 0,
      biography: item.biography ?? null,
      profilePic: null,
      recentPosts: (item.recentPosts ?? []).slice(0, 12).map((p) => ({
        caption: p.caption ?? null,
        likes: p.likesCount ?? 0,
        comments: p.commentsCount ?? 0,
        mediaType: p.mediaType ?? null,
        timestamp: p.timestamp ? Math.floor(new Date(p.timestamp).getTime() / 1000) : 0,
      })),
      source: "scrape",
    };
  } catch {
    return null;
  }
}

/**
 * Routes a fetch through a rotating proxy when SCRAPE_PROXY_URL is set
 * (ScraperAPI / ZenRows / ScrapingBee style, "{url}" placeholder supported).
 * Needed on serverless hosts (Vercel) whose datacenter IPs Instagram blocks.
 */
function proxiedFetch(url: string, init: RequestInit): Promise<Response> {
  const template = process.env.SCRAPE_PROXY_URL;
  if (!template) return fetch(url, init);
  const target = encodeURIComponent(url);
  const proxyUrl = template.includes("{url}")
    ? template.replace("{url}", target)
    : template + target;
  return fetch(proxyUrl, init);
}

async function tryApiProfile(username: string): Promise<ScrapedProfile | null> {
  try {
    const res = await proxiedFetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "x-ig-app-id": "936619743392459",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          accept: "*/*",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      }
    );
    if (!res.ok) throw new Error(`Instagram returned ${res.status}`);

    const json = (await res.json()) as {
      data?: {
        user?: {
          username?: string;
          full_name?: string | null;
          edge_followed_by?: { count?: number };
          edge_follow?: { count?: number };
          edge_owner_to_timeline_media?: {
            count?: number;
            edges?: {
              node?: {
                edge_media_to_caption?: { edges?: { node?: { text?: string } }[] };
                edge_liked_by?: { count?: number };
                edge_media_to_comment?: { count?: number };
                __typename?: string;
                taken_at_timestamp?: number;
              };
            }[];
          };
          biography?: string | null;
          profile_pic_url_hd?: string | null;
        };
      };
    };

    const u = json?.data?.user;
    if (!u?.username) throw new Error("Profile not found");

    const media = u.edge_owner_to_timeline_media ?? {};
    return {
      username: u.username,
      fullName: u.full_name ?? null,
      followers: u.edge_followed_by?.count ?? 0,
      following: u.edge_follow?.count ?? 0,
      posts: media.count ?? 0,
      biography: u.biography ?? null,
      profilePic: u.profile_pic_url_hd ?? null,
      recentPosts: (media.edges ?? []).slice(0, 12).map((e) => {
        const node = e.node ?? {};
        return {
          caption: node.edge_media_to_caption?.edges?.[0]?.node?.text ?? null,
          likes: node.edge_liked_by?.count ?? 0,
          comments: node.edge_media_to_comment?.count ?? 0,
          mediaType: node.__typename ?? null,
          timestamp: node.taken_at_timestamp ?? 0,
        };
      }),
      source: "scrape",
    };
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s.replace(/&#0*64;/g, "@").replace(/&amp;/g, "&");
}

function parseCount(s: string | undefined): number {
  if (!s) return 0;
  const trimmed = s.trim();
  let n = parseFloat(trimmed.replace(/,/g, ""));
  if (Number.isNaN(n)) return 0;
  if (/k$/i.test(trimmed)) n *= 1_000;
  if (/m$/i.test(trimmed)) n *= 1_000_000;
  return Math.round(n);
}

/**
 * The mobile profile page renders real counts in its og:description meta
 * ("852K Followers, 1 Following, 436 Posts …") — the most reliable
 * unauthenticated source. Post-level data is client-rendered, so recentPosts
 * stays empty here.
 */
async function tryMobileWebProfile(username: string): Promise<ScrapedProfile | null> {
  try {
    const res = await proxiedFetch(`https://m.instagram.com/${encodeURIComponent(username)}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ogDesc = html.match(/og:description" content="([^"]+)"/)?.[1];
    if (!ogDesc) return null;
    const counts = ogDesc.match(
      /([\d.,]+[KM]?)\s*Followers?\s*,\s*([\d.,]+[KM]?)\s*Following\s*,\s*([\d.,]+[KM]?)\s*Posts?/i
    );
    if (!counts) return null;

    const ogTitle = html.match(/og:title" content="([^"]+)"/)?.[1];
    const fullName = ogTitle
      ? decodeEntities(ogTitle).replace(/\(\s*@.+/i, "").replace(/\s*•.*$/, "").trim() || null
      : null;

    return {
      username: username.replace("@", ""),
      fullName,
      followers: parseCount(counts[1]),
      following: parseCount(counts[2]),
      posts: parseCount(counts[3]),
      biography: null,
      profilePic: null,
      recentPosts: [],
      source: "scrape",
    };
  } catch {
    return null;
  }
}
