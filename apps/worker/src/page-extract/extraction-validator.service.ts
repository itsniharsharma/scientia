import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { PageExtractionContract } from './types/extraction-contract';

// ── Zod schema (mirrors extraction-contract.ts) ───────────────────────────────

const VisualTypeSchema = z.enum([
  'image', 'diagram', 'graph', 'circuit', 'chemical', 'table', 'other',
]);

const VisualRefSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  type: VisualTypeSchema,
  position_y: z.number().min(0).max(1),
});

const PassageItemSchema = z.object({
  passage_id: z.string().regex(/^P\d+$/),
  is_continuation: z.boolean(),
  is_start: z.boolean(),
  is_end: z.boolean(),
  text: z.string(),
});

const NumeralTypeSchema = z.enum(['arabic', 'roman', 'alpha', 'none']);

const QuestionIdentitySchema = z.object({
  raw_label: z.string().nullable(),
  normalized_sequence: z.number().int().positive().nullable(),
  numeral_type: NumeralTypeSchema,
  section_label: z.string().nullable(),
  sub_index: z.string().nullable(),
  position_y: z.number().min(0).max(1),
  occurrence_rank_on_page: z.number().int().positive(),
});

const OptionItemSchema = z.object({
  label: z.string().min(1),
  text: z.string(),
  visual_ref: z.string().nullable(),
});

const QuestionTypeSchema = z.enum([
  'single_correct',
  'multi_correct',
  'integer_type',
  'assertion_reason',
  'match_following',
  'subjective',
  'fill_blank',
]);

const ExtractedQuestionSchema = z.object({
  identity: QuestionIdentitySchema,
  question_type: QuestionTypeSchema,
  text: z.string(),
  visual_refs: z.array(z.string()),
  options: z.array(OptionItemSchema),
  passage_ref: z.string().nullable(),
  is_continuation: z.boolean(),
  is_end: z.boolean(),
  correct_answer: z.string().nullable(),
  explanation: z.string().nullable(),
  marks_correct: z.number().nullable(),
  marks_negative: z.number().nullable(),
  confidence: z.number().min(0).max(1),
});

const PageExtractionContractSchema = z.object({
  page_number: z.number().int().positive(),
  has_questions: z.boolean(),
  visuals: z.array(VisualRefSchema),
  passages: z.array(PassageItemSchema),
  questions: z.array(ExtractedQuestionSchema),
  page_notes: z.string().nullable(),
  overall_confidence: z.number().min(0).max(1),
});

// ── Result types ──────────────────────────────────────────────────────────────

export type ValidationSuccess = { success: true; data: PageExtractionContract };
export type ValidationFailure = { success: false; error: string; rawText: string };
export type ValidationResult = ValidationSuccess | ValidationFailure;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ExtractionValidatorService {
  validate(text: string): ValidationResult {
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return {
        success: false,
        error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}`,
        rawText: text,
      };
    }

    const result = PageExtractionContractSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return { success: false, error: `Schema validation failed: ${issues}`, rawText: text };
    }

    return { success: true, data: result.data as PageExtractionContract };
  }
}
