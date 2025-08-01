create schema private;
create extension if not exists pg_net with schema extensions;
create extension if not exists vector with schema extensions;

create index on "KnowledgeBaseChunk" using hnsw (embedding vector_ip_ops);
