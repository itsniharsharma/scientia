import { describe, it, expect } from 'vitest';
import { GeminiProvider } from '../../modules/rag/generation/providers/gemini-provider';
import { GROUNDING_SYSTEM_PROMPT } from '../../modules/rag/generation/prompts';
import type { ConversationTurn, RetrievedContext } from '../../modules/rag/core/types';

// Gated behind a real API key, mirroring qdrant.live.test.ts.
const skipIfNoGemini = !process.env.GEMINI_API_KEY ? it.skip : it;

function contextWith(text: string): RetrievedContext {
  return {
    chunks: [{
      score: 1,
      chunk: {
        text,
        metadata: {
          chunkId: 'c1', documentId: 'd1', documentTitle: 'Scientia Documentation', documentVersion: 1,
          pageStart: 5, pageEnd: 5, section: 'Subscriptions', subsection: null, contentType: 'paragraph',
          contentHash: 'h1', parserVersion: 'v1', chunkerVersion: 'v1', embeddingModel: 'test',
        },
      },
    }],
    sources: [{ documentTitle: 'Scientia Documentation', section: 'Subscriptions', subsection: null, page: 5 }],
    tokenCount: 50,
  };
}

function multiChunkContext(entries: Array<{ text: string; section: string }>): RetrievedContext {
  return {
    chunks: entries.map((e, i) => ({
      score: 1 - i * 0.01,
      chunk: {
        text: e.text,
        metadata: {
          chunkId: `c${i}`, documentId: 'd1', documentTitle: 'Scientia Documentation', documentVersion: 1,
          pageStart: i + 1, pageEnd: i + 1, section: e.section, subsection: null, contentType: 'paragraph',
          contentHash: `h${i}`, parserVersion: 'v1', chunkerVersion: 'v1', embeddingModel: 'test',
        },
      },
    })),
    sources: entries.map((e, i) => ({ documentTitle: 'Scientia Documentation', section: e.section, subsection: null, page: i + 1 })),
    tokenCount: 200,
  };
}

const SCIENTIA_OVERVIEW =
  'Document: Scientia Documentation\nSection: What is Scientia\n\nScientia is an examination and structured-learning platform designed for competitive-examination preparation such as JEE and NEET. It combines structured learning, targeted practice, and assessment-driven feedback for students and teachers.';

const ORGANISATION_DEFINITION =
  'Document: Scientia Documentation\nSection: Organisations\n\nAn organisation in Scientia is the top-level space used to group teachers, students, batches, tests, and related academic activity. A teacher can belong to multiple organisations. Students can also belong to multiple organisations through an authorised assignment workflow. Every username in Scientia is globally unique across all organisations.';

const RAG_LANGUAGE_PATTERN =
  /based on the (provided|retrieved)|according to the (retrieved|provided)|the (provided|retrieved) (documents?|context|chunks?)|the knowledge base (says|states)|retrieved (context|chunks?|sources?)|rag context/i;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// The free-tier Gemini quota used for these tests is 5 requests/minute —
// comfortably enough for a live sanity check, but this file makes more than
// 5 real calls in total. `paced()` spaces every real call at least 13s
// apart (60s / 5 = 12s minimum) so the suite never hits a 429, rather than
// masking rate-limit behavior behind mocks.
let lastCallAt = 0;
async function paced<T>(fn: () => Promise<T>): Promise<T> {
  const wait = Math.max(0, 13_000 - (Date.now() - lastCallAt));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  try {
    return await fn();
  } finally {
    lastCallAt = Date.now();
  }
}

