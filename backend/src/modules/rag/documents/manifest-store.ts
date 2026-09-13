import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DocumentRecord } from '../core/types';

/** Persistent source of truth for which document versions exist and which
 *  is active — separate from the in-memory runtime layer built on top of
 *  it. A DB-backed implementation can replace FileManifestStore later
 *  without this interface changing. */
export interface ManifestStore {
  load(): Promise<DocumentRecord[]>;
  save(records: DocumentRecord[]): Promise<void>;
}

/** JSON-file-backed manifest. Appropriate at helpdesk scale (dozens of
 *  PDFs) — writes are atomic (write-to-temp-then-rename) so a crash
 *  mid-write can never leave a half-written manifest on disk. */
export class FileManifestStore implements ManifestStore {
  constructor(private readonly filePath: string) {}

  async load(): Promise<DocumentRecord[]> {
    try {
      const raw = await readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as DocumentRecord[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
  }

  async save(records: DocumentRecord[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(records, null, 2), 'utf-8');
    await rename(tempPath, this.filePath);
  }
}
