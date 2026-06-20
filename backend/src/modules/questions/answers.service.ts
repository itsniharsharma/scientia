import { UnprocessableError } from '../../shared/errors';
import type { QuestionType } from '@scientia/types';

interface OptionAnswer {
  isCorrect: boolean;
}

export function validateAnswerRules(
  type: QuestionType,
  options: OptionAnswer[] | undefined | null,
  integerAnswer: number | null | undefined,
): void {
  if (type === 'INTEGER') {
    if (options && options.length > 0) {
      throw new UnprocessableError('INTEGER questions cannot have options');
    }
    if (integerAnswer === undefined || integerAnswer === null) {
      throw new UnprocessableError('INTEGER questions require integerAnswer');
    }
    return;
  }

  if (type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE') {
    if (integerAnswer !== undefined && integerAnswer !== null) {
      throw new UnprocessableError('Choice questions cannot have integerAnswer');
    }
    if (!options || options.length === 0) {
      throw new UnprocessableError(
        'Choice questions require at least one option',
      );
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (type === 'SINGLE_CHOICE' && correctCount !== 1) {
      throw new UnprocessableError(
        'SINGLE_CHOICE questions must have exactly one correct option',
      );
    }
    if (type === 'MULTI_CHOICE' && correctCount < 1) {
      throw new UnprocessableError(
        'MULTI_CHOICE questions must have at least one correct option',
      );
    }
  }
}
