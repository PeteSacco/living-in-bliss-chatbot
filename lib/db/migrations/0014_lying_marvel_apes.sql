-- Drop the old trigger
drop trigger if exists embed_knowledge_base_chunks on "KnowledgeBaseChunk";

-- Recreate it with batch size 10
create trigger embed_knowledge_base_chunks
  after insert on "KnowledgeBaseChunk"
  referencing new table as inserted
  for each statement
  execute procedure private.embed(content, embedding, 10);
