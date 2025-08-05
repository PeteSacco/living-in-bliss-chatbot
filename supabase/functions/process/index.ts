import { createClient } from '@supabase/supabase-js';
import { processMarkdown } from '../_lib/markdown-parser.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

Deno.serve(async (req) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variables.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const authorization = req.headers.get('Authorization');

  if (!authorization) {
    return new Response(
      JSON.stringify({ error: `No authorization header passed` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        authorization,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  const { documents } = await req.json();

  if (!Array.isArray(documents) || documents.length === 0) {
    return new Response(JSON.stringify({ error: 'No documents provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const failures: string[] = [];

  for (const doc of documents) {
    const { title, content } = doc;

    const { data } = await supabase
      .from('KnowledgeBase')
      .select('id, KnowledgeBaseChunk(id)')
      .eq('title', title)
      .maybeSingle();

    const hasChunks = data?.KnowledgeBaseChunk?.length > 0;
    if (data && hasChunks) {
      console.log(`⚠️ Document '${title}' already exists. Skipping.`);
      continue;
    } 

    const { data: knowledgeBaseId, error: upsertError } = await supabase.from('KnowledgeBase').upsert({
      title,
      content,
    }).select().single();

    if (upsertError) {
      console.error(`Failed to save document '${title}':`, upsertError);
      failures.push(title);
      continue;
    }
    

    const processedMd = processMarkdown(content);

    const { error: insertError } = await supabase.from('KnowledgeBaseChunk').insert(
      processedMd.sections.map(({ content }) => ({
        knowledgeBaseId,
        content,
      })),
    );

    if (insertError) {
      console.error(`Failed to save sections for ${title}:`, insertError);
      failures.push(title);
    } else {
      console.log(
        `✅ Saved ${processedMd.sections.length} sections for '${title}'`,
      );
    }
  }

  return new Response(null, {
    status: 204,
    headers: { 'Content-Type': 'application/json' },
  });
});
