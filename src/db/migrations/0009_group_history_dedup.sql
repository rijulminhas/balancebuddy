-- Add new columns to group_history for deduplication support
ALTER TABLE "group_history" ADD COLUMN "first_joined_at" timestamp;
ALTER TABLE "group_history" ADD COLUMN "last_left_at" timestamp;
ALTER TABLE "group_history" ADD COLUMN "join_count" integer NOT NULL DEFAULT 1;
ALTER TABLE "group_history" ADD COLUMN "created_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "group_history" ADD COLUMN "updated_at" timestamp NOT NULL DEFAULT now();
--> statement-breakpoint

-- Initialise new columns from existing left_at on all rows
UPDATE "group_history" SET "last_left_at" = "left_at", "first_joined_at" = "left_at";
--> statement-breakpoint

-- For user-group pairs with multiple rows: update the most-recent row with
-- the correct aggregate join_count and earliest first_joined_at
WITH agg AS (
  SELECT user_id, group_id, COUNT(*) AS cnt, MIN(left_at) AS min_left
  FROM "group_history"
  GROUP BY user_id, group_id
  HAVING COUNT(*) > 1
),
keepers AS (
  SELECT DISTINCT ON (gh.user_id, gh.group_id) gh.id, agg.cnt, agg.min_left
  FROM "group_history" gh
  JOIN agg ON agg.user_id = gh.user_id AND agg.group_id = gh.group_id
  ORDER BY gh.user_id, gh.group_id, gh.left_at DESC
)
UPDATE "group_history" gh
SET "join_count" = k.cnt, "first_joined_at" = k.min_left
FROM keepers k
WHERE gh.id = k.id;
--> statement-breakpoint

-- Delete duplicate rows — keep only the most recent leave event per user-group pair
DELETE FROM "group_history"
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, group_id ORDER BY left_at DESC) AS rn
    FROM "group_history"
  ) ranked
  WHERE rn > 1
);
--> statement-breakpoint

-- Enforce NOT NULL now that every surviving row has values
ALTER TABLE "group_history" ALTER COLUMN "first_joined_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "group_history" ALTER COLUMN "last_left_at" SET NOT NULL;
--> statement-breakpoint

-- Unique constraint: at most one history record per user-group combination
CREATE UNIQUE INDEX "group_history_user_group_uidx" ON "group_history" ("user_id", "group_id");
--> statement-breakpoint

-- Remove the now-superseded left_at column
ALTER TABLE "group_history" DROP COLUMN "left_at";
