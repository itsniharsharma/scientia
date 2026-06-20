/**
 * Scientia E2E Teacher Flow Validation
 *
 * Prerequisites:
 *   1. Backend running:  npx tsx --env-file=.env backend/src/index.ts
 *   2. DB seeded:        npx tsx --env-file=.env apps/website/test/seed.ts
 *
 * Run:
 *   npx tsx --env-file=.env apps/website/test/e2e-teacher-flow.ts
 *
 * On subsequent runs (resets appearance counts for a clean validation):
 *   npx tsx --env-file=.env apps/website/test/e2e-teacher-flow.ts --reset
 *
 * Expected output: 17 assertions all passing, fairness rotation confirmed.
 */

import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = (process.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const RESET = process.argv.includes('--reset');
const prisma = new PrismaClient();

// ─── Console helpers ──────────────────────────────────────────────────────────

const C = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

type AssertionResult = { label: string; passed: boolean; detail: string };
const results: AssertionResult[] = [];

function assert(label: string, condition: boolean, detail = '') {
  results.push({ label, passed: condition, detail });
  const icon = condition ? C.green('✓') : C.red('✗');
  const detailStr = detail ? C.dim(`  (${detail})`) : '';
  console.log(`    ${icon} ${label}${detailStr}`);
  return condition;
}

function section(title: string) {
  console.log(`\n  ${C.bold(C.cyan('▶'))} ${C.bold(title)}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + C.bold('╔══════════════════════════════════════════════╗'));
  console.log(C.bold('║   Scientia E2E Teacher Flow Validation       ║'));
  console.log(C.bold('╚══════════════════════════════════════════════╝'));
  console.log(`\n  API URL : ${C.cyan(API_URL)}`);
  console.log(`  Mode    : ${RESET ? C.yellow('--reset (cleaning prior run data)') : 'standard'}\n`);

  // ── Optional reset ──────────────────────────────────────────────────────────
  if (RESET) {
    section('Pre-run Reset');

    // Delete any tests from this validation
    const deletedTests = await prisma.test.deleteMany({
      where: { name: { in: ['Hydrocarbons #01', 'Hydrocarbons #02'] } },
    });
    console.log(`    Deleted ${deletedTests.count} test(s) from previous runs.`);

    // Reset appearance counters for Hydrocarbons questions
    const topic = await prisma.topic.findFirst({ where: { name: 'Hydrocarbons' } });
    if (topic) {
      const reset = await prisma.question.updateMany({
        where: { topicId: topic.id },
        data: { appearanceCount: 0, lastAppearedAt: null },
      });
      console.log(`    Reset appearance data for ${reset.count} question(s).\n`);
    }
  }

  // ── Step 1: Server health check ─────────────────────────────────────────────
  section('Step 1 — Server Reachability');
  try {
    await axios.get(`${API_URL}/subjects`, { timeout: 5000 });
    assert('Backend server is reachable', true, API_URL);
  } catch (err: unknown) {
    assert('Backend server is reachable', false, 'connection refused — is the server running?');
    console.log(
      `\n  ${C.red('✗ Server unreachable. Start it with:')}\n    npx tsx --env-file=.env backend/src/index.ts\n`,
    );
    process.exit(1);
  }

  // ── Step 2: Teacher Login ────────────────────────────────────────────────────
  section('Step 2 — Teacher Login');
  let token: string;
  let teacherId: string;

  try {
    const res = await axios.post(`${API_URL}/auth/teacher/login`, {
      username: 'teacher1',
      password: 'Teacher@123',
    });
    token = res.data.token;
    teacherId = res.data.user.id;
    assert('Login returns a JWT token', typeof token === 'string' && token.length > 0);
    assert('User role is TEACHER', res.data.user.role === 'TEACHER', `role=${res.data.user.role}`);
    assert('Username matches', res.data.user.username === 'teacher1');
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      (err as Error).message;
    assert('Teacher login succeeds', false, msg);
    console.log(
      `\n  ${C.red('Login failed — run the seed script first:')}\n    npx tsx --env-file=.env apps/website/test/seed.ts\n`,
    );
    process.exit(1);
  }

  const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token!}` },
  });

  // ── Step 3: Retrieve Subject ─────────────────────────────────────────────────
  section('Step 3 — Retrieve Subject');
  const subjectsRes = await api.get('/subjects');
  const chemistry = subjectsRes.data.find((s: { name: string }) => s.name === 'Chemistry');
  assert('Chemistry subject exists', !!chemistry, chemistry ? `id=${chemistry.id}` : 'not found');

  // ── Step 4: Retrieve Chapter ─────────────────────────────────────────────────
  section('Step 4 — Retrieve Chapter');
  const chaptersRes = await api.get(`/subjects/${chemistry.id}/chapters`);
  const organicChem = chaptersRes.data.find(
    (c: { name: string }) => c.name === 'Organic Chemistry',
  );
  assert(
    'Organic Chemistry chapter exists',
    !!organicChem,
    organicChem ? `id=${organicChem.id}` : 'not found',
  );

  // ── Step 5: Retrieve Topic ───────────────────────────────────────────────────
  section('Step 5 — Retrieve Topic');
  const topicsRes = await api.get(`/chapters/${organicChem.id}/topics`);
  const hydrocarbons = topicsRes.data.find((t: { name: string }) => t.name === 'Hydrocarbons');
  assert(
    'Hydrocarbons topic exists',
    !!hydrocarbons,
    hydrocarbons ? `id=${hydrocarbons.id}` : 'not found',
  );

  // Verify question pool
  const poolSize = await prisma.question.count({
    where: { topicId: hydrocarbons.id, status: 'PUBLISHED' },
  });
  assert('Question pool has 30 published questions', poolSize === 30, `found=${poolSize}`);

  // ── Step 6: Generate Test #1 ─────────────────────────────────────────────────
  section('Step 6 — Generate "Hydrocarbons #01"');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  interface TestQuestion {
    id: string;
    originalQuestionId: string;
    questionText: string | null;
    questionType: string;
    position: number;
    optionsJson: unknown[];
  }

  interface TestResponse {
    id: string;
    name: string;
    status: string;
    durationMinutes: number;
    questions: TestQuestion[];
  }

  let test1: TestResponse;
  try {
    const res = await api.post<TestResponse>('/tests/generate', {
      name: 'Hydrocarbons #01',
      subjectId: chemistry.id,
      topicIds: [hydrocarbons.id],
      questionCount: 10,
      durationMinutes: 30,
      scheduledAt: tomorrow.toISOString(),
    });
    test1 = res.data;
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      (err as Error).message;
    assert('Test #1 generation succeeds', false, msg);
    process.exit(1);
  }

  // ── Step 7: Verify Test #1 ───────────────────────────────────────────────────
  section('Step 7 — Verify Test #1 Structure');
  assert('Test #1 name is "Hydrocarbons #01"', test1.name === 'Hydrocarbons #01');
  assert('Test #1 status is DRAFT', test1.status === 'DRAFT');
  assert('Test #1 duration is 30 minutes', test1.durationMinutes === 30);
  assert(
    'Test #1 has exactly 10 TestQuestion snapshots',
    test1.questions.length === 10,
    `count=${test1.questions.length}`,
  );
  assert(
    'All snapshots have position assigned',
    test1.questions.every((q) => q.position > 0),
  );

  const test1OrigIds = test1.questions.map((q) => q.originalQuestionId);

  // ── Step 8-9: Verify appearanceCount and lastAppearedAt ──────────────────────
  section('Step 8–9 — Verify Fairness Counter Updates (DB)');
  const dbQuestions = await prisma.question.findMany({
    where: { id: { in: test1OrigIds } },
    select: { id: true, appearanceCount: true, lastAppearedAt: true },
  });

  const countUpdated = dbQuestions.filter((q) => q.appearanceCount >= 1);
  const lastAppearedSet = dbQuestions.filter((q) => q.lastAppearedAt !== null);

  assert(
    'appearanceCount ≥ 1 for all 10 selected questions',
    countUpdated.length === 10,
    `${countUpdated.length}/10 updated`,
  );
  assert(
    'lastAppearedAt is set for all 10 selected questions',
    lastAppearedSet.length === 10,
    `${lastAppearedSet.length}/10 set`,
  );
  assert(
    'The other 20 questions still have appearanceCount=0',
    (await prisma.question.count({
      where: { topicId: hydrocarbons.id, id: { notIn: test1OrigIds }, appearanceCount: 0 },
    })) === 20,
  );

  console.log(`\n    ${C.yellow('Test #1 — Selected Question IDs:')}`);
  test1.questions
    .sort((a, b) => a.position - b.position)
    .forEach((q) => {
      console.log(`      [${q.position}] ${q.originalQuestionId}  ${C.dim(q.questionType)}`);
    });

  // ── Step 10: Generate Test #2 ────────────────────────────────────────────────
  section('Step 10 — Generate "Hydrocarbons #02"');
  let test2: TestResponse;
  try {
    const res = await api.post<TestResponse>('/tests/generate', {
      name: 'Hydrocarbons #02',
      subjectId: chemistry.id,
      topicIds: [hydrocarbons.id],
      questionCount: 10,
      durationMinutes: 30,
      scheduledAt: tomorrow.toISOString(),
    });
    test2 = res.data;
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      (err as Error).message;
    assert('Test #2 generation succeeds', false, msg);
    process.exit(1);
  }

  assert('Test #2 name is "Hydrocarbons #02"', test2.name === 'Hydrocarbons #02');
  assert(
    'Test #2 has exactly 10 TestQuestion snapshots',
    test2.questions.length === 10,
    `count=${test2.questions.length}`,
  );

  const test2OrigIds = test2.questions.map((q) => q.originalQuestionId);

  console.log(`\n    ${C.yellow('Test #2 — Selected Question IDs:')}`);
  test2.questions
    .sort((a, b) => a.position - b.position)
    .forEach((q) => {
      const reused = test1OrigIds.includes(q.originalQuestionId);
      const marker = reused ? C.yellow(' ← reused') : C.green(' ← fresh');
      console.log(
        `      [${q.position}] ${q.originalQuestionId}  ${C.dim(q.questionType)}${marker}`,
      );
    });

  // ── Step 11: Fairness Rotation Verification ───────────────────────────────────
  section('Step 11 — Fairness Algorithm Verification');

  const overlap = test1OrigIds.filter((id) => test2OrigIds.includes(id));
  const freshInTest2 = test2OrigIds.filter((id) => !test1OrigIds.includes(id));

  console.log(`\n    Overlap (questions in both tests) : ${C.bold(String(overlap.length))}`);
  console.log(
    `    Fresh questions in Test #2        : ${C.bold(String(freshInTest2.length))}/10`,
  );
  console.log(
    `    Unique questions across both tests: ${C.bold(String(new Set([...test1OrigIds, ...test2OrigIds]).size))}`,
  );

  assert(
    'Rotation: ≤ 2 questions overlap between Test #1 and Test #2',
    overlap.length <= 2,
    `overlap=${overlap.length} (expected ≤ 2 with 30-question pool)`,
  );
  assert(
    'Rotation: Test #2 draws ≥ 8 fresh (unused) questions',
    freshInTest2.length >= 8,
    `fresh=${freshInTest2.length}/10`,
  );

  // Verify that fresh Test #2 questions now have appearanceCount=1
  const freshInDb = await prisma.question.findMany({
    where: { id: { in: freshInTest2 } },
    select: { id: true, appearanceCount: true },
  });
  assert(
    'Fresh Test #2 questions have appearanceCount=1 after generation',
    freshInDb.every((q) => q.appearanceCount === 1),
    `${freshInDb.filter((q) => q.appearanceCount === 1).length}/${freshInDb.length} updated`,
  );

  // Verify previously-used questions have count ≥ 1 still
  const reusedInDb = await prisma.question.findMany({
    where: { id: { in: overlap } },
    select: { id: true, appearanceCount: true },
  });
  if (reusedInDb.length > 0) {
    assert(
      'Reused questions have appearanceCount ≥ 2',
      reusedInDb.every((q) => q.appearanceCount >= 2),
      `${reusedInDb.map((q) => q.appearanceCount).join(', ')}`,
    );
  } else {
    console.log(`    ${C.dim('— No reused questions to verify (perfect rotation)')}`);
  }

  // ── Final Report ──────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n' + C.bold('╔══════════════════════════════════════════════╗'));
  console.log(C.bold('║   Validation Report                          ║'));
  console.log(C.bold('╚══════════════════════════════════════════════╝'));
  console.log(`\n  Total assertions : ${results.length}`);
  console.log(`  ${C.green(`Passed           : ${passed}`)}`);
  console.log(`  ${failed > 0 ? C.red(`Failed           : ${failed}`) : C.green(`Failed           : ${failed}`)}`);

  if (failed > 0) {
    console.log(`\n  ${C.bold(C.red('Failed assertions:'))}`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`    ✗ ${r.label}${r.detail ? C.dim(` (${r.detail})`) : ''}`);
      });
    console.log();
    process.exit(1);
  }

  console.log(
    `\n  ${C.bold(C.green('✓ All validations passed — Teacher workflow is working correctly!'))}\n`,
  );
  process.exit(0);
}

main()
  .catch((err) => {
    console.error(C.red('\n✗ Unexpected error:'), err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
