import { describe, it, expect } from 'vitest';
import {
  deriveDocumentId,
  findActiveVersion,
  findDuplicate,
  nextVersionNumber,
  activateNewVersion,
} from '../../modules/rag/documents/versioning';
import type { DocumentRecord } from '../../modules/rag/core/types';

function record(overrides: Partial<DocumentRecord>): DocumentRecord {
  return {
    documentId: 'scientia-docs',
    filename: 'scientia-docs.pdf',
    checksum: 'checksum-1',
    version: 1,
    status: 'active',
    source: 'telegram:teacher-1',
    ingestedAt: new Date().toISOString(),
    parserVersion: 'v1',
    chunkerVersion: 'v1',
    embeddingModel: 'voyage-4-lite',
    chunkCount: 5,
    chunkIds: ['c1', 'c2', 'c3', 'c4', 'c5'],
    ...overrides,
  };
}

describe('deriveDocumentId', () => {
  it('normalizes filename casing, extension, and punctuation into a stable id', () => {
    expect(deriveDocumentId('Scientia Documentation.pdf')).toBe('scientia-documentation');
    expect(deriveDocumentId('scientia_documentation.PDF')).toBe('scientia-documentation');
  });

  it('is deterministic for the same filename', () => {
    expect(deriveDocumentId('Pricing Guide.pdf')).toBe(deriveDocumentId('Pricing Guide.pdf'));
  });
});

describe('findDuplicate', () => {
  it('detects an identical checksum for the same document as a duplicate', () => {
    const records = [record({})];
    expect(findDuplicate(records, 'scientia-docs', 'checksum-1')).toBeDefined();
  });

  it('does not treat a different checksum as a duplicate (this is a new version)', () => {
    const records = [record({})];
    expect(findDuplicate(records, 'scientia-docs', 'checksum-2')).toBeUndefined();
  });

  it('ignores failed records when checking for duplicates', () => {
    const records = [record({ status: 'failed' })];
    expect(findDuplicate(records, 'scientia-docs', 'checksum-1')).toBeUndefined();
  });
});

describe('nextVersionNumber', () => {
  it('starts at 1 for a brand new document', () => {
    expect(nextVersionNumber([], 'new-doc')).toBe(1);
  });

  it('increments from the highest existing version', () => {
    const records = [record({ version: 1, status: 'superseded' }), record({ version: 2 })];
    expect(nextVersionNumber(records, 'scientia-docs')).toBe(3);
  });
});

describe('activateNewVersion', () => {
  it('marks the previously active version as superseded and adds the new one as active', () => {
    const oldRecord = record({ version: 1 });
    const newRecord = record({ version: 2, checksum: 'checksum-2', chunkIds: ['c6'] });

    const updated = activateNewVersion([oldRecord], newRecord);

    expect(updated).toHaveLength(2);
    expect(updated.find((r) => r.version === 1)?.status).toBe('superseded');
    expect(updated.find((r) => r.version === 2)?.status).toBe('active');
    expect(findActiveVersion(updated, 'scientia-docs')?.version).toBe(2);
  });

  it('never leaves two active versions of the same document', () => {
    const updated = activateNewVersion([record({ version: 1 })], record({ version: 2, chunkIds: ['c6'] }));
    const activeCount = updated.filter((r) => r.documentId === 'scientia-docs' && r.status === 'active').length;
    expect(activeCount).toBe(1);
  });

  it('does not affect an unrelated document\'s active version', () => {
    const other = record({ documentId: 'other-doc', filename: 'other-doc.pdf' });
    const updated = activateNewVersion([other, record({ version: 1 })], record({ version: 2, chunkIds: ['c6'] }));
    expect(findActiveVersion(updated, 'other-doc')?.status).toBe('active');
  });
});
