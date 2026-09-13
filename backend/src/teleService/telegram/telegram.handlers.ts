import { randomUUID } from 'crypto';
import type { BotContext, TelegramSession } from './telegram.types';
import type { UploadQuestionType, UploadRequest, UploadResult } from '../types';
import { clearUploadFlow, setSession } from './telegram.session';
import {
  getSubjects,
  getChaptersBySubject,
  getTopicsByChapter,
  getSubjectById,
  getChapterById,
  getTopicById,
  countTodayUploads,
} from './telegram.catalog';
import {
  subjectKeyboard,
  chapterKeyboard,
  topicKeyboard,
  questionTypeKeyboard,
  confirmKeyboard,
  changeContextKeyboard,
  duplicateWarningKeyboard,
} from './telegram.keyboards';
import { logger } from '../../shared/logger';
import { uploadService } from '../upload.service';
import { telegramAdapter } from './telegram.adapter';
import {
  UploadValidationError,
  UploadImageError,
  UploadCloudinaryError,
  UploadDatabaseError,
} from '../errors';
import { checkDuplicate, markUploaded } from './telegram.session';
import { checkUploadRateLimit } from './telegram.rate-limit';
import { uploadMetrics } from '../metrics';
import { runCleanup } from '../jobs/cleanup';
import { consumeLinkToken, linkTeacherToTelegram } from './telegram.link';
import { validateAnswerOrNull } from '../services/validation.service';
import { createChapterInBot, createTopicInBot } from './telegram.create';
import { downloadTelegramFile } from './telegram.document';
import { getRagService } from '../../modules/rag/rag.service';

// ── Internal utilities ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeEdit(ctx: BotContext, text: string, extra?: any): Promise<void> {
  try {
    await ctx.editMessageText(text, extra);
  } catch {
    // Message too old to edit (deleted / >48h old) — send a new one
    await ctx.reply(text, extra);
  }
}

function typeLabel(type: UploadQuestionType): string {
  const map: Record<UploadQuestionType, string> = {
    SINGLE:     'Single Correct',
    MULTI:      'Multiple Correct',
    INTEGER:    'Integer',
    TRUE_FALSE: 'True / False',
  };
  return map[type];
}

function getAnswerFormatHint(type: UploadQuestionType): string {
  const map: Record<UploadQuestionType, string> = {
    SINGLE:     'Type the correct option: <b>1</b>, <b>2</b>, <b>3</b>, or <b>4</b>\n<i>(A, B, C, D also accepted)</i>',
    MULTI:      'Type all correct options without spaces, e.g. <b>12</b> or <b>134</b>\n<i>(letters like ABD also accepted)</i>',
    INTEGER:    'Type the correct whole number, e.g. <b>42</b> or <b>-5</b>',
    TRUE_FALSE: 'Type <b>True</b> or <b>False</b>',
  };
  return map[type];
}

// Maps 1–4 to A–D so downstream code (buildOptions) always receives letters
function digitToLetter(c: string): string {
  return { '1': 'A', '2': 'B', '3': 'C', '4': 'D' }[c] ?? c;
}

function normalizeAnswer(type: UploadQuestionType, raw: string): string {
  const a = raw.trim().toUpperCase();
  if (type === 'SINGLE') return digitToLetter(a);
  // Deduplicate, convert digits, sort alphabetically (e.g. "31B" → "ABC")
  if (type === 'MULTI')  return [...new Set(a.split('').map(digitToLetter))].sort().join('');
  if (type === 'TRUE_FALSE') return a.charAt(0) + a.slice(1).toLowerCase();
  return a; // INTEGER: preserve as-is
}

function buildSummary(session: TelegramSession): string {
  return [
    '📋 <b>Upload Summary</b>',
    '',
    `📚 <b>Subject:</b>  ${session.subjectName ?? '—'}`,
    `📖 <b>Chapter:</b>  ${session.chapterName ?? '—'}`,
    `📝 <b>Topic:</b>    ${session.topicName ?? '—'}`,
    `🔢 <b>Type:</b>     ${session.questionType ? typeLabel(session.questionType) : '—'}`,
    `✅ <b>Answer:</b>   ${session.correctAnswer ?? '—'}`,
    '',
    'Press <b>Upload</b> to confirm or <b>Cancel</b> to discard.',
  ].join('\n');
}

async function showReady(ctx: BotContext): Promise<void> {
  const { subjectName, chapterName, topicName } = ctx.session;
  const text = [
    '✅ <b>Context set!</b>',
    '',
    `📚 <b>Subject:</b>  ${subjectName}`,
    `📖 <b>Chapter:</b>  ${chapterName}`,
    `📝 <b>Topic:</b>    ${topicName}`,
    '',
    '📸 Send a question photo to begin uploading.',
  ].join('\n');

  await ctx.reply(text, {
    parse_mode:    'HTML',
    reply_markup:  changeContextKeyboard(ctx.session).reply_markup,
  });
}

