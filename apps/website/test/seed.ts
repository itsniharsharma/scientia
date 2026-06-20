/**
 * Scientia Seed Script — Hydrocarbons Test Data
 *
 * Run from the monorepo root:
 *   npx tsx --env-file=.env apps/website/test/seed.ts
 *
 * To force a clean reseed (deletes existing questions and any tests
 * that reference them):
 *   npx tsx --env-file=.env apps/website/test/seed.ts --force
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const FORCE = process.argv.includes('--force');

// ─── Question Definitions ────────────────────────────────────────────────────

type QuestionSeed =
  | {
      type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
      questionText: string;
      options: { position: number; optionText: string; isCorrect: boolean }[];
    }
  | { type: 'INTEGER'; questionText: string; integerAnswer: number };

const QUESTIONS: QuestionSeed[] = [
  // ── SINGLE_CHOICE (15) ──────────────────────────────────────────────────────
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'What is the IUPAC name of the hydrocarbon with molecular formula C₃H₈?',
    options: [
      { position: 1, optionText: 'Methane', isCorrect: false },
      { position: 2, optionText: 'Ethane', isCorrect: false },
      { position: 3, optionText: 'Propane', isCorrect: true },
      { position: 4, optionText: 'Butane', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText: 'What is the general molecular formula for alkanes?',
    options: [
      { position: 1, optionText: 'CₙH₂ₙ', isCorrect: false },
      { position: 2, optionText: 'CₙH₂ₙ₊₂', isCorrect: true },
      { position: 3, optionText: 'CₙH₂ₙ₋₂', isCorrect: false },
      { position: 4, optionText: 'CₙHₙ', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'What type of hybridisation does the carbon atom undergo in methane (CH₄)?',
    options: [
      { position: 1, optionText: 'sp', isCorrect: false },
      { position: 2, optionText: 'sp²', isCorrect: false },
      { position: 3, optionText: 'sp³', isCorrect: true },
      { position: 4, optionText: 'sp³d', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText: 'The approximate H–C–H bond angle in methane is:',
    options: [
      { position: 1, optionText: '90°', isCorrect: false },
      { position: 2, optionText: '104.5°', isCorrect: false },
      { position: 3, optionText: '109.5°', isCorrect: true },
      { position: 4, optionText: '120°', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'The carbon–carbon bond in ethylene (ethene, C₂H₄) consists of:',
    options: [
      { position: 1, optionText: 'One σ bond only', isCorrect: false },
      { position: 2, optionText: 'Two σ bonds', isCorrect: false },
      { position: 3, optionText: 'One σ bond and one π bond', isCorrect: true },
      { position: 4, optionText: 'Two π bonds', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'What is the hybridisation of carbon atoms in acetylene (ethyne, C₂H₂)?',
    options: [
      { position: 1, optionText: 'sp', isCorrect: true },
      { position: 2, optionText: 'sp²', isCorrect: false },
      { position: 3, optionText: 'sp³', isCorrect: false },
      { position: 4, optionText: 'sp³d', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'The extra stability of benzene over a hypothetical cyclohexatriene is attributed to:',
    options: [
      { position: 1, optionText: 'Alternating single and double bonds', isCorrect: false },
      {
        position: 2,
        optionText: 'Delocalisation of π electrons over the entire ring',
        isCorrect: true,
      },
      { position: 3, optionText: 'High hydrogen-to-carbon ratio', isCorrect: false },
      { position: 4, optionText: 'Linear geometry of the carbon chain', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText: 'The number of structural isomers of butane (C₄H₁₀) is:',
    options: [
      { position: 1, optionText: '1', isCorrect: false },
      { position: 2, optionText: '2', isCorrect: true },
      { position: 3, optionText: '3', isCorrect: false },
      { position: 4, optionText: '4', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'The products of complete combustion of methane in excess oxygen are:',
    options: [
      { position: 1, optionText: 'CO and H₂O', isCorrect: false },
      { position: 2, optionText: 'CO₂ and H₂O', isCorrect: true },
      { position: 3, optionText: 'CO₂ and H₂', isCorrect: false },
      { position: 4, optionText: 'CO and CO₂', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'The reaction of benzene with Br₂ in the presence of anhydrous FeBr₃ is best described as:',
    options: [
      { position: 1, optionText: 'Electrophilic addition', isCorrect: false },
      { position: 2, optionText: 'Electrophilic aromatic substitution', isCorrect: true },
      { position: 3, optionText: 'Nucleophilic substitution', isCorrect: false },
      { position: 4, optionText: 'Free-radical addition', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText: 'The general molecular formula for alkynes is:',
    options: [
      { position: 1, optionText: 'CₙH₂ₙ', isCorrect: false },
      { position: 2, optionText: 'CₙH₂ₙ₊₂', isCorrect: false },
      { position: 3, optionText: 'CₙH₂ₙ₋₂', isCorrect: true },
      { position: 4, optionText: 'CₙH₂ₙ₋₄', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'Which of the following hydrocarbons most readily decolorises bromine water at room temperature?',
    options: [
      { position: 1, optionText: 'Hexane', isCorrect: false },
      { position: 2, optionText: 'Cyclohexane', isCorrect: false },
      { position: 3, optionText: 'Benzene', isCorrect: false },
      { position: 4, optionText: '1-Hexene', isCorrect: true },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText: 'The IUPAC name of the compound CH₃CH(CH₃)CH₃ is:',
    options: [
      { position: 1, optionText: 'n-Butane', isCorrect: false },
      { position: 2, optionText: '2-Methylpropane', isCorrect: true },
      { position: 3, optionText: 'Isobutylene', isCorrect: false },
      { position: 4, optionText: '2-Butene', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText:
      'When HBr is added to propene (CH₃–CH=CH₂) following Markovnikov\'s rule, the major product is:',
    options: [
      { position: 1, optionText: '1-Bromopropane', isCorrect: false },
      { position: 2, optionText: '2-Bromopropane', isCorrect: true },
      { position: 3, optionText: '1,2-Dibromopropane', isCorrect: false },
      { position: 4, optionText: 'Propan-1-ol', isCorrect: false },
    ],
  },
  {
    type: 'SINGLE_CHOICE',
    questionText: 'Which of the following is NOT a hydrocarbon?',
    options: [
      { position: 1, optionText: 'Methane', isCorrect: false },
      { position: 2, optionText: 'Benzene', isCorrect: false },
      { position: 3, optionText: 'Ethanol', isCorrect: true },
      { position: 4, optionText: 'Cyclohexane', isCorrect: false },
    ],
  },

  // ── MULTI_CHOICE (10) ───────────────────────────────────────────────────────
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following are unsaturated hydrocarbons? (Select all that apply)',
    options: [
      { position: 1, optionText: 'Ethane', isCorrect: false },
      { position: 2, optionText: 'Ethene (ethylene)', isCorrect: true },
      { position: 3, optionText: 'Ethyne (acetylene)', isCorrect: true },
      { position: 4, optionText: 'Benzene', isCorrect: true },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following statements are CORRECT about alkenes? (Select all that apply)',
    options: [
      { position: 1, optionText: 'They undergo addition reactions with halogens', isCorrect: true },
      { position: 2, optionText: 'Their general molecular formula is CₙH₂ₙ', isCorrect: true },
      { position: 3, optionText: 'They decolorise bromine water', isCorrect: true },
      { position: 4, optionText: 'They are less reactive than alkanes', isCorrect: false },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following compounds are structural isomers of pentane (C₅H₁₂)? (Select all that apply)',
    options: [
      { position: 1, optionText: '2-Methylbutane', isCorrect: true },
      { position: 2, optionText: '2,2-Dimethylpropane', isCorrect: true },
      { position: 3, optionText: '2-Methylpropane (C₄H₁₀)', isCorrect: false },
      { position: 4, optionText: 'Hexane (C₆H₁₄)', isCorrect: false },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following are CORRECT statements about benzene? (Select all that apply)',
    options: [
      { position: 1, optionText: 'All C–C bond lengths in benzene are equal', isCorrect: true },
      {
        position: 2,
        optionText: 'Benzene readily undergoes electrophilic aromatic substitution',
        isCorrect: true,
      },
      { position: 3, optionText: 'The benzene ring is planar', isCorrect: true },
      {
        position: 4,
        optionText: 'Benzene undergoes addition more readily than alkenes',
        isCorrect: false,
      },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following are TRUE about alkanes? (Select all that apply)',
    options: [
      { position: 1, optionText: 'They are saturated hydrocarbons', isCorrect: true },
      {
        position: 2,
        optionText: 'They react with halogens under UV light via free-radical substitution',
        isCorrect: true,
      },
      { position: 3, optionText: 'Their general formula is CₙH₂ₙ₊₂', isCorrect: true },
      { position: 4, optionText: 'They readily react with strong acids', isCorrect: false },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following correctly describe alkynes? (Select all that apply)',
    options: [
      { position: 1, optionText: 'They contain a carbon–carbon triple bond', isCorrect: true },
      { position: 2, optionText: 'The simplest alkyne is ethyne (acetylene)', isCorrect: true },
      {
        position: 3,
        optionText: 'They can undergo addition reactions with H₂ and Br₂',
        isCorrect: true,
      },
      { position: 4, optionText: 'Their general molecular formula is CₙH₂ₙ₋₂', isCorrect: true },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following are aromatic hydrocarbons? (Select all that apply)',
    options: [
      { position: 1, optionText: 'Benzene (C₆H₆)', isCorrect: true },
      { position: 2, optionText: 'Toluene (methylbenzene)', isCorrect: true },
      { position: 3, optionText: 'Naphthalene (C₁₀H₈)', isCorrect: true },
      { position: 4, optionText: 'Cyclohexane (C₆H₁₂)', isCorrect: false },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'In which of the following molecules are all carbon atoms sp³ hybridised? (Select all that apply)',
    options: [
      { position: 1, optionText: 'Methane (CH₄)', isCorrect: true },
      { position: 2, optionText: 'Ethane (C₂H₆)', isCorrect: true },
      { position: 3, optionText: 'Ethylene (C₂H₄)', isCorrect: false },
      { position: 4, optionText: 'Propane (C₃H₈)', isCorrect: true },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following reactions can alkenes undergo? (Select all that apply)',
    options: [
      { position: 1, optionText: 'Catalytic hydrogenation (addition of H₂)', isCorrect: true },
      { position: 2, optionText: 'Addition of Br₂ (halogenation)', isCorrect: true },
      { position: 3, optionText: 'Complete combustion with O₂', isCorrect: true },
      { position: 4, optionText: 'Electrophilic aromatic substitution', isCorrect: false },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    questionText:
      'Which of the following statements about the physical properties of alkanes are CORRECT? (Select all that apply)',
    options: [
      {
        position: 1,
        optionText: 'The first four alkanes (C₁–C₄) are gases at room temperature and pressure',
        isCorrect: true,
      },
      { position: 2, optionText: 'Alkanes are generally insoluble in water', isCorrect: true },
      {
        position: 3,
        optionText: 'Boiling points of alkanes increase with increasing molecular mass',
        isCorrect: true,
      },
      { position: 4, optionText: 'Alkanes are generally denser than water', isCorrect: false },
    ],
  },

  // ── INTEGER (5) ─────────────────────────────────────────────────────────────
  {
    type: 'INTEGER',
    questionText:
      'How many hydrogen atoms are present in one molecule of propane (C₃H₈)?',
    integerAnswer: 8,
  },
  {
    type: 'INTEGER',
    questionText: 'How many carbon atoms are present in one molecule of decane?',
    integerAnswer: 10,
  },
  {
    type: 'INTEGER',
    questionText:
      'How many structural isomers are possible for butane (C₄H₁₀)?',
    integerAnswer: 2,
  },
  {
    type: 'INTEGER',
    questionText:
      'How many sigma (σ) bonds are present in one molecule of ethylene (C₂H₄)? (Count all σ bonds including C–H bonds)',
    integerAnswer: 5,
  },
  {
    type: 'INTEGER',
    questionText:
      'How many pi (π) bonds are present in the Kekulé structure of benzene (C₆H₆)?',
    integerAnswer: 3,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  Scientia Seed Script                 ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // ── 1. Subject ──────────────────────────────────────────────────────────────
  console.log('▶ Subject: Chemistry');
  const subject = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry' },
  });
  console.log(`  ✓ id=${subject.id}\n`);

  // ── 2. Chapter ──────────────────────────────────────────────────────────────
  console.log('▶ Chapter: Organic Chemistry');
  const chapter = await prisma.chapter.upsert({
    where: { subjectId_name: { subjectId: subject.id, name: 'Organic Chemistry' } },
    update: {},
    create: { subjectId: subject.id, name: 'Organic Chemistry' },
  });
  console.log(`  ✓ id=${chapter.id}\n`);

  // ── 3. Topic ─────────────────────────────────────────────────────────────────
  console.log('▶ Topic: Hydrocarbons');
  const topic = await prisma.topic.upsert({
    where: { chapterId_name: { chapterId: chapter.id, name: 'Hydrocarbons' } },
    update: {},
    create: { chapterId: chapter.id, name: 'Hydrocarbons' },
  });
  console.log(`  ✓ id=${topic.id}\n`);

  // ── 4. Questions ─────────────────────────────────────────────────────────────
  console.log('▶ Questions (30 total)');
  const existingCount = await prisma.question.count({ where: { topicId: topic.id } });

  if (existingCount >= 30 && !FORCE) {
    console.log(`  ⚠  Already ${existingCount} questions in this topic. Skipping.`);
    console.log('     Use --force to delete and reseed.\n');
  } else {
    if (existingCount > 0) {
      console.log(`  Cleaning up ${existingCount} existing question(s)...`);

      // Find tests that reference any of our questions
      const topicQuestionIds = (
        await prisma.question.findMany({ where: { topicId: topic.id }, select: { id: true } })
      ).map((q) => q.id);

      const affectedTestIds = [
        ...new Set(
          (
            await prisma.testQuestion.findMany({
              where: { originalQuestionId: { in: topicQuestionIds } },
              select: { testId: true },
            })
          ).map((tq) => tq.testId),
        ),
      ];

      if (affectedTestIds.length > 0) {
        await prisma.test.deleteMany({ where: { id: { in: affectedTestIds } } });
        console.log(`  Deleted ${affectedTestIds.length} test(s) referencing old questions.`);
      }

      await prisma.question.deleteMany({ where: { topicId: topic.id } });
      console.log(`  Deleted ${existingCount} old question(s).\n`);
    }

    let created = 0;
    for (const q of QUESTIONS) {
      if (q.type === 'INTEGER') {
        await prisma.question.create({
          data: {
            topicId: topic.id,
            type: 'INTEGER',
            status: 'PUBLISHED',
            questionText: q.questionText,
            integerAnswer: q.integerAnswer,
          },
        });
      } else {
        await prisma.question.create({
          data: {
            topicId: topic.id,
            type: q.type,
            status: 'PUBLISHED',
            questionText: q.questionText,
            options: { create: q.options },
          },
        });
      }
      created++;
      process.stdout.write(`\r  Created ${created}/${QUESTIONS.length} questions...`);
    }
    console.log(`\n  ✓ ${QUESTIONS.length} questions created\n`);
  }

  // ── 5. Teacher ────────────────────────────────────────────────────────────────
  console.log('▶ Teacher: teacher1');
  const existingTeacher = await prisma.teacher.findUnique({ where: { username: 'teacher1' } });
  if (existingTeacher && !FORCE) {
    console.log('  ⚠  teacher1 already exists. Skipping.');
  } else {
    const hashedPw = await bcrypt.hash('Teacher@123', 12);
    await prisma.teacher.upsert({
      where: { username: 'teacher1' },
      update: { password: hashedPw },
      create: { username: 'teacher1', password: hashedPw },
    });
    console.log('  ✓ teacher1 / Teacher@123');
  }
  console.log();

  // ── 6. Students ───────────────────────────────────────────────────────────────
  console.log('▶ Students');
  const studentPw = await bcrypt.hash('Student@123', 12);
  const studentDefs = [
    { username: 'student1', fullName: 'Priya Sharma', phone: '9000000001' },
    { username: 'student2', fullName: 'Arjun Patel', phone: '9000000002' },
    { username: 'student3', fullName: 'Sneha Reddy', phone: '9000000003' },
  ];

  for (const s of studentDefs) {
    await prisma.student.upsert({
      where: { username: s.username },
      update: {},
      create: { username: s.username, fullName: s.fullName, phone: s.phone, password: studentPw },
    });
    console.log(`  ✓ ${s.username} (${s.fullName}) / Student@123`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  const finalCount = await prisma.question.count({ where: { topicId: topic.id, status: 'PUBLISHED' } });
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  Seed Complete                        ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`\n  Subject   : Chemistry (id=${subject.id})`);
  console.log(`  Chapter   : Organic Chemistry (id=${chapter.id})`);
  console.log(`  Topic     : Hydrocarbons (id=${topic.id})`);
  console.log(`  Questions : ${finalCount} published`);
  console.log('  Teacher   : teacher1 / Teacher@123');
  console.log('  Students  : student1, student2, student3 / Student@123');
  console.log('\n  Next step:');
  console.log('    npx tsx --env-file=.env apps/website/test/e2e-teacher-flow.ts\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
