/**
 * Applies the prisma/migrations DDL to a remote libSQL (Turso) database.
 * Run with DATABASE_URL + TURSO_AUTH_TOKEN in the environment:
 *   npx tsx prisma/apply-remote.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;

async function main() {
  if (!url || !(url.startsWith("libsql://") || url.startsWith("turso://"))) {
    console.error("DATABASE_URL must be a libsql:// or turso:// URL");
    process.exit(1);
  }
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const dir = join(process.cwd(), "prisma", "migrations");
  const applied = new Set<string>();
  try {
    const rows = await db.execute('SELECT migration_name FROM "_prisma_migrations"');
    for (const row of rows.rows) applied.add(String(row[0]));
  } catch {
    // table does not exist yet — first run
  }

  const dirs = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const name of dirs) {
    if (applied.has(name)) continue;
    const sql = readFileSync(join(dir, name, "migration.sql"), "utf8");
    console.log("applying", name);
    await db.executeMultiple(sql);
    await db.execute({
      sql: 'INSERT INTO "_prisma_migrations" (migration_name, started_at, finished_at, applied_steps_count, logs, rolled_back_at) VALUES (?, ?, ?, ?, ?, NULL)',
      args: [name, new Date().toISOString(), new Date().toISOString(), 1, null],
    });
    console.log("  ok");
  }

  console.log("done — all migrations applied");
  db.close();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
