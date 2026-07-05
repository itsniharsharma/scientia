import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

const questions: AnyQ[] = [
  // Q104 — 2nd April 2nd Shift 2026
  sc(
    `Solution A is prepared by dissolving 1 g of a protein (molar mass = 50000 g mol⁻¹) in 0.5 L of water at 300 K. Its osmotic pressure is x bar. Solution B is made by dissolving 2 g of same protein in 1 L of water at 300 K. Osmotic pressure of solution B is y bar. Entire solution of A is mixed with entire solution of B at same temperature. The osmotic pressure of resultant solution is z bar. x, y and z respectively are (R = 0.083 L bar mol⁻¹ K⁻¹)`,
    [
      '9.96×10⁻⁴; 9.96×10⁻⁴; 9.96×10⁻⁴',
      '9.96×10⁻⁴; 9.96×10⁻⁴; 19.92×10⁻⁴',
      '4.98×10⁻⁴; 4.98×10⁻⁴; 9.96×10⁻⁴',
      '4.98×10⁻⁴; 4.98×10⁻⁴; 4.98×10⁻⁴',
    ],
    0
  ),
  // Q105 — 21st January 1st Shift 2026
  sc(
    `Elements P and Q form two types of non-volatile, non-ionizable compounds PQ and PQ₂. When 1 g of PQ is dissolved in 50 g of solvent 'A', ΔTb was 1.176 K while when 1 g of PQ₂ is dissolved in 50 g of solvent 'A', ΔTb was 0.689 K. (Kb of 'A' = 5 K kg mol⁻¹). The molar masses of elements P and Q (in g mol⁻¹) respectively, are`,
    ['65, 145', '25, 60', '70, 110', '60, 25'],
    1
  ),
  // Q106 — 24th January 1st Shift 2026
  sc(
    `A solution is prepared by dissolving 0.3 g of a non-volatile non-electrolyte solute 'A' of molar mass 60 g mol⁻¹ and 0.9 g of a non-volatile non-electrolyte solute 'B' of molar mass 180 g mol⁻¹ in 100 mL H₂O at 27°C. Osmotic pressure of the solution will be [Given: R = 0.082 L atm K⁻¹ mol⁻¹]`,
    ['1.47 atm', '2.46 atm', '0.82 atm', '1.23 atm'],
    1
  ),
  // Q107 — 3rd April 1st Shift 2025
  sc(
    `2 moles each of ethylene glycol and glucose are dissolved in 500 g of water. The boiling point of the resulting solution is (Given: Ebullioscopic constant of water = 0.52 K kg mol⁻¹)`,
    ['377.3 K', '277.3 K', '375.3 K', '379.2 K'],
    0
  ),
  // Q108 — 4th April 1st Shift 2025
  sc(
    `XY is the membrane/partition between two chambers 1 and 2 containing sugar solutions of concentration c₁ and c₂ (c₁ > c₂) mol L⁻¹. For the reverse osmosis to take place identify the correct condition. (Here p₁ and p₂ are pressures applied on chamber 1 and 2.)\nA. Membrane/Partition: Cellophane, p₁ > π\nB. Membrane/Partition: Porous, p₂ > π\nC. Membrane/Partition: Parchment paper, p₁ > π\nD. Membrane/Partition: Cellophane, p₂ > π\nChoose the correct answer from the options given below:`,
    ['B and D only', 'C only', 'A and D only', 'A and C only'],
    3
  ),
  // Q109 — 4th April 2nd Shift 2025
  sc(
    `Given below are two statements:\nStatement (I): Molal depression constant Kf is given by M₁RTf²/ΔSfus, where symbols have their usual meaning.\nStatement (II): Kf for benzene is less than the Kf for water.\nIn the light of the above statements, choose the most appropriate answer from the options given below:`,
    [
      'Statement I is incorrect but statement II is correct.',
      'Statement I is correct but statement II is incorrect.',
      'Both statement I and statement II are incorrect.',
      'Both statement I and statement II are correct.',
    ],
    1
  ),
  // Q110 — 23rd January 2nd Shift 2025
  sc(
    `When a non-volatile solute is added to the solvent, the vapour pressure of the solvent decreases by 10 mm of Hg. The mole fraction of the solute in the solution is 0.2. What would be the mole fraction of the solvent if decrease in vapour pressure is 20 mm of Hg?`,
    ['0.2', '0.4', '0.8', '0.6'],
    3
  ),
  // Q111 — 24th January 1st Shift 2025
  sc(
    `Consider the given plots of vapour pressure (VP) vs temperature (T/K). Which amongst the following options is correct graphical representation showing ΔTf, depression in the freezing point of a solvent in a solution?`,
    [
      'Curves labelled "Frozen Solvent" and "Solution"; ΔTf between Tf and Tf°',
      'Curves labelled "Liquid Solvent" and "Solution"; ΔTf between Tf and Tf°',
      'Curves "Frozen Solution / Liquid solvent" rising from a common point; ΔTf marked',
      'Curves "Frozen Solution / Solution" with "Liquid Solvent"; ΔTf marked',
    ],
    0
  ),
  // Q112 — 28th January 1st Shift 2025
  sc(
    `What is the freezing point depression constant of a solvent, 50 g of which contain 1 g non-volatile solute (molar mass 256 g mol⁻¹) and the decrease in freezing point is 0.40 K?`,
    ['5.12 K kg mol⁻¹', '3.72 K kg mol⁻¹', '4.43 K kg mol⁻¹', '1.86 K kg mol⁻¹'],
    0
  ),
  // Q113 — 28th January 2nd Shift 2025
  sc(
    `Assume a living cell with 0.9% (w/w) of glucose solution (aqueous). This cell is immersed in another solution having equal mole fraction of glucose and water. (Consider the data upto first decimal place only) The cell will:`,
    [
      'show no change in volume since solution is 0.9% (w/w)',
      'shrink since solution is 0.45% (w/w) as a result of association of glucose molecules (due to hydrogen bonding)',
      'shrink since solution is 0.5% (w/w)',
      'swell up since solution is 1% (w/w)',
    ],
    2
  ),
  // Q114 — 29th January 2nd Shift 2025
  sc(
    `Given below are two statements:\nStatement (I): NaCl is added to the ice at 0°C, present in the ice cream box to prevent the melting of ice cream.\nStatement (II): On addition of NaCl to ice at 0°C, there is a depression in freezing point.\nIn the light of the above statements, choose the correct answer from the options given below:`,
    [
      'Both statement I and statement II are false.',
      'Both statement I and statement II are true.',
      'Statement I is false but statement II is true.',
      'Statement I is true but statement II is false.',
    ],
    1
  ),
  // Q115 — 9th April 1st Shift 2024
  sc(
    `0.05 M CuSO₄ when treated with 0.01 M K₂Cr₂O₇ gives green colour solution of Cu₂Cr₂O₇. The two solutions are separated by a Semi Permeable Membrane (SPM) with K₂Cr₂O₇ on Side X and CuSO₄ on Side Y. Due to osmosis`,
    [
      'Green colour formation observed on side Y.',
      'Green colour formation observed on side X.',
      'Molarity of CuSO₄ solution is lowered.',
      'Molarity of K₂Cr₂O₇ solution is lowered.',
    ],
    2
  ),
  // Q116 — 30th January 1st Shift 2024
  sc(
    `What happens to freezing point of benzene when small quantity of naphthalene is added to benzene?`,
    ['First decreases and then increases', 'Remains unchanged', 'Decreases', 'Increases'],
    2
  ),
  // Q117 — 11th April 2nd Shift 2023
  sc(
    `What weight of glucose must be dissolved in 100 g of water to lower the vapour pressure by 0.20 mm Hg? (Assume dilute solution is being formed.) (Given: Vapour pressure of pure water is 54.2 mm Hg at room temperature. Molar mass of glucose is 180 g mol⁻¹.)`,
    ['4.69 g', '3.69 g', '2.59 g', '3.59 g'],
    1
  ),
  // Q118 — 24th January 1st Shift 2023
  sc(
    `In the depression of freezing point experiment:\nA. vapour pressure of the solution is less than that of pure solvent\nB. vapour pressure of the solution is more than that of pure solvent\nC. only solute molecules solidify at the freezing point\nD. only solvent molecules solidify at the freezing point\nChoose the most appropriate answer from the options given below.`,
    ['A only', 'B and C only', 'A and C only', 'A and D only'],
    3
  ),
  // Q119 — 29th January 2nd Shift 2023
  sc(
    `Match List I and List II.\nList I: A. Osmosis  B. Reverse osmosis  C. Electroosmosis  D. Electrophoresis\nList II: I. Solvent molecules pass through SPM towards solvent side.  II. Movement of charged colloidal particles under an applied electric potential towards oppositely charged electrodes.  III. Solvent molecules pass through SPM towards solution side.  IV. Dispersion medium moves in an electric field.\nChoose the correct answer from the options given below:`,
    ['A-I, B-III, C-IV, D-II', 'A-III, B-I, C-IV, D-II', 'A-I, B-III, C-II, D-IV', 'A-III, B-I, C-II, D-IV'],
    1
  ),
  // Q120 — 25th July 2nd Shift 2022
  sc(
    `Two solution A and B are prepared by dissolving 1 g of non-volatile solutes X and Y, respectively in 1 kg of water. The ratio of depression in freezing points for A and B is found to be 1 : 4. The ratio of molar masses of X and Y is`,
    ['1 : 4', '1 : 0.25', '1 : 0.20', '1 : 5'],
    1
  ),
  // Q121 — 27th July 1st Shift 2022
  sc(
    `Boiling point of a 2% aqueous solution of a non-volatile solute A is equal to the boiling point of 8% aqueous solution of a non-volatile solute B. The relation between molecular weights of A and B is`,
    ['MA = 4MB', 'MB = 4MA', 'MA = 8MB', 'MB = 8MA'],
    1
  ),
  // Q122 — 2nd September 1st Shift 2020
  sc(
    `An open beaker of water in equilibrium with water vapour is in a sealed container. When a few grams of glucose are added to the beaker of water, the rate at which water molecules`,
    [
      'leaves the vapour increases',
      'leaves the solution increases',
      'leaves the solution decreases',
      'leaves the vapour decreases.',
    ],
    2
  ),
  // Q123 — 2nd September 2nd Shift 2020
  sc(
    `The size of a raw mango shrinks to a much smaller size when kept in a concentrated salt solution. Which one of the following processes can explain this?`,
    ['Dialysis', 'Diffusion', 'Reverse osmosis', 'Osmosis'],
    3
  ),
  // Q124 — 6th September 2nd Shift 2020
  sc(
    `A set of solutions is prepared using 180 g of water as a solvent and 10 g of different non-volatile solutes A, B and C. The relative lowering of vapour pressure in the presence of these solutes are in the order [Given, molar mass of A = 100 g mol⁻¹; B = 200 g mol⁻¹; C = 10,000 g mol⁻¹]`,
    ['B > C > A', 'C > B > A', 'A > B > C', 'A > C > B'],
    2
  ),
  // Q125 — 7th January 2nd Shift 2020
  sc(
    `Two open beakers one containing a solvent and the other containing a mixture of that solvent with a non-volatile solute are together sealed in a container. Over time`,
    [
      'the volume of the solution increases and the volume of the solvent decreases',
      'the volume of solution and the solvent does not change',
      'the volume of the solution does not change and the volume of the solvent decreases',
      'the volume of the solution decreases and the volume of the solvent increases.',
    ],
    0
  ),
  // Q126 — 9th April 2nd Shift 2019
  sc(
    `At room temperature, a dilute solution of urea is prepared by dissolving 0.60 g of urea in 360 g of water. If the vapour pressure of pure water at this temperature is 35 mmHg, lowering of vapour pressure will be (molar mass of urea = 60 g mol⁻¹)`,
    ['0.031 mmHg', '0.028 mmHg', '0.017 mmHg', '0.027 mmHg'],
    2
  ),
  // Q127 — 10th April 2nd Shift 2019
  sc(
    `1 g of a non-volatile non-electrolyte solute is dissolved in 100 g of two different solvents A and B whose ebullioscopic constants are in the ratio of 1 : 5. The ratio of the elevation in their boiling points, ΔTb(A)/ΔTb(B), is`,
    ['5 : 1', '1 : 0.2', '10 : 1', '1 : 5'],
    3
  ),
  // Q128 — 12th April 2nd Shift 2019
  sc(
    `A solution is prepared by dissolving 0.6 g of urea (molar mass = 60 g mol⁻¹) and 1.8 g of glucose (molar mass = 180 g mol⁻¹) in 100 mL of water at 27°C. The osmotic pressure of the solution is (R = 0.08206 L atm K⁻¹ mol⁻¹)`,
    ['8.2 atm', '2.46 atm', '4.92 atm', '1.64 atm'],
    2
  ),
  // Q129 — 9th January 2nd Shift 2019
  sc(
    `A solution containing 62 g ethylene glycol in 250 g water is cooled to –10°C. If Kf for water is 1.86 K kg mol⁻¹, the amount of water (in g) separated as ice is`,
    ['64', '32', '16', '48'],
    0
  ),
  // Q130 — 10th January 2nd Shift 2019
  sc(
    `Elevation in the boiling point for 1 molal solution of glucose is 2 K. The depression in the freezing point for 2 molal solution of glucose in the same solvent is 2 K. The relation between Kb and Kf is`,
    ['Kb = 1.5 Kf', 'Kb = 0.5 Kf', 'Kb = 2Kf', 'Kb = Kf'],
    2
  ),
  // Q131 — 11th January 1st Shift 2019
  sc(
    `The freezing point of a diluted milk sample is found to be –0.2°C, while it should have been –0.5°C for pure milk. How much water has been added to pure milk to make the diluted sample?`,
    [
      '1 cup of water to 3 cups of pure milk',
      '2 cups of water to 3 cups of pure milk',
      '1 cup of water to 2 cups of pure milk',
      '3 cups of water to 2 cups of pure milk',
    ],
    3
  ),
  // Q132 — 12th January 1st Shift 2019
  sc(
    `Freezing point of a 4% aqueous solution of X is equal to freezing point of 12% aqueous solution of Y. If molecular weight of X is A, then molecular weight of Y is`,
    ['2A', '3A', 'A', '4A'],
    1
  ),
  // Q133 — Online 2018
  sc(
    `Two 5 molal solutions are prepared by dissolving a non-electrolyte, non-volatile solute separately in the solvents X and Y. The molecular weights of the solvents are Mx and My, respectively where Mx = ¾My. The relative lowering of vapour pressure of the solution in X is "m" times that of the solution in Y. Given that the number of moles of solute is very small in comparison to that of solvent, the value of "m" is`,
    ['3/4', '4/3', '1/2', '1/4'],
    0
  ),
  // Q134 — Online 2018
  sc(
    `The mass of a non-volatile, non-electrolyte solute (molar mass = 50 g mol⁻¹) needed to be dissolved in 114 g octane to reduce its vapour pressure to 75%, is`,
    ['50 g', '37.5 g', '75 g', '150 g'],
    3
  ),
  // Q135 — Online 2017
  sc(
    `A solution is prepared by mixing 8.5 g of CH₂Cl₂ and 11.95 g of CHCl₃. If vapour pressure of CH₂Cl₂ and CHCl₃ at 298 K are 415 and 200 mm Hg respectively, the mole fraction of CHCl₃ in vapour form is (Molar mass of Cl = 35.5 g mol⁻¹)`,
    ['0.675', '0.162', '0.486', '0.325'],
    3
  ),
  // Q136 — 2015
  sc(
    `The vapour pressure of acetone at 20°C is 185 torr. When 1.2 g of a non-volatile substance was dissolved in 100 g of acetone at 20°C, its vapour pressure was 183 torr. The molar mass (g mol⁻¹) of the substance is`,
    ['128', '488', '32', '64'],
    3
  ),
  // Q137 — Online 2013
  sc(
    `A molecule M associates in a given solvent according to the equation M ⇌ (M)n. For a certain concentration of M, the van't Hoff factor was found to be 0.9 and the fraction of associated molecules was 0.2. The value of n is`,
    ['3', '5', '2', '4'],
    2
  ),
  // Q138 — 2012
  sc(
    `Kf for water is 1.86 K kg mol⁻¹. If your automobile radiator holds 1.0 kg of water, how many grams of ethylene glycol (C₂H₆O₂) must you add to get the freezing point of the solution lowered to –2.8°C?`,
    ['93 g', '39 g', '27 g', '72 g'],
    0
  ),
  // Q139 — 2011
  sc(
    `Ethylene glycol is used as an antifreeze in a cold climate. Mass of ethylene glycol which should be added to 4 kg of water to prevent it from freezing at –6°C will be (Kf for water = 1.86 K kg mol⁻¹, and molar mass of ethylene glycol = 62 g mol⁻¹)`,
    ['804.32 g', '204.30 g', '400.00 g', '304.60 g'],
    0
  ),
  // Q140 — Re-Scheduled 2011
  sc(
    `A 5% solution of cane sugar (molar mass 342) is isotonic with 1% of a solution of an unknown solute. The molar mass of unknown solute in g/mol is:`,
    ['171.2', '68.4', '34.2', '136.2'],
    1
  ),
  // Q141 — 2007
  sc(
    `A 5.25% solution of a substance is isotonic with a 1.5% solution of urea (molar mass = 60 g mol⁻¹) in the same solvent. If the densities of both the solutions are assumed to be equal to 1.0 g cm⁻³, molar mass of the substance will be`,
    ['210.0 g mol⁻¹', '90.0 g mol⁻¹', '115.0 g mol⁻¹', '105.0 g mol⁻¹'],
    0
  ),
  // Q142 — 2006
  sc(
    `18 g of glucose (C₆H₁₂O₆) is added to 178.2 g of water. The vapour pressure of water for this aqueous solution at 100°C is`,
    ['759.00 torr', '7.60 torr', '76.00 torr', '752.40 torr'],
    3
  ),
  // Q143 — 2005
  sc(
    `Equimolal solutions in the same solvent have`,
    [
      'same boiling point but different freezing point',
      'same freezing point but different boiling point',
      'same boiling and same freezing points',
      'different boiling and different freezing points.',
    ],
    2
  ),
];

async function main() {
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

  const topic = await prisma.topic.upsert({
    where: { chapterId_name: { chapterId: chapter.id, name: 'Colligative Properties of Dilute Solutions' } },
    update: {},
    create: { name: 'Colligative Properties of Dilute Solutions', chapterId: chapter.id },
  });

  let created = 0;
  let skipped = 0;

  for (const q of questions) {
    const existing = await prisma.question.findFirst({
      where: { topicId: topic.id, questionText: q.questionText },
    });

    if (existing) {
      skipped++;
      continue;
    }

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

  console.log(`Done — created: ${created}, skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
