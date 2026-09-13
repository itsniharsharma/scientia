import { describe, it, expect } from 'vitest';
import { sha256 } from '../../modules/rag/core/hash';

describe('sha256', () => {
  it('is deterministic for identical input', () => {
    expect(sha256('hello world')).toBe(sha256('hello world'));
  });

  it('differs for different input', () => {
    expect(sha256('hello world')).not.toBe(sha256('hello world!'));
  });

  it('works identically for a Buffer and its equivalent string', () => {
    expect(sha256(Buffer.from('scientia'))).toBe(sha256('scientia'));
  });
});
