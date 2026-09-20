import { ai, GEMINI_MODEL_EMBEDDING } from '../lib/gemini.js';
import { supabase, isSupabaseConfigured, memoryDb } from '../lib/supabase.js';

export interface ContractChunk {
  id?: string;
  contract_id: string;
  content: string;
  page_number: number;
  chunk_index: number;
  embedding?: number[];
  similarity?: number;
}

/**
 * Splits document text into overlapping chunks while preserving page numbers.
 */
export function chunkContractDocument(
  contractId: string,
  pages: Array<{ pageNumber: number; text: string }>,
  targetChunkChars = 800,
  overlapChars = 100
): ContractChunk[] {
  const chunks: ContractChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;

    if (text.length <= targetChunkChars) {
      chunks.push({
        contract_id: contractId,
        content: `[Page ${page.pageNumber}] ${text}`,
        page_number: page.pageNumber,
        chunk_index: globalChunkIndex++
      });
      continue;
    }

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + targetChunkChars, text.length);
      const chunkSnippet = text.slice(start, end).trim();

      if (chunkSnippet.length > 0) {
        chunks.push({
          contract_id: contractId,
          content: `[Page ${page.pageNumber}] ${chunkSnippet}`,
          page_number: page.pageNumber,
          chunk_index: globalChunkIndex++
        });
      }

      start += (targetChunkChars - overlapChars);
    }
  }

  return chunks;
}

/**
 * Generates 768-dimensional vector embedding for a single text chunk.
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your-gemini-api-key') {
    try {
      const response: any = await ai.models.embedContent({
        model: GEMINI_MODEL_EMBEDDING,
        contents: [text]
      });

      if (response?.embedding?.values) {
        return response.embedding.values;
      }
      if (response?.embeddings?.[0]?.values) {
        return response.embeddings[0].values;
      }
    } catch (err: any) {
      console.warn(`[WARNING] Gemini embedding error: ${err.message}. Using fallback vector.`);
    }
  }

  // Deterministic 768-dim hash vector for offline evaluation / demo
  const vector = new Array(768).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const pos = (charCode * (i + 1)) % 768;
    vector[pos] = (vector[pos] + (charCode / 255)) % 1;
  }
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => v / magnitude);
}

/**
 * Calculates cosine similarity between two 768-dim float arrays.
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Stores chunks and embeddings in PostgreSQL pgvector or memory store.
 */
export async function saveContractEmbeddings(chunks: ContractChunk[]): Promise<void> {
  for (const chunk of chunks) {
    const embedding = await generateTextEmbedding(chunk.content);
    chunk.embedding = embedding;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('contract_embeddings').insert({
          contract_id: chunk.contract_id,
          content: chunk.content,
          page_number: chunk.page_number,
          chunk_index: chunk.chunk_index,
          embedding
        });
      } catch (err: any) {
        console.warn(`[WARNING] Failed to insert embedding to Supabase: ${err.message}`);
        memoryDb.embeddings.push(chunk);
      }
    } else {
      memoryDb.embeddings.push(chunk);
    }
  }
}

/**
 * Hybrid retrieval: Queries semantic vector similarity across chunks.
 */
export async function searchSimilarChunks(
  query: string,
  contractId?: string,
  matchThreshold = 0.45,
  matchCount = 5
): Promise<ContractChunk[]> {
  const queryEmbedding = await generateTextEmbedding(query);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('match_contract_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_contract_id: contractId || null
      });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          contract_id: item.contract_id,
          content: item.content,
          page_number: item.page_number,
          chunk_index: 0,
          similarity: item.similarity
        }));
      }
    } catch (err: any) {
      console.warn(`[WARNING] Supabase RPC match_contract_chunks failed: ${err.message}. Falling back to memory search.`);
    }
  }

  // Fallback: search memoryDb chunks or contract raw text
  let sourceChunks = memoryDb.embeddings;
  if (contractId) {
    sourceChunks = sourceChunks.filter(c => c.contract_id === contractId);
  }

  // If memory embeddings empty, create on the fly from memory contracts
  if (sourceChunks.length === 0) {
    const contractsToSearch = contractId
      ? memoryDb.contracts.filter(c => c.id === contractId)
      : memoryDb.contracts;

    for (const c of contractsToSearch) {
      const parsedChunks = chunkContractDocument(c.id, [{ pageNumber: 1, text: c.raw_text }]);
      for (const ch of parsedChunks) {
        ch.embedding = await generateTextEmbedding(ch.content);
        memoryDb.embeddings.push(ch);
      }
    }
    sourceChunks = contractId ? memoryDb.embeddings.filter(c => c.contract_id === contractId) : memoryDb.embeddings;
  }

  const scoredChunks = sourceChunks.map(chunk => {
    const similarity = chunk.embedding ? calculateCosineSimilarity(queryEmbedding, chunk.embedding) : 0.5;
    return {
      ...chunk,
      similarity
    };
  });

  scoredChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  return scoredChunks.slice(0, matchCount);
}
