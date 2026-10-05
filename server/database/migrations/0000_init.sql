CREATE TYPE "public"."season" AS ENUM('spring', 'summer', 'autumn', 'winter');--> statement-breakpoint
CREATE TABLE "auth_throttle" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "farm_objectives" (
	"farm_id" uuid NOT NULL,
	"objective_id" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farm_objectives_farm_id_objective_id_pk" PRIMARY KEY("farm_id","objective_id")
);
--> statement-breakpoint
CREATE TABLE "farm_steps" (
	"farm_id" uuid NOT NULL,
	"objective_id" varchar(80) NOT NULL,
	"method_index" smallint NOT NULL,
	"step_index" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farm_steps_farm_id_objective_id_method_index_step_index_pk" PRIMARY KEY("farm_id","objective_id","method_index","step_index")
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"farmer_name" varchar(40) NOT NULL,
	"farm_name" varchar(40) NOT NULL,
	"game_year" smallint DEFAULT 1 NOT NULL,
	"game_season" "season" DEFAULT 'spring' NOT NULL,
	"game_day" smallint DEFAULT 1 NOT NULL,
	"pinned_objective_id" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_played_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farms_game_day_check" CHECK ("farms"."game_day" between 1 and 30),
	CONSTRAINT "farms_game_year_check" CHECK ("farms"."game_year" between 1 and 999)
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"body" text NOT NULL,
	"game_year" smallint NOT NULL,
	"game_season" "season" NOT NULL,
	"game_day" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(32) NOT NULL,
	"username_key" varchar(32) NOT NULL,
	"email" varchar(254),
	"password_hash" text NOT NULL,
	"settings" jsonb DEFAULT '{"sounds":false,"reducedMotion":false,"forcedSeason":null}'::jsonb NOT NULL,
	"active_farm_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"password_changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "farm_objectives" ADD CONSTRAINT "farm_objectives_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_steps" ADD CONSTRAINT "farm_steps_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_active_farm_id_farms_id_fk" FOREIGN KEY ("active_farm_id") REFERENCES "public"."farms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "farms_user_idx" ON "farms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_farm_idx" ON "notes" USING btree ("farm_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_key_idx" ON "users" USING btree ("username_key");