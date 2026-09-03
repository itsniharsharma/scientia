// Production-only startup guard against a missing/placeholder/weak JWT_SECRET.
// Scoped to NODE_ENV==='production' so local dev and the test suite's short
// fixture secret (vitest.config.ts) are unaffected — this only hardens the
// environment where a forgeable secret actually matters.

const MIN_LENGTH = 32;

// Heuristic, not exhaustive — catches this project's own placeholder
// ("replace-with-a-long-random-secret-min-32-chars") and common look-alikes.
// A real random secret is astronomically unlikely to match any of these.
const WEAK_PATTERNS: RegExp[] = [
  /replace.?with/i,
  /change.?me/i,
  /place.?holder/i,
  /your.?secret/i,
  /secret.?here/i,
  /example/i,
  /^test$/i,
  /^secret$/i,
  /^password$/i,
];

export class WeakJwtSecretError extends Error {}

/**
 * Throws WeakJwtSecretError when running with NODE_ENV=production and
 * JWT_SECRET is missing, too short, or matches a known placeholder pattern.
 * No-op outside production. Never includes the secret value in the error message.
 */
export function validateJwtSecret(secret: string | undefined, nodeEnv: string | undefined): void {
  if (nodeEnv !== 'production') return;

  if (!secret) {
    throw new WeakJwtSecretError('JWT_SECRET is not set');
  }
  if (secret.length < MIN_LENGTH) {
    throw new WeakJwtSecretError(
      `JWT_SECRET must be at least ${MIN_LENGTH} characters in production (received ${secret.length})`,
    );
  }
  if (WEAK_PATTERNS.some((re) => re.test(secret))) {
    throw new WeakJwtSecretError(
      'JWT_SECRET appears to be a placeholder/example value — set a real random secret in production',
    );
  }
}
