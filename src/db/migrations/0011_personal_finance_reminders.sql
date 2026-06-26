CREATE TYPE "public"."income_type" AS ENUM('salary', 'freelancing', 'business', 'rental_income', 'bonus', 'other');
--> statement-breakpoint
CREATE TYPE "public"."personal_expense_category" AS ENUM('food', 'travel', 'fuel', 'shopping', 'entertainment', 'bills', 'healthcare', 'education', 'family', 'other');
--> statement-breakpoint
CREATE TYPE "public"."investment_type" AS ENUM('sip', 'mutual_fund', 'stocks', 'ppf', 'fd', 'crypto', 'gold', 'other');
--> statement-breakpoint
CREATE TYPE "public"."loan_type" AS ENUM('home_loan', 'car_loan', 'personal_loan', 'education_loan', 'credit_card_emi', 'other');
--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('rent', 'emi', 'electricity', 'water', 'internet', 'subscription', 'custom');
--> statement-breakpoint
CREATE TYPE "public"."reminder_frequency" AS ENUM('daily', 'weekly', 'monthly', 'yearly', 'one_time');
--> statement-breakpoint
CREATE TABLE "personal_incomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"income_type" "income_type" DEFAULT 'salary' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" "personal_expense_category" DEFAULT 'other' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"investment_name" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"investment_type" "investment_type" DEFAULT 'other' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_name" varchar(255) NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"current_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"target_date" timestamp,
	"notes" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"loan_name" varchar(255) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"outstanding_amount" numeric(12, 2) NOT NULL,
	"emi_amount" numeric(12, 2) NOT NULL,
	"loan_type" "loan_type" DEFAULT 'personal_loan' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(12, 2),
	"type" "reminder_type" DEFAULT 'custom' NOT NULL,
	"frequency" "reminder_frequency" DEFAULT 'monthly' NOT NULL,
	"day_of_month" integer,
	"month_of_year" integer,
	"day_of_week" integer,
	"specific_date" timestamp,
	"reminder_days_before" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_notified_at" timestamp,
	"next_notify_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_incomes" ADD CONSTRAINT "personal_incomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_expenses" ADD CONSTRAINT "personal_expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_investments" ADD CONSTRAINT "personal_investments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
