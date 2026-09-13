import type { LLMProvider, GenerationInput } from '../llm-provider';
import { buildUserPrompt, parseGeneratedAnswer, type ParsedGeneration } from '../prompts';
import { GenerationError } from '../../core/errors';
import { withRetry, PermanentProviderError } from '../../core/retry';

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
}

// The system prompt already asks for concise, proportionate answers — this
// is a hard cost/safety backstop, not the normal content limiter. Verified
// against the real model that 1024 was NOT always enough headroom: a normal
// (non-adversarial) follow-up question with several retrieved chunks
// produced a response that hit that cap mid-answer, truncating it mid-
// sentence. 2048 gives real Helpdesk answers comfortable room (even a
// multi-paragraph "tell me everything" response) while still bounding
// worst-case cost if generation ever degenerates (e.g. a repetition loop).
const MAX_OUTPUT_TOKENS = 2048;

export class GeminiProvider implements LLMProvider {
  constructor(
    private readonly model: string,
    private readonly apiKey: string,
  ) {}

  async generate(input: GenerationInput): Promise<ParsedGeneration> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const userPrompt = buildUserPrompt(input.query, input.context);

    // Prior turns are sent as real Gemini conversation turns (not flattened
    // into the prompt text) — this is what actually gives the model
    // conversational continuity ("what about organisations?" reads as a
    // continuation, not a fresh unrelated question) without touching
    // retrieval at all: only the CURRENT query is ever embedded/searched.
    const historyContents = (input.history ?? []).map((turn) => ({
      role: turn.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: turn.content }],
    }));

    return withRetry(async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: input.systemInstructions }] },
          contents: [...historyContents, { role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        if (res.status !== 429 && res.status < 500) {
          throw new PermanentProviderError(`Gemini generation request failed (${res.status}): ${body}`);
        }
        throw new Error(`Gemini generation request failed (${res.status}): ${body}`);
      }

      const json = (await res.json()) as GeminiResponse;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new PermanentProviderError('Gemini returned no generated text');
      }
      return parseGeneratedAnswer(text);
    }).catch((err) => {
      if (err instanceof PermanentProviderError) throw new GenerationError(err.message);
      throw new GenerationError(`Gemini generation failed after retries: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
