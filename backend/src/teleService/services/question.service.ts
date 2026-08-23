import { createQuestion } from '../../modules/questions/questions.service';
import { UploadDatabaseError } from '../errors';
import { toDbQuestionType } from '../types';
import type { UploadQuestionType } from '../types';
import type { Question } from '@scientia/types';
import type { CreateOptionInput } from '@scientia/validators';

export class QuestionService {
  async create(params: {
    topicId:        string;
    secureUrl:      string;
    questionType:   UploadQuestionType;
    correctAnswer:  string;
  }): Promise<Question> {
    const { topicId, secureUrl, questionType, correctAnswer } = params;

    const dbType       = toDbQuestionType(questionType);
    const options      = buildOptions(questionType, correctAnswer);
    const integerAnswer =
      questionType === 'INTEGER' ? parseInt(correctAnswer.trim(), 10) : undefined;

    try {
      // Telegram uploads are published immediately — the teacher never
      // reviews via the admin app, so there is no separate approval step.
      // validateAnswerRules (enforced inside createQuestion) still guards
      // against a malformed answer ever reaching students.
      return await createQuestion(
        topicId,
        {
          type:             dbType,
          questionImageUrl: secureUrl,
          options,
          integerAnswer,
        },
        'PUBLISHED',
      );
    } catch (err) {
      throw new UploadDatabaseError(
        'Failed to write question to database',
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }
}

function buildOptions(
  type: UploadQuestionType,
  correctAnswer: string,
): CreateOptionInput[] {
  if (type === 'INTEGER') return [];

  if (type === 'TRUE_FALSE') {
    const isTrue = correctAnswer.trim().toUpperCase() === 'TRUE';
    return [
      { position: 0, optionText: 'True',  isCorrect: isTrue  },
      { position: 1, optionText: 'False', isCorrect: !isTrue },
    ];
  }

  // SINGLE or MULTI
  const correct = new Set(correctAnswer.trim().toUpperCase().split(''));
  return ['A', 'B', 'C', 'D'].map((letter, i) => ({
    position:   i,
    optionText: `Option ${letter}`,
    isCorrect:  correct.has(letter),
  }));
}
