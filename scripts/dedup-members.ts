import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

async function run() {
  const { db } = await import("../src/db/index");
  const { sql } = await import("drizzle-orm");

  await db.execute(
    sql`DELETE FROM flat_members WHERE id NOT IN (
      SELECT DISTINCT ON (flat_id, user_id) id
      FROM flat_members
      ORDER BY flat_id, user_id, created_at ASC
    )`
  );
  console.log("Duplicates removed.");
  process.exit(0);
}

run();
