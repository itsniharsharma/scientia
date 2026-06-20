/**
 * Deterministic weighted fairness algorithm for question selection.
 *
 * Score formula (all components normalised to [0, 1]):
 *
 *   score = 0.50 × frequencyScore
 *         + 0.40 × recencyScore
 *         + 0.10 × jitter
 *
 * frequencyScore  = 1 / (appearanceCount + 1)
 *   → Unused questions score 1.0; heavily-used questions approach 0.
 *
 * recencyScore    = daysSince / (daysSince + HALF_LIFE)   [0 if never appeared → 1.0]
 *   → Sigmoid that grows toward 1.0 as questions age out of rotation.
 *   → HALF_LIFE = 30 days: a question last used 30 days ago scores 0.5.
 *
 * jitter          = deterministicNoise(seed XOR questionHash) × 0.10
 *   → Tiny deterministic noise to break ties and prevent identical selections
 *     across separate generation runs at the same second.
 *   → seed = floor(epoch ms / 60_000) XOR hash(teacherId) — changes each minute.
 */

const RECENCY_HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 86_400_000;

function hashString(s: string): number {
  // FNV-1a 32-bit
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

function xorshift32(n: number): number {
  // Returns deterministic float in [0, 1) from a 32-bit seed
  let x = (n >>> 0) || 1; // xorshift must not start at 0
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

export function computeFairnessScore(
  questionId: string,
  appearanceCount: number,
  lastAppearedAt: Date | null,
  generationSeed: number,
): number {
  // Component 1: frequency (heavily-used questions penalised)
  const frequencyScore = 1 / (appearanceCount + 1);

  // Component 2: recency (questions not seen recently get higher scores)
  let recencyScore: number;
  if (lastAppearedAt === null) {
    recencyScore = 1.0; // never appeared → maximum freshness
  } else {
    const daysSince = (Date.now() - lastAppearedAt.getTime()) / MS_PER_DAY;
    recencyScore = daysSince / (daysSince + RECENCY_HALF_LIFE_DAYS);
  }

  // Component 3: deterministic jitter (avoids identical selections across runs)
  const qHash = hashString(questionId);
  const jitter = xorshift32(generationSeed ^ qHash) * 0.1;

  return 0.5 * frequencyScore + 0.4 * recencyScore + jitter;
}

export function buildGenerationSeed(teacherId: string): number {
  // Changes every minute; XOR with teacher hash so different teachers
  // generating simultaneously get different jitter.
  const minuteBucket = Math.floor(Date.now() / 60_000);
  return minuteBucket ^ hashString(teacherId);
}

export function selectQuestionIds(
  candidates: Array<{
    id: string;
    appearanceCount: number;
    lastAppearedAt: Date | null;
  }>,
  count: number,
  seed: number,
): string[] {
  if (candidates.length <= count) {
    // Not enough candidates — return all (caller validates before reaching here)
    return candidates.map((q) => q.id);
  }

  const scored = candidates.map((q) => ({
    id: q.id,
    score: computeFairnessScore(q.id, q.appearanceCount, q.lastAppearedAt, seed),
  }));

  // Deterministic descending sort; stable on equal scores (same order in, same order out)
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.id);
}
