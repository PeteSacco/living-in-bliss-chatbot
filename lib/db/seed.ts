import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

config({
  path: '.env.local',
});

// biome-ignore lint: Forbidden non-null assertion.
const SUPABASE_URL = process.env.SUPABASE_URL!;
// biome-ignore lint: Forbidden non-null assertion.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const docsDir = path.join(__dirname, '../../docs');

async function seed() {
  const fileNames = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
  const documents = fileNames.map((fileName) => {
    const content = fs.readFileSync(path.join(docsDir, fileName), 'utf8');
    const title = fileName;
    return {
      title,
      content,
    };
  });
  // Process markdown documents to seed knowledge base and knowledge base chunks
  const { data, error: processError } = await supabase.functions.invoke(
    'process',
    {
      body: { documents },
    },
  );

  const { data: knowledgeBaseChunks, error: knowledgeBaseChunkError } =
    await supabase.from('KnowledgeBaseChunk').select('*').is('embedding', null);

  console.log('🔍 Knowledge base chunks:', knowledgeBaseChunks);
  if (knowledgeBaseChunkError) {
    console.error(
      '❌ Error getting knowledge base chunks:',
      knowledgeBaseChunkError,
    );
  }

  for (const chunk of knowledgeBaseChunks) {
    const { error: embedError } = await
      await supabase.functions.invoke('embed', {
        body: {
          ids: [chunk.id],
          table: 'KnowledgeBaseChunk',
          contentColumn: 'content',
          embeddingColumn: 'embedding',
        },
      });
    if (embedError) {
      console.error('❌ Error embedding chunk:', embedError);
    }
  }

  if (processError) {
    console.error('❌ Error invoking function:', embedError);
  } else {
    console.log('✅ Seeded documents:', data);
  }
}

seed();
