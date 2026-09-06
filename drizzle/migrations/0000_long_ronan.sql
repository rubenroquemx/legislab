CREATE TYPE "public"."gestion_estatus" AS ENUM('Recibido', 'En Trámite', 'Oficio Enviado', 'Audiencia Programada', 'Aprobado', 'Rechazado', 'Concluido', 'Urgente');--> statement-breakpoint
CREATE TYPE "public"."gestion_prioridad" AS ENUM('Baja', 'Media', 'Alta', 'Urgente');--> statement-breakpoint
CREATE TYPE "public"."iniciativa_estado" AS ENUM('Borrador', 'Revisión Técnica', 'Lista para Presentar', 'Presentada en Pleno', 'En Comisión', 'Dictaminada', 'Aprobada', 'Desechada');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('diputado', 'asesor_a', 'asesor_b', 'secretario_tecnico', 'coordinador_territorial', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "gestiones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"office_id" uuid NOT NULL,
	"folio" text NOT NULL,
	"asunto" text NOT NULL,
	"solicitante" text NOT NULL,
	"colonia" text NOT NULL,
	"telefono" text,
	"email" text,
	"categoria" text DEFAULT 'General',
	"prioridad" text DEFAULT 'Media' NOT NULL,
	"estatus" text DEFAULT 'En Trámite' NOT NULL,
	"dependencia_canalizada" text,
	"notas_internas" text,
	"responsable_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ia_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"office_id" uuid NOT NULL,
	"user_id" text,
	"prompt" text NOT NULL,
	"tipo_documento" text NOT NULL,
	"ambito" text NOT NULL,
	"generated_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iniciativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"office_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"tipo_documento" text NOT NULL,
	"ambito" text DEFAULT 'Federal (Cámara de Diputados)' NOT NULL,
	"comision" text,
	"estado" text DEFAULT 'Borrador' NOT NULL,
	"exposicion_motivos" text,
	"decreto_texto" text,
	"transitorios_texto" text,
	"documento_completo" text,
	"autor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"titular_name" text NOT NULL,
	"legislature" text DEFAULT 'LXVI Legislatura' NOT NULL,
	"district" text NOT NULL,
	"state" text DEFAULT 'Nacional' NOT NULL,
	"party" text,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"office_id" uuid,
	"role" text DEFAULT 'asesor_a' NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gestiones" ADD CONSTRAINT "gestiones_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gestiones" ADD CONSTRAINT "gestiones_responsable_id_users_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ia_generations" ADD CONSTRAINT "ia_generations_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ia_generations" ADD CONSTRAINT "ia_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iniciativas" ADD CONSTRAINT "iniciativas_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iniciativas" ADD CONSTRAINT "iniciativas_autor_id_users_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;