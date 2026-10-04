CREATE TYPE "public"."campus_kind" AS ENUM('sede', 'congregacao');--> statement-breakpoint
CREATE TYPE "public"."preset" AS ENUM('assembleia-de-deus', 'generico');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin_igreja', 'pastor', 'secretaria', 'tesouraria', 'lider_ministerio', 'lider_celula', 'professor', 'voluntario', 'membro', 'visitante');--> statement-breakpoint
CREATE TYPE "public"."scope_type" AS ENUM('church', 'campus', 'ministry', 'cell', 'class');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('feminino', 'masculino', 'nao_informado');--> statement-breakpoint
CREATE TYPE "public"."household_role" AS ENUM('responsavel', 'conjuge', 'filho', 'dependente', 'outro');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('solteiro', 'casado', 'uniao_estavel', 'divorciado', 'viuvo', 'nao_informado');--> statement-breakpoint
CREATE TYPE "public"."membership_event_type" AS ENUM('conversao', 'batismo_aguas', 'batismo_espirito_santo', 'recepcao_membro', 'apresentacao_crianca', 'casamento', 'consagracao', 'transferencia_entrada', 'transferencia_saida', 'disciplina', 'reconciliacao', 'falecimento');--> statement-breakpoint
CREATE TYPE "public"."person_status" AS ENUM('visitante', 'frequentador', 'membro', 'inativo', 'transferido', 'falecido');--> statement-breakpoint
CREATE TABLE "campuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "campus_kind" DEFAULT 'congregacao' NOT NULL,
	"parent_id" uuid,
	"address" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "churches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"slug" text NOT NULL,
	"preset" "preset" DEFAULT 'generico' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"logo_url" text,
	"brand_color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "churches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"email" text,
	"avatar_url" text,
	"last_church_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"scope_type" "scope_type" DEFAULT 'church' NOT NULL,
	"scope_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"data" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "membership_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"campus_id" uuid,
	"type" "membership_event_type" NOT NULL,
	"occurred_at" date NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_restricted" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"campus_id" uuid NOT NULL,
	"household_id" uuid,
	"household_role" "household_role",
	"user_id" uuid,
	"full_name" text NOT NULL,
	"preferred_name" text,
	"gender" "gender" DEFAULT 'nao_informado' NOT NULL,
	"birth_date" date,
	"marital_status" "marital_status" DEFAULT 'nao_informado' NOT NULL,
	"cpf" text,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"photo_url" text,
	"address" jsonb,
	"profession" text,
	"status" "person_status" DEFAULT 'visitante' NOT NULL,
	"member_number" integer,
	"joined_at" date,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"consents" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campuses_church_idx" ON "campuses" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campuses_one_sede_per_church" ON "campuses" USING btree ("church_id") WHERE kind = 'sede' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "role_assignments_user_idx" ON "role_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "role_assignments_church_idx" ON "role_assignments" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_assignments_unique" ON "role_assignments" USING btree ("church_id","user_id","role","scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "audit_logs_church_created_idx" ON "audit_logs" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "households_church_idx" ON "households" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "membership_events_person_idx" ON "membership_events" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "membership_events_church_type_idx" ON "membership_events" USING btree ("church_id","type");--> statement-breakpoint
CREATE INDEX "people_church_idx" ON "people" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "people_campus_idx" ON "people" USING btree ("campus_id");--> statement-breakpoint
CREATE INDEX "people_household_idx" ON "people" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "people_status_idx" ON "people" USING btree ("church_id","status");--> statement-breakpoint
CREATE INDEX "people_user_idx" ON "people" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "people_member_number_unique" ON "people" USING btree ("church_id","member_number");--> statement-breakpoint
CREATE UNIQUE INDEX "people_cpf_unique" ON "people" USING btree ("church_id","cpf");