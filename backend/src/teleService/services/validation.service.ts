import { prisma } from '../../lib/prisma';
import { UploadValidationError } from '../errors';
import type { UploadQuestionType } from '../types';

// Accepts both A–D letters and 1–4 numbers — normalised to letters before DB write
const VALID_OPTION_INPUTS = new Set(['A', 'B', 'C', 'D', '1', '2', '3', '4']);

export class ValidationService {
  async validate(input: {
    teacherId:     string;
    topicId:       string;
    questionType:  UploadQuestionType;
    correctAnswer: string;
  }): Promise<void> {
    const { teacherId, topicId, questionType, correctAnswer } = input;

    const [teacher, topic] = await Promise.all([
      prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } }),
      prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } }),
    ]);

    if (!teacher) throw new UploadValidationError(`Teacher not found: ${teacherId}`);
    if (!topic)   throw new UploadValidationError(`Topic not found: ${topicId}`);

    validateAnswer(questionType, correctAnswer);
  }
}

/**
 * Validates an answer without throwing — for use in bot text handlers
 * where a user-facing error string is needed rather than an exception.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateAnswerOrNull(type: UploadQuestionType, raw: string): string | null {
  try {
    validateAnswer(type, raw);
    return null;
  } catch (err) {
    return err instanceof UploadValidationError ? err.message : 'Invalid answer format';
  }
}

function validateAnswer(type: UploadQuestionType, raw: string): void {
  const answer = raw.trim();

  switch (type) {
    case 'SINGLE': {
      const up = answer.toUpperCase();
      if (answer.length !== 1 || !VALID_OPTION_INPUTS.has(up)) {
        throw new UploadValidationError(
          `SINGLE_CHOICE answer must be 1–4 or A–D — received: "${answer}"`,
        );
      }
      break;
    }
    case 'MULTI': {
      const chars = answer.toUpperCase().split('');
      const unique = new Set(chars);
      const allValid = chars.every(c => VALID_OPTION_INPUTS.has(c));
      if (chars.length === 0 || !allValid || unique.size !== chars.length) {
        throw new UploadValidationError(
          `MULTI_CHOICE answer must be unique options from 1–4 or A–D with no repeats (e.g. 123 or ABD) — received: "${answer}"`,
        );
      }
      break;
    }
    case 'INTEGER': {
      if (!/^-?\d+$/.test(answer)) {
        throw new UploadValidationError(
          `INTEGER answer must be a whole number — received: "${answer}"`,
        );
      }
      break;
    }
    case 'TRUE_FALSE': {
      const normalised = answer.toUpperCase();
      if (normalised !== 'TRUE' && normalised !== 'FALSE') {
        throw new UploadValidationError(
          `TRUE_FALSE answer must be "True" or "False" — received: "${answer}"`,
        );
      }
      break;
    }
    default: {
      const _: never = type;
      throw new UploadValidationError(`Unknown question type: ${String(_)}`);
    }
  }
}
