/**
 * Seed: Scientia Chemistry Classes — Mole Concept (Previous Year Questions)
 * Run: npx tsx --env-file ../.env src/seed/seed-mole-concept-pyq-scientia.ts
 *
 * Subject : Chemistry
 *   Chapter: Mole Concept
 *     Topics: Section A - JEE Main (PYQ), Section B - NEET (PYQ)
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

// ─── Section A — JEE Main PYQ (Q1-15) ───────────────────────────────────────────
// Answers: d a d a b d c d a a a a a a b

const sectionAPyq: AnyQ[] = [
  sc('The largest number of atoms is present in:',
    ['127 g of iodine', '48 g of magnesium', '71 g of chlorine', '4 g of hydrogen'], 3),
  sc('Commercial concentrated sulphuric acid is 95% H₂SO₄ by mass with density 1.834 g/cm³. Its molarity is:',
    ['17.8 M', '15.7 M', '10.5 M', '12.0 M'], 0),
  sc('In a gaseous mixture the masses of oxygen and nitrogen are in the ratio 1 : 4. The ratio of the number of their molecules is:',
    ['1 : 8', '3 : 16', '1 : 4', '7 : 32'], 3),
  sc('120 g of urea (molar mass 60) is dissolved in 1000 g of water; the solution density is 1.15 g/mL. The molarity of the solution is:',
    ['2.05 M', '0.50 M', '1.78 M', '1.02 M'], 0),
  sc('The ratio of the number of oxygen atoms in 16 g of ozone (O₃), 28 g of carbon monoxide (CO) and 32 g of oxygen (O₂) is:',
    ['3 : 1 : 1', '1 : 1 : 2', '3 : 1 : 2', '1 : 1 : 1'], 1),
  sc('When 0.5 L of CO₂ is passed over red-hot coke it is partly reduced to CO, and the total volume of gas becomes 700 mL. The composition of the gas mixture (at STP) is (CO₂ + C → 2CO):',
    ['CO₂ = 200 mL, CO = 500 mL', 'CO₂ = 350 mL, CO = 350 mL', 'CO₂ = 0 mL, CO = 700 mL', 'CO₂ = 300 mL, CO = 400 mL'], 3),
  sc('An open vessel at 300 K is heated until two-fifths of the air is expelled. Assuming the volume stays constant, the temperature to which it was heated is:',
    ['750 K', '400 K', '500 K', '1500 K'], 2),
  sc('The density of a 3 M NaCl solution is 1.252 g/mL. The molality of the solution is (molar mass NaCl = 58.5):',
    ['2.18 m', '3.00 m', '2.60 m', '2.79 m'], 3),
  sc('0.6 g of urea on strong heating with NaOH liberates NH₃. This NH₃ is exactly neutralised by:',
    ['100 mL of 0.2 N HCl', '400 mL of 0.2 N HCl', '100 mL of 0.1 N HCl', '200 mL of 0.2 N HCl'], 0),
  sc('A 5.2 molal aqueous solution of methanol (CH₃OH) is prepared. The mole fraction of methanol is:',
    ['0.086', '0.050', '0.100', '0.190'], 0),
  sc('A solution of HNO₃ has density 1.4 g/mL and is 63% HNO₃ by mass. The molarity of the solution is:',
    ['14 M', '10 M', '8 M', '12 M'], 0),
  sc('A 300 mL bottle of soft drink contains CO₂ dissolved at a concentration of 0.2 M. Treating CO₂ as ideal, the volume of dissolved CO₂ at STP is (molar volume = 22.7 L/mol):',
    ['1362 mL', '681 mL', '2724 mL', '1400 mL'], 0),
  sc('Complete combustion of 750 g of an organic compound gives 420 g of CO₂ and 210 g of H₂O. The percentages of carbon and hydrogen, respectively, are:',
    ['15.3% and 3.11%', '22.4% and 3.11%', '15.3% and 6.22%', '11.2% and 3.11%'], 0),
  sc('The mass of FeSO₄·7H₂O (M = 278) that must be added to 100 kg of wheat to give 10 ppm of Fe is:',
    ['4.96 g', '1.00 g', '2.78 g', '5.60 g'], 0),
  sc('A transition metal M forms a volatile chloride of vapour density 94.8 containing 74.75% chlorine by mass. The formula of the chloride is:',
    ['MCl₂', 'MCl₄', 'MCl₅', 'MCl₃'], 1),
];

// ─── Section B — NEET PYQ (Q16-23) ──────────────────────────────────────────────
// Answers: a b c a b a a a

const sectionBPyq: AnyQ[] = [
  sc('The number of hydrogen atoms present in 5.4 g of urea [(NH₂)₂CO, M = 60] is (Nₐ = 6.022 × 10²³):',
    ['2.17 × 10²³', '1.08 × 10²³', '5.42 × 10²²', '4.34 × 10²³'], 0),
  sc('1 g of NaOH is treated with 25 mL of 0.75 M HCl. The mass of NaOH left unreacted is:',
    ['750 mg', '250 mg', 'zero', '200 mg'], 1),
  sc('When 22.4 L of H₂ is mixed with 11.2 L of Cl₂, each at STP, the number of moles of HCl formed is (H₂ + Cl₂ → 2HCl):',
    ['0.5 mol', '1.5 mol', '1 mol', '2 mol'], 2),
  sc('The number of moles of KMnO₄ required to react with one mole of sulphite ion in acidic medium is:',
    ['2/5', '3/5', '4/5', '1'], 0),
  sc("The number of moles of hydrogen molecules required to produce 20 moles of ammonia by Haber's process is (N₂ + 3H₂ → 2NH₃):",
    ['20', '30', '40', '10'], 1),
  sc('The mass of 95% pure CaCO₃ required to neutralise 50 mL of 0.5 M HCl is (CaCO₃ + 2HCl → CaCl₂ + CO₂ + H₂O):',
    ['1.32 g', '1.25 g', '2.50 g', '1.00 g'], 0),
  sc('2.5 L of 1 M NaOH solution is mixed with 3 L of 0.5 M NaOH solution. The molarity of the resulting solution is:',
    ['0.727 M', '0.75 M', '1.0 M', '0.5 M'], 0),
  sc('The total number of atoms present in 0.1 mole of a triatomic gas is (Nₐ = 6.022 × 10²³):',
    ['1.806 × 10²³', '6.022 × 10²²', '1.806 × 10²²', '3.60 × 10²³'], 0),
];

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Scientia Chemistry Classes — Mole Concept (PYQ)...\n');

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

  const r1 = await seedTopic('Section A - JEE Main (PYQ)', sectionAPyq);
  const r2 = await seedTopic('Section B - NEET (PYQ)', sectionBPyq);

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
