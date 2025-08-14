import { tool, type UIMessageStreamWriter } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/queries';
import type { ChatMessage } from '@/lib/types';

interface SearchKnowledgeBaseProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const searchKnowledgeBase = ({
  session,
  dataStream,
}: SearchKnowledgeBaseProps) =>
  tool({
    description:
      'Search through the knowledge base using semantic similarity to find relevant information.',
    inputSchema: z.object({
      query: z
        .string()
        .describe('The search query to find relevant information'),
      embedding: z
        .array(z.number())
        .describe('The embedding vector for the query'),
      matchThreshold: z
        .number()
        .optional()
        .default(0.8)
        .describe('Similarity threshold for matching (0-1)'),
      maxResults: z
        .number()
        .optional()
        .default(5)
        .describe('Maximum number of results to return'),
    }),
    execute: async ({ query, embedding, matchThreshold, maxResults }) => {
      try {
        const db = getDb();

        // Convert embedding array to string format for pgvector
        const embeddingVector = `[${embedding.join(',')}]`;

        // Use the match function we created in the migration
        const results = await db.execute(sql`
          SELECT * FROM match_knowledge_base_chunks(
            ${embeddingVector}::vector,
            ${matchThreshold},
            ${maxResults}
          )
        `);

        const relevantChunks = results;

        if (relevantChunks.length === 0) {
          return {
            success: true,
            query,
            results: [],
            message: 'No relevant information found in the knowledge base.',
          };
        }

        // Stream the search results
        dataStream.write({
          type: 'data-searchResults',
          data: {
            query,
            results: relevantChunks.map((chunk: any) => ({
              id: chunk.id,
              content: chunk.content,
              knowledgeBaseId: chunk.knowledgeBaseId,
            })),
          },
          transient: true,
        });

        const combinedContent = relevantChunks
          .map((chunk: any) => chunk.content)
          .join('\n\n');

        return {
          success: true,
          query,
          results: relevantChunks.map((chunk: any) => ({
            id: chunk.id,
            content:
              chunk.content.substring(0, 200) +
              (chunk.content.length > 200 ? '...' : ''),
            knowledgeBaseId: chunk.knowledgeBaseId,
          })),
          combinedContent,
          message: `Found ${relevantChunks.length} relevant pieces of information.`,
        };
      } catch (error) {
        console.error('Knowledge base search error:', error);
        return {
          success: false,
          query,
          results: [],
          error: 'Failed to search knowledge base',
        };
      }
    },
  });
