import { Markup } from 'telegraf';
import type { CatalogSubject, CatalogChapter, CatalogTopic } from './telegram.catalog';
import type { TelegramSession } from './telegram.types';

const PAGE_SIZE = 8;

type InlineKB = ReturnType<typeof Markup.inlineKeyboard>;

// ── Pagination helper ─────────────────────────────────────────────────────────

function paginatedRows<T extends { id: string; name: string }>(
  items:        T[],
  page:         number,
  selectPrefix: string,
  pagePrefix:   string,
): ReturnType<typeof Markup.button.callback>[][] {
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const p          = Math.max(0, Math.min(page, totalPages - 1));
  const slice      = items.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);

  const rows: ReturnType<typeof Markup.button.callback>[][] = [];

  // 2 items per row
  for (let i = 0; i < slice.length; i += 2) {
    const row = [Markup.button.callback(slice[i].name, `${selectPrefix}:${slice[i].id}`)];
    if (slice[i + 1]) {
      row.push(Markup.button.callback(slice[i + 1].name, `${selectPrefix}:${slice[i + 1].id}`));
    }
    rows.push(row);
  }

  const navRow: ReturnType<typeof Markup.button.callback>[] = [];
  if (p > 0)               navRow.push(Markup.button.callback('◀ Prev', `${pagePrefix}:${p - 1}`));
  if (p < totalPages - 1)  navRow.push(Markup.button.callback('Next ▶', `${pagePrefix}:${p + 1}`));
  if (navRow.length)        rows.push(navRow);

  return rows;
}

// ── Subject picker ────────────────────────────────────────────────────────────

export function subjectKeyboard(subjects: CatalogSubject[], page = 0): InlineKB {
  const rows = paginatedRows(subjects, page, 'sel_sub', 'pag_sub');
  return Markup.inlineKeyboard(rows);
}

// ── Chapter picker ────────────────────────────────────────────────────────────

export function chapterKeyboard(chapters: CatalogChapter[], page = 0): InlineKB {
  const rows = paginatedRows(chapters, page, 'sel_cha', 'pag_cha');
  rows.push([Markup.button.callback('➕ New Chapter', 'crt_cha')]);
  rows.push([Markup.button.callback('↩ Change Subject', 'chg_sub')]);
  return Markup.inlineKeyboard(rows);
}

// ── Topic picker ──────────────────────────────────────────────────────────────

export function topicKeyboard(topics: CatalogTopic[], page = 0): InlineKB {
  const rows = paginatedRows(topics, page, 'sel_top', 'pag_top');
  rows.push([Markup.button.callback('➕ New Topic', 'crt_top')]);
  rows.push([Markup.button.callback('↩ Change Chapter', 'chg_cha')]);
  return Markup.inlineKeyboard(rows);
}

// ── Question-type picker ──────────────────────────────────────────────────────

export function questionTypeKeyboard(): InlineKB {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔵 Single Correct',   'sel_typ:SINGLE')],
    [Markup.button.callback('🟢 Multiple Correct', 'sel_typ:MULTI')],
    [Markup.button.callback('🔢 Integer',          'sel_typ:INTEGER')],
    [Markup.button.callback('✅ True / False',     'sel_typ:TRUE_FALSE')],
    [Markup.button.callback('❌ Cancel Upload',    'up_cancel')],
  ]);
}

// ── Upload confirmation ───────────────────────────────────────────────────────

export function confirmKeyboard(): InlineKB {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🚀 Upload',   'up_confirm'),
      Markup.button.callback('❌ Cancel',   'up_cancel'),
    ],
  ]);
}

// ── Duplicate warning ─────────────────────────────────────────────────────────

export function duplicateWarningKeyboard(): InlineKB {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('⚠️ Upload Anyway', 'up_force'),
      Markup.button.callback('❌ Cancel',         'up_cancel'),
    ],
  ]);
}

// ── Context-change keyboard (shown when topic is already set) ─────────────────

export function changeContextKeyboard(session: TelegramSession): InlineKB {
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  rows.push([Markup.button.callback('📚 Change Subject', 'chg_sub')]);
  if (session.subjectId) {
    rows.push([Markup.button.callback('📖 Change Chapter', 'chg_cha')]);
  }
  if (session.chapterId) {
    rows.push([Markup.button.callback('📝 Change Topic', 'chg_top')]);
  }
  return Markup.inlineKeyboard(rows);
}
