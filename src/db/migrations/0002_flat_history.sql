ALTER TABLE "flats" ADD COLUMN "deleted_at" timestamp;

CREATE TABLE "flat_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "flat_id" uuid NOT NULL,
  "flat_name" varchar(255) NOT NULL,
  "flat_address" text,
  "role" "flat_member_role" NOT NULL,
  "left_at" timestamp DEFAULT now() NOT NULL,
  "deleted_by_owner" boolean DEFAULT false NOT NULL,
  "deleted_at" timestamp,
  "invite_code" varchar(20) NOT NULL
);

ALTER TABLE "flat_history" ADD CONSTRAINT "flat_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "flat_history" ADD CONSTRAINT "flat_history_flat_id_flats_id_fk" FOREIGN KEY ("flat_id") REFERENCES "public"."flats"("id") ON DELETE restrict ON UPDATE no action;
