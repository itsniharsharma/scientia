import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { GenerativeModel } from '@google/generative-ai';
import { AppConfigService } from '../config/app-config.service';

export class GeminiRateLimitError extends Error {
  constructor() {
    super('Gemini rate limited (429)');
    this.name = 'GeminiRateLimitError';
  }
}

export class GeminiSafetyBlockError extends Error {
  constructor() {
    super('Gemini blocked response due to safety filters');
    this.name = 'GeminiSafetyBlockError';
  }
}

export interface GeminiExtractionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  modelVersion: string;
}

export interface GeminiExtractParams {
  imageBuffer: Buffer;
  systemPrompt: string;
  userPrompt: string;
  pageNumber: number;
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

@Injectable()
export class GeminiClientService implements OnModuleInit {
  private readonly logger = new Logger(GeminiClientService.name);
  private model!: GenerativeModel;
  private modelName!: string;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    const apiKey = this.config.get('GEMINI_API_KEY');
    this.modelName = this.config.get('GEMINI_MODEL');

    const genAI = new GoogleGenerativeAI(apiKey);

    this.model = genAI.getGenerativeModel(
      {
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: this.config.get('GEMINI_MAX_OUTPUT_TOKENS'),
          temperature: this.config.get('GEMINI_TEMPERATURE'),
        },
        safetySettings: SAFETY_SETTINGS,
      },
    );

    this.logger.log(`Gemini client initialized (model: ${this.modelName})`);
  }

  async extract(params: GeminiExtractParams): Promise<GeminiExtractionResult> {
    const { imageBuffer, systemPrompt, userPrompt, pageNumber } = params;
    const imageBase64 = imageBuffer.toString('base64');

    this.logger.debug(`Calling Gemini for page ${pageNumber} (image: ${imageBuffer.length} bytes)`);

    const startMs = Date.now();

    let result;
    try {
      result = await this.model.generateContent({
        systemInstruction: systemPrompt,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
              { text: userPrompt },
            ],
          },
        ],
      });
    } catch (err) {
      const durationMs = Date.now() - startMs;
      this.logger.error(`Gemini API error after ${durationMs}ms: ${String(err)}`);
      if (this.isRateLimitError(err)) throw new GeminiRateLimitError();
      throw err;
    }

    const durationMs = Date.now() - startMs;
    const response = result.response;

    // Safety block — finishReason is SAFETY when blocked
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      this.logger.warn(`Gemini safety block on page ${pageNumber}`);
      throw new GeminiSafetyBlockError();
    }

    const text = response.text();
    const usage = response.usageMetadata;

    this.logger.debug(
      `Gemini page ${pageNumber} done in ${durationMs}ms — ` +
        `in:${usage?.promptTokenCount ?? 0} out:${usage?.candidatesTokenCount ?? 0}`,
    );

    return {
      text,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      durationMs,
      modelVersion: this.modelName,
    };
  }

  private isRateLimitError(err: unknown): boolean {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      return msg.includes('429') || msg.includes('rate limit') || msg.includes('quota');
    }
    return false;
  }
}
