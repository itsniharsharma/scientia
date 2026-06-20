import { prisma } from '../../lib/prisma';
import { NotFoundError, UnprocessableError } from '../../shared/errors';
import { getTopicById } from '../topics/topics.service';
import { validateAnswerRules } from './answers.service';
import type { CreateQuestionInput, UpdateQuestionInput } from '@scientia/validators';
import type { Question, QuestionOption, QuestionType, QuestionStatus } from '@scientia/types';

type OptionRecord = {
  id: string;
  questionId: string;
  position: number;
  optionText: string | null;
  optionImageUrl: string | null;
  isCorrect: boolean;
};

type QuestionRecord = {
  id: string;
  topicId: string;
  type: string;
  status: string;
  questionText: string | null;
  questionImageUrl: string | null;
  integerAnswer: number | null;
  createdAt: Date;
  updatedAt: Date;
  options: OptionRecord[];
};

function optionToDto(record: OptionRecord): QuestionOption {
  return {
    id: record.id,
    questionId: record.questionId,
    position: record.position,
    optionText: record.optionText,
    optionImageUrl: record.optionImageUrl,
    isCorrect: record.isCorrect,
  };
}

function toDto(record: QuestionRecord): Question {
  return {
    id: record.id,
    topicId: record.topicId,
    type: record.type as QuestionType,
    status: record.status as QuestionStatus,
    questionText: record.questionText,
    questionImageUrl: record.questionImageUrl,
    integerAnswer: record.integerAnswer,
    options: record.options.map(optionToDto),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

const includeOptions = {
  options: { orderBy: { position: 'asc' as const } },
};

export async function getAllQuestions(topicId: string): Promise<Question[]> {
  await getTopicById(topicId);
  const records = await prisma.question.findMany({
    where: { topicId },
    include: includeOptions,
    orderBy: { createdAt: 'asc' },
  });
  return records.map(toDto);
}

export async function getQuestionById(id: string): Promise<Question> {
  const record = await prisma.question.findUnique({
    where: { id },
    include: includeOptions,
  });
  if (!record) {
    throw new NotFoundError('Question not found');
  }
  return toDto(record);
}

export async function createQuestion(
  topicId: string,
  data: CreateQuestionInput,
): Promise<Question> {
  await getTopicById(topicId);

  const created = await prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        topicId,
        type: data.type,
        questionText: data.questionText ?? null,
        questionImageUrl: data.questionImageUrl ?? null,
        integerAnswer:
          data.type === 'INTEGER' ? (data.integerAnswer ?? null) : null,
      },
    });

    if (data.options && data.options.length > 0) {
      await tx.option.createMany({
        data: data.options.map((o, i) => ({
          questionId: question.id,
          position: i,
          optionText: o.optionText ?? null,
          optionImageUrl: o.optionImageUrl ?? null,
          isCorrect: o.isCorrect,
        })),
      });
    }

    return question;
  });

  return getQuestionById(created.id);
}

export async function updateQuestion(
  id: string,
  data: UpdateQuestionInput,
): Promise<Question> {
  const existing = await getQuestionById(id);

  const effectiveText =
    data.questionText !== undefined ? data.questionText : existing.questionText;
  const effectiveImageUrl =
    data.questionImageUrl !== undefined
      ? data.questionImageUrl
      : existing.questionImageUrl;

  if (!effectiveText && !effectiveImageUrl) {
    throw new UnprocessableError(
      'At least one of questionText or questionImageUrl is required',
    );
  }

  if (data.options !== undefined) {
    validateAnswerRules(existing.type, data.options, undefined);
  }

  if (data.integerAnswer !== undefined && data.integerAnswer !== null) {
    if (existing.type !== 'INTEGER') {
      throw new UnprocessableError(
        'Only INTEGER questions can have integerAnswer',
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: { id },
      data: {
        ...(data.questionText !== undefined && {
          questionText: data.questionText,
        }),
        ...(data.questionImageUrl !== undefined && {
          questionImageUrl: data.questionImageUrl,
        }),
        ...(data.integerAnswer !== undefined && {
          integerAnswer: data.integerAnswer,
        }),
      },
    });

    if (data.options !== undefined) {
      await tx.option.deleteMany({ where: { questionId: id } });
      if (data.options.length > 0) {
        await tx.option.createMany({
          data: data.options.map((o, i) => ({
            questionId: id,
            position: i,
            optionText: o.optionText ?? null,
            optionImageUrl: o.optionImageUrl ?? null,
            isCorrect: o.isCorrect,
          })),
        });
      }
    }
  });

  return getQuestionById(id);
}

export async function deleteQuestion(id: string): Promise<void> {
  await getQuestionById(id);
  await prisma.question.delete({ where: { id } });
}
