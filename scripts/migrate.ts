/**
 * Safe migration script.
 *
 * Handles two problems:
 * 1. Renames flat→group in the DB (idempotent — skips if already done).
 * 2. Seeds drizzle.__drizzle_migrations so that `npm run db:migrate` works
 *    correctly going forward (won't try to re-apply migrations 0000-0003).
 *
 * Usage: npx tsx scripts/migrate.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

const MIGRATIONS_DIR = join(process.cwd(), "src/db/migrations");

function fileHash(filename: string): string {
  const content = readFileSync(join(MIGRATIONS_DIR, filename), "utf-8");
  return createHash("sha256").update(content).digest("hex");
}

async function main() {
  console.log("── Step 1: Apply pending DB changes ──────────────────────────");

  // ── check if rename has already been applied ──────────────────────────────
  const [tableCheck] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'groups'
    ) AS already_renamed
  `;

  if (tableCheck.already_renamed) {
    console.log("✓ Rename flat→group already applied, skipping SQL renames.");
  } else {
    console.log("Applying flat→group rename…");

    await sql`ALTER TYPE "flat_member_role" RENAME TO "group_member_role"`;
    await sql`ALTER TYPE "notification_type" RENAME VALUE 'flat_invitation' TO 'group_invitation'`;
    console.log("✓ Enums renamed");

    await sql`ALTER TABLE "flats"        RENAME TO "groups"`;
    await sql`ALTER TABLE "flat_members" RENAME TO "group_members"`;
    await sql`ALTER TABLE "flat_history" RENAME TO "group_history"`;
    console.log("✓ Tables renamed");

    await sql`ALTER TABLE "group_members" RENAME COLUMN "flat_id" TO "group_id"`;
    await sql`ALTER TABLE "group_history" RENAME COLUMN "flat_id"      TO "group_id"`;
    await sql`ALTER TABLE "group_history" RENAME COLUMN "flat_name"    TO "group_name"`;
    await sql`ALTER TABLE "group_history" RENAME COLUMN "flat_address" TO "group_address"`;
    console.log("✓ Columns renamed in group_members / group_history");

    for (const t of ["expenses","payments","settlements","chores",
                     "inventory_items","assets","notifications",
                     "messages","audit_logs"]) {
      await sql.unsafe(`ALTER TABLE "${t}" RENAME COLUMN "flat_id" TO "group_id"`);
    }
    console.log("✓ flat_id → group_id in all dependent tables");

    await sql`ALTER TABLE "groups" RENAME CONSTRAINT "flats_invite_code_unique"       TO "groups_invite_code_unique"`;
    await sql`ALTER TABLE "groups" RENAME CONSTRAINT "flats_owner_id_users_id_fk"     TO "groups_owner_id_users_id_fk"`;
    await sql`ALTER TABLE "group_members" RENAME CONSTRAINT "flat_members_flat_id_flats_id_fk"  TO "group_members_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "group_members" RENAME CONSTRAINT "flat_members_user_id_users_id_fk"  TO "group_members_user_id_users_id_fk"`;
    await sql`ALTER TABLE "group_history" RENAME CONSTRAINT "flat_history_user_id_users_id_fk"  TO "group_history_user_id_users_id_fk"`;
    await sql`ALTER TABLE "group_history" RENAME CONSTRAINT "flat_history_flat_id_flats_id_fk"  TO "group_history_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "expenses"      RENAME CONSTRAINT "expenses_flat_id_flats_id_fk"      TO "expenses_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "payments"      RENAME CONSTRAINT "payments_flat_id_flats_id_fk"      TO "payments_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "settlements"   RENAME CONSTRAINT "settlements_flat_id_flats_id_fk"   TO "settlements_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "chores"        RENAME CONSTRAINT "chores_flat_id_flats_id_fk"        TO "chores_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "inventory_items" RENAME CONSTRAINT "inventory_items_flat_id_flats_id_fk" TO "inventory_items_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "assets"        RENAME CONSTRAINT "assets_flat_id_flats_id_fk"        TO "assets_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "notifications" RENAME CONSTRAINT "notifications_flat_id_flats_id_fk" TO "notifications_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "messages"      RENAME CONSTRAINT "messages_flat_id_flats_id_fk"      TO "messages_group_id_groups_id_fk"`;
    await sql`ALTER TABLE "audit_logs"    RENAME CONSTRAINT "audit_logs_flat_id_flats_id_fk"    TO "audit_logs_group_id_groups_id_fk"`;
    console.log("✓ Constraints renamed");

    await sql`ALTER INDEX "flat_members_flat_user_uidx" RENAME TO "group_members_group_user_uidx"`;
    console.log("✓ Index renamed");
  }

  // ── ensure drizzle schema + migrations table exist ────────────────────────
  console.log("\n── Step 2: Seed drizzle migration tracking ───────────────────");

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id       SERIAL PRIMARY KEY,
      hash     text NOT NULL,
      created_at bigint
    )
  `;

  const migrations = [
    { file: "0000_silly_marrow.sql",              ts: 1780661445193 },
    { file: "0001_flat_member_removed_reason.sql", ts: 1780661445194 },
    { file: "0002_flat_history.sql",               ts: 1780661445195 },
    { file: "0003_rename_flat_to_group.sql",        ts: 1780661445196 },
  ];

  for (const m of migrations) {
    const hash = fileHash(m.file);
    const [existing] = await sql`
      SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
    `;
    if (existing) {
      console.log(`  already tracked: ${m.file}`);
    } else {
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${hash}, ${m.ts})
      `;
      console.log(`  ✓ tracked: ${m.file}`);
    }
  }

  await sql.end();
  console.log("\n✓ All done. `npm run db:migrate` will now work correctly.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
