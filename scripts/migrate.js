import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
const sql = neon(process.env.DATABASE_URL);
const script = await readFile(
  new URL("../migrations/001-directory.sql", import.meta.url),
  "utf8",
);
const statements = script
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
await sql.transaction(statements.map((s) => sql.query(s, [])));
console.log(
  "MyLesenHub schema ready. Verified tables:",
  (
    await sql`select count(*)::int as count from information_schema.tables where table_schema='mylesenhub'`
  )[0].count,
);
