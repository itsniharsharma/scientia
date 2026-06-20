import type { CorrectAnswerSnapshot, SelectedAnswer } from '@scientia/types';

const POINTS_CORRECT = 4;
const POINTS_WRONG = -1;
const POINTS_UNATTEMPTED = 0;

export function isAttempted(selected: SelectedAnswer | null): boolean {
  if (!selected) return false;
  if (selected.type === 'integer') return selected.value !== null;
  return selected.optionIds.length > 0;
}

export function scoreResponse(
  questionType: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER',
  selected: SelectedAnswer | null,
  correct: CorrectAnswerSnapshot,
): { isCorrect: boolean | null; points: number } {
  if (!isAttempted(selected)) {
    return { isCorrect: null, points: POINTS_UNATTEMPTED };
  }

  if (questionType === 'INTEGER') {
    if (selected!.type !== 'integer' || correct.type !== 'integer') {
      return { isCorrect: false, points: POINTS_WRONG };
    }
    const ok = selected!.value === correct.value;
    return { isCorrect: ok, points: ok ? POINTS_CORRECT : POINTS_WRONG };
  }

  // SINGLE_CHOICE or MULTI_CHOICE
  if (selected!.type !== 'choice' || correct.type !== 'choice') {
    return { isCorrect: false, points: POINTS_WRONG };
  }

  const selectedSorted = [...selected!.optionIds].sort();
  const correctSorted = [...correct.optionIds].sort();
  const ok =
    selectedSorted.length === correctSorted.length &&
    selectedSorted.every((id, i) => id === correctSorted[i]);

  return { isCorrect: ok, points: ok ? POINTS_CORRECT : POINTS_WRONG };
}

export interface ScoreSummary {
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
}

export function computeScore(
  responses: Array<{
    questionType: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER';
    selected: SelectedAnswer | null;
    correct: CorrectAnswerSnapshot;
  }>,
): ScoreSummary {
  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  for (const r of responses) {
    const { isCorrect, points } = scoreResponse(r.questionType, r.selected, r.correct);
    totalScore += points;
    if (isCorrect === null) unattemptedCount++;
    else if (isCorrect) correctCount++;
    else wrongCount++;
  }

  return { totalScore, correctCount, wrongCount, unattemptedCount };
}
