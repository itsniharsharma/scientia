import { describe, it, expect } from 'vitest';
import { validateJwtSecret, WeakJwtSecretError } from '../shared/validate-jwt-secret';

// ─── Regression tests for the production JWT_SECRET startup guard (SCI-01) ────
// Never asserts on or logs an actual secret value — only behavior (throws vs not).

const STRONG_SECRET = 'a'.repeat(48); // 48 random-looking chars, well over the 32 minimum

describe('validateJwtSecret — production environment', () => {
  it('does NOT throw for a strong, sufficiently long secret', () => {
    expect(() => validateJwtSecret(STRONG_SECRET, 'production')).not.toThrow();
  });

  it('throws when JWT_SECRET is missing', () => {
    expect(() => validateJwtSecret(undefined, 'production')).toThrow(WeakJwtSecretError);
    expect(() => validateJwtSecret('', 'production')).toThrow(WeakJwtSecretError);
  });

  it('throws for the project\'s own known placeholder value', () => {
    expect(() =>
      validateJwtSecret('replace-with-a-long-random-secret-min-32-chars', 'production'),
    ).toThrow(WeakJwtSecretError);
  });

  it('throws for other common placeholder patterns', () => {
    const placeholders = [
      'changeme-changeme-changeme-changeme',
      'your-secret-goes-here-your-secret-goes-here',
      'this-is-just-an-example-secret-value-here',
      'PLACEHOLDER_PLACEHOLDER_PLACEHOLDER_VALUE',
    ];
    for (const p of placeholders) {
      expect(() => validateJwtSecret(p, 'production')).toThrow(WeakJwtSecretError);
    }
  });

  it('throws for an obviously weak/short secret even if not a recognized placeholder', () => {
    expect(() => validateJwtSecret('short', 'production')).toThrow(WeakJwtSecretError);
    expect(() => validateJwtSecret('a'.repeat(31), 'production')).toThrow(WeakJwtSecretError); // one under the minimum
  });

  it('accepts a secret exactly at the minimum length boundary', () => {
    expect(() => validateJwtSecret('b'.repeat(32), 'production')).not.toThrow();
  });

  it('never includes the secret value in the thrown error message', () => {
    const secretValue = 'replace-with-a-long-random-secret-min-32-chars';
    try {
      validateJwtSecret(secretValue, 'production');
      throw new Error('expected validateJwtSecret to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(WeakJwtSecretError);
      expect((err as Error).message).not.toContain(secretValue);
    }
  });
});

describe('validateJwtSecret — development/test environments remain usable', () => {
  it('is a no-op for a missing secret outside production', () => {
    expect(() => validateJwtSecret(undefined, 'development')).not.toThrow();
    expect(() => validateJwtSecret(undefined, 'test')).not.toThrow();
  });

  it('is a no-op for the placeholder value outside production', () => {
    expect(() =>
      validateJwtSecret('replace-with-a-long-random-secret-min-32-chars', 'development'),
    ).not.toThrow();
  });

  it('does not reject the vitest fixture secret used by the rest of the suite', () => {
    // Matches vitest.config.ts's JWT_SECRET exactly — proves this guard cannot
    // break the existing test environment.
    expect(() => validateJwtSecret('test-secret-not-for-production', 'test')).not.toThrow();
  });

  it('is a no-op when NODE_ENV is unset', () => {
    expect(() => validateJwtSecret('short', undefined)).not.toThrow();
  });
});
