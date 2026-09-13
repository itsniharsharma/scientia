import { api } from './axios';
import type { ConversationTurn, GenerationResult } from '../types/rag';

// Calls the existing backend RAG endpoint (POST /rag/query, proxied through
// /api). Cookie-based auth is attached automatically by the shared axios
// instance (withCredentials: true) — no separate auth wiring needed here.
// `history` is optional and, when provided, lets the backend answer as a
// continuation of the conversation rather than a standalone question.
export async function queryHelpdesk(query: string, history?: ConversationTurn[]): Promise<GenerationResult> {
  const res = await api.post<GenerationResult>('/rag/query', { query, history });
  return res.data;
}
