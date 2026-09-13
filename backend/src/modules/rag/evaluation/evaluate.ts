import type { RagService } from '../rag.service';
import { EVAL_DATASET, type EvalQuestion, type QuestionCategory } from './eval-dataset';

export interface CategoryBreakdown {
  count: number;
  recallAtK: number;
}

export interface EvalResult {
  totalQuestions: number;
  /** Recall@K and MRR are computed against `sources` from the PUBLIC
   *  queryKnowledge() API (final, already-fused-and-budgeted results) —
   *  evaluation measures what a user actually receives, not an internal
   *  retrieval-only score the API never exposes. */
  recallAtK: number;
  mrr: number;
  /** Of the answerable questions, the fraction whose returned sources
   *  actually include the expected section (not just "an answer came back"). */
  citationCorrectness: number;
  /** Of ALL questions, the fraction where insufficientEvidence correctly
   *  matches whether the fixture document actually answers it. */
  answerabilityAccuracy: number;
  perCategory: Record<QuestionCategory, CategoryBreakdown>;
}

function matchesExpectedSection(sources: { section: string | null; subsection: string | null }[], expected: string): boolean {
  return sources.some((s) => s.section === expected || s.subsection === expected);
}

function rankOfExpectedSection(sources: { section: string | null; subsection: string | null }[], expected: string): number | null {
  const index = sources.findIndex((s) => s.section === expected || s.subsection === expected);
  return index === -1 ? null : index + 1;
}

export async function runEvaluation(service: RagService, dataset: EvalQuestion[] = EVAL_DATASET): Promise<EvalResult> {
  const answerable = dataset.filter((q) => q.answerable);
  let recallHits = 0;
  let reciprocalRankSum = 0;
  let citationHits = 0;
  let answerabilityCorrect = 0;

  const categoryTotals = new Map<QuestionCategory, { count: number; hits: number }>();

  for (const question of dataset) {
    const result = await service.queryKnowledge(question.query);

    const bucket = categoryTotals.get(question.category) ?? { count: 0, hits: 0 };
    bucket.count += 1;

    if (question.answerable && question.expectedSection) {
      const hit = matchesExpectedSection(result.sources, question.expectedSection);
      if (hit) {
        recallHits += 1;
        bucket.hits += 1;
        citationHits += 1;
      }
      const rank = rankOfExpectedSection(result.sources, question.expectedSection);
      if (rank !== null) reciprocalRankSum += 1 / rank;
    }

    if (result.insufficientEvidence === !question.answerable) {
      answerabilityCorrect += 1;
    }

    categoryTotals.set(question.category, bucket);
  }

  const perCategory = Object.fromEntries(
    [...categoryTotals.entries()].map(([category, { count, hits }]) => [category, { count, recallAtK: count > 0 ? hits / count : 0 }]),
  ) as Record<QuestionCategory, CategoryBreakdown>;

  return {
    totalQuestions: dataset.length,
    recallAtK: answerable.length > 0 ? recallHits / answerable.length : 0,
    mrr: answerable.length > 0 ? reciprocalRankSum / answerable.length : 0,
    citationCorrectness: answerable.length > 0 ? citationHits / answerable.length : 0,
    answerabilityAccuracy: dataset.length > 0 ? answerabilityCorrect / dataset.length : 0,
    perCategory,
  };
}
