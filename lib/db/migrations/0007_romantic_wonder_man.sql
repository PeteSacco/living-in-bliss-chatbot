CREATE TABLE IF NOT EXISTS "KnowledgeBase" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"storageObjectId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "KnowledgeBase_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "KnowledgeBaseChunk" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"knowledgeBaseId" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(384),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "KnowledgeBaseChunk_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_storageObjectId_objects_id_fk" FOREIGN KEY ("storageObjectId") REFERENCES "storage"."objects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "KnowledgeBaseChunk" ADD CONSTRAINT "KnowledgeBaseChunk_knowledgeBaseId_KnowledgeBase_id_fk" FOREIGN KEY ("knowledgeBaseId") REFERENCES "public"."KnowledgeBase"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
