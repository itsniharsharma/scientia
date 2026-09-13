import { describe, it, expect, afterEach } from 'vitest';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileManifestStore } from '../../modules/rag/documents/manifest-store';
import type { DocumentRecord } from '../../modules/rag/core/types';

const testPath = join(tmpdir(), `rag-manifest-test-${Date.now()}.json`);

afterEach(async () => {
  await rm(testPath, { force: true });
  await rm(`${testPath}.tmp`, { force: true });
});

function record(): DocumentRecord {
  return {
    documentId: 'doc-1',
    filename: 'doc.pdf',
    checksum: 'abc',
    version: 1,
    status: 'active',
    source: 'telegram:t1',
    ingestedAt: new Date().toISOString(),
    parserVersion: 'v1',
    chunkerVersion: 'v1',
    embeddingModel: 'voyage-4-lite',
    chunkCount: 1,
    chunkIds: ['c1'],
  };
}

describe('FileManifestStore', () => {
  it('returns an empty array when no manifest file exists yet', async () => {
    const store = new FileManifestStore(testPath);
    expect(await store.load()).toEqual([]);
  });

  it('round-trips saved records', async () => {
    const store = new FileManifestStore(testPath);
    await store.save([record()]);
    const loaded = await store.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].documentId).toBe('doc-1');
  });

  it('creates the containing directory if it does not exist', async () => {
    const nestedDir = join(tmpdir(), `rag-manifest-nested-${Date.now()}`);
    const store = new FileManifestStore(join(nestedDir, 'manifest.json'));
    await store.save([record()]);
    expect(await store.load()).toHaveLength(1);
    await rm(nestedDir, { recursive: true, force: true }).catch(() => {});
  });
});
