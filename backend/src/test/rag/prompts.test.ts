import { describe, it, expect } from 'vitest';
import { parseGeneratedAnswer, buildUserPrompt } from '../../modules/rag/generation/prompts';
import type { RetrievedContext } from '../../modules/rag/core/types';

describe('parseGeneratedAnswer', () => {
  it('extracts the answer and used-source indices from a well-formed response (marker leads)', () => {
    const raw = 'USED_SOURCES: 1, 3\n\nScientia is an exam-prep platform.';
    expect(parseGeneratedAnswer(raw)).toEqual({
      answer: 'Scientia is an exam-prep platform.',
      usedIndices: [1, 3],
    });
  });

  it('is case-insensitive and tolerates extra whitespace around the marker', () => {
    const raw = '   used_sources:   2  \nAn answer.';
    expect(parseGeneratedAnswer(raw)).toEqual({ answer: 'An answer.', usedIndices: [2] });
  });

  it('returns an empty array (not null) for an explicit "none"', () => {
    const raw = "USED_SOURCES: none\n\nSorry, I don't have that information.";
    expect(parseGeneratedAnswer(raw)).toEqual({
      answer: "Sorry, I don't have that information.",
      usedIndices: [],
    });
  });

  it('returns null when there is no marker at all — an unexpected/malformed response', () => {
    const raw = 'Just an answer with no marker.';
    expect(parseGeneratedAnswer(raw)).toEqual({ answer: raw, usedIndices: null });
  });

  it('returns null when the marker is present but nothing parseable follows it', () => {
    const raw = 'USED_SOURCES: \nAn answer.';
    expect(parseGeneratedAnswer(raw)).toEqual({ answer: 'An answer.', usedIndices: null });
  });

  it('ignores non-numeric junk in the list but keeps the numbers that are present', () => {
    const raw = 'USED_SOURCES: 1, abc, 2\nAn answer.';
    expect(parseGeneratedAnswer(raw)).toEqual({ answer: 'An answer.', usedIndices: [1, 2] });
  });

  it('never leaves the marker inside the visible answer', () => {
    const raw = 'USED_SOURCES: 1\nMulti-line\nanswer body.';
    const { answer } = parseGeneratedAnswer(raw);
    expect(answer).not.toMatch(/USED_SOURCES/i);
    expect(answer).toBe('Multi-line\nanswer body.');
  });

  it('survives truncation: citation data is intact even when the visible answer is cut off mid-sentence', () => {
    // Regression test for a real bug found via live testing: with the
    // marker written AFTER the answer, a response that hit the output-token
    // cap mid-answer lost the marker entirely (fell back to "cite
    // everything") AND the user saw a broken, unfinished-looking reply. The
    // marker now comes first specifically so this can't happen — a
    // truncated response still yields correct citation data, even though
    // the visible answer itself is still cut short (a separate, real LLM-
    // length-adherence concern, not something a token cap alone can fix).
    const raw = 'USED_SOURCES: 2\n\nHere are the key details on how they work:'; // cut off mid-sentence
    expect(parseGeneratedAnswer(raw)).toEqual({
      answer: 'Here are the key details on how they work:',
      usedIndices: [2],
    });
  });
});

describe('buildUserPrompt', () => {
  function contextWith(chunks: RetrievedContext['chunks']): RetrievedContext {
    return { chunks, sources: [], tokenCount: 0 };
  }

  it('wraps reference material in explicit delimiters so untrusted document content has a clear boundary', () => {
    const prompt = buildUserPrompt('What is Scientia?', contextWith([]));
    expect(prompt).toContain('REFERENCE_MATERIAL_START');
    expect(prompt).toContain('REFERENCE_MATERIAL_END');
    expect(prompt).toContain('Current question: What is Scientia?');
  });

  it('places the question after the material closes, so injected text inside the material cannot masquerade as the question', () => {
    const prompt = buildUserPrompt('real question', contextWith([]));
    const endIndex = prompt.indexOf('REFERENCE_MATERIAL_END');
    const questionIndex = prompt.indexOf('Current question:');
    expect(questionIndex).toBeGreaterThan(endIndex);
  });
});
