import { createHash } from 'node:crypto';

/** Deterministic content hash — used for document checksums and chunk
 *  content hashes (duplicate detection, "did this content already get
 *  embedded" checks). */
export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}
