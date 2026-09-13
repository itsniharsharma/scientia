// Approximate token count — chars/4 is the standard rule-of-thumb estimate
// for English text. Voyage and Gemini each use their own tokenizers
// internally (neither is GPT's BPE), so no single exact tokenizer would be
// correct for both anyway. This is only used to bound chunk sizes, never
// for billing, so an approximation is appropriate rather than pulling in a
// tokenizer dependency tied to a specific, unrelated model family.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
