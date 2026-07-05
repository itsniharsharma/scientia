/**
 * Seed: Scientia Chemistry Classes — Mole Concept
 * Run: npx tsx --env-file ../.env src/seed/seed-mole-concept-scientia.ts
 *
 * Subject : Chemistry
 *   Chapter: Mole Concept
 *     Topics: Section A - JEE Main Pattern, Section B - NEET Pattern
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── helpers ───────────────────────────────────────────────────────────────────

type Opt = { optionText: string; isCorrect: boolean; position: number };
type SC = { type: 'SINGLE_CHOICE'; questionText: string; options: Opt[] };
type AnyQ = SC;

function sc(text: string, opts: string[], ci: number): SC {
  return {
    type: 'SINGLE_CHOICE',
    questionText: text,
    options: opts.map((o, i) => ({ optionText: o, isCorrect: i === ci, position: i + 1 })),
  };
}

// ─── Section A — JEE Main Pattern (Q1-25) ───────────────────────────────────────
// Answers: d a c a c b b b b c b b c b a a a a a b a b a a a

const sectionA: AnyQ[] = [
  sc('The number of molecules present in 4.4 g of CO₂ is:',
    ['6.022 × 10²³', '3.011 × 10²³', '1.2044 × 10²³', '6.022 × 10²²'], 3),
  sc('The mass of 0.5 mole of H₂SO₄ is:',
    ['49 g', '98 g', '24.5 g', '9.8 g'], 0),
  sc('The number of moles of oxygen atoms present in 126 g of HNO₃ (molar mass = 63) is:',
    ['2', '4', '6', '3'], 2),
  sc('The percentage of nitrogen by mass in ammonium sulphate [(NH₄)₂SO₄, M = 132] is:',
    ['21.2%', '28%', '14%', '42.4%'], 0),
  sc('The empirical formula of a compound is CH₂O and its molar mass is 180 g/mol. Its molecular formula is:',
    ['C₂H₄O₂', 'C₅H₁₀O₅', 'C₆H₁₂O₆', 'C₃H₆O₃'], 2),
  sc('The number of atoms present in 0.1 mole of P₄ molecules is:',
    ['6.022 × 10²²', '2.4088 × 10²³', '6.022 × 10²³', '1.2044 × 10²³'], 1),
  sc('The volume of O₂ at STP required for complete combustion of 16 g of CH₄ is (CH₄ + 2O₂ → CO₂ + 2H₂O):',
    ['22.4 L', '44.8 L', '11.2 L', '67.2 L'], 1),
  sc('The molarity of a solution containing 5.85 g of NaCl (M = 58.5) in 500 mL of solution is:',
    ['0.1 M', '0.2 M', '0.5 M', '1.0 M'], 1),
  sc('When 22 g of CO₂ is mixed with 16 g of O₂, the total number of moles of gas in the mixture is:',
    ['0.5', '1.0', '1.5', '2.0'], 1),
  sc('The mass of one molecule of water (H₂O) is approximately:',
    ['3 × 10⁻²³ g', '18 g', '2.99 × 10⁻²³ g', '6.022 × 10²³ g'], 2),
  sc('4 g of H₂ is mixed with 16 g of O₂ and ignited. The mass of water formed is (2H₂ + O₂ → 2H₂O):',
    ['9 g', '18 g', '36 g', '4 g'], 1),
  sc('The number of gram-atoms of oxygen present in 0.2 mole of CaCO₃ is:',
    ['0.2', '0.6', '0.3', '1.2'], 1),
  sc('The vapour density of a gas is 32. Its molar mass is:',
    ['32', '16', '64', '128'], 2),
  sc('The molality of a solution containing 18 g of glucose (M = 180) dissolved in 500 g of water is:',
    ['0.1 m', '0.2 m', '0.5 m', '1.0 m'], 1),
  sc('The total number of electrons present in 1.8 g of water (H₂O) is:',
    ['6.022 × 10²³', '6.022 × 10²²', '10', '3.011 × 10²³'], 0),
  sc('5.6 L of a gas at STP weighs 11 g. The molar mass of the gas is:',
    ['44', '22', '11', '28'], 0),
  sc('The mole fraction of ethanol in a solution containing 46 g of ethanol (M = 46) and 54 g of water (M = 18) is:',
    ['0.25', '0.75', '0.5', '0.33'], 0),
  sc('The number of moles of KClO₃ that must decompose to liberate 6 g of O₂ is (2KClO₃ → 2KCl + 3O₂):',
    ['0.125', '0.1875', '0.25', '0.0625'], 0),
  sc('The number of moles of water present in 1 L of water (density = 1 g/mL) is approximately:',
    ['55.5', '18', '1000', '5.55'], 0),
  sc('Equal masses of O₂ and SO₂ are taken. The ratio of the number of molecules of O₂ to SO₂ is:',
    ['1 : 1', '2 : 1', '1 : 2', '4 : 1'], 1),
  sc('0.44 g of a gas occupies 224 mL at STP. The molar mass of the gas is:',
    ['44', '22', '88', '16'], 0),
  sc('The normality of a 0.5 M H₂SO₄ solution is:',
    ['0.5 N', '1 N', '2 N', '0.25 N'], 1),
  sc('The number of gram-atoms of oxygen present in 0.25 mole of Na₂CO₃·10H₂O is:',
    ['3.25', '13', '0.25', '2.5'], 0),
  sc('The mass of Na₂CO₃ (M = 106) required to prepare 250 mL of a 0.1 M solution is:',
    ['2.65 g', '1.06 g', '10.6 g', '0.265 g'], 0),
  sc('The total number of protons present in 10 g of CaCO₃ (M = 100) is:',
    ['3.011 × 10²⁴', '6.022 × 10²³', '3.011 × 10²³', '6.022 × 10²⁴'], 0),
];

// ─── Section B — NEET Pattern (Q26-40) ──────────────────────────────────────────
// Answers: c d c a a b a a b a a a a a a

const sectionB: AnyQ[] = [
  sc('Which of the following contains the maximum number of atoms?',
    ['18 g of H₂O', '16 g of O₂', '4 g of H₂', '44 g of CO₂'], 2),
  sc('The mass of carbon present in 0.5 mole of K₄[Fe(CN)₆] is:',
    ['1.8 g', '18 g', '3.6 g', '36 g'], 3),
  sc('1 g of which of the following contains the largest number of molecules?',
    ['H₂O', 'CO₂', 'CH₄', 'O₂'], 2),
  sc('The number of moles of oxygen in 1 L of air containing 21% oxygen by volume at STP is:',
    ['9.375 × 10⁻³', '0.21', '2.1 × 10⁻²', '4.46 × 10⁻²'], 0),
  sc('The mass of HCl required to react completely with 2 moles of Al is (2Al + 6HCl → 2AlCl₃ + 3H₂):',
    ['219 g', '36.5 g', '73 g', '109.5 g'], 0),
  sc('The number of atoms present in 0.004 g of magnesium (atomic mass = 24) is closest to:',
    ['4 × 10²⁰', '1 × 10²⁰', '4 × 10²³', '1 × 10²³'], 1),
  sc('An organic compound contains 40% carbon, 6.67% hydrogen and the rest oxygen by mass. Its empirical formula is:',
    ['CH₂O', 'C₂H₄O', 'CHO', 'CH₄O'], 0),
  sc('The volume occupied by 4.4 g of CO₂ at STP is:',
    ['2.24 L', '22.4 L', '1.12 L', '4.48 L'], 0),
  sc('The mass of 1 × 10²² molecules of CuSO₄·5H₂O (M = 250) is approximately:',
    ['4.15 g', '41.5 g', '250 g', '2.49 g'], 0),
  sc('Equal volumes of two gases under the same conditions of temperature and pressure contain an equal number of:',
    ['atoms', 'molecules', 'electrons', 'protons'], 1),
  sc('The number of oxygen atoms present in 6.022 × 10²² molecules of CO₂ is:',
    ['1.2044 × 10²³', '6.022 × 10²²', '1.2044 × 10²²', '6.022 × 10²³'], 0),
  sc('0.5 mole of a substance weighs 32 g. Its molar mass is:',
    ['64', '32', '16', '128'], 0),
  sc('The percentage of water of crystallisation in CuSO₄·5H₂O (M = 250) is:',
    ['36%', '18%', '90%', '25%'], 0),
  sc('The number of moles of CO₂ that contains 8 g of oxygen is:',
    ['0.25', '0.5', '1.0', '0.125'], 0),
  sc('The number of molecules present in 1.7 g of NH₃ (M = 17) is:',
    ['6.022 × 10²²', '6.022 × 10²³', '1.7 × 10²³', '3.011 × 10²²'], 0),
];

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Scientia Chemistry Classes — Mole Concept...\n');

  const subject = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry' },
  });

  const chapter = await prisma.chapter.upsert({
    where: { subjectId_name: { subjectId: subject.id, name: 'Mole Concept' } },
    update: {},
    create: { name: 'Mole Concept', subjectId: subject.id },
  });

  async function seedTopic(topicName: string, questions: AnyQ[]) {
    const topic = await prisma.topic.upsert({
      where: { chapterId_name: { chapterId: chapter.id, name: topicName } },
      update: {},
      create: { name: topicName, chapterId: chapter.id },
    });

    let created = 0;
    let skipped = 0;

    for (const q of questions) {
      const existing = await prisma.question.findFirst({
        where: { topicId: topic.id, questionText: q.questionText },
      });
      if (existing) { skipped++; continue; }

      await prisma.question.create({
        data: {
          topicId: topic.id,
          type: q.type,
          questionText: q.questionText,
          status: 'PUBLISHED',
          options: {
            create: q.options.map((o) => ({
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              position: o.position,
            })),
          },
        },
      });
      created++;
    }

    console.log(`  ${topicName}: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  }

  const r1 = await seedTopic('Section A - JEE Main Pattern', sectionA);
  const r2 = await seedTopic('Section B - NEET Pattern', sectionB);

  const allResults = [r1, r2];
  const totalCreated = allResults.reduce((s, r) => s + r.created, 0);
  const totalSkipped = allResults.reduce((s, r) => s + r.skipped, 0);
  const totalAttempted = totalCreated + totalSkipped;

  console.log('\n─────────────────────────────────');
  console.log(`Total attempted : ${totalAttempted}`);
  console.log(`Created         : ${totalCreated}`);
  console.log(`Already existed : ${totalSkipped}`);
  console.log(`Success rate    : ${((totalCreated / totalAttempted) * 100).toFixed(1)}%`);
  console.log('─────────────────────────────────');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