// ── Navigation callback handlers (module-private) ─────────────────────────────

async function selectSubject(ctx: BotContext, id: string): Promise<void> {
  const subject = await getSubjectById(id);
  if (!subject) {
    await safeEdit(ctx, '⚠️ Subject not found. It may have been removed. Send /start to refresh.');
    return;
  }

  ctx.session = {
    ...ctx.session,
    subjectId: subject.id, subjectName: subject.name,
    chapterId: undefined, chapterName: undefined,
    topicId: undefined, topicName: undefined,
    subjectPage: 0,
  };

  const chapters = await getChaptersBySubject(id);
  if (!chapters.length) {
    await safeEdit(
      ctx,
      `📚 <b>${subject.name}</b>\n\n📭 No chapters yet — tap <b>➕ New Chapter</b> to create one.`,
      { parse_mode: 'HTML', reply_markup: chapterKeyboard([], 0).reply_markup },
    );
    return;
  }

  await safeEdit(
    ctx,
    `📚 <b>${subject.name}</b>\n\nSelect a chapter:`,
    { parse_mode: 'HTML', reply_markup: chapterKeyboard(chapters, 0).reply_markup },
  );
}

async function selectChapter(ctx: BotContext, id: string): Promise<void> {
  const chapter = await getChapterById(id);
  if (!chapter) {
    await safeEdit(ctx, '⚠️ Chapter not found. It may have been removed. Send /start to refresh.');
    return;
  }

  ctx.session = {
    ...ctx.session,
    chapterId: chapter.id, chapterName: chapter.name,
    topicId: undefined, topicName: undefined,
    chapterPage: 0,
  };

  const topics = await getTopicsByChapter(id);
  if (!topics.length) {
    await safeEdit(
      ctx,
      `📖 <b>${chapter.name}</b>\n\n📭 No topics yet — tap <b>➕ New Topic</b> to create one.`,
      { parse_mode: 'HTML', reply_markup: topicKeyboard([], 0).reply_markup },
    );
    return;
  }

  await safeEdit(
    ctx,
    `📖 <b>${chapter.name}</b>\n\nSelect a topic:`,
    { parse_mode: 'HTML', reply_markup: topicKeyboard(topics, 0).reply_markup },
  );
}

async function selectTopic(ctx: BotContext, id: string): Promise<void> {
  const topic = await getTopicById(id);
  if (!topic) {
    await safeEdit(ctx, '⚠️ Topic not found. It may have been removed. Send /start to refresh.');
    return;
  }

  ctx.session = { ...ctx.session, topicId: topic.id, topicName: topic.name, topicPage: 0 };

  await safeEdit(
    ctx,
    [
      `📚 ${ctx.session.subjectName}`,
      `📖 ${ctx.session.chapterName}`,
      `📝 <b>${topic.name}</b>`,
      '',
      '✅ Context set! Send a question photo to start uploading.',
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: changeContextKeyboard(ctx.session).reply_markup },
  );
}

async function pageSubjects(ctx: BotContext, page: number): Promise<void> {
  const subjects = await getSubjects();
  ctx.session.subjectPage = page;
  await safeEdit(ctx, '📚 Select a subject:', {
    reply_markup: subjectKeyboard(subjects, page).reply_markup,
  });
}

async function pageChapters(ctx: BotContext, page: number): Promise<void> {
  if (!ctx.session.subjectId) { await safeEdit(ctx, '📍 Please select a subject first.'); return; }
  const chapters = await getChaptersBySubject(ctx.session.subjectId);
  ctx.session.chapterPage = page;
  await safeEdit(
    ctx,
    `📚 <b>${ctx.session.subjectName}</b>\n\nSelect a chapter:`,
    { parse_mode: 'HTML', reply_markup: chapterKeyboard(chapters, page).reply_markup },
  );
}

async function pageTopics(ctx: BotContext, page: number): Promise<void> {
  if (!ctx.session.chapterId) { await safeEdit(ctx, '📍 Please select a chapter first.'); return; }
  const topics = await getTopicsByChapter(ctx.session.chapterId);
  ctx.session.topicPage = page;
  await safeEdit(
    ctx,
    `📖 <b>${ctx.session.chapterName}</b>\n\nSelect a topic:`,
    { parse_mode: 'HTML', reply_markup: topicKeyboard(topics, page).reply_markup },
  );
}

async function changeSubject(ctx: BotContext): Promise<void> {
  const subjects = await getSubjects();
  await safeEdit(ctx, '📚 Select a subject:', {
    reply_markup: subjectKeyboard(subjects, 0).reply_markup,
  });
}

