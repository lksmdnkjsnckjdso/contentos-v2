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
  await db.execute(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
  )`);
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
    const id = `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      console.log("applying", name);
      const statements = sql
        .replace(/^\s*--.*$/gm, "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const statement of statements) {
        await db.execute(statement);
      }
      console.log("  ok");
    } catch (e) {
      const cause: unknown = (e as { cause?: unknown })?.cause;
      const msg = [
        e instanceof Error ? e.message : String(e),
        cause instanceof Error ? cause.message : cause ? String(cause) : "",
      ].join(" | ");
      if (/already exists|duplicate column/i.test(msg)) {
        console.log("  already applied — marking as done");
      } else {
        throw e;
      }
    }
    await db.execute({
      sql: 'INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count, logs, rolled_back_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)',
      args: [id, "remote-sync", name, new Date().toISOString(), new Date().toISOString(), 1],
    });
  }

  console.log("done — all migrations applied");
  db.close();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
