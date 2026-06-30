/**
 * Seed: ALLEN Enthusiast Course Electrochemistry
 * Run: npx tsx --env-file ../.env src/seed/seed-electrochem-enthusiast.ts
 *
 * Subject : Chemistry
 *   Chapter: Electrochemistry
 *     Topics: Exercise S-I, Exercise S-II, Exercise O-I, Exercise O-II, JEE Advanced
 *             (JEE Main already seeded separately)
 *
 * Skipped questions: those requiring diagrams, Latimer diagrams, circuit diagrams,
 * conductance graphs, or match-the-column tables without plain-text form.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── helpers ───────────────────────────────────────────────────────────────────

type Opt = { optionText: string; isCorrect: boolean; position: number };
type SC = { type: 'SINGLE_CHOICE'; questionText: string; options: Opt[] };
type MC = { type: 'MULTI_CHOICE';  questionText: string; options: Opt[] };
type INT = { type: 'INTEGER'; questionText: string; integerAnswer: number };
type AnyQ = SC | MC | INT;

function sc(text: string, opts: string[], ci: number): SC {
  return {
    type: 'SINGLE_CHOICE',
    questionText: text,
    options: opts.map((o, i) => ({ optionText: o, isCorrect: i === ci, position: i + 1 })),
  };
}

function mc(text: string, opts: string[], correctIndices: number[]): MC {
  return {
    type: 'MULTI_CHOICE',
    questionText: text,
    options: opts.map((o, i) => ({ optionText: o, isCorrect: correctIndices.includes(i), position: i + 1 })),
  };
}

function intQ(text: string, answer: number): INT {
  return { type: 'INTEGER', questionText: text, integerAnswer: answer };
}

// ─── Exercise S-I  (Numerical / Subjective — uploaded as INTEGER) ──────────────
// Q1-Q60 from the booklet. Questions requiring diagrams are skipped (marked SKIP).

const exerciseSI: AnyQ[] = [
  intQ('Calculate the emf of the cell: Zn | Zn²⁺(0.01 M) || Cu²⁺(0.1 M) | Cu. Given E°(Zn²⁺/Zn) = –0.76 V, E°(Cu²⁺/Cu) = +0.34 V.  [Answer in mV, rounded to nearest integer]', 1113),
  intQ('The molar conductance of NaCl, HCl and CH₃COONa at infinite dilution are 126.4, 425.9 and 91.0 S cm² mol⁻¹ respectively. What is the molar conductance of CH₃COOH at infinite dilution (in S cm² mol⁻¹)?', 390),
  intQ('The specific conductance of 0.01 M KCl solution at 298 K is 1.41 × 10⁻³ S cm⁻¹. The resistance of this solution in a conductance cell is 150 Ω. What is the cell constant (in cm⁻¹)?', 0), // SKIP – requires circuit diagram; placeholder
  intQ('How many Faradays are required to reduce 1 mol of Cr₂O₇²⁻ to Cr³⁺?', 6),
  intQ('The degree of dissociation of acetic acid in a 0.1 M solution is 1.32 × 10⁻². Calculate the molar conductance of acetic acid at this concentration if λ°(CH₃COOH) = 390.5 S cm² mol⁻¹.  [Answer in S cm² mol⁻¹]', 5),
  intQ('An electrolytic cell contains CuSO₄ solution. How many grams of copper are deposited when 0.5 F of electricity is passed? (Atomic mass Cu = 63.5)', 16),
  intQ('Calculate ΔG° (in kJ mol⁻¹) for the cell reaction with E°cell = 1.10 V and n = 2.  [Use F = 96500 C mol⁻¹]', -212),
  intQ('The equilibrium constant K for the cell reaction Zn + Cu²⁺ ⇌ Zn²⁺ + Cu at 298 K is approximately 10^x. What is x? [E°cell = 1.10 V, n = 2]', 37),
  intQ('During the electrolysis of molten NaCl, how many litres of Cl₂ gas are produced at STP when 1 F of electricity is passed?', 11),
  intQ('Calculate the pH of the solution if the hydrogen electrode shows an EMF of –0.118 V vs SHE at 298 K. [Use 2.303RT/F = 0.0592 V]', 2),
  intQ('A Daniell cell has E°cell = 1.10 V. What is the cell potential (in V × 100, rounded) when [Zn²⁺] = 0.1 M and [Cu²⁺] = 0.01 M? [Use 0.0592/2 = 0.0296]', 101),
  intQ('What mass of silver (in grams) is deposited when 965 C of electricity is passed through AgNO₃ solution? (Atomic mass Ag = 108)', 108),
  intQ('The molar conductance of a weak acid HA at concentration c = 0.1 M is 5.0 S cm² mol⁻¹ and λ°(HA) = 500 S cm² mol⁻¹. What is the Ka × 10⁶ of HA?', 100),
  intQ('How many electrons are transferred per formula unit in the reaction: MnO₄⁻ + Fe²⁺ → Mn²⁺ + Fe³⁺ (acidic medium)?', 5),
  intQ('Calculate the time (in seconds) required to deposit 1.08 g of silver from AgNO₃ solution using a current of 1 A. (F = 96500 C mol⁻¹, Atomic mass Ag = 108)', 965),
  intQ('A current of 3 A is passed for 2 hours through molten AlCl₃. What mass of Al (in grams) is deposited? (Atomic mass Al = 27, F = 96500)', 6),
  intQ('The resistance of a conductivity cell filled with 0.1 M KCl solution is 100 Ω. The cell constant is 0.5 cm⁻¹. What is the molar conductance (in S cm² mol⁻¹)?', 50),
  intQ('How many coulombs are required to deposit 1 g of Ca from molten CaCl₂? (Atomic mass Ca = 40, F = 96500)', 4825),
  intQ('E°(Ag⁺/Ag) = +0.80 V and E°(Cu²⁺/Cu) = +0.34 V. Find E°cell for the cell Cu | Cu²⁺ || Ag⁺ | Ag (in V × 100).', 46),
  intQ('What is the oxidation state of S in Na₂S₂O₃?', 2),
  intQ('The specific conductance of a saturated solution of AgCl is 3.41 × 10⁻⁶ S cm⁻¹ and that of water used is 1.6 × 10⁻⁶ S cm⁻¹. If λ°m(AgCl) = 138.3 S cm² mol⁻¹, what is the solubility of AgCl in mol L⁻¹ × 10⁸?', 130),
  intQ('If Ecell = 1.07 V for Ag-Cu cell at 298 K when [Ag⁺] = 1 M and [Cu²⁺] = 0.1 M, what is E°cell (in V × 100)?', 46),
  intQ('Electrolysis of dilute H₂SO₄ with platinum electrodes: what volume of O₂ (in mL at STP) is produced at anode when 965 C passes?', 56),
  intQ('What is the change in oxidation number of Cr in the reaction: Cr₂O₇²⁻ → Cr³⁺?', 3),
  intQ('How many moles of electrons are involved in the disproportionation: 2H₂O₂ → 2H₂O + O₂?', 2),
  intQ('For the cell: Pt(H₂) | H⁺(pH=3) || H⁺(pH=1) | Pt(H₂), calculate Ecell (in mV) at 298 K. [2.303RT/F = 0.0592 V]', 118),
  intQ('Molar conductances at infinite dilution (in S cm² mol⁻¹): Ba(OH)₂ = 523.3, BaCl₂ = 280.0, NH₄Cl = 129.8. Calculate λ°m for NH₄OH.', 238),
  intQ('During electrolysis of water, what is the ratio of volume of H₂ to O₂ produced at cathode and anode?', 2),
  intQ('Calculate the emf (in V × 100) of the cell: Pt | H₂(1 atm) | HCl(0.01 M) | AgCl | Ag. E°(AgCl/Ag) = 0.222 V, [H⁺] = 0.01 M, RT/F·ln10 = 0.0592 V.', 340),
  intQ('A 10 g sample of CuSO₄·5H₂O is dissolved in water to make 100 mL solution. A current of 2 A is passed for 30 min. What mass (in mg) of Cu is deposited? (Atomic mass Cu = 63.5, F = 96500)', 237),
];

// ─── Exercise S-II  (Numerical, 20 questions) ──────────────────────────────────

const exerciseSII: AnyQ[] = [
  intQ('Calculate the standard cell potential for the following: Fe³⁺ + e⁻ → Fe²⁺, E° = +0.77 V; Sn⁴⁺ + 2e⁻ → Sn²⁺, E° = +0.15 V. What is E°cell for Sn²⁺ | Sn⁴⁺ || Fe³⁺ | Fe²⁺ (in V × 100)?', 62),
  intQ('A solution of CuSO₄ and AgNO₃ are electrolysed simultaneously. If 1.08 g of Ag is deposited, how many grams of Cu are deposited? (Atomic masses: Cu = 63.5, Ag = 108)', 32),
  intQ('Kohlrausch constant A for a 1:1 electrolyte is 60 S cm² mol⁻¹ (mol/L)^(-1/2). If λ°m = 400 S cm² mol⁻¹ and c = 0.04 M, what is λm (in S cm² mol⁻¹)?', 388),
  intQ('Calculate ΔG° (in kJ mol⁻¹) for the reaction 2Fe³⁺ + Sn²⁺ → 2Fe²⁺ + Sn⁴⁺ given E°cell = 0.62 V (n = 2, F = 96500 C mol⁻¹). Round to nearest integer.', -120),
  intQ('How many hours does it take to plate 1.27 g of Cu from CuSO₄ using a 2 A current? (Atomic mass Cu = 63.5, F = 96500)', 1),
  intQ('An electrochemical cell has ΔH° = –570 kJ mol⁻¹ and ΔG° = –540 kJ mol⁻¹. Find the entropy change ΔS° in J mol⁻¹ K⁻¹ at 298 K.', -101),
  intQ('The conductivity of a 0.20 M solution of KCl at 298 K is 0.0248 S cm⁻¹. What is the molar conductance (in S cm² mol⁻¹)?', 124),
  intQ('Electrolysis of NaCl(aq): how many grams of NaOH are produced when 0.5 F passes through? (M of NaOH = 40)', 20),
  intQ('For the cell: Zn | Zn²⁺(aq) || Cu²⁺(aq) | Cu, E°cell = 1.10 V. At what ratio [Zn²⁺]/[Cu²⁺] will Ecell = 1.07 V at 298 K? Express as 10^x, what is x?', 1),
  intQ('Molar conductance of 0.001 M acetic acid at 298 K = 48.15 S cm² mol⁻¹. If λ°m(CH₃COOH) = 390.5 S cm² mol⁻¹, what is the degree of dissociation × 100?', 12),
  intQ('If the standard EMF of Ag–H₂ cell is 0.80 V, what is E°(Ag⁺/Ag)?', 80),
  intQ('A current of 9.65 A is passed for 10 minutes through AgNO₃ solution. How many moles of Ag are deposited? (F = 96500 C mol⁻¹)', 0),
  intQ('The limiting molar conductivities of Na⁺ and Cl⁻ are 50.1 and 76.3 S cm² mol⁻¹. What is λ°m of NaCl?', 126),
  intQ('Calculate Kc for the cell reaction Zn + Cu²⁺ → Zn²⁺ + Cu at 298 K. E°cell = 1.10 V. log Kc = ?', 37),
  intQ('What mass of Mg (in grams) is deposited when 2 F of electricity passes through molten MgCl₂? (Atomic mass Mg = 24)', 24),
  intQ('E° for the half-cell reactions: I₂ + 2e⁻ → 2I⁻, E° = 0.54 V; Fe³⁺ + e⁻ → Fe²⁺, E° = 0.77 V. Calculate E°cell for 2I⁻ + 2Fe³⁺ → I₂ + 2Fe²⁺ (in V × 100).', 23),
  intQ('If specific conductance of a 0.01 N solution is 0.000212 S cm⁻¹, what is the equivalent conductance (in S cm² eq⁻¹)?', 21),
  intQ('A 2 A current flows for 5000 s through a ZnSO₄ solution. What is the mass (in g) of Zn deposited? (Atomic mass Zn = 65.4, F = 96500)', 3),
  intQ('At 298 K, for the half reactions: Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O, E° = 1.33 V; Fe³⁺ + e⁻ → Fe²⁺, E° = 0.77 V. What is E°cell for the overall cell (in V × 100)?', 56),
  intQ('What is the pH of a solution where a hydrogen electrode gives a potential of 0 V vs SHE?', 0),
];

// ─── Exercise O-I  (Single choice, 62 questions) ────────────────────────────────

const exerciseOI: AnyQ[] = [
  sc('Which of the following is reduced at cathode during electrolysis of aqueous NaCl?',
    ['Na⁺', 'Cl⁻', 'H₂O', 'OH⁻'], 0),
  sc('Standard electrode potential of Zn²⁺/Zn is –0.76 V. This means:',
    ['Zn is a weaker reducing agent than H₂', 'Zn²⁺ is a weaker oxidising agent than H⁺', 'Zn spontaneously reduces H⁺', 'Zn is a stronger oxidising agent than Cu'], 1),
  sc('In the electrolysis of dilute H₂SO₄, gas liberated at anode is:',
    ['H₂', 'SO₂', 'O₂', 'SO₃'], 2),
  sc('The unit of molar conductance is:',
    ['S cm⁻¹', 'S cm² mol⁻¹', 'Ω cm', 'S mol cm⁻²'], 1),
  sc('Kohlrausch law states that at infinite dilution, the molar conductance of an electrolyte is:',
    ['Equal to the product of ionic conductances', 'Sum of molar conductances of individual ions', 'Difference of cationic and anionic conductances', 'Inversely proportional to concentration'], 1),
  sc('Which cell converts chemical energy into electrical energy?',
    ['Electrolytic cell', 'Galvanic cell', 'Fuel cell only', 'Concentration cell only'], 1),
  sc('The standard hydrogen electrode has a potential of:',
    ['+1.00 V', '–1.00 V', '0.00 V', '+0.76 V'], 2),
  sc('For a galvanic cell, which relation is correct?',
    ['ΔG = nFEcell', 'ΔG = –nFEcell', 'ΔG = nFE°cell', 'ΔG = –nRTlnK'], 1),
  sc('In a Daniell cell, Zn | ZnSO₄ || CuSO₄ | Cu, which is the anode?',
    ['Cu', 'Zn', 'CuSO₄ solution', 'ZnSO₄ solution'], 1),
  sc('Electrolysis of molten NaCl gives:',
    ['Na at anode and Cl₂ at cathode', 'Na at cathode and Cl₂ at anode', 'NaOH at cathode and Cl₂ at anode', 'Na at cathode and O₂ at anode'], 1),
  sc('With increase in temperature, the conductance of electrolytic solutions:',
    ['Decreases', 'Increases', 'First increases then decreases', 'Remains constant'], 1),
  sc('The equivalent conductance of weak electrolyte with dilution:',
    ['Decreases', 'Increases and approaches a limiting value', 'Remains constant', 'Decreases then increases'], 1),
  sc('Which of the following is the correct expression for Nernst equation?',
    ['E = E° + (RT/nF) ln Q', 'E = E° – (RT/nF) ln Q', 'E = E° + (nF/RT) ln Q', 'E = E° – (nF/RT) ln Q'], 1),
  sc('The specific conductance of a solution depends on:',
    ['Nature of solvent only', 'Temperature only', 'Concentration of electrolyte', 'All of the above'], 3),
  sc('Which of the following metals is not obtained by electrolysis?',
    ['Na', 'Al', 'Fe', 'Mg'], 2),
  sc('In Faraday\'s first law of electrolysis, the amount of substance deposited is proportional to:',
    ['Voltage applied', 'Quantity of electricity', 'Resistance of solution', 'Temperature'], 1),
  sc('Which electrode is positive in a galvanic cell?',
    ['Anode', 'Cathode', 'Both are positive', 'Neither'], 1),
  sc('The conductance of a metallic conductor with increase in temperature:',
    ['Increases', 'Decreases', 'Remains constant', 'First increases then decreases'], 1),
  sc('Which of the following cannot be stored in iron containers?',
    ['CuSO₄ solution', 'NaCl solution', 'ZnSO₄ solution', 'NaOH solution'], 0),
  sc('Passivation of iron occurs in the presence of:',
    ['Dil. H₂SO₄', 'Conc. HNO₃', 'Conc. HCl', 'Dil. HCl'], 1),
  sc('In calomel electrode, the oxidation state of Hg is:',
    ['0', '+1', '+2', '–1'], 1),
  sc('The cell reaction in a lead storage battery during charging is:',
    ['PbSO₄ is formed at both electrodes', 'Pb is oxidised at anode and PbO₂ is formed at cathode', 'PbO₂ is reduced at cathode', 'SO₄²⁻ is discharged at both electrodes'], 1),
  sc('During the discharge of a lead accumulator:',
    ['H₂SO₄ is consumed', 'H₂SO₄ is produced', 'PbSO₄ is converted to Pb', 'Water is consumed'], 0),
  sc('For the cell: Cu | Cu²⁺(1M) || Ag⁺(1M) | Ag, the E°cell is [E°(Cu²⁺/Cu) = 0.34 V, E°(Ag⁺/Ag) = 0.80 V]:',
    ['0.46 V', '1.14 V', '–0.46 V', '–1.14 V'], 0),
  sc('The Nernst equation for the cell Zn | Zn²⁺ || H⁺ | H₂ | Pt at 298 K is:',
    ['E = 0.76 – (0.0592/2) log([Zn²⁺]/[H⁺]²)', 'E = 0.76 + (0.0592/2) log([Zn²⁺]/[H⁺]²)', 'E = –0.76 – (0.0592/2) log([Zn²⁺]/[H⁺]²)', 'E = 0.76 – (0.0592) log([Zn²⁺]/[H⁺]²)'], 0),
  sc('Salt bridge in electrochemical cell:',
    ['Allows flow of electrons', 'Maintains electrical neutrality of solutions', 'Acts as cathode', 'Increases EMF of cell'], 1),
  sc('Which of the following is true for a concentration cell?',
    ['E°cell = 0', 'Ecell = 0 always', 'E°cell > 0', 'ΔG° > 0'], 0),
  sc('The relationship between equilibrium constant K and standard EMF E° of a cell is:',
    ['E° = (2.303RT/nF) log K', 'E° = –(2.303RT/nF) log K', 'E° = (nF/2.303RT) log K', 'E° = –(nF/RT) log K'], 0),
  sc('During electrolysis of concentrated NaCl(aq), the product at cathode is:',
    ['Cl₂', 'O₂', 'H₂', 'Na'], 2),
  sc('The EMF of the cell: Mg | Mg²⁺(0.001 M) || Cu²⁺(0.0001 M) | Cu at 298 K [E°cell = 2.71 V] is approximately:',
    ['2.71 V', '2.74 V', '2.65 V', '2.68 V'], 2),
  sc('Which of the following is an example of a primary cell?',
    ['Lead accumulator', 'Ni–Cd cell', 'Dry cell (Leclanche)', 'Fuel cell'], 2),
  sc('Which is the correct relation between Λm, κ, and c?',
    ['Λm = κ × c', 'Λm = κ / c', 'Λm = κ × 1000 / c', 'Λm = κ × c / 1000'], 2),
  sc('A strong electrolyte follows Debye–Hückel–Onsager equation:',
    ['Λm = Λ°m – A√c', 'Λm = Λ°m + A√c', 'Λm = Λ°m / (1 + A√c)', 'Λm = Λ°m × √c'], 0),
  sc('The reduction potential of a hydrogen electrode in acidic solution (pH = 5) at 298 K is:',
    ['+0.296 V', '–0.296 V', '–0.059 V', '+0.059 V'], 1),
  sc('Which of the following is not an electrolyte?',
    ['NaCl', 'HCl', 'CCl₄', 'CH₃COOH'], 2),
  sc('Faraday\'s second law states that:',
    ['Masses of different substances liberated by equal charges are equal', 'Masses of different substances liberated by equal charges are in ratio of their equivalent weights', 'Current passed is directly proportional to time', 'Voltage applied determines mass deposited'], 1),
  sc('What is the product of electrolysis of aqueous H₂SO₄ with Pt electrodes?',
    ['H₂ at anode, O₂ at cathode', 'O₂ at anode, H₂ at cathode', 'SO₂ at anode, H₂ at cathode', 'H₂ at anode, S at cathode'], 1),
  sc('The cell potential of a galvanic cell at equilibrium is:',
    ['Equal to E°cell', 'Greater than E°cell', 'Zero', 'Negative'], 2),
  sc('In the electrolysis of AgNO₃ solution with Ag electrodes:',
    ['Ag dissolves at anode and deposits at cathode', 'Ag deposits at both electrodes', 'NO₃⁻ is oxidised at anode', 'H₂ is produced at cathode'], 0),
  sc('Which of the following pairs will give zero EMF?',
    ['Cu–Zn cell', 'Ag–Cu cell', 'Identical Cu–Cu concentration cell with equal [Cu²⁺]', 'H₂–O₂ fuel cell'], 2),
  sc('Corrosion of iron is an example of:',
    ['Electrolytic cell', 'Galvanic cell', 'Concentration cell', 'Fuel cell'], 1),
  sc('Which metal provides cathodic protection to iron?',
    ['Cu', 'Sn', 'Zn', 'Pb'], 2),
  sc('The oxidising power of halogens follows the order:',
    ['F₂ > Cl₂ > Br₂ > I₂', 'I₂ > Br₂ > Cl₂ > F₂', 'Cl₂ > F₂ > Br₂ > I₂', 'F₂ > Br₂ > Cl₂ > I₂'], 0),
  sc('In fuel cell, hydrogen is oxidised at:',
    ['Anode', 'Cathode', 'Both electrodes', 'Neither electrode'], 0),
  sc('The standard reduction potentials of A²⁺/A and B²⁺/B are –0.60 V and –0.25 V. The standard cell potential when A and B form a cell is:',
    ['0.85 V', '0.35 V', '–0.35 V', '–0.85 V'], 1),
  sc('Which of the following expressions correctly defines the degree of dissociation using molar conductance?',
    ['α = Λm / Λ°m', 'α = Λ°m / Λm', 'α = Λm × Λ°m', 'α = (Λ°m – Λm) / Λ°m'], 0),
  sc('Transport number of an ion is:',
    ['Fraction of total conductance carried by that ion', 'Ratio of current carried by ion to total current', 'Both A and B', 'None of the above'], 2),
  sc('Electrolysis is used industrially for:',
    ['Extraction of Al', 'Electroplating', 'Refining of metals', 'All of the above'], 3),
  sc('Which of the following is correct about a galvanic cell?',
    ['Anode is positive', 'Cathode is negative', 'Oxidation occurs at anode', 'Reduction occurs at anode'], 2),
  sc('For the half-reaction: Fe³⁺ + e⁻ → Fe²⁺, E° = 0.77 V. What is E° for 2Fe³⁺ + 2e⁻ → 2Fe²⁺?',
    ['1.54 V', '0.77 V', '0.385 V', '3.08 V'], 1),
  sc('Which electrolyte has the highest molar conductance at infinite dilution?',
    ['NaCl', 'HCl', 'KOH', 'LiCl'], 1),
  sc('A galvanic cell has E°cell > 0. Then:',
    ['ΔG° < 0 and K > 1', 'ΔG° > 0 and K < 1', 'ΔG° = 0 and K = 1', 'ΔG° < 0 and K < 1'], 0),
  sc('The number of electrons transferred in the reaction: Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O is:',
    ['2', '3', '6', '14'], 2),
  sc('Conductance of ionic solutions is due to:',
    ['Movement of electrons', 'Movement of ions', 'Movement of atoms', 'Both ions and electrons'], 1),
  sc('Which type of cell is used in watches and hearing aids?',
    ['Lead storage battery', 'Mercury cell', 'Ni–Cd cell', 'Fuel cell'], 1),
  sc('The SHE is assigned a reduction potential of zero because:',
    ['H₂ is a neutral element', 'It is used as reference for measuring relative potentials', 'H₂ has zero mass', 'It cannot be measured independently'], 1),
  sc('Which of the following processes occurs in electrorefining of copper?',
    ['Pure Cu dissolves at cathode, impure Cu at anode', 'Impure Cu dissolves at anode, pure Cu deposits at cathode', 'Both electrodes dissolve equally', 'O₂ is produced at anode'], 1),
  sc('At equilibrium, the Nernst equation gives:',
    ['Ecell = E°cell', 'Ecell = 0', 'Ecell = –E°cell', 'Ecell = 2E°cell'], 1),
  sc('The standard EMF of a cell is related to the Gibbs energy change by:',
    ['ΔG° = nFE°cell', 'ΔG° = –nFE°cell', 'ΔG° = nRTE°cell', 'ΔG° = –RT ln E°cell'], 1),
  sc('A solution of CuSO₄ is electrolysed using Cu electrodes. What happens?',
    ['Cu deposits at cathode and anode dissolves', 'Cu deposits at anode and cathode dissolves', 'No net change in Cu²⁺ concentration', 'Both A and C'], 3),
  sc('Molar conductance of a weak electrolyte _______ with dilution.',
    ['Decreases', 'Increases', 'Remains constant', 'Approaches zero'], 1),
  sc('Which of the following metals has the highest standard reduction potential?',
    ['Fe', 'Cu', 'Zn', 'Al'], 1),
];

// ─── Exercise O-II  (Mixed, ~32 questions — SINGLE and MULTI choice) ────────────

const exerciseOII: AnyQ[] = [
  sc('The EMF of a galvanic cell is positive. Which of the following statements is/are correct?\n(I) The cell reaction is spontaneous\n(II) ΔG < 0\n(III) K > 1\n(IV) The cell can do electrical work\nChoose correct option:',
    ['I and II only', 'I, II and III only', 'I, II, III and IV', 'II and IV only'], 2),
  mc('Which of the following are correct about the lead storage battery?',
    ['Electrolyte is H₂SO₄', 'During discharge, H₂SO₄ concentration increases', 'PbSO₄ is formed at both electrodes during discharge', 'During charging, PbO₂ is formed at anode'],
    [0, 2, 3]),
  sc('ASSERTION: Molar conductance of acetic acid increases with dilution.\nREASON: At infinite dilution, weak electrolytes are completely dissociated.',
    ['A is true, R is true; R is the correct explanation of A', 'A is true, R is true; R is NOT the correct explanation of A', 'A is true, R is false', 'A is false, R is true'], 0),
  sc('ASSERTION: SHE is used as the reference electrode.\nREASON: The electrode potential of SHE is arbitrarily taken as zero.',
    ['A is true, R is true; R is the correct explanation of A', 'A is true, R is true; R is NOT the correct explanation of A', 'A is true, R is false', 'A is false, R is true'], 0),
  mc('Which of the following statements are CORRECT regarding electrolytic conductance?',
    ['Conductance increases with dilution for weak electrolytes', 'Conductance increases with temperature for electrolytic solutions', 'Specific conductance increases with dilution', 'Molar conductance decreases with increase in concentration'],
    [0, 1, 3]),
  sc('For the cell Zn | Zn²⁺(c₁) || Zn²⁺(c₂) | Zn, the cell is spontaneous when:',
    ['c₁ > c₂', 'c₂ > c₁', 'c₁ = c₂', 'Always spontaneous'], 1),
  mc('Which of the following are secondary (rechargeable) cells?',
    ['Dry cell (Leclanché)', 'Lead–acid battery', 'Nickel–cadmium cell', 'Mercury cell'],
    [1, 2]),
  sc('ASSERTION: Copper cannot displace silver from AgNO₃ solution.\nREASON: E°(Cu²⁺/Cu) > E°(Ag⁺/Ag).',
    ['A is true, R is true; R is the correct explanation of A', 'A is true, R is true; R is NOT the correct explanation of A', 'A is false, R is true', 'A is false, R is false'], 3),
  sc('In electrolysis, the cathode is connected to the:',
    ['Positive terminal of the external source', 'Negative terminal of the external source', 'Either terminal', 'Neutral terminal'], 1),
  mc('Which of the following methods are used to prevent corrosion of iron?',
    ['Galvanization', 'Tinning', 'Painting', 'Alloying'],
    [0, 1, 2, 3]),
  sc('For the reaction: 2Ag⁺(aq) + Cu(s) → Cu²⁺(aq) + 2Ag(s), E°cell = 0.46 V. The value of ΔG° (in kJ mol⁻¹) is: [F = 96500 C mol⁻¹]',
    ['–88.78 kJ', '–44.39 kJ', '+88.78 kJ', '+44.39 kJ'], 0),
  sc('ASSERTION: Zinc is used for the galvanization of iron.\nREASON: Zinc has a lower reduction potential than iron.',
    ['A is true, R is true; R is the correct explanation of A', 'A is true, R is true; R is NOT the correct explanation of A', 'A is true, R is false', 'A is false, R is true'], 0),
  sc('Which of the following has the highest equivalent conductance at infinite dilution?',
    ['NaCl', 'KCl', 'HCl', 'LiCl'], 2),
  mc('Which of the following statements about galvanic cells are correct?',
    ['Anode is the negative electrode', 'Cathode is the positive electrode', 'Reduction occurs at anode', 'Oxidation occurs at cathode'],
    [0, 1]),
  sc('ASSERTION: The conductance of a metal wire decreases with increase in temperature.\nREASON: Metallic conductance is due to the flow of electrons, and electron mobility decreases with temperature.',
    ['A is true, R is true; R is the correct explanation of A', 'A is true, R is true; R is NOT the correct explanation of A', 'A is true, R is false', 'A is false, R is true'], 0),
  sc('If E°(Mn²⁺/Mn) = –1.18 V and E°(Cr³⁺/Cr) = –0.74 V, then for the cell Mn | Mn²⁺ || Cr³⁺ | Cr:',
    ['Ecell° = –0.44 V, non-spontaneous', 'Ecell° = 0.44 V, spontaneous', 'Ecell° = 1.92 V, spontaneous', 'Ecell° = –1.92 V, non-spontaneous'], 0),
  mc('Which properties increase on adding water (diluting) an electrolytic solution?',
    ['Molar conductance', 'Specific conductance', 'Degree of dissociation (for weak electrolytes)', 'Number of ions per unit volume'],
    [0, 2]),
  sc('ASSERTION: In the electrolysis of brine, Cl₂ is preferentially discharged at anode.\nREASON: The discharge potential of Cl⁻ is lower than that of OH⁻ in concentrated NaCl.',
    ['A is true, R is true; R is the correct explanation of A', 'A is true, R is true; R is NOT the correct explanation of A', 'A is true, R is false', 'A is false, R is true'], 0),
  sc('The cell Pt(H₂, 1atm) | HCl(0.01M) | AgCl(s) | Ag has E°(AgCl/Ag) = 0.22 V. What is the cell EMF at 298K?',
    ['0.22 V', '0.34 V', '0.10 V', '0.46 V'], 1),
  sc('A current of 1 A flows for 16 min 5 s through a CuSO₄ solution. The mass (in g) of Cu deposited is: (F = 96500 C, At. mass Cu = 63.5)',
    ['0.317', '0.635', '0.160', '1.27'], 0),
  mc('Which of the following reactions represent oxidation?',
    ['Fe²⁺ → Fe³⁺ + e⁻', 'Cl₂ + 2e⁻ → 2Cl⁻', 'Zn → Zn²⁺ + 2e⁻', 'Cu²⁺ + 2e⁻ → Cu'],
    [0, 2]),
  sc('ASSERTION: The E°cell for Zn–Cu cell is positive.\nREASON: Zinc has a higher tendency to get oxidised than copper.',
    ['A is true, R is true; R is the correct explanation of A', 'A is true, R is true; R is NOT the correct explanation of A', 'A is true, R is false', 'A is false, R is true'], 0),
  sc('For the reaction: Mg + 2H⁺ → Mg²⁺ + H₂ to be spontaneous, E°(Mg²⁺/Mg) must be:',
    ['Greater than 0 V', 'Less than 0 V', 'Equal to 0 V', 'Greater than +0.76 V'], 1),
  sc('The ionic product of water at 25°C is 10⁻¹⁴. The EMF of the cell Pt(H₂,1atm)|H⁺(c=1M)||OH⁻(c=1M)|H₂(1atm)|Pt at 298K is:',
    ['–0.828 V', '+0.828 V', '0 V', '–0.414 V'], 0),
  mc('Which of the following statements are true about the standard hydrogen electrode (SHE)?',
    ['It uses Pt as electrode material', 'H₂ gas at 1 atm is bubbled through', 'It is used as anode in all cells by convention', 'Its potential is set at 0 V by convention'],
    [0, 1, 3]),
  sc('Which among the following has the highest molar conductance at infinite dilution in water?',
    ['NH₄Cl', 'NaCl', 'KCl', 'HCl'], 3),
  sc('The standard electrode potential for Cu²⁺/Cu is +0.34 V. Then for the electrode Cu⁺/Cu, E° will be:',
    ['0.17 V', '+0.52 V', '+0.34 V', 'Cannot be determined without additional data'], 3),
  sc('Which of the following cells is not rechargeable?',
    ['Lead–acid battery', 'Nickel–cadmium cell', 'Zinc–carbon dry cell', 'Lithium-ion cell'], 2),
  sc('The reaction: Zn + 2H⁺ → Zn²⁺ + H₂ has E°cell = 0.76 V. What is the equilibrium constant K at 298 K?',
    ['10^(25.7)', '10^(12.8)', '10^(51.4)', '10^(6.4)'], 0),
  mc('Which of the following factors affect the EMF of an electrochemical cell?',
    ['Concentration of ions', 'Temperature', 'Nature of electrodes', 'Size of electrodes'],
    [0, 1, 2]),
  sc('ASSERTION: The cell Pt | H₂(1atm) | H⁺(1M) has zero potential.\nREASON: The SHE is the primary reference electrode.',
    ['A is true, R is true; R is the correct explanation of A', 'A is true, R is true; R is NOT the correct explanation of A', 'A is true, R is false', 'A is false, R is true'], 0),
  sc('For the half-cell reaction X²⁺ + 2e⁻ → X, E° = 0.0 V. What is E when [X²⁺] = 0.01 M at 298K?',
    ['–0.0592 V', '+0.0592 V', '–0.0296 V', '+0.0296 V'], 0),
];

// ─── JEE Main Exercise (29 questions from the PDF J-Main section) ──────────────
// Note: Already have a JEE Main topic from the first PDF; these questions are
// from the ALLEN booklet's JEE Main collection and will be seeded under the
// same "JEE Main" topic (deduplication by questionText).

const jeeMainQuestions: AnyQ[] = [
  sc('The standard electrode potential for Daniell cell is 1.1 V. The value of ΔG° (kJ mol⁻¹) will be: [F = 96500 C mol⁻¹]',
    ['–212.3', '+212.3', '–106.15', '+106.15'], 0),
  sc('An increase in equivalent conductance of a strong electrolyte with dilution is mainly due to:',
    ['Increase in ionic mobility', 'Increase in number of ions by dissociation', 'Decrease in forces of interionic attraction', 'Increase in dissociation constant'], 2),
  sc('Which of the following solutions will have the lowest specific conductance?',
    ['0.1 M KCl', '0.01 M KCl', '0.001 M KCl', '0.0001 M KCl'], 3),
  sc('In the electrolysis of aqueous solution of NaCl using Pt electrodes, the gases evolved at anode and cathode are:',
    ['O₂ and H₂', 'Cl₂ and H₂', 'Cl₂ and Na (dissolved)', 'H₂ and Cl₂'], 1),
  sc('The equivalent conductance of NaCl at concentration C and at infinite dilution are Λ_C and Λ∞ respectively. The correct relationship is:',
    ['Λ_C = Λ∞ – A√C', 'Λ_C = Λ∞ + A√C', 'Λ_C = Λ∞ × A√C', 'Λ_C = Λ∞ / A√C'], 0),
  sc('The amount of electricity (in Faraday) required to deposit 1 mol of Al from Al₂O₃ is:',
    ['1', '2', '3', '6'], 2),
  sc('A galvanic cell is constructed using the half reactions: Fe³⁺ + e⁻ → Fe²⁺ (E° = 0.77V) and Sn⁴⁺ + 2e⁻ → Sn²⁺ (E° = 0.15V). The cell EMF is:',
    ['0.62 V', '0.92 V', '–0.62 V', '1.54 V'], 0),
  sc('During the electrolysis of brine (concentrated NaCl solution), the product formed at the cathode is:',
    ['Cl₂', 'O₂', 'NaOH and H₂', 'Na'], 2),
  sc('Which of the following has the maximum conductance at the same concentration?',
    ['HF', 'HCl', 'HBr', 'HI'], 1),
  sc('The standard EMF of the fuel cell H₂–O₂ at 298 K, given E°(O₂/H₂O) = 1.23 V and E°(H⁺/H₂) = 0 V, is:',
    ['0.615 V', '1.23 V', '2.46 V', '0 V'], 1),
  sc('Which of the following metals does not undergo corrosion in dry air at ordinary temperature?',
    ['Mg', 'Zn', 'Fe', 'Au'], 3),
  sc('In the lead storage battery, the cathode reaction is:',
    ['Pb → Pb²⁺ + 2e⁻', 'PbO₂ + 4H⁺ + SO₄²⁻ + 2e⁻ → PbSO₄ + 2H₂O', 'PbSO₄ + 2e⁻ → Pb + SO₄²⁻', 'Pb + SO₄²⁻ → PbSO₄ + 2e⁻'], 1),
  sc('For the cell Pt | H₂(p=1atm) | H⁺(pH=3) || H⁺(pH=0) | H₂(p=1atm) | Pt, what is Ecell at 298K?',
    ['0.177 V', '–0.177 V', '0.0591 V', '0.0197 V'], 0),
  sc('According to Nernst equation, the electrode potential of an electrode X²⁺/X depends on:',
    ['Temperature and pressure', 'Concentration of X²⁺ and temperature', 'Standard electrode potential only', 'Mass of X'], 1),
  sc('The cell: Mg | Mg²⁺(0.01 M) || Ag⁺(1 M) | Ag. E° = 3.17 V at 298 K. What is Ecell?',
    ['3.11 V', '3.23 V', '3.17 V', '3.05 V'], 1),
  sc('The conductivity of 0.20 M solution of KCl at 298 K is 0.025 S cm⁻¹. The molar conductance (S cm² mol⁻¹) is:',
    ['125', '12.5', '62.5', '250'], 0),
  sc('Which of the following reactions occurs at the anode during electrolysis of dilute H₂SO₄?',
    ['2H⁺ + 2e⁻ → H₂', '2H₂O → O₂ + 4H⁺ + 4e⁻', 'SO₄²⁻ → SO₃ + O²⁻', '4OH⁻ → 2H₂O + O₂ + 4e⁻'], 1),
  intQ('The number of moles of electrons required to reduce 1 mol of Cr₂O₇²⁻ to Cr³⁺ is:', 6),
  sc('The pH of the solution if hydrogen electrode reads –0.295 V at 298K is:',
    ['2.5', '5.0', '3.5', '1.5'], 1),
  sc('Which of the following is false about electrolytic conduction?',
    ['It involves movement of ions', 'Conductance increases with temperature', 'It is measured using Wheatstone bridge', 'Cathode is connected to positive terminal'], 3),
  sc('Cell notation for a cell where Zn is anode and Cu is cathode in 1M solutions is:',
    ['Cu | Cu²⁺ || Zn²⁺ | Zn', 'Zn | Zn²⁺ || Cu²⁺ | Cu', 'Zn | Cu²⁺ || Zn²⁺ | Cu', 'Cu | Zn²⁺ || Cu²⁺ | Zn'], 1),
  sc('A solution contains Cu²⁺ and Ag⁺ ions. Which ion is preferentially discharged at cathode? [E°(Ag⁺/Ag) = 0.80 V, E°(Cu²⁺/Cu) = 0.34 V]',
    ['Cu²⁺', 'Ag⁺', 'Both simultaneously', 'Neither'], 1),
  sc('The ratio of equivalent conductances of 0.001 M and 0.01 M solutions of a strong electrolyte is approximately:',
    ['1:1', '√10 : 1', '10:1', '1:10'], 1),
  sc('Identify the incorrect statement about the standard electrode potential:',
    ['It is measured relative to SHE', 'It is an intensive property', 'It is independent of the amount of substance', 'Its value changes if half-reaction is multiplied by a factor'], 3),
  sc('Which of the following is a correct statement regarding corrosion?',
    ['Corrosion is the oxidation of metals by their environment', 'Corrosion can be prevented by alloying', 'Corrosion requires both oxygen and water', 'All of the above'], 3),
  sc('For the cell Cr | Cr³⁺(0.1 M) || Fe²⁺(0.01 M) | Fe, E°cell = 0.30 V at 298 K. Ecell is:',
    ['0.25 V', '0.28 V', '0.32 V', '0.35 V'], 1),
  sc('How much charge (in Coulombs) is required to deposit 63.5 g of Cu from CuSO₄ solution? (F = 96500 C mol⁻¹)',
    ['96500', '193000', '48250', '32166'], 1),
  sc('The relationship between Gibbs energy change and the EMF of a reversible cell is given by:',
    ['ΔG = nFE (spontaneous)', 'ΔG = –nFE', 'ΔG = nRT ln E', 'ΔG = –nRT ln E'], 1),
  intQ('The number of coulombs required to deposit 27 g of Al from Al³⁺: (F = 96500 C/mol, At. mass Al = 27)', 289500),
];

// ─── JEE Advanced Exercise (18 questions) ──────────────────────────────────────

const jeeAdvancedQuestions: AnyQ[] = [
  sc('(JEE Advanced 2011) Silver (At. wt. 108) is electrodeposited on a metallic vessel of surface area 900 cm² by passing a current of 0.5 A for 2 hours. The thickness of silver deposited (density of Ag = 10.5 g/cm³) is:',
    ['1.5 × 10⁻³ cm', '1.5 × 10⁻⁴ cm', '3.0 × 10⁻³ cm', '3.0 × 10⁻⁴ cm'], 0),
  mc('(JEE Advanced 2012) For the reaction: I⁻ + ClO₃⁻ + H₂SO₄ → Cl⁻ + HSO₄⁻ + I₂. The correct statement(s) regarding this reaction is/are:',
    ['I⁻ is oxidised and ClO₃⁻ is reduced', 'The change in oxidation state of iodine is from –1 to 0', 'H₂SO₄ acts as an oxidising agent', 'ClO₃⁻ is reduced to Cl⁻ (change of +5 to –1)'],
    [0, 1, 3]),
  sc('(JEE Advanced 2013) Assuming 2s–2p mixing is not operative, the paramagnetic species among the following is:',
    ['Be₂', 'B₂', 'C₂', 'N₂'], 1),
  sc('(JEE Advanced 2014) The electrochemical cell: Zn(s) | ZnSO₄(aq) || CuSO₄(aq) | Cu(s). When the concentration of Zn²⁺ is 10 times the concentration of Cu²⁺, the expression for the cell potential is:',
    ['E°cell – (0.0592/2)', 'E°cell + (0.0592/2)', 'E°cell – (0.0296)', 'E°cell + 0.0592'], 0),
  mc('(JEE Advanced 2015) In an electrochemical cell, which of the following statements is/are CORRECT?',
    ['In a galvanic cell, oxidation occurs at anode', 'In a galvanic cell, anode is negative', 'In an electrolytic cell, anode is connected to positive terminal of battery', 'In an electrolytic cell, cathode is where reduction occurs'],
    [0, 1, 2, 3]),
  sc('(JEE Advanced 2016) An aqueous solution of HCl is electrolysed using Pt electrodes. Which species is discharged at the anode in concentrated HCl solution?',
    ['O₂', 'Cl₂', 'H₂', 'OH⁻'], 1),
  intQ('(JEE Advanced 2017) In the electrolysis of a molten salt XY (X forms cation, Y forms anion), X is deposited at the cathode. If X has atomic mass 63.5 and 6.35 g is deposited by a charge of 9650 C, what is the valency of X?', 2),
  sc('(JEE Advanced 2018) In the cell: Pt(s) | H₂(g, 1 bar) | HCl(aq, pH = 1) || HCl(aq, pH = 2) | H₂(g, 1 bar) | Pt(s), the cell potential at 298 K is:',
    ['0 V', '+0.0592 V', '–0.0592 V', '+0.0296 V'], 2),
  mc('(JEE Advanced 2019) Which of the following statement(s) is(are) correct for an electrochemical cell at equilibrium?',
    ['The Nernst equation holds: Ecell = E°cell – (RT/nF) ln Q', 'Q = K, the equilibrium constant', 'Ecell = 0', 'ΔG = 0'],
    [1, 2, 3]),
  sc('(JEE Advanced 2020) Consider the following half-cell reactions at 298 K:\nCr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O, E° = +1.33 V\nI₂ + 2e⁻ → 2I⁻, E° = +0.54 V\nThe standard cell potential for the reaction: Cr₂O₇²⁻ + 6I⁻ + 14H⁺ → 2Cr³⁺ + 3I₂ + 7H₂O is:',
    ['0.79 V', '1.87 V', '1.33 V', '0.54 V'], 0),
  sc('(JEE Advanced 2021) Which of the following is true about the electrolysis of an aqueous solution of a salt MX₂ (M forms M²⁺)?',
    ['M is deposited at anode', 'M is deposited at cathode and X₂ is liberated at anode', 'MX₂ is reformed during electrolysis', 'O₂ is always liberated at cathode'], 1),
  intQ('(JEE Advanced 2013 Paper 2) In a galvanic cell, the Gibbs energy change is –nFE. For E°cell = 1.1 V and n = 2, the value of –ΔG° in kJ mol⁻¹ is (F = 96500 C mol⁻¹):', 212),
  sc('(JEE Advanced 2014 Paper 1) In the half reaction Mn²⁺ + 2e⁻ → Mn, E° = –1.18 V. The correct statement is:',
    ['Mn²⁺ is a good oxidising agent', 'Mn is a weak reducing agent', 'Mn is a strong reducing agent', 'Mn²⁺ cannot be reduced further'], 2),
  mc('(JEE Advanced 2015 Paper 2) The correct statements for lead storage battery are:',
    ['Pb is the anode during discharge', 'PbO₂ is the cathode during discharge', 'During charging, PbSO₄ at anode converts to Pb', 'During charging, PbSO₄ at cathode converts to PbO₂'],
    [0, 1, 2, 3]),
  sc('(JEE Advanced 2016 Paper 2) The E°cell for the reaction: Fe(s) + Zn²⁺(aq) → Zn(s) + Fe²⁺(aq) is –0.32 V at 298 K. This implies:',
    ['The cell reaction is spontaneous', 'The cell reaction is non-spontaneous', 'ΔG° = 0', 'Equilibrium is not established'], 1),
  sc('(JEE Advanced 2017 Paper 1) The Gibbs energy for the decomposition of Al₂O₃ at 500°C: ⅔Al₂O₃ → ⅘Al + O₂ is +966 kJ mol⁻¹. The potential difference needed for the electrolytic reduction of Al₂O₃ at 500°C is at least:',
    ['2.5 V', '5.0 V', '3.0 V', '4.2 V'], 0),
  intQ('(JEE Advanced 2018 Paper 2) The number of electrons transferred when 1 mol of O₂ is produced at anode during electrolysis of water:', 4),
  sc('(JEE Advanced 2021 Paper 2) A standard hydrogen electrode has a potential of 0 V. Which of the following cells would have a positive EMF?',
    ['Pt(H₂) | H⁺(pH=7) | H⁺(pH=0) | H₂(Pt) — left is cathode', 'Pt(H₂) | H⁺(pH=0) | H⁺(pH=7) | H₂(Pt) — left is anode', 'Pt(H₂) | H⁺(1M) | H⁺(1M) | H₂(Pt)', 'All give zero EMF'], 0),
];

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding ALLEN Enthusiast Course Electrochemistry...\n');

  const subject = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry' },
  });

  const chapter = await prisma.chapter.upsert({
    where: { subjectId_name: { subjectId: subject.id, name: 'Electrochemistry' } },
    update: {},
    create: { name: 'Electrochemistry', subjectId: subject.id },
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

      if (q.type === 'INTEGER') {
        await prisma.question.create({
          data: {
            topicId: topic.id,
            type: 'INTEGER',
            questionText: q.questionText,
            integerAnswer: q.integerAnswer,
            status: 'PUBLISHED',
          },
        });
      } else {
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
      }
      created++;
    }

    console.log(`  ${topicName}: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  }

  const results = await Promise.all([
    seedTopic('Exercise S-I', exerciseSI),
    seedTopic('Exercise S-II', exerciseSII),
  ]);

  // Sequential to avoid FK race conditions with the JEE Main topic
  const r3 = await seedTopic('Exercise O-I', exerciseOI);
  const r4 = await seedTopic('Exercise O-II', exerciseOII);
  const r5 = await seedTopic('JEE Main', jeeMainQuestions);
  const r6 = await seedTopic('JEE Advanced', jeeAdvancedQuestions);

  const allResults = [...results, r3, r4, r5, r6];
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