describe('GeminiProvider (live)', () => {
  const rawProvider = new GeminiProvider(process.env.RAG_LLM_MODEL || 'gemini-3.6-flash', process.env.GEMINI_API_KEY || '');
  const provider = { generate: (input: Parameters<typeof rawProvider.generate>[0]) => paced(() => rawProvider.generate(input)) };

  skipIfNoGemini('answers from the provided context', async () => {
    const { answer, usedIndices } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'What is the Pro plan price?',
      context: contextWith('Document: Scientia Documentation\nSection: Subscriptions\n\nThe Pro plan costs 999 rupees per month and supports up to 500 students.'),
    });

    expect(answer.toLowerCase()).toContain('999');
    expect(answer).not.toMatch(/USED_SOURCES/i); // trailer must never leak into the visible answer
    expect(usedIndices).toEqual([1]); // the only evidence item, and it was actually used
  }, 45_000);

  skipIfNoGemini('does not fabricate information absent from the context', async () => {
    const { answer, usedIndices } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: "Who is Scientia's CEO?",
      context: contextWith('Document: Scientia Documentation\nSection: Subscriptions\n\nThe Pro plan costs 999 rupees per month and supports up to 500 students.'),
    });

    // The context says nothing about a CEO — a grounded answer should say
    // so rather than inventing a name. Broadened to include "don't have" —
    // the new conversational prompt's suggested refusal phrasing — which
    // the original, narrower pattern predates.
    expect(answer.length).toBeGreaterThan(0);
    expect(/\b(not|no|doesn't|does not|isn't covered|unavailable|cannot find|don't have)\b/i.test(answer)).toBe(true);
    // The one evidence item (Pro plan pricing) doesn't answer a CEO
    // question — a citation-honest model reports using none of it.
    expect(usedIndices).toEqual([]);
  }, 45_000);

  // Regression tests for the response-QUALITY report: retrieval was already
  // finding the right evidence (see what-is-scientia.live.test.ts), but the
  // generated answer read like an internal RAG report — verbose, littered
  // with "based on the provided documentation," dumping unrelated sections,
  // and appending a "Sources:" list Gemini itself wrote. These pin the new
  // conversational prompt's behavior against the real model.

  skipIfNoGemini('answers "What is Scientia?" concisely and naturally, with no RAG language and no document dump', async () => {
    const { answer } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'What is Scientia?',
      context: contextWith(SCIENTIA_OVERVIEW),
    });

    expect(RAG_LANGUAGE_PATTERN.test(answer)).toBe(false);
    expect(/^sources:?$/im.test(answer)).toBe(false);
    expect(/\[\d+\]/.test(answer)).toBe(false);
    expect(/^#|^what is /im.test(answer.trim())).toBe(false); // no forced heading
    expect(wordCount(answer)).toBeLessThanOrEqual(120);
    expect(answer.toLowerCase()).toMatch(/exam|jee|neet|learning|practice/);
  }, 45_000);

  skipIfNoGemini('answers an organisation question directly without explaining unrelated Scientia topics, citing only the organisation evidence', async () => {
    const { answer, usedIndices } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'Can you tell me something about organisations?',
      context: multiChunkContext([
        { text: ORGANISATION_DEFINITION, section: 'Organisations' },
        { text: SCIENTIA_OVERVIEW, section: 'What is Scientia' },
      ]),
    });

    expect(RAG_LANGUAGE_PATTERN.test(answer)).toBe(false);
    expect(/^sources:?$/im.test(answer)).toBe(false);
    expect(answer.toLowerCase()).toContain('organisation');
    expect(wordCount(answer)).toBeLessThanOrEqual(150);
    // Citation integrity (Section 5): the answer is about organisations
    // only — the unrelated "What is Scientia" overview chunk (index 2)
    // cleared retrieval's relevance floor for the query as a whole, but the
    // generated answer shouldn't cite it as a source it drew from.
    expect(usedIndices).toEqual([1]);
  }, 45_000);

  skipIfNoGemini('gives a more comprehensive answer when the user explicitly asks for everything', async () => {
    const context = multiChunkContext([
      { text: ORGANISATION_DEFINITION, section: 'Organisations' },
      { text: SCIENTIA_OVERVIEW, section: 'What is Scientia' },
    ]);

    const { answer: shortAnswer } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'Can you tell me something about organisations?',
      context,
    });
    const { answer: detailedAnswer } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'Tell me everything about organisations.',
      context,
    });

    expect(RAG_LANGUAGE_PATTERN.test(detailedAnswer)).toBe(false);
    expect(wordCount(detailedAnswer)).toBeGreaterThan(wordCount(shortAnswer));
  }, 60_000);

  skipIfNoGemini('does not fabricate a price when pricing is absent from the retrieved evidence, even though other Scientia evidence is present', async () => {
    const { answer, usedIndices } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'What are the subscription prices?',
      context: multiChunkContext([
        { text: ORGANISATION_DEFINITION, section: 'Organisations' },
        { text: SCIENTIA_OVERVIEW, section: 'What is Scientia' },
      ]),
    });

    expect(/\b(not|no|doesn't|does not|isn't covered|unavailable|cannot find|don't have)\b/i.test(answer)).toBe(true);
    // No fabricated currency amount (₹, Rs, $, or "N per month"/"N/month").
    expect(/₹\s?\d|rs\.?\s?\d|\$\s?\d|\b\d+\s*(rupees|per month|\/month)/i.test(answer)).toBe(false);
    // Neither retrieved item actually answers a pricing question — a
    // citation-honest refusal cites nothing (Section 5: no citation dumping
    // on a "not found" answer).
    expect(usedIndices).toEqual([]);
  }, 45_000);

  skipIfNoGemini('continues the conversation naturally on a follow-up instead of restarting', async () => {
    const { answer: overviewAnswer } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'What is Scientia?',
      context: contextWith(SCIENTIA_OVERVIEW),
    });

    const history: ConversationTurn[] = [
      { role: 'user', content: 'What is Scientia?' },
      { role: 'assistant', content: overviewAnswer },
    ];

    const { answer: followUpAnswer } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'What about organisations?',
      context: contextWith(ORGANISATION_DEFINITION),
      history,
    });

    expect(RAG_LANGUAGE_PATTERN.test(followUpAnswer)).toBe(false);
    expect(followUpAnswer.toLowerCase()).toContain('organisation');
    // Should not re-introduce/redefine what Scientia is again — that was
    // already established in the previous turn.
    expect(/scientia is an? (examination|platform)/i.test(followUpAnswer)).toBe(false);
  }, 60_000);

  skipIfNoGemini('gracefully refuses a completely unrelated, unsupported question without hallucinating', async () => {
    const { answer, usedIndices } = await provider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query: 'Who won the last cricket world cup?',
      context: { chunks: [], sources: [], tokenCount: 0 },
    });

    expect(/\b(not|no|doesn't|does not|isn't covered|unavailable|cannot find|don't have)\b/i.test(answer)).toBe(true);
    expect(RAG_LANGUAGE_PATTERN.test(answer)).toBe(false);
    expect(answer.toLowerCase()).not.toMatch(/india|australia|england|world cup winner/);
    expect(usedIndices).toEqual([]); // no evidence existed at all
  }, 45_000);
});
