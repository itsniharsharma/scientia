/**
 * Seed: Scientia Chemistry Classes — Solutions
 * Run: npx tsx --env-file ../.env src/seed/seed-solutions-scientia.ts
 *
 * Subject : Chemistry
 *   Chapter: Solutions
 *     Topics: MCQ Practice Bank, Raoult's Law & Azeotropes, Concentration Terms & Henry's Law (Set 2)
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

// ─── PDF1: Solutions_Question_Paper.pdf — MCQ Practice Bank ────────────────────
// Answers: B C D B A D A D D C

const mcqPracticeBank: AnyQ[] = [
  sc('The vapour pressure of a solution of the liquids A (p°A = 80 mmHg, xA = 0.4) and B (p°B = 120 mmHg, xB = 0.6) is found to be 100 mmHg. The solution exhibits:',
    ['positive deviation from ideal behaviour', 'negative deviation from ideal behaviour', 'ideal behaviour', 'positive deviation at low conc. and negative at high conc.'], 1),
  sc('Two 1-litre flasks A and B are connected by a closed valve. Flask A holds benzene in equilibrium with its vapour at 30°C. Flask B is evacuated and the valve is opened. If the temperature is kept constant, which statement is true?',
    ['Some benzene molecules move from flask A to flask B', 'Vapour pressure becomes half its initial value', 'The vapour pressure remains unchanged', 'Some more liquid benzene in flask A evaporates'], 2),
  sc('All of the following form ideal solutions EXCEPT:',
    ['C6H6 and C6H5CH3', 'C2H6 and C2H5I', 'C6H5Cl and C6H5Br', 'C2H5I and C2H5OH'], 3),
  sc('The vapour pressure (at the normal boiling point of water) of an aqueous solution containing 28% by mass of a non-volatile solute (molar mass = 28) will be:',
    ['152 torr', '608 torr', '760 torr', '547 torr'], 1),
  sc('Which one of the following binary mixtures forms an azeotrope of the minimum-boiling-point type?',
    ['acetone – ethanol', 'H2O – HNO3', 'benzene – toluene', 'n-hexane – n-heptane'], 0),
  sc('At 80°C the vapour pressure of pure A is 520 mmHg and that of pure B is 1000 mmHg. A mixture of A and B boils at 80°C under 1 atm (760 mmHg). The amount of A in the mixture is:',
    ['52 mol %', '34 mol %', '48 mol %', '50 mol %'], 3),
  sc('Pick the correct statement:',
    ['Relative lowering of vapour pressure is independent of temperature', 'Osmotic pressure always depends on the nature of the solute', 'Elevation of boiling point depends on the nature of the solute', 'Lowering of freezing point is proportional to the molar concentration of solute'], 0),
  sc("Henry's law constant for oxygen is 1.4 × 10⁻³ mol L⁻¹ atm⁻¹ at 298 K. What mass of oxygen dissolves in 100 mL of water at 298 K when the partial pressure of oxygen is 0.5 atm?",
    ['1.4 g', '3.2 g', '22.4 mg', '2.24 mg'], 3),
  sc('If the intermolecular forces in liquids A, B and C are in the order A < B < C, which statement is correct?',
    ['B evaporates more readily than A', 'B evaporates less readily than C', 'A and B evaporate at the same rate', 'A evaporates more readily than C'], 3),
  sc("100 mL of liquid A was mixed with 25 mL of liquid B to give a non-ideal solution showing negative deviation from Raoult's law. The volume of the mixture would be:",
    ['75 mL', '125 mL', 'close to 125 mL, but not exceeding 125 mL', 'just more than 125 mL'], 2),
];

// ─── PDF2: Scientia_Solutions_QuestionBank.pdf — Raoult's Law, Ideal Solutions, Deviations & Azeotropes ──
// Answers: B B D A B A B C B

const raoultsLawAzeotropes: AnyQ[] = [
  sc('Formation of a solution from two components can be considered as: (i) Pure solvent → separated solvent molecules, ΔH1; (ii) Pure solute → separated solute molecules, ΔH2; (iii) Separated solvent and solute molecules → Solution, ΔH3. The solution so formed will be ideal if',
    ['ΔHsoln = ΔH3 − ΔH1 − ΔH2', 'ΔHsoln = ΔH1 + ΔH2 + ΔH3', 'ΔHsoln = ΔH1 + ΔH2 − ΔH3', 'ΔHsoln = ΔH1 − ΔH2 − ΔH3'], 1),
  sc('Which condition is not satisfied by an ideal solution?',
    ['ΔmixV = 0', 'ΔmixS = 0', "Obeyance to Raoult's law", 'ΔmixH = 0'], 1),
  sc('PA and PB are the vapour pressures of pure liquid components A and B of an ideal binary solution. If XA is the mole fraction of A, the total pressure of the solution will be',
    ['PA + XA(PB − PA)', 'PA + XA(PA − PB)', 'PB + XA(PB − PA)', 'PB + XA(PA − PB)'], 3),
  sc('Vapour pressures of chloroform (CHCl3) and dichloromethane (CH2Cl2) at 25°C are 200 mmHg and 41.5 mmHg respectively. The vapour pressure of the solution obtained by mixing 25.5 g of CHCl3 and 40 g of CH2Cl2 at the same temperature is (Molar mass: CHCl3 = 119.5 u, CH2Cl2 = 85 u)',
    ['90.92 mmHg', '115.0 mmHg', '147.9 mmHg', '285.5 mmHg'], 0),
  sc('Two liquids X and Y form an ideal solution at 300 K. The vapour pressure of a solution of 1 mol X and 3 mol Y is 550 mmHg. On adding 1 more mol of Y, the vapour pressure rises by 10 mmHg. The vapour pressures (mmHg) of pure X and pure Y respectively are',
    ['300 and 400', '400 and 600', '500 and 600', '200 and 300'], 1),
  sc('A solution of acetone in ethanol',
    ["shows a positive deviation from Raoult's law", 'behaves like a non-ideal solution', "obeys Raoult's law", "shows a negative deviation from Raoult's law"], 0),
  sc('Which of the following is true regarding azeotropes?',
    ['An azeotrope does not have the same composition in the vapour and liquid phases', 'Azeotropic mixtures cannot be separated into their constituents by fractional distillation', 'In a minimum-boiling azeotrope, the boiling point of the azeotrope is higher than that of either pure component', 'In a maximum-boiling azeotrope, the boiling point of the azeotrope is lower than that of either pure component'], 1),
  sc('An azeotropic solution of two liquids has a boiling point lower than either component when it',
    ["shows negative deviation from Raoult's law", 'shows no deviation from Raoult\'s law', "shows positive deviation from Raoult's law", 'is saturated'], 2),
  sc('Persons are medically considered to have lead poisoning if their blood lead concentration exceeds 10 micrograms of lead per decilitre of blood. This concentration in parts per billion (ppb) is',
    ['1000', '100', '10', '1'], 1),
];

// ─── PDF3: Scientia_Solutions_Set2_QuestionBank.pdf — Concentration Terms, Henry's Law, Ideal Solutions & Deviations — Set 2 ──
// Answers: A B B D B D B D B C

const concentrationHenrysLawSet2: AnyQ[] = [
  sc('Which of the following statements regarding the mole fraction (x) of a component in a solution is correct?',
    ['0 ≤ x ≤ 1', 'x ≤ 1', 'x is always non-negative', '−2 ≤ x ≤ 2'], 0),
  sc('The vapour pressure of water at 20°C is 17.24 mm Hg. When 20 g of a non-ionic substance is dissolved in 100 g of water, the vapour pressure is lowered by 0.30 mm Hg. The molecular mass of the substance is',
    ['200.8 g/mol', '206.88 g/mol', '210.5 g/mol', '215.2 g/mol'], 1),
  sc('25.3 g of sodium carbonate, Na2CO3, is dissolved in enough water to make 250 mL of solution. If it dissociates completely, the molar concentrations of Na+ and CO3²⁻ respectively are (Molar mass of Na2CO3 = 106 g mol⁻¹)',
    ['0.955 M and 1.910 M', '1.910 M and 0.955 M', '1.90 M and 1.910 M', '0.477 M and 0.477 M'], 1),
  sc('How many grams of concentrated nitric acid solution should be used to prepare 250 mL of 2.0 M HNO3? The concentrated acid is 70% HNO3 by mass.',
    ['90.0 g conc. HNO3', '70.0 g conc. HNO3', '54.0 g conc. HNO3', '45.0 g conc. HNO3'], 3),
  sc("The solubility of a solid in a liquid follows Solute + Solvent ⇌ Solution and obeys Le Chatelier's principle. Which of the following is correct?",
    ['ΔHsol > 0; solubility ↑; temperature ↓', 'ΔHsol < 0; solubility ↓; temperature ↑', 'ΔHsol > 0; solubility ↓; temperature ↑', 'ΔHsol < 0; solubility ↑; temperature ↑'], 1),
  sc("Which one of the following gases has the lowest value of Henry's law constant (KH)?",
    ['N2', 'He', 'H2', 'CO2'], 3),
  sc('At 15°C and 1 atm partial pressure of hydrogen, 20 mL of H2 (measured at STP) dissolves in 1 L of water. If the water is exposed to a gas mixture of total pressure 1500 mm Hg (excluding water vapour) containing 80% H2 by volume, the volume of H2 (at STP) that dissolves in 1 L of water is',
    ['20.0 mL', '31.6 mL', '36.1 mL', '26.3 mL'], 1),
  sc('For an ideal solution of two components A and B, which of the following is true?',
    ['ΔmixH < 0', 'ΔmixH > 0', 'A–B interaction is stronger than A–A and B–B interactions', 'A–A, B–B and A–B interactions are identical'], 3),
  sc('2 mol of liquid A (P°A = 100 torr) and 3 mol of liquid B (P°B = 150 torr) form a solution whose vapour pressure is 120 torr. From this one can conclude that',
    ['interaction between like molecules is greater than that between unlike molecules', 'interaction between like molecules is less than that between unlike molecules', 'interaction between like molecules is equal to that between unlike molecules', 'ΔmixS = 0'], 1),
  sc("100 mL of liquid A is mixed with 25 mL of liquid B to give a non-ideal solution showing negative deviation from Raoult's law. The volume of the mixture would be",
    ['75 mL', '125 mL', 'close to 125 mL, but not exceeding 125 mL', 'just more than 125 mL'], 2),
];

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Scientia Chemistry Classes — Solutions...\n');

  const subject = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry' },
  });

  const chapter = await prisma.chapter.upsert({
    where: { subjectId_name: { subjectId: subject.id, name: 'Solutions' } },
    update: {},
    create: { name: 'Solutions', subjectId: subject.id },
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

  const r1 = await seedTopic('MCQ Practice Bank', mcqPracticeBank);
  const r2 = await seedTopic("Raoult's Law & Azeotropes", raoultsLawAzeotropes);
  const r3 = await seedTopic("Concentration Terms & Henry's Law (Set 2)", concentrationHenrysLawSet2);

  const allResults = [r1, r2, r3];
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
