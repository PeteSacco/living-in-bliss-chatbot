ALTER TABLE "KnowledgeBase" DROP CONSTRAINT "KnowledgeBase_storageObjectId_objects_id_fk";
--> statement-breakpoint
ALTER TABLE "KnowledgeBase" DROP COLUMN IF EXISTS "storageObjectId";