async function changeChapter(ctx: BotContext): Promise<void> {
  if (!ctx.session.subjectId) { await safeEdit(ctx, '📍 Please select a subject first. Send /start.'); return; }
  const chapters = await getChaptersBySubject(ctx.session.subjectId);
  await safeEdit(
    ctx,
    `📚 <b>${ctx.session.subjectName}</b>\n\nSelect a chapter:`,
    { parse_mode: 'HTML', reply_markup: chapterKeyboard(chapters, 0).reply_markup },
  );
}

async function changeTopic(ctx: BotContext): Promise<void> {
  if (!ctx.session.chapterId) { await safeEdit(ctx, '📍 Please select a chapter first. Send /start.'); return; }
  const topics = await getTopicsByChapter(ctx.session.chapterId);
  await safeEdit(
    ctx,
    `📖 <b>${ctx.session.chapterName}</b>\n\nSelect a topic:`,
    { parse_mode: 'HTML', reply_markup: topicKeyboard(topics, 0).reply_markup },
  );
}

async function selectType(ctx: BotContext, type: UploadQuestionType): Promise<void> {
  const validTypes: UploadQuestionType[] = ['SINGLE', 'MULTI', 'INTEGER', 'TRUE_FALSE'];
  if (!validTypes.includes(type)) {
    await safeEdit(ctx, '⚠️ Unknown question type. Please select again.');
    return;
  }

  ctx.session.questionType = type;
  ctx.session.step = 'AWAITING_ANSWER';

  await safeEdit(
    ctx,
    `🔢 <b>Type: ${typeLabel(type)}</b>\n\n${getAnswerFormatHint(type)}\n\n✏️ Type your answer:`,
    { parse_mode: 'HTML' },
  );
}

function classifyUploadError(err: unknown): string {
  if (err instanceof UploadValidationError) {
    return (
      '❌ <b>Validation failed</b>\n\n' +
      `${err.message}\n\n` +
      'Please correct the answer and try again.'
    );
  }
  if (err instanceof UploadImageError) {
    return (
      '❌ <b>Image processing failed</b>\n\n' +
      'The photo could not be processed. Please resend a clearer image.'
    );
  }
  if (err instanceof UploadCloudinaryError) {
    return (
      '❌ <b>Cloud upload failed</b>\n\n' +
      'Image storage is temporarily unavailable. Nothing was saved. Please try again.'
    );
  }
  if (err instanceof UploadDatabaseError) {
    return (
      '❌ <b>Question save failed</b>\n\n' +
      'The image was uploaded but the question record could not be created. ' +
      'The cloud asset has been rolled back automatically. Please try again.'
    );
  }
  return '❌ <b>Unexpected error</b>\n\nAn unexpected error occurred. Please try again.';
}

function buildSuccessMessage(params: {
  questionId:   string;
  subjectName:  string;
  chapterName:  string;
  topicName:    string;
  questionType: UploadQuestionType;
  todayCount:   number;
  durationMs:   number;
}): string {
  const LABEL: Record<UploadQuestionType, string> = {
    SINGLE:     'Single Correct',
    MULTI:      'Multiple Correct',
    INTEGER:    'Integer',
    TRUE_FALSE: 'True / False',
  };
  return [
    '━━━━━━━━━━━━━━━━━━━━━━',
    '✅ <b>Question Uploaded Successfully</b>',
    '',
    '🆔 <b>Question ID</b>',
    `<code>${params.questionId}</code>`,
    '',
    `📚 <b>Subject</b>   ${params.subjectName}`,
    `📖 <b>Chapter</b>   ${params.chapterName}`,
    `📝 <b>Topic</b>     ${params.topicName}`,
    `🔢 <b>Type</b>      ${LABEL[params.questionType]}`,
    '',
    `📊 <b>Today's Uploads</b>   ${params.todayCount}`,
    `⏱ <b>Duration</b>          ${params.durationMs}ms`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
  ].join('\n');
}

// ── Create-chapter flow ───────────────────────────────────────────────────────

async function startCreateChapter(ctx: BotContext): Promise<void> {
  if (!ctx.session.subjectId) {
    await safeEdit(ctx, '📍 Please select a subject first. Send /start.');
    return;
  }
  ctx.session.step = 'CREATING_CHAPTER';
  await safeEdit(
    ctx,
    `📚 <b>${ctx.session.subjectName}</b>\n\n📝 Type the name for the new chapter:`,
    { parse_mode: 'HTML' },
  );
}

