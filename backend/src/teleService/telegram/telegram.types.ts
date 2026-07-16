import type { Context } from 'telegraf';
import type { UploadQuestionType } from '../types';

export type ConversationStep =
  | 'AWAITING_TYPE'
  | 'AWAITING_ANSWER'
  | 'CONFIRMING'
  | 'UPLOADING_IN_PROGRESS' // lock against double-tap race — cleared by clearUploadFlow
  | 'CREATING_CHAPTER'      // waiting for user to type a new chapter name
  | 'CREATING_TOPIC';       // waiting for user to type a new topic name

export interface TelegramSession {
  // Cached teacher identity — populated on first auth, persists in session
  teacherId?: string;

  // Context selection — persists until teacher changes it
  subjectId?:   string;
  subjectName?: string;
  chapterId?:   string;
  chapterName?: string;
  topicId?:     string;
  topicName?:   string;

  // Active upload flow — cleared after Upload / Cancel
  step?:           ConversationStep;
  fileId?:         string;
  fileUniqueId?:   string;
  questionType?:   UploadQuestionType;
  correctAnswer?:  string;

  // Pagination cursors
  subjectPage?: number;
  chapterPage?: number;
  topicPage?:   number;
}

// Telegraf context augmented with our session
export interface BotContext extends Context {
  session: TelegramSession;
}
