import { pipeline } from '@xenova/transformers';

let embeddingPipeline: any = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Supabase/gte-small',
    );
  }
  return embeddingPipeline;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getEmbeddingPipeline();
    const output = await pipe(text, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function searchKnowledgeBase(
  embedding: number[],
  matchThreshold: 0.8,
  maxResults: 5,
): Promise<any[]> {
  const { getDb } = await import('@/lib/db/queries');
  const { sql } = await import('drizzle-orm');

  try {
    const db = getDb();
    const embeddingVector = `[${embedding.join(',')}]`;

    const results = await db.execute(sql`
      SELECT * FROM match_knowledge_base_chunks(
        ${embeddingVector}::vector,
        ${matchThreshold},
        ${maxResults}
      )
    `);
    
    return results;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
}

