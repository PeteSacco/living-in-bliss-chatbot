-- Custom migration to add match_knowledge_base_chunks function for similarity search

create or replace function match_knowledge_base_chunks(
  embedding vector(384),
  match_threshold float,
  match_count int default 5
)
returns setof "KnowledgeBaseChunk"
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from "KnowledgeBaseChunk"
  where "KnowledgeBaseChunk".embedding <#> embedding < -match_threshold
  order by "KnowledgeBaseChunk".embedding <#> embedding
  limit match_count;
end;
$$;