async function handleCreateChapterText(ctx: BotContext, text: string): Promise<void> {
  const name = text.trim();
  if (!name) {
    await ctx.reply('❌ Chapter name cannot be empty. Type a name or send /cancel to abort.');
    return;
  }
  if (name.length > 100) {
    await ctx.reply('❌ Chapter name is too long (max 100 characters). Please try a shorter name:');
    return;
  }

  const { subjectId } = ctx.session;
  if (!subjectId) {
    ctx.session.step = undefined;
    await ctx.reply('⚠️ Session expired. Send /start to begin.');
    return;
  }

  try {
    const chapter = await createChapterInBot(subjectId, name);
    ctx.session.chapterId   = chapter.id;
    ctx.session.chapterName = chapter.name;
    ctx.session.topicId     = undefined;
    ctx.session.topicName   = undefined;
    // Immediately flow into topic creation — the new chapter has no topics yet
    ctx.session.step = 'CREATING_TOPIC';
    await ctx.reply(
      `✅ <b>Chapter created: ${chapter.name}</b>\n\n📝 Now type a name for the first topic:`,
      { parse_mode: 'HTML' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create chapter.';
    await ctx.reply(`❌ ${msg}\n\nTry a different name or send /cancel to abort.`);
  }
}

// ── Create-topic flow ─────────────────────────────────────────────────────────

async function startCreateTopic(ctx: BotContext): Promise<void> {
  if (!ctx.session.chapterId) {
    await safeEdit(ctx, '📍 Please select a chapter first. Send /start.');
    return;
  }
  ctx.session.step = 'CREATING_TOPIC';
  await safeEdit(
    ctx,
    `📖 <b>${ctx.session.chapterName}</b>\n\n📝 Type the name for the new topic:`,
    { parse_mode: 'HTML' },
  );
}

async function handleCreateTopicText(ctx: BotContext, text: string): Promise<void> {
  const name = text.trim();
  if (!name) {
    await ctx.reply('❌ Topic name cannot be empty. Type a name or send /cancel to abort.');
    return;
  }
  if (name.length > 100) {
    await ctx.reply('❌ Topic name is too long (max 100 characters). Please try a shorter name:');
    return;
  }

  const { chapterId } = ctx.session;
  if (!chapterId) {
    ctx.session.step = undefined;
    await ctx.reply('⚠️ Session expired. Send /start to begin.');
    return;
  }

  try {
    const topic = await createTopicInBot(chapterId, name);
    ctx.session.topicId   = topic.id;
    ctx.session.topicName = topic.name;
    ctx.session.step      = undefined;
    await showReady(ctx);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create topic.';
    await ctx.reply(`❌ ${msg}\n\nTry a different name or send /cancel to abort.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function confirmUpload(ctx: BotContext): Promise<void> {
  // ── Re-entry guard ────────────────────────────────────────────────────────────
  // Prevents double-tap race: if the teacher presses Upload twice in quick
  // succession, the second callback sees the locked step and is rejected.
  if (ctx.session.step === 'UPLOADING_IN_PROGRESS') {
    await ctx.reply('⏳ Upload already in progress. Please wait until it completes.', { parse_mode: 'HTML' });
    return;
  }

  const {
    teacherId, topicId, fileId, fileUniqueId,
    questionType, correctAnswer,
    subjectName, chapterName, topicName,
  } = ctx.session;

  // Defensive guard — UI gates prevent reaching here without these set
  if (!teacherId || !topicId || !fileId || !questionType || !correctAnswer) {
    await safeEdit(ctx, '⚠️ Upload data is incomplete. Please send the photo again.');
    ctx.session = clearUploadFlow(ctx.session);
    return;
  }

  const telegramId = ctx.from!.id.toString();

  // ── Lock state immediately ────────────────────────────────────────────────────
  // Flush to Redis NOW, before any network call.  Any concurrent webhook
  // delivery that loads the session will see UPLOADING_IN_PROGRESS and abort.
  ctx.session.step = 'UPLOADING_IN_PROGRESS';
  await setSession(telegramId, ctx.session);

  // ── Rate limit: 20 uploads / 60 s per teacher ────────────────────────────────
  const rateLimit = await checkUploadRateLimit(teacherId);
  if (!rateLimit.allowed) {
    uploadMetrics.recordRateLimited();
    ctx.session = clearUploadFlow(ctx.session); // release the lock
    await ctx.reply(
      `⏱ <b>Upload limit reached</b>\n\nYou can upload up to 20 photos per minute.\nPlease wait <b>${rateLimit.resetInSeconds}s</b> and try again.`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  const uploadId = randomUUID();
  const startMs  = Date.now();

  // ── Stage 1: Download ─────────────────────────────────────────────────────────
  await safeEdit(ctx, '📥 <b>Downloading image...</b>', { parse_mode: 'HTML' });

  let imageStream: NodeJS.ReadableStream;
  try {
    imageStream = await telegramAdapter.download(fileId);
  } catch (err) {
    logger.error('TELEGRAM_DOWNLOAD_FAILED', {
      uploadId, teacherId, telegramUserId: telegramId, topicId,
      durationMs: Date.now() - startMs,
      error: err instanceof Error ? err.message : String(err),
    });
    await safeEdit(
      ctx,
      '❌ <b>Image download failed.</b>\n\nCould not retrieve the photo. Please resend it.',
      { parse_mode: 'HTML' },
    );
    ctx.session = clearUploadFlow(ctx.session);
    return;
  }

  // ── Stage 2: Upload pipeline (compress → Cloudinary → DB) ────────────────────
  // Retries Cloudinary failures exactly once with a fresh stream.
  await safeEdit(ctx, '🗜 <b>Compressing · ☁️ Uploading · 💾 Saving...</b>', { parse_mode: 'HTML' });

  const buildRequest = (stream: NodeJS.ReadableStream, id: string): UploadRequest => ({
    context: { uploadId: id, teacherId, topicId, uploadSource: 'TELEGRAM', timestamp: new Date() },
    imageStream:   stream,
    questionType,
    correctAnswer,
  });

  const runUpload = async (): Promise<UploadResult> => {
    try {
      return await uploadService.upload(buildRequest(imageStream, uploadId));
    } catch (err) {
      if (!(err instanceof UploadCloudinaryError)) throw err;

      // Single retry for transient Cloudinary failures
      uploadMetrics.recordRetry();
      logger.warn('TELEGRAM_CLOUDINARY_RETRY', { uploadId, teacherId, telegramUserId: telegramId });
      await safeEdit(ctx, '☁️ <b>Cloud upload failed. Retrying once...</b>', { parse_mode: 'HTML' });
      await new Promise(r => setTimeout(r, 1500));

      const retryStream = await telegramAdapter.download(fileId);
      await safeEdit(ctx, '🗜 <b>Retrying: Compressing · ☁️ Uploading · 💾 Saving...</b>', { parse_mode: 'HTML' });
      return uploadService.upload(buildRequest(retryStream, randomUUID()));
    }
  };

  let result: UploadResult;
  try {
    result = await runUpload();
  } catch (err) {
    const durationMs = Date.now() - startMs;
    logger.error('TELEGRAM_UPLOAD_FAILED', {
      uploadId, teacherId, telegramUserId: telegramId, topicId,
      durationMs, error: err instanceof Error ? err.message : String(err),
    });
    await safeEdit(ctx, classifyUploadError(err), { parse_mode: 'HTML' });
    ctx.session = clearUploadFlow(ctx.session);
    return;
  }

  const durationMs = Date.now() - startMs;
  logger.info('TELEGRAM_UPLOAD_SUCCESS', {
    uploadId, teacherId, telegramUserId: telegramId, topicId,
    questionId: result.questionId, durationMs,
  });

  // ── Success ───────────────────────────────────────────────────────────────────
  ctx.session = clearUploadFlow(ctx.session); // clears lock + upload fields

  // Record dedup key so re-sending the same photo warns the teacher
  if (fileUniqueId) {
    await markUploaded(fileUniqueId, result.questionId).catch(() => {});
  }

  const todayCount = await countTodayUploads(teacherId).catch(() => 0);
  await safeEdit(
    ctx,
    buildSuccessMessage({
      questionId:  result.questionId,
      subjectName: subjectName ?? '—',
      chapterName: chapterName ?? '—',
      topicName:   topicName   ?? '—',
      questionType,
      todayCount,
      durationMs,
    }),
    { parse_mode: 'HTML' },
  );

  await ctx.reply(
    '📸 Ready for the next question. Send a photo to continue.',
    { reply_markup: changeContextKeyboard(ctx.session).reply_markup },
  );
}

async function cancelUpload(ctx: BotContext): Promise<void> {
  ctx.session = clearUploadFlow(ctx.session);
  await safeEdit(ctx, '🚫 Upload cancelled.');

  if (ctx.session.topicId) {
    await ctx.reply('📸 Send a photo to start a new upload.', {
      reply_markup: changeContextKeyboard(ctx.session).reply_markup,
    });
  }
}

// Proceed despite duplicate warning — show type-selection keyboard
async function forceUpload(ctx: BotContext): Promise<void> {
  if (!ctx.session.fileId) {
    await safeEdit(ctx, '⚠️ Session expired. Please send the photo again.');
    return;
  }
  await safeEdit(
    ctx,
    '🖼 <b>Uploading anyway.</b>\n\nSelect the question type:',
    { parse_mode: 'HTML', reply_markup: questionTypeKeyboard().reply_markup },
  );
}

// ── Exported command handlers ──────────────────────────────────────────────────

export async function handleStart(ctx: BotContext): Promise<void> {
  // ── Token-based Telegram linking ──────────────────────────────────────────────
  // Handles the deep-link flow: teacher taps a link from the web admin that
  // opens the bot with /start <token>.  The token is one-time-use and expires
  // after 15 minutes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = (ctx as any).startPayload as string | undefined;

  if (!ctx.session.teacherId) {
    if (!payload) {
      await ctx.reply(
        '👋 <b>Welcome to Question Warehouse!</b>\n\n' +
        '🔗 Your Telegram account isn\'t linked yet.\n\n' +
        '1️⃣ Log in to the <b>web admin panel</b>\n' +
        '2️⃣ Go to <b>Profile → Link Telegram</b>\n' +
        '3️⃣ Tap the generated link to open this bot\n\n' +
        'Once linked, send /start to begin uploading questions.',
        { parse_mode: 'HTML' },
      );
      return;
    }

    const teacherId = await consumeLinkToken(payload);
    if (!teacherId) {
      await ctx.reply(
        '❌ <b>Link expired or invalid.</b>\n\n' +
        'Please generate a new link from the web admin panel.',
        { parse_mode: 'HTML' },
      );
      return;
    }

    const telegramUserId = ctx.from!.id.toString();
    try {
      const teacher = await linkTeacherToTelegram(teacherId, telegramUserId);
      ctx.session.teacherId = teacher.id;
      logger.info('TELEGRAM_TEACHER_LINKED_VIA_TOKEN', { teacherId, telegramUserId });
      await ctx.reply(
        `✅ <b>Account linked!</b>\n\nWelcome, <b>${teacher.username}</b>! 🎉\n\n` +
        'Send /start to begin uploading questions.',
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      logger.error('TELEGRAM_LINK_FAILED', {
        teacherId,
        telegramUserId,
        error: err instanceof Error ? err.message : String(err),
      });
      await ctx.reply(
        '❌ <b>Linking failed.</b>\n\n' +
        (err instanceof Error ? err.message : 'An unexpected error occurred.') +
        '\n\nPlease contact the administrator.',
        { parse_mode: 'HTML' },
      );
    }
    return;
  }

  // ── Normal /start flow for linked teachers ────────────────────────────────────
  const { subjectId, chapterId, topicId } = ctx.session;

  if (topicId) {
    await showReady(ctx);
    return;
  }

  if (chapterId) {
    const topics = await getTopicsByChapter(chapterId);
    await ctx.reply(
      `📖 <b>${ctx.session.chapterName}</b>\n\nSelect a topic:`,
      { parse_mode: 'HTML', reply_markup: topicKeyboard(topics, 0).reply_markup },
    );
    return;
  }

  if (subjectId) {
    const chapters = await getChaptersBySubject(subjectId);
    await ctx.reply(
      `📚 <b>${ctx.session.subjectName}</b>\n\nSelect a chapter:`,
      { parse_mode: 'HTML', reply_markup: chapterKeyboard(chapters, 0).reply_markup },
    );
    return;
  }

  const subjects = await getSubjects();
  if (!subjects.length) {
    await ctx.reply('📭 No subjects found. Please ask the administrator to add subjects first.');
    return;
  }

  await ctx.reply(
    '👋 <b>Welcome to Question Warehouse!</b>\n\n📚 Select a subject to begin:',
    { parse_mode: 'HTML', reply_markup: subjectKeyboard(subjects, 0).reply_markup },
  );
}

export async function handleHelp(ctx: BotContext): Promise<void> {
  await ctx.reply(
    '📖 <b>Question Warehouse — Help</b>\n\n' +
    '<b>How to upload a question:</b>\n' +
    '1️⃣  Select Subject → Chapter → Topic\n' +
    '     (tap <b>➕ New Chapter</b> or <b>➕ New Topic</b> to create)\n' +
    '2️⃣  Send a photo of the question\n' +
    '3️⃣  Choose the question type\n' +
    '4️⃣  Type the correct answer\n' +
    '5️⃣  Review and confirm the upload\n\n' +
    '<b>Commands:</b>\n' +
    '/start — Main menu / resume navigation\n' +
    '/current — Show current subject / chapter / topic\n' +
    '/change — Change subject, chapter, or topic\n' +
    '/cancel — Cancel an in-progress upload or creation\n' +
    '/cleanup — Retry orphaned upload jobs (Admin)\n' +
    '/help — This message',
    { parse_mode: 'HTML' },
  );
}

export async function handleCleanup(ctx: BotContext): Promise<void> {
  await ctx.reply('🔍 Scanning for orphaned upload jobs...');
  try {
    const result = await runCleanup();
    if (result.found === 0) {
      await ctx.reply('✅ No orphaned jobs found. Everything is clean!');
      return;
    }
    await ctx.reply(
      `🧹 <b>Cleanup Complete</b>\n\n` +
      `📊 Found:    ${result.found}\n` +
      `✅ Resolved: ${result.resolved}\n` +
      `❌ Failed:   ${result.failed}` +
      (result.failed > 0 ? '\n\n⚠️ Some jobs could not be resolved. Check server logs.' : ''),
      { parse_mode: 'HTML' },
    );
  } catch (err) {
    logger.error('TELEGRAM_CLEANUP_ERROR', {
      teacherId: ctx.session.teacherId,
      error: err instanceof Error ? err.message : String(err),
    });
    await ctx.reply('❌ Cleanup failed. Check the server logs for details.');
  }
}

export async function handleCurrent(ctx: BotContext): Promise<void> {
  const { subjectName, chapterName, topicName } = ctx.session;

  if (!subjectName) {
    await ctx.reply('📭 No selection made yet.\n\nSend /start to choose Subject → Chapter → Topic.');
    return;
  }

  await ctx.reply(
    [
      '📍 <b>Current Selection</b>',
      '',
      `📚 <b>Subject:</b>  ${subjectName}`,
      `📖 <b>Chapter:</b>  ${chapterName ?? '—'}`,
      `📝 <b>Topic:</b>    ${topicName ?? '—'}`,
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: changeContextKeyboard(ctx.session).reply_markup },
  );
}

export async function handleChange(ctx: BotContext): Promise<void> {
  if (!ctx.session.subjectId) {
    await ctx.reply('📭 Nothing selected yet.\n\nSend /start to choose Subject → Chapter → Topic.');
    return;
  }

  await ctx.reply(
    '🔄 <b>What would you like to change?</b>',
    { parse_mode: 'HTML', reply_markup: changeContextKeyboard(ctx.session).reply_markup },
  );
}

export async function handleCancel(ctx: BotContext): Promise<void> {
  const { step } = ctx.session;

  if (!step) {
    await ctx.reply('ℹ️ No active operation to cancel.');
    return;
  }

  const isCreateFlow = step === 'CREATING_CHAPTER' || step === 'CREATING_TOPIC';
  ctx.session = clearUploadFlow(ctx.session);
  await ctx.reply(isCreateFlow ? '🚫 Creation cancelled.' : '🚫 Upload cancelled.');

  if (ctx.session.topicId) {
    await showReady(ctx);
  }
}

// ── Photo handler ─────────────────────────────────────────────────────────────

export async function handlePhoto(ctx: BotContext): Promise<void> {
  // Guard: user is mid-way through naming a new chapter or topic
  if (ctx.session.step === 'CREATING_CHAPTER' || ctx.session.step === 'CREATING_TOPIC') {
    const what = ctx.session.step === 'CREATING_CHAPTER' ? 'chapter' : 'topic';
    await ctx.reply(`📝 Please type the ${what} name first, or send /cancel to abort.`);
    return;
  }

  if (!ctx.session.topicId) {
    const subjects = await getSubjects();
    await ctx.reply(
      '📍 Please select a topic before sending a photo.\n\n📚 Select a subject first:',
      { reply_markup: subjectKeyboard(subjects, 0).reply_markup },
    );
    return;
  }

  // Extract the highest-resolution variant Telegram provides
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photos = (ctx.message as any)?.photo as Array<{ file_id: string; file_unique_id: string }> | undefined;
  if (!photos?.length) {
    await ctx.reply('⚠️ Could not read the photo. Please try again.');
    return;
  }

  const largest = photos[photos.length - 1];

  // Store file references — NOT downloading yet (adapter does that in confirmUpload)
  ctx.session.step         = 'AWAITING_TYPE';
  ctx.session.fileId       = largest.file_id;
  ctx.session.fileUniqueId = largest.file_unique_id;
  // Clear any previous answer from a prior flow
  ctx.session.questionType  = undefined;
  ctx.session.correctAnswer = undefined;

  // Duplicate check — warn if the same file was uploaded in the last 24 h
  const existingQuestionId = await checkDuplicate(largest.file_unique_id).catch(() => null);
  if (existingQuestionId) {
    uploadMetrics.recordDuplicate();
    await ctx.reply(
      `⚠️ <b>Duplicate Image Detected</b>\n\n` +
      `This photo was previously uploaded as:\n<code>${existingQuestionId}</code>\n\n` +
      `Do you want to upload it again anyway?`,
      { parse_mode: 'HTML', reply_markup: duplicateWarningKeyboard().reply_markup },
    );
    return;
  }

  await ctx.reply(
    '🖼 <b>Image received!</b>\n\nSelect the question type:',
    { parse_mode: 'HTML', reply_markup: questionTypeKeyboard().reply_markup },
  );
}

// ── Text handler (answer input) ───────────────────────────────────────────────

export async function handleText(ctx: BotContext): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (ctx.message as any)?.text as string | undefined;
  if (!text || text.startsWith('/')) return; // commands handled separately

  const { step, questionType } = ctx.session;

  // Create flows take priority — user is typing a name, not an answer
  if (step === 'CREATING_CHAPTER') { await handleCreateChapterText(ctx, text); return; }
  if (step === 'CREATING_TOPIC')   { await handleCreateTopicText(ctx, text);   return; }

  if (step !== 'AWAITING_ANSWER' || !questionType) {
    if (!ctx.session.topicId) {
      await ctx.reply('📍 Please select a topic first.\n\nSend /start to begin.');
    } else {
      await ctx.reply('📸 Send a question photo to start an upload.');
    }
    return;
  }

  // Use the canonical validator from ValidationService
  const error = validateAnswerOrNull(questionType, text);
  if (error) {
    await ctx.reply(
      `❌ <b>Invalid answer format</b>\n\n${error}\n\n${getAnswerFormatHint(questionType)}`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  ctx.session.correctAnswer = normalizeAnswer(questionType, text);
  ctx.session.step          = 'CONFIRMING';

  await ctx.reply(buildSummary(ctx.session), {
    parse_mode:   'HTML',
    reply_markup: confirmKeyboard().reply_markup,
  });
}

// ── Callback query dispatcher ─────────────────────────────────────────────────

export async function handleCallback(ctx: BotContext): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (ctx.callbackQuery as any)?.data as string | undefined;
  if (!data) return;

  // Dismiss the spinner immediately so the UI feels responsive
  await ctx.answerCbQuery().catch(() => {});

  // Navigation — subjects
  if (data.startsWith('sel_sub:')) return selectSubject(ctx, data.slice(8));
  if (data.startsWith('pag_sub:')) return pageSubjects(ctx, parseInt(data.slice(8), 10));
  if (data === 'chg_sub')           return changeSubject(ctx);

  // Navigation — chapters
  if (data.startsWith('sel_cha:')) return selectChapter(ctx, data.slice(8));
  if (data.startsWith('pag_cha:')) return pageChapters(ctx, parseInt(data.slice(8), 10));
  if (data === 'chg_cha')           return changeChapter(ctx);
  if (data === 'crt_cha')           return startCreateChapter(ctx);

  // Navigation — topics
  if (data.startsWith('sel_top:')) return selectTopic(ctx, data.slice(8));
  if (data.startsWith('pag_top:')) return pageTopics(ctx, parseInt(data.slice(8), 10));
  if (data === 'chg_top')           return changeTopic(ctx);
  if (data === 'crt_top')           return startCreateTopic(ctx);

  // Upload flow
  if (data.startsWith('sel_typ:')) return selectType(ctx, data.slice(8) as UploadQuestionType);
  if (data === 'up_confirm')        return confirmUpload(ctx);
  if (data === 'up_cancel')         return cancelUpload(ctx);
  if (data === 'up_force')          return forceUpload(ctx);

  logger.warn('TELEGRAM_UNKNOWN_CALLBACK', { data, teacherId: ctx.session.teacherId });
}

// ── Helpdesk knowledge-base document upload ───────────────────────────────────
// Deliberately minimal: validate transport-level concerns (file type),
// download the bytes, and hand off to the RAG module's public API. No
// parsing/chunking/embedding logic belongs here — that's rag.service.ts's
// job, and this handler has no knowledge of how ingestion actually works.

export async function handleDocument(ctx: BotContext): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const document = (ctx.message as any)?.document as
    | { file_id: string; file_name?: string; mime_type?: string }
    | undefined;
  if (!document) return;

  if (document.mime_type !== 'application/pdf') {
    await ctx.reply('📄 Only PDF documents are accepted for the Scientia knowledge base.');
    return;
  }

  const filename = document.file_name ?? `document-${document.file_id}.pdf`;
  const teacherId = ctx.session.teacherId!;

  await ctx.reply(`📥 Received "${filename}" — processing...`);

  try {
    const buffer = await downloadTelegramFile(document.file_id);
    const record = await getRagService().ingestDocument({
      filename,
      buffer,
      source: `telegram:${teacherId}`,
    });

    await ctx.reply(
      `✅ "${filename}" ingested — version ${record.version}, ${record.chunkCount} chunk(s) indexed.`,
    );
  } catch (err) {
    logger.error('RAG_TELEGRAM_INGEST_FAILED', {
      teacherId,
      filename,
      error: err instanceof Error ? err.message : String(err),
    });
    const message = err instanceof Error ? err.message : 'Unknown error';
    await ctx.reply(`❌ Failed to ingest "${filename}": ${message}`);
  }
}
