import { z } from "zod";

export const csvRowSchema = z.object({
  username: z
    .string()
    .transform((v) => v.trim().replace(/^@/, "").toLowerCase())
    .pipe(z.string().min(1).max(30).regex(/^[a-zA-Z0-9._]+$/, "Invalid username")),
  followers: z.coerce.number().int().nonnegative().default(0),
  following: z.coerce.number().int().nonnegative().default(0),
  posts: z.coerce.number().int().nonnegative().default(0),
  engagementRate: z.coerce.number().nonnegative().default(0),
  avgLikes: z.coerce.number().nonnegative().default(0),
  avgComments: z.coerce.number().nonnegative().default(0),
  postingFrequency: z.coerce.number().nonnegative().default(0),
  topHashtags: z
    .string()
    .transform((v) =>
      v
        .split(/,|;/)
        .map((t) => t.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean)
    )
    .default([]),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

const HEADER_ALIASES: Record<string, string> = {
  username: "username",
  followers: "followers",
  following: "following",
  posts: "posts",
  engagement: "engagementRate",
  engagement_rate: "engagementRate",
  engagementrate: "engagementRate",
  avg_likes: "avgLikes",
  avglikes: "avgLikes",
  avg_comments: "avgComments",
  avgcomments: "avgComments",
  posting_frequency: "postingFrequency",
  postingfrequency: "postingFrequency",
  top_hashtags: "topHashtags",
  hashtags: "topHashtags",
};

/**
 * Minimal RFC-4180-style parser: handles quoted fields (with embedded
 * commas/newlines/escaped quotes), CRLF, and a UTF-8 BOM.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Parses CSV text into validated rows. Returns { rows, errors } so partial
 * imports can succeed while bad lines are reported to the user.
 */
export function parseCompetitorCsv(text: string) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { rows: [] as CsvRow[], errors: ["File is empty"] };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const columns = headers.map((h) => HEADER_ALIASES[h]);
  if (!columns.includes("username")) {
    return {
      rows: [] as CsvRow[],
      errors: [
        "No username column found. Expected headers: username, followers, following, posts, engagement_rate, avg_likes, avg_comments, posting_frequency, top_hashtags",
      ],
    };
  }

  const errors: string[] = [];
  const out: CsvRow[] = [];
  rows.slice(1).forEach((cells, idx) => {
    const record: Record<string, string> = {};
    columns.forEach((col, i) => {
      if (col) record[col] = (cells[i] ?? "").trim();
    });
    const parsed = csvRowSchema.safeParse(record);
    if (parsed.success) {
      out.push(parsed.data);
    } else {
      const msg = parsed.error.issues[0]?.message ?? "Invalid row";
      errors.push(`Row ${idx + 2}: ${msg}`);
    }
  });

  return { rows: out, errors };
}
