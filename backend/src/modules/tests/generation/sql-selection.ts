import { prisma } from '../../../lib/prisma';

/**
 * Database-side reproduction of fairness.algorithm.ts's computeFairnessScore
 * + selectQuestionIds, so Postgres returns only the requested top-N question
 * IDs instead of every published candidate in the topic set.
 *
 * Behavioral parity with the JS reference (fairness.algorithm.ts) — same
 * selected IDs, same ordering — is established in
 * src/test/generation-sql-parity.test.ts, including against real production
 * data. One known, evidenced, and inert difference remains: Postgres's
 * EXTRACT(EPOCH FROM interval) recency computation can round to an adjacent
 * IEEE754 double (1 ULP) differently than JS's millisecond-integer
 * subtraction, in ~10% of cases. Proven not to affect ranking or the
 * selected set (see the differential test suite) — this is a documented,
 * accepted residual, not a defect.
 *
 * Toggle: FAIRNESS_SELECTION_MODE=sql opts into this path (mirrors the
 * existing TELEGRAM_MODE env-var convention). Default (unset, or any other
 * value) keeps the original all-candidates-into-Node JS path unchanged.
 *
 * FNV-1a and xorshift32 are reproduced bit-exact (verified against the JS
 * implementation across hundreds of cases): FNV-1a via a per-row recursive
 * CTE (ASCII-only input — question IDs are UUIDs, so JS's charCodeAt and
 * SQL's ascii() agree exactly); xorshift32 via explicit bigint arithmetic
 * with 32-bit masking after every step, since Postgres's native bigint
 * shift operators do NOT truncate to 32 bits the way JS's do — verified
 * empirically, not assumed. The one sign-sensitive step (x >> 17, JS's
 * arithmetic right shift) is reproduced by explicitly reinterpreting the
 * 32-bit unsigned bit pattern as signed before applying Postgres's native
 * bigint >>, which was empirically confirmed to floor-shift correctly.
 */
export async function selectTopNIdsViaSql(
  topicIds: string[],
  count: number,
  seed: number,
  now: Date,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT q.id
    FROM questions q
    CROSS JOIN LATERAL (
      WITH RECURSIVE fnv(i, h) AS (
        SELECT 0, 2166136261::bigint
        UNION ALL
        SELECT i + 1, ((h # ascii(substring(q.id::text FROM i + 1 FOR 1))) * 16777619) & 4294967295
        FROM fnv WHERE i < length(q.id::text)
      )
      SELECT h AS qhash FROM fnv WHERE i = length(q.id::text)
    ) AS hash_calc
    CROSS JOIN LATERAL (
      WITH n AS (SELECT ((${seed}::bigint # hash_calc.qhash) & 4294967295) AS v),
      x0 AS (SELECT (CASE WHEN v = 0 THEN 1 ELSE v END) AS v FROM n),
      x1 AS (SELECT (v # ((v * 8192) & 4294967295)) & 4294967295 AS v FROM x0),
      x1s AS (SELECT CASE WHEN v >= 2147483648 THEN v - 4294967296 ELSE v END AS sv, v AS uv FROM x1),
      x2 AS (SELECT (uv # ((sv >> 17) & 4294967295)) & 4294967295 AS v FROM x1s),
      x3 AS (SELECT (v # ((v * 32) & 4294967295)) & 4294967295 AS v FROM x2)
      SELECT (v::double precision / 4294967296.0::double precision) AS jitter_raw FROM x3
    ) AS jitter_calc
    -- daysSince computed once here and reused twice in the recency formula
    -- below (numerator + denominator) — the original query computed
    -- EXTRACT(EPOCH FROM ...) twice per non-null-lastAppearedAt row; this is
    -- a pure algebraic reuse of the same value, not a formula change.
    CROSS JOIN LATERAL (
      SELECT CASE WHEN q."lastAppearedAt" IS NULL THEN NULL
        ELSE EXTRACT(EPOCH FROM (${now}::timestamptz - q."lastAppearedAt")) / 86400.0::double precision
      END AS days_since
    ) AS recency_calc
    WHERE q."topicId" = ANY(${topicIds}) AND q.status = 'PUBLISHED'::"QuestionStatus"
    ORDER BY (
      0.5::double precision * (1.0::double precision / (q."appearanceCount" + 1)::double precision)
      + 0.4::double precision * (
          CASE WHEN recency_calc.days_since IS NULL THEN 1.0::double precision
          ELSE recency_calc.days_since / (recency_calc.days_since + 30.0::double precision)
          END
        )
      + (jitter_calc.jitter_raw * 0.1::double precision)
    ) DESC
    LIMIT ${count}
  `;
  return rows.map((r) => r.id);
}
