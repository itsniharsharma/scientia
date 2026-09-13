import type { RetrievedContext, SourceRef } from '../core/types';
import { toSourceRef, sourceKey } from '../context/context-builder';

/** Renders retrieved sources into the clean, user-facing citation format
 *  from the spec:
 *    Sources:
 *    - Scientia Documentation — Subscriptions — Pro Plan — p. 12
 *  Only ever built from sources that were actually retrieved — there is no
 *  code path that invents a citation. */
export function formatCitations(sources: SourceRef[]): string[] {
  return sources.map((source) => {
    const location = [source.documentTitle, source.section, source.subsection].filter(Boolean).join(' — ');
    return `${location} — p. ${source.page}`;
  });
}

/** Deterministic, structural signal (not dependent on trusting the LLM's
 *  self-assessment): if retrieval found nothing at all, evidence is
 *  insufficient by definition. */
export function hasInsufficientEvidence(context: RetrievedContext): boolean {
  return context.chunks.length === 0;
}

/**
 * Retrieval clears a relevance floor for the QUESTION as a whole — it does
 * not guarantee every retrieved chunk was actually drawn on by the specific
 * answer generated from them. Without this filter, `sources` would list
 * every chunk that made it into context, even ones the model didn't
 * actually use (citation dumping). The generation prompt asks the model to
 * report which numbered evidence items its answer actually drew from (see
 * generation/prompts.ts); this narrows `context.sources` down to just
 * those, deduped the same way buildContext() dedupes its full list.
 *
 * `usedIndices` is `null` when the model's response didn't include a
 * parseable marker (a malformed/unexpected response) — in that case this
 * falls back to the full retrieved source list rather than showing no
 * citations for a real answer, which would be a worse user experience than
 * the (rare) risk of one extra, genuinely-relevant-per-retrieval source. An
 * explicit empty array means the model reported using none of the evidence
 * (e.g. it answered from conversation context alone) — that legitimately
 * means zero citations, not "fall back to everything".
 */
export function filterSourcesByUsedChunks(context: RetrievedContext, usedIndices: number[] | null): SourceRef[] {
  if (usedIndices === null) return context.sources;
  if (usedIndices.length === 0) return [];

  const seen = new Set<string>();
  const filtered: SourceRef[] = [];
  for (const oneBasedIndex of usedIndices) {
    const chunk = context.chunks[oneBasedIndex - 1];
    if (!chunk) continue; // out-of-range index the model hallucinated — ignore, don't crash
    const source = toSourceRef(chunk.chunk);
    const key = sourceKey(source);
    if (seen.has(key)) continue;
    seen.add(key);
    filtered.push(source);
  }

  // Every index was out of range / nothing survived — same fallback as "no marker at all".
  return filtered.length > 0 ? filtered : context.sources;
}
