// Phase 4 Gemini extraction contract — matches the JSON Gemini must return.
// Zod schema in extraction-validator.service.ts mirrors this exactly.

export type VisualType = 'image' | 'diagram' | 'graph' | 'circuit' | 'chemical' | 'table' | 'other';

export interface VisualRef {
  id: string;           // scoped: "{3-digit-page}{letter}" e.g. "001a"
  description: string;
  type: VisualType;
  position_y: number;  // 0-1 normalized, 0=top
}

export type NumeralType = 'arabic' | 'roman' | 'alpha' | 'none';

export interface QuestionIdentity {
  raw_label: string | null;           // printed label: "Q.1", "(ii)", "A", null
  normalized_sequence: number | null; // 1, 2, 3… null if indeterminate
  numeral_type: NumeralType;
  section_label: string | null;       // "Section A", "Part I", null
  sub_index: string | null;           // "a", "b" for multi-part, null
  position_y: number;                 // 0-1 top of question stem
  occurrence_rank_on_page: number;    // 1-based, disambiguates same-label questions
}

export interface OptionItem {
  label: string;            // "A", "B", "1", "P" etc.
  text: string;
  visual_ref: string | null; // scoped visual ID if option contains an image
}

export interface PassageItem {
  passage_id: string;      // "P1", "P2" — stable across pages
  is_continuation: boolean; // true if started on a prior page
  is_start: boolean;
  is_end: boolean;
  text: string;            // visible portion of passage on this page
}

export type ExtractionQuestionType =
  | 'single_correct'
  | 'multi_correct'
  | 'integer_type'
  | 'assertion_reason'
  | 'match_following'
  | 'subjective'
  | 'fill_blank';

export interface ExtractedQuestion {
  identity: QuestionIdentity;
  question_type: ExtractionQuestionType;
  text: string;
  visual_refs: string[];         // scoped IDs from this or prior pages
  options: OptionItem[];
  passage_ref: string | null;    // "P1" if belongs to a passage, else null
  is_continuation: boolean;      // stem started on previous page
  is_end: boolean;               // continues onto next page
  correct_answer: string | null; // "A", "B,C", "4", null if not visible
  explanation: string | null;
  marks_correct: number | null;
  marks_negative: number | null;
  confidence: number;            // 0-1
}

export interface PageExtractionContract {
  page_number: number;
  has_questions: boolean;
  visuals: VisualRef[];
  passages: PassageItem[];
  questions: ExtractedQuestion[];
  page_notes: string | null;
  overall_confidence: number; // 0-1, mean of question confidences
}
