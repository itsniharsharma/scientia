import type { DocumentRecord } from '../core/types';

/** A document's identity is its (normalized) filename — re-uploading the
 *  same filename is treated as a new version of the same document;
 *  uploading a different filename is a brand new document. This is the
 *  natural identity for a Telegram-uploaded documentation PDF, where
 *  there's no separate document-management UI to assign IDs explicitly. */
export function deriveDocumentId(filename: string): string {
  return filename
    .toLowerCase()
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findActiveVersion(records: DocumentRecord[], documentId: string): DocumentRecord | undefined {
  return records.find((r) => r.documentId === documentId && r.status === 'active');
}

/** Exact-duplicate detection: same document, same content, already active —
 *  reprocessing would be pure waste. */
export function findDuplicate(records: DocumentRecord[], documentId: string, checksum: string): DocumentRecord | undefined {
  return records.find((r) => r.documentId === documentId && r.checksum === checksum && r.status !== 'failed');
}

export function nextVersionNumber(records: DocumentRecord[], documentId: string): number {
  const versions = records.filter((r) => r.documentId === documentId).map((r) => r.version);
  return versions.length === 0 ? 1 : Math.max(...versions) + 1;
}

/** Pure transformation: marks any previously-active version of this
 *  document as superseded and appends the new record as active. Does not
 *  perform any I/O itself — pipeline.ts sequences this against the vector
 *  store so old chunks are only removed after the new version's chunks are
 *  confirmed persisted (never a window with zero valid chunks). */
export function activateNewVersion(records: DocumentRecord[], newRecord: DocumentRecord): DocumentRecord[] {
  const updated = records.map((r) =>
    r.documentId === newRecord.documentId && r.status === 'active' ? { ...r, status: 'superseded' as const } : r,
  );
  return [...updated, newRecord];
}
