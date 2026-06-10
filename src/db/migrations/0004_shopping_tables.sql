CREATE TABLE "monthly_essentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" numeric(10, 2),
	"unit" varchar(50),
	"category" varchar(100) DEFAULT 'Groceries' NOT NULL,
	"notes" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"added_count" integer DEFAULT 0 NOT NULL,
	"last_added_to_shopping_at" timestamp,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" numeric(10, 2),
	"unit" varchar(50),
	"category" varchar(100) DEFAULT 'Groceries' NOT NULL,
	"notes" text,
	"is_purchased" boolean DEFAULT false NOT NULL,
	"added_by_id" uuid NOT NULL,
	"source_essential_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_essentials" ADD CONSTRAINT "monthly_essentials_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_essentials" ADD CONSTRAINT "monthly_essentials_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_added_by_id_users_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_source_essential_id_monthly_essentials_id_fk" FOREIGN KEY ("source_essential_id") REFERENCES "public"."monthly_essentials"("id") ON DELETE set null ON UPDATE no action;
