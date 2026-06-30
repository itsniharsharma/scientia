/**
 * Seed: JEE Main Electrochemistry questions (16 SINGLE_CHOICE)
 * Run: npx tsx --env-file ../.env src/seed/seed-electrochemistry.ts
 *
 * Subject : Chemistry
 *   Chapter: Electrochemistry
 *     Topic : JEE Main
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Opt = { optionText: string; isCorrect: boolean };
type Q = { questionText: string; options: Opt[] };

function sc(text: string, options: string[], correctIndex: number): Q {
  return {
    questionText: text,
    options: options.map((o, i) => ({ optionText: o, isCorrect: i === correctIndex })),
  };
}

const questions: Q[] = [
  sc(
    'The standard electrode potential E° and its temperature coefficient (dE°/dT) for a cell are 2V and –5×10⁻⁴ VK⁻¹ at 300K respectively. The cell reaction is Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s). The standard reaction enthalpy (ΔrH°) at 300K in kJ mol⁻¹ is: [Use R = 8 JK⁻¹mol⁻¹ and F = 96,000 Cmol⁻¹]',
    ['–412.8', '–384.0', '206.4', '192.0'],
    0,
  ),
  sc(
    'Λ°m for NaCl, HCl and NaA are 126.4, 425.9 and 100.5 S cm²mol⁻¹ respectively. If the conductivity of 0.001 M HA is 5×10⁻⁵ S cm⁻¹, degree of dissociation of HA is:',
    ['0.75', '0.125', '0.25', '0.50'],
    1,
  ),
  sc(
    'Consider the following reduction processes:\nZn²⁺ + 2e⁻ → Zn(s); E° = –0.76 V\nCa²⁺ + 2e⁻ → Ca(s); E° = –2.87 V\nMg²⁺ + 2e⁻ → Mg(s); E° = –2.36 V\nNi²⁺ + 2e⁻ → Ni(s); E° = –0.25 V\nThe reducing power of the metals increases in the order:',
    ['Ca < Zn < Mg < Ni', 'Ni < Zn < Mg < Ca', 'Zn < Mg < Ni < Ca', 'Ca < Mg < Zn < Ni'],
    1,
  ),
  sc(
    'In the cell: Pt(s)|H₂(g, 1bar)|HCl(aq)|AgCl(s)|Ag(s)|Pt(s), the cell potential is 0.92V when a 10⁻⁶ molal HCl solution is used. The standard electrode potential of (AgCl/Ag,Cl⁻) electrode is: [Given: 2.303RT/F = 0.06V at 298K]',
    ['0.20 V', '0.76 V', '0.40 V', '0.94 V'],
    0,
  ),
  sc(
    'The anodic half-cell of lead-acid battery is recharged using electricity of 0.05 Faraday. The amount of PbSO₄ electrolyzed in g during the process is: (Molar mass of PbSO₄ = 303 g mol⁻¹)',
    ['22.8', '15.2', '7.6', '11.4'],
    1,
  ),
  sc(
    'For the cell Zn(s)|Zn²⁺(aq)||Mˣ⁺(aq)|M(s), the standard electrode potentials are: Au³⁺/Au = +1.40V, Ag⁺/Ag = +0.80V, Fe³⁺/Fe²⁺ = +0.77V, Fe²⁺/Fe = –0.44V. If E°(Zn²⁺/Zn) = –0.76V, which cathode will give a maximum value of E°cell per electron transferred?',
    ['Fe³⁺ / Fe²⁺', 'Ag⁺ / Ag', 'Au³⁺ / Au', 'Fe²⁺ / Fe'],
    1,
  ),
  sc(
    'If the standard electrode potential for a cell is 2V at 300K, the equilibrium constant (K) for the reaction Zn(s) + Cu²⁺(aq) ⇌ Zn²⁺(aq) + Cu(s) at 300K is approximately: (R = 8 JK⁻¹mol⁻¹, F = 96000 Cmol⁻¹)',
    ['e¹⁶⁰', 'e³²⁰', 'e⁻¹⁶⁰', 'e⁻⁸⁰'],
    0,
  ),
  sc(
    'Given the equilibrium constant Kc of the reaction Cu(s) + 2Ag⁺(aq) → Cu²⁺(aq) + 2Ag(s) is 10×10¹⁵, calculate the E°cell of this reaction at 298K. [2.303RT/F at 298K = 0.059V]',
    ['0.04736 V', '0.4736 V', '0.4736 mV', '0.04736 mV'],
    1,
  ),
  sc(
    'Given that: E°(O₂/H₂O) = +1.23V, E°(S₂O₈²⁻/SO₄²⁻) = +2.05V, E°(Br₂/Br⁻) = +1.09V, E°(Au³⁺/Au) = +1.4V. The strongest oxidizing agent is:',
    ['O₂', 'Br₂', 'S₂O₈²⁻', 'Au³⁺'],
    2,
  ),
  sc(
    'Calculate the standard cell potential (in V) of the cell in which the following reaction takes place: Fe²⁺(aq) + Ag⁺(aq) → Fe³⁺(aq) + Ag(s). Given that E°(Ag⁺/Ag) = xV, E°(Fe²⁺/Fe) = yV, E°(Fe³⁺/Fe) = zV.',
    ['x + 2y – 3z', 'x – z', 'x – y', 'x + y – z'],
    0,
  ),
  sc(
    'The standard Gibbs energy for the given cell reaction in kJ mol⁻¹ at 298K is: Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s), E° = 2V at 298K. (Faraday\'s constant F = 96000 C mol⁻¹)',
    ['–384', '–192', '192', '384'],
    0,
  ),
  sc(
    'A solution of Ni(NO₃)₂ is electrolysed between platinum electrodes using 0.1 Faraday electricity. How many moles of Ni will be deposited at the cathode?',
    ['0.20', '0.05', '0.10', '0.15'],
    1,
  ),
  sc(
    'Consider the statements S1 and S2:\nS1: Conductivity always increases with decrease in the concentration of electrolyte.\nS2: Molar conductivity always increases with decrease in the concentration of electrolyte.\nThe correct option is:',
    [
      'Both S1 and S2 are correct',
      'S1 is wrong and S2 is correct',
      'S1 is correct and S2 is wrong',
      'Both S1 and S2 are wrong',
    ],
    1,
  ),
  sc(
    'Which one of the following graphs between molar conductivity (Λm) versus √C is correct for strong electrolytes NaCl and KCl? (KCl has higher molar conductivity than NaCl at all concentrations; both show linear decrease with √C)',
    [
      'Graph (1): NaCl above KCl, both linear decreasing',
      'Graph (2): KCl above NaCl, both linear decreasing',
      'Graph (3): KCl above NaCl but lines converge at high √C',
      'Graph (4): KCl and NaCl overlap',
    ],
    1,
  ),
  sc(
    'Given:\nCo³⁺ + e⁻ → Co²⁺; E° = +1.81 V\nPb⁴⁺ + 2e⁻ → Pb²⁺; E° = +1.67 V\nCe⁴⁺ + e⁻ → Ce³⁺; E° = +1.61 V\nBi³⁺ + 3e⁻ → Bi; E° = +0.20 V\nOxidizing power of the species will increase in the order:',
    ['Ce⁴⁺ < Pb⁴⁺ < Bi³⁺ < Co³⁺', 'Co³⁺ < Pb⁴⁺ < Ce⁴⁺ < Bi³⁺', 'Co³⁺ < Ce⁴⁺ < Bi³⁺ < Pb⁴⁺', 'Bi³⁺ < Ce⁴⁺ < Pb⁴⁺ < Co³⁺'],
    3,
  ),
  sc(
    'The decreasing order of electrical conductivity of the following aqueous solutions is:\n0.1 M Formic acid (A)\n0.1 M Acetic acid (B)\n0.1 M Benzoic acid (C)',
    ['C > B > A', 'A > B > C', 'A > C > B', 'C > A > B'],
    2,
  ),
];

async function main() {
  // ── Ensure Subject → Chapter → Topic exist ────────────────────────────────
  const subject = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry' },
  });

  const chapter = await prisma.chapter.upsert({
    where: { subjectId_name: { subjectId: subject.id, name: 'Electrochemistry' } },
    update: {},
    create: { subjectId: subject.id, name: 'Electrochemistry' },
  });

  const topic = await prisma.topic.upsert({
    where: { chapterId_name: { chapterId: chapter.id, name: 'JEE Main' } },
    update: {},
    create: { chapterId: chapter.id, name: 'JEE Main' },
  });

  console.log(`Topic: ${topic.name} (${topic.id})`);

  // ── Insert questions ───────────────────────────────────────────────────────
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
        type: 'SINGLE_CHOICE',
        status: 'PUBLISHED',
        questionText: q.questionText,
        options: {
          create: q.options.map((o, i) => ({
            position: i,
            optionText: o.optionText,
            isCorrect: o.isCorrect,
          })),
        },
      },
    });

    created++;
    console.log(`  ✓ Q${created + skipped}: ${q.questionText.slice(0, 60)}...`);
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped (already exist).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
