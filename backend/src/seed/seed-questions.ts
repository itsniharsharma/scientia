/**
 * Seed script: uploads f-Block and Hydrogen questions to the question bank.
 * Run: npx tsx --env-file ../.env src/seed/seed-questions.ts
 *
 * Subject: Chemistry
 *   Chapter: f-Block Elements
 *     Topic: Exercise O-1           (13 single-choice)
 *     Topic: JEE Main               (23 single-choice)
 *   Chapter: Hydrogen and its Compounds
 *     Topic: Dihydrogen             (13 single-choice, O-1)
 *     Topic: Water (H2O)            (11 single-choice, O-1)
 *     Topic: Hydrogen Peroxide      (11 single-choice, O-1)
 *     Topic: Exercise O-2           (15 single/multi-choice)
 *     Topic: Exercise S-2           (6 single-choice, comprehension + match)
 *     Topic: JEE Main               (22 single-choice)
 *     Topic: JEE Advanced           (5 single-choice)
 *
 * Skipped (not representable as MCQ):
 *   - Exercise S-1: 5 integer-type questions
 *   - Exercise S-2 Q1-Q2: matrix-match type
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

type OptionDef = { optionText: string; isCorrect: boolean };
type QuestionDef = {
  questionText: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  options: OptionDef[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sc(text: string, options: string[], correctIndex: number): QuestionDef {
  return {
    questionText: text,
    type: 'SINGLE_CHOICE',
    options: options.map((o, i) => ({ optionText: o, isCorrect: i === correctIndex })),
  };
}

function mc(text: string, options: string[], correctIndices: number[]): QuestionDef {
  return {
    questionText: text,
    type: 'MULTI_CHOICE',
    options: options.map((o, i) => ({ optionText: o, isCorrect: correctIndices.includes(i) })),
  };
}

// Shorthand: answer letter A→0, B→1, C→2, D→3
const L: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
// For JEE-MAIN numbered options: answer n → index n-1
const N = (n: number) => n - 1;

// ─── F-BLOCK DATA ─────────────────────────────────────────────────────────────

const fbO1: QuestionDef[] = [
  sc(
    '5f-subshell is filled by electron(s) -',
    ['In actinides', 'After filling of 7s-subshell', 'Before filling of electron in 6d series', 'All are correct'],
    L['D'],
  ),
  sc(
    'Ln (Lanthanide) reacts with Halogen → X; burns with O2 → Y; heated with N2 → Z. X, Y & Z are respectively -',
    ['LnX3, Ln2O3, Ln3N', 'LnX3, Ln2O3, LnN', 'LnX2, LnO, LnN', 'LnX2, Ln2O3, Ln3N'],
    L['B'],
  ),
  sc(
    'Last element of lanthanide series is -',
    ['Lawrencium', 'Lutetium', 'Thulium', 'Hafnium'],
    L['B'],
  ),
  sc(
    'Which is a consequence of lanthanide contraction -',
    ['Size of Zr >> Hf', 'Size of Zr << Hf', 'Size of Zr ≈ Hf', 'Size of Zr > Zr4+'],
    L['C'],
  ),
  sc(
    'Select the ion which is larger than Ce3+',
    ['Lu3+', 'Eu3+', 'Ce4+', 'La3+'],
    L['D'],
  ),
  sc(
    'Select the reducing agent out of given options -',
    ['Ce4+', 'Eu2+', 'La3+', 'Na+'],
    L['B'],
  ),
  sc(
    'The correct order of ionic radii of Y3+, La3+, Eu3+ and Lu3+ is :-',
    [
      'Y3+ < La3+ < Eu3+ < Lu3+',
      'Y3+ < Lu3+ < Eu3+ < La3+',
      'Lu3+ < Eu3+ < La3+ < Y3+',
      'La3+ < Eu3+ < Lu3+ < Y3+',
    ],
    L['B'],
  ),
  sc(
    'Which of the following statement is NOT CORRECT?',
    [
      'La(OH)3 is less basic than Lu(OH)3',
      'In lanthanide series, ionic radius of Ln3+ ions decreases',
      'La is actually an element of transition series rather than lanthanide series',
      'Atomic radii of Zr and Hf are same because of lanthanide contraction',
    ],
    L['A'],
  ),
  sc(
    'In the lanthanide series, the basicity of the lanthanide hydroxides',
    ['Increases', 'Decreases', 'First increase and then decrease', 'First decrease and then increases'],
    L['B'],
  ),
  sc(
    'The reason for the stability of Gd3+ ion is',
    ['4f subshell — half filled', '4f subshell — completely filled', 'Possesses the general electronic configuration of noble gases', '4f subshell empty'],
    L['A'],
  ),
  sc(
    'Which of the following pairs has the same size?',
    ['Zn2+, Hf4+', 'Fe2+, Ni2+', 'Zr4+, Ti4+', 'Zr4+, Hf4+'],
    L['D'],
  ),
  sc(
    'Which of the following ions will exhibit colour in aqueous solutions?',
    ['Sc3+ (Z = 21)', 'La3+ (Z = 57)', 'Ti3+ (Z = 22)', 'Lu3+ (Z = 71)'],
    L['C'],
  ),
  sc(
    'Which of the following exhibits only +3 oxidation state?',
    ['Ac', 'Pa', 'U', 'Th'],
    L['A'],
  ),
];

const fbJeeMain: QuestionDef[] = [
  // Q1 [AIEEE-2002]
  sc(
    'Arrange Ce3+, La3+, Pm3+ and Yb3+ in increasing order of their ionic radius - [AIEEE-2002]',
    [
      'Yb3+ < Pm3+ < Ce3+ < La3+',
      'Ce3+ > Yb3+ < Pm3+ < La3+',
      'Yb3+ > Pm3+ < La3+ < Ce3+',
      'Pm3+ < La3+ < Ce3+ > Yb3+',
    ],
    N(1),
  ),
  // Q2 [AIEEE-2002]
  sc(
    'Most common oxidation states shown by cerium are : [AIEEE-2002]',
    ['+2, +4', '+3, +4', '+3, +5', '+2, +3'],
    N(2),
  ),
  // Q3 [AIEEE-2003]
  sc(
    'A reduction in atomic size with increase in atomic number is a characteristic of elements of : [AIEEE-2003]',
    ['f-Block', 'Radioactive series', 'High atomic masses', 'd-Block'],
    N(1),
  ),
  // Q4 [AIEEE-2003]
  sc(
    'The radius of La3+ is 1.06 Å. Which of the following given values will be closest to the radius of Lu3+ (At no. of Lu = 71, La = 57)? [AIEEE-2003]',
    ['1.6 Å', '1.4 Å', '1.06 Å', '0.85 Å'],
    N(4),
  ),
  // Q5 [AIEEE-2004]
  sc(
    'Cerium (Z = 58) is an important member of the lanthanoids. Which of the following statements about cerium is INCORRECT - [AIEEE-2004]',
    [
      'Cerium (IV) acts as an oxidising agent',
      'The +3 oxidation state of cerium is more stable than the +4 oxidation state',
      'The +4 oxidation state of cerium is not known in solutions',
      'The common oxidation states of cerium are +3 and +4',
    ],
    N(3),
  ),
  // Q6 [AIEEE-2005]
  sc(
    'The lanthanoid contraction is responsible for the fact that - [AIEEE-2005]',
    [
      'Zr and Y have about the same radius',
      'Zr and Nb have similar oxidation state',
      'Zr and Hf have about the same radius',
      'Zr and Zn have similar oxidation state',
    ],
    N(3),
  ),
  // Q7 [AIEEE-2006]
  sc(
    'Lanthanoid contraction is caused due to [AIEEE-2006]',
    [
      'the same effective nuclear charge from Ce to Lu',
      'the imperfect shielding on outer electrons by 4f electrons from the nuclear charge',
      'the appreciable shielding on outer electrons by 4f electrons from the nuclear charge',
      'the appreciable shielding on outer electrons by 5d electrons from the nuclear charge',
    ],
    N(2),
  ),
  // Q8 [AIEEE-2007]
  sc(
    'Identify the INCORRECT statement among the following - [AIEEE-2007]',
    [
      'd-block elements show irregular and erratic chemical properties among themselves',
      'La and Lu have partially filled d-orbitals and no other partially filled orbitals',
      'The chemistry of various lanthanoids is very similar',
      '4f and 5f-orbitals are equally shielded',
    ],
    N(4),
  ),
  // Q9 [AIEEE-2007]
  sc(
    'The actinoids exhibits more number of oxidation states in general than the lanthanoids. This is because - [AIEEE-2007]',
    [
      'The 5f-orbitals are more buried than the 4f-orbitals',
      'There is a similarity between 4f and 5f in their angular part of the wave function',
      'The actinoids are more reactive than the lanthanoids',
      'The 5f-orbitals extend further from the nucleus than the 4f-orbitals',
    ],
    N(4),
  ),
  // Q10 [AIEEE-2008]
  sc(
    'Larger number of oxidation states are exhibited by the actinoids than those by the lanthanoids, the main reason being [AIEEE-2008]',
    [
      '4f orbitals more diffused than the 5f orbitals',
      'lesser energy difference between 5f and 6d than between 4f and 5d orbitals',
      'more energy difference between 5f and 6d than between 4f and 5d orbitals',
      'more reactive nature of the actinides than the lanthanides',
    ],
    N(2),
  ),
  // Q11 [AIEEE-2009]
  sc(
    'Knowing that the chemistry of lanthanoids (Ln) is dominated by its +3 oxidation state, which of the following statements is INCORRECT? [AIEEE-2009]',
    [
      'Ln(III) compounds are generally colourless',
      'Ln(III) hydroxides are mainly basic in character',
      'Because of the large size of the Ln(III) ions the bonding in its compounds is predominantly ionic in character',
      'The ionic sizes of Ln(III) decrease in general with increasing atomic number',
    ],
    N(1),
  ),
  // Q12 [AIEEE-2011]
  sc(
    'In context of the lanthanoids, which of the following statements is NOT CORRECT? [AIEEE-2011]',
    [
      'Because of similar properties the separation of lanthanoids is not easy',
      'Availability of 4f electrons results in the formation of compounds in +4 state for all the members of the series',
      'There is a gradual decrease in the radii of the members with increasing atomic number in the series',
      'All the members exhibit +3 oxidation state',
    ],
    N(2),
  ),
  // Q13 [Jee-Main 2012, Online]
  sc(
    'Which of the following forms stable +4 oxidation state? [Jee-Main 2012, Online]',
    ['La (Z = 57)', 'Eu (Z = 63)', 'Gd (Z = 64)', 'Ce (Z = 58)'],
    N(4),
  ),
  // Q14 [Jee-Main 2012, Online]
  sc(
    'The number of unpaired electrons in Gadolinium [Z = 64] is :- [Jee-Main 2012, Online]',
    ['2', '6', '8', '3'],
    N(3),
  ),
  // Q15 [Jee-Main 2019, Online]
  sc(
    'The lanthanide ion that would show colour is - [Jee-Main 2019, Online]',
    ['Sm3+', 'La3+', 'Lu3+', 'Gd3+'],
    N(1),
  ),
  // Q16 [Jee-Main 2019, Online]
  sc(
    'The highest possible oxidation states of uranium and plutonium, respectively, are :- [Jee-Main 2019, Online]',
    ['6 and 4', '7 and 6', '4 and 6', '6 and 7'],
    N(4),
  ),
  // Q17 [Jee-Main 2019, Online]
  sc(
    'The correct order of atomic radii is : [Jee-Main 2019, Online]',
    ['Ce > Eu > Ho > N', 'N > Ce > Eu > Ho', 'Eu > Ce > Ho > N', 'Ho > N > Eu > Ce'],
    N(3),
  ),
  // Q18 [Jee-Main 2020, Online]
  sc(
    'The maximum number of possible oxidation states of actinoides are shown by [Jee-Main 2020, Online]',
    [
      'berkelium (Bk) and californium (Cf)',
      'nobelium (No) and lawrencium (Lr)',
      'actinium (Ac) and thorium (Th)',
      'neptunium (Np) and plutonium (Pu)',
    ],
    N(4),
  ),
  // Q19 [Jee-Main 2020, Online]
  sc(
    'The electronic configurations of bivalent europium and trivalent cerium are (atomic number: Xe = 54, Ce = 58, Eu = 63) [Jee-Main 2020, Online]',
    [
      '[Xe] 4f4 and [Xe] 4f9',
      '[Xe] 4f7 and [Xe] 4f1',
      '[Xe] 4f7 6s2 and [Xe] 4f2 6s2',
      '[Xe] 4f2 and [Xe] 4f7',
    ],
    N(2),
  ),
  // Q20 [J-Main 2021]
  sc(
    'Which one of the following lanthanoids does not form MO2? [M is lanthanoid metal] [J-Main 2021]',
    ['Pr', 'Dy', 'Nd', 'Yb'],
    N(4),
  ),
  // Q21 [J-Main 2021]
  sc(
    'Assertion A: Size of Bk3+ ion is less than Np3+ ion.\nReason R: The above is a consequence of the lanthanoid contraction.\nChoose the correct answer: [J-Main 2021]',
    [
      'A is false but R is true',
      'Both A and R are true but R is not the correct explanation of A',
      'Both A and R are true and R is the correct explanation of A',
      'A is true but R is false',
    ],
    N(4),
  ),
  // Q22 [J-Main 2022]
  sc(
    'Which one of the lanthanoids given below is the most stable in divalent form? [J-Main 2022]',
    ['Ce (Atomic Number 58)', 'Sm (Atomic Number 62)', 'Eu (Atomic Number 63)', 'Yb (Atomic Number 70)'],
    N(3),
  ),
  // Q23 [J-Main 2022]
  sc(
    'The most common oxidation state of Lanthanoid elements is +3. Which of the following is likely to deviate easily from +3 oxidation state? [J-Main 2022]',
    ['Ce (At. No. 58)', 'La (At. No. 57)', 'Lu (At. No. 71)', 'Gd (At. No. 64)'],
    N(1),
  ),
];

// ─── HYDROGEN DATA ────────────────────────────────────────────────────────────

// O-1 Section: DIHYDROGEN (Q1-Q13), answers: A D C D A C A A D D B C A
const hyDihydrogen: QuestionDef[] = [
  sc(
    'The sum of number of neutrons and protons in one of the isotopes of hydrogen is :-',
    ['3', '4', '5', '6'],
    L['A'],
  ),
  sc(
    'The catalyst used in Bosch process of manufacture of H2 is :-',
    ['Finely divided Ni', 'V2O5', 'Pb', 'Fe2O3 + Cr2O3'],
    L['D'],
  ),
  sc(
    'The most abundant isotope of hydrogen is :-',
    ['Tritium', 'Deuterium', 'Protium', 'Para hydrogen'],
    L['C'],
  ),
  sc(
    'The n/p ratio for 1H1 is :-',
    ['1', '2', '3', 'Zero'],
    L['D'],
  ),
  sc(
    'Ordinary hydrogen at high temperature is a mixture of :-',
    [
      '75% o-Hydrogen + 25% p-Hydrogen',
      '25% o-Hydrogen + 75% p-Hydrogen',
      '50% o-Hydrogen + 50% p-Hydrogen',
      '1% o-Hydrogen + 99% p-Hydrogen',
    ],
    L['A'],
  ),
  sc(
    'Hydrogen behaves as :-',
    [
      'Electropositive',
      'Electronegative',
      'Both electropositive as well as electronegative',
      'Neither electropositive nor electronegative',
    ],
    L['C'],
  ),
  sc(
    'At high temperature Para hydrogen is :-',
    [
      'Less stable than ortho hydrogen',
      'More stable than ortho hydrogen',
      'As stable as ortho hydrogen',
      'None of these',
    ],
    L['A'],
  ),
  sc(
    'When the same amount of zinc is treated separately with excess of sulphuric acid and excess of sodium hydroxide, the ratio of volumes of hydrogen evolved is :-',
    ['1 : 1', '1 : 2', '2 : 1', '9 : 4'],
    L['A'],
  ),
  sc(
    'The lightest gas is :-',
    ['Nitrogen', 'Helium', 'Oxygen', 'Hydrogen'],
    L['D'],
  ),
  sc(
    'The ratio of electron, proton and neutron in tritium is :-',
    ['1 : 1 : 1', '1 : 1 : 2', '2 : 1 : 1', '1 : 2 : 1'],
    L['D'],
  ),
  sc(
    'The nuclei of tritium (H3) atom would contain neutrons :-',
    ['1', '2', '3', '4'],
    L['B'],
  ),
  sc(
    'The adsorption of hydrogen by metals is called :-',
    ['Dehydrogenation', 'Hydrogenation', 'Occlusion', 'Adsorption'],
    L['C'],
  ),
  sc(
    'At absolute zero :-',
    [
      'Only para hydrogen exists',
      'Only ortho hydrogen exists',
      'Both para and ortho hydrogen exist',
      'None',
    ],
    L['A'],
  ),
];

// O-1 Section: WATER (Q14-Q24), answers: A B D B C A C B C B C
const hyWater: QuestionDef[] = [
  sc(
    'Only temporary hardness in water is removed by :-',
    ['Boiling', 'Filtration', "Calgon's process", 'None of these'],
    L['A'],
  ),
  sc(
    'Both temporary and permanent hardness is removed on boiling water with :-',
    ['Ca(OH)2', 'Na2CO3', 'CaCO3', 'CaO'],
    L['B'],
  ),
  sc(
    'Temporary hardness is caused due to the presence of :-',
    ['CaSO4', 'CaCl2', 'CaCO3', 'Ca(HCO3)2'],
    L['D'],
  ),
  sc(
    'High boiling point of water is due to :-',
    ['Its high specific heat', 'Hydrogen bonding', 'High dielectric constant', 'Low dissociation constant'],
    L['B'],
  ),
  sc(
    'Calgon is an industrial name given to :-',
    ['Normal sodium phosphate', 'Sodium meta-aluminate', 'Sodium hexametaphosphate', 'Hydrated sodium aluminium silicate'],
    L['C'],
  ),
  sc(
    'Permutit is :-',
    ['Hydrated sodium aluminium silicate', 'Sodium hexametaphosphate', 'Sodium silicate', 'Sodium meta-aluminate'],
    L['A'],
  ),
  sc(
    'Heavy water has found application in atomic reactor as :-',
    ['Coolant', 'Moderator', 'Both coolant and moderator', 'Neither coolant nor moderator'],
    L['C'],
  ),
  sc(
    'Calgon (a water softener) is :-',
    ['Na2[Na4(PO3)6]', 'Na4[Na2(PO3)]6', 'Na2[Na4(PO4)6]', 'Na4[Na2(PO4)6]'],
    L['B'],
  ),
  sc(
    'The hardness of water is due to ......... metal ions',
    ['Ca2+ and Na+', 'Mg2+ and K+', 'Ca2+ and Mg2+', 'Zn2+ and Ba2+'],
    L['C'],
  ),
  sc(
    'The formula of heavy water is :-',
    ['H2O18', 'D2O', 'T2O', 'H2O17'],
    L['B'],
  ),
  sc(
    'Pure de-mineralised water can be obtained by -',
    [
      'Na+ cation exchanger and Cl- anion exchanger',
      'H+ cation exchanger only',
      'H+ cation exchanger and OH- anion exchanger',
      'Na+ cation exchanger only',
    ],
    L['C'],
  ),
];

// O-1 Section: HYDROGEN PEROXIDE (Q25-Q35), answers: B D A B A B C C B C C
const hyH2O2: QuestionDef[] = [
  sc(
    'The bleaching properties of H2O2 are due to its :-',
    ['Reducing properties', 'Oxidising properties', 'Unstable nature', 'Acidic nature'],
    L['B'],
  ),
  sc(
    'Hydrogen peroxide has a :-',
    ['Linear structure', 'Pyramidal structure', 'Closed book type structure', 'Half open book type structure'],
    L['D'],
  ),
  sc(
    'Hydrogen peroxide is a :-',
    ['Liquid', 'Gas', 'Solid', 'Semi-solid'],
    L['A'],
  ),
  sc(
    'Which of the following is a true structure of H2O2?',
    [
      'H-O-O-H (bond angle 180°)',
      'H-O-O-H (bond angle 94.8°)',
      'H attached to O-O-H (open)',
      'H attached to O=O (double bond)',
    ],
    L['B'],
  ),
  sc(
    'Decomposition of H2O2 is retarded by :- [2H2O2(l) → 2H2O(l) + O2(g)]',
    ['Acetanilide', 'MnO2', 'Zinc', 'Finely divided metals'],
    L['A'],
  ),
  sc(
    'H2O2 is :-',
    ['An oxidising agent', 'Both oxidising and reducing agent', 'Reducing agent', 'None of the above'],
    L['B'],
  ),
  sc(
    'H2O2 is always stored in black bottles because :-',
    [
      'It is highly unstable',
      'Its enthalpy of decomposition is high',
      'It undergoes auto-oxidation on prolonged standing',
      'None of these',
    ],
    L['C'],
  ),
  sc(
    'Acidified solution of K2Cr2O7 on treatment with H2O2 yields :-',
    ['CrO3 + H2O + O2', 'Cr2O2 + H2O + O2', 'CrO5 + H2O + K2SO4', 'H2Cr2O7 + H2O + O2'],
    L['C'],
  ),
  sc(
    'H2O2 restores the colour of old lead paintings, blackened by the action of H2S gas by :-',
    ['Converting PbO2 to Pb', 'By oxidising PbS to PbSO4', 'Converting PbCO3 to Pb', 'Oxidising PbSO3 to PbSO4'],
    L['B'],
  ),
  sc(
    'The reaction, H2S + H2O2 → S + 2H2O manifests:',
    ['Acidic nature of H2O2', 'Alkaline nature of H2O2', 'Oxidising nature of H2O2', 'Reducing nature of H2O2'],
    L['C'],
  ),
  sc(
    'Hydrogen peroxide is now generally prepared on industrial scale by the :-',
    [
      'Action of H2SO4 on barium peroxide',
      'Action of H2SO4 on sodium peroxide',
      'Auto-oxidation of 2-alkylanthraquinols',
      'Burning hydrogen in excess of oxygen',
    ],
    L['C'],
  ),
];

// O-2: answers: ABD ACD D ABC D D C ACD C ABD B AC D C ABD
const hyO2: QuestionDef[] = [
  mc(
    'Which of the following is / are same for Ortho and Para hydrogen :-',
    [
      'In the number of protons',
      'In the molecular mass',
      'In the nature of spins of nucleus',
      'In the nature of spins of electrons',
    ],
    [L['A'], L['B'], L['D']],
  ),
  mc(
    "In Bosch's process which gas is NOT utilised for the production of hydrogen :-",
    ['Producer gas', 'Water gas', 'Coal gas', 'Natural gas'],
    [L['A'], L['C'], L['D']],
  ),
  sc(
    'The gas(es) used in the hydrogenation of oils in presence of nickel as a catalyst is / are :-',
    ['Methane', 'Ethane', 'Ozone', 'Hydrogen'],
    L['D'],
  ),
  mc(
    "Water softening by Clarke's process does NOT use :-",
    ['Calcium bicarbonate', 'Sodium bicarbonate', 'Potash alum', 'Calcium hydroxide'],
    [L['A'], L['B'], L['C']],
  ),
  sc(
    'Which of the following produces hydrolith with dihydrogen :-',
    ['Mg', 'Al', 'Cu', 'Ca'],
    L['D'],
  ),
  sc(
    'Which process is/are used to remove permanent hardness :-',
    ["Boiling", "Clark's method", 'On reaction with NaOH', 'Permutit process'],
    L['D'],
  ),
  sc(
    'Ionic hydrides is/are usually :-',
    [
      'Good electrically conductors when solid',
      'Easily reduced',
      'Good reducing agents',
      'Liquid at room temperature',
    ],
    L['C'],
  ),
  mc(
    'Which of the following will produce hydrogen gas :-',
    [
      'Reaction between Fe and dil. HCl',
      'Reaction between Zn and conc. H2SO4',
      'Reaction between Zn and NaOH',
      'Electrolysis of NaCl (aq.) in Nelson\'s cell',
    ],
    [L['A'], L['C'], L['D']],
  ),
  sc(
    'Ortho-hydrogen and para-hydrogen resembles in which of the following property :-',
    ['Thermal conductivity', 'Magnetic properties', 'Chemical properties', 'Heat capacity'],
    L['C'],
  ),
  mc(
    'Which of the following statements concerning protium, deuterium and tritium is / are true :-',
    [
      'They are isotopes of each other',
      'They have similar electronic configurations',
      'They exist in the nature in the ratio of 1 : 2 : 3',
      'Their mass numbers are in the ratio of 1 : 2 : 3',
    ],
    [L['A'], L['B'], L['D']],
  ),
  sc(
    'Ionic hydrides are formed by :-',
    ['Transition metals', 'Elements of very high electropositivity', 'Elements of very low electropositivity', 'Metalloids'],
    L['B'],
  ),
  mc(
    'Which of the following statements is/are correct :',
    [
      'Atomic hydrogen is obtained by passing hydrogen gas through an electric arc',
      '30% (w/v) or 100V H2O2 solution is not called per hydrol.',
      'Finely divided palladium absorbs large volume of hydrogen gas.',
      'Ortho and para hydrogen have same physical properties.',
    ],
    [L['A'], L['C']],
  ),
  sc(
    'Which hydride is/are an ionic hydride :-',
    ['NH3', 'H2S', 'TiH1.73', 'NaH'],
    L['D'],
  ),
  sc(
    'Which of the following hydride is/are "electron-precise" type ?',
    ['HF', 'H2O', 'SiH4', 'PH3'],
    L['C'],
  ),
  mc(
    'Hydrogen peroxide can act as a :-',
    ['A reducing agent', 'An oxidising agent', 'A dehydrating agent', 'A bleaching agent'],
    [L['A'], L['B'], L['D']],
  ),
];

// S-2 (Q3-Q8): comprehension + matching list type (as single-choice)
// Comprehension passage: "Hydrogen accounts for approximately 75% of the mass of the universe..."
// Q3, Q4, Q5 answers: C, B, D
// Matching list Q6,Q7,Q8 answers: C, D, C
const hyS2: QuestionDef[] = [
  // Q3 [Comprehension]
  sc(
    '[Passage: Hydrogen has three isotopes: protium (1H), deuterium (D or 2H), tritium (T or 3H).]\nWhich of the following is radioactive in nature?',
    ['hydrogen only', 'deuterium only', 'tritium only', 'deuterium and tritium'],
    L['C'],
  ),
  // Q4 [Comprehension]
  sc(
    '[Passage: Hydrogen accounts for approximately 75% of the mass of the universe.]\nHydrogen, H2, is very less abundant in the atmosphere due to -',
    [
      'Inflammable nature of H2',
      "Weak earth's gravity which is not able to hold light H2 molecules",
      'Diatomic nature of hydrogen',
      'Very rapid reaction between hydrogen and atmospheric oxygen',
    ],
    L['B'],
  ),
  // Q5 [Comprehension]
  sc(
    '[Passage: Hydrogen accounts for approximately 75% of the mass of the universe.]\nLiquid H2 has been used as rocket fuel as',
    [
      'Its reaction with oxygen is highly exothermic',
      'It occupies small space',
      'It has high thrust',
      'All of the above',
    ],
    L['D'],
  ),
  // Q6 [Matching List] — table: (1)Calogen/(P)Na6P6O18/(i)Remove temp hard; (2)Permutit/(Q)Na2Al2Si2O8.xH2O/(ii)Remove perm hard; (3)Perhydrol/(R)'100V'H2O2/(iii)Rocket propellant; (4)Washing Soda/(S)Na2CO3.10H2O/(iv)Zeolite
  sc(
    'Column-I: (1)Calogen (2)Permutit (3)Perhydrol (4)Washing Soda\nColumn-II: (P)Na6P6O18 (Q)Na2Al2Si2O8.xH2O (R)100V H2O2 (S)Na2CO3.10H2O\nColumn-III: (i)Remove temporary hardness (ii)Remove permanent hardness (iii)Rocket propellant (iv)Zeolite\nWhich combination is NOT related to removal of Ca2+/Mg2+ from the sample of water?',
    ['(1)-(P)-(i)(ii)', '(2)-(Q)-(i)(ii)(iv)', '(3)-(R)-(i)(ii)', '(4)-(S)-(i)(ii)'],
    L['C'],
  ),
  // Q7 [Matching List]
  sc(
    'From the same table (Calogen/Permutit/Perhydrol/Washing Soda and their formulas):\nWhich of the following is INCORRECT between Column I & Column II?',
    ['1-P', '2-Q', '3-R', '2-S'],
    L['D'],
  ),
  // Q8 [Matching List]
  sc(
    'From the same table (Calogen/Permutit/Perhydrol/Washing Soda):\nWhich of the following is INCORRECT matching between Column III & Column II?',
    ['(iii) – R', '(iv) – Q', '(iv) – P', 'none of these'],
    L['C'],
  ),
];

// JEE-MAIN Hydrogen (Q1-Q22), answers (1-indexed): 1 4 2 3 1 3 3 3 2 2 3 2 3 4 2 3 2 2 1 3 2 2
const hyJeeMain: QuestionDef[] = [
  // Q1 [AIEEE 2003]
  sc(
    'Which one of the following processes will produce hard water :- [AIEEE 2003]',
    ['Saturation of water with CaSO4', 'Addition of Na2SO4 to water', 'Saturation of water with CaCO3', 'Saturation of water with MgCO3'],
    N(1),
  ),
  // Q2 [AIEEE 2012]
  sc(
    'Very pure hydrogen (99.9%) can be made by which of the following processes? [AIEEE 2012]',
    [
      'Reaction of salt like hydrides with water',
      'Reaction of methane with steam',
      'Mixing natural hydrocarbons of high molecular weight',
      'Electrolysis of water',
    ],
    N(4),
  ),
  // Q3 [JEE(Main) 2014]
  sc(
    'In which of the following reaction H2O2 acts as a reducing agent? [JEE(Main) 2014]\n(a) H2O2 + 2H+ + 2e- → 2H2O\n(b) H2O2 - 2e- → O2 + 2H+\n(c) H2O2 + 2e- → 2OH-\n(d) H2O2 + 2OH- - 2e- → O2 + 2H2O',
    ['(a), (c)', '(b), (d)', '(a), (b)', '(c), (d)'],
    N(2),
  ),
  // Q4 [JEE(Main) 2014]
  sc(
    'Which of the following statements about Na2O2 is not correct? [JEE(Main) 2014]',
    [
      'Na2O2 oxidises Cr3+ to CrO4^2- in acid medium',
      'It is diamagnetic in nature',
      'It is the super oxide of sodium',
      'It is a derivative of H2O2',
    ],
    N(3),
  ),
  // Q5 [JEE(Main)Online-2014]
  sc(
    'Hydrogen peroxide acts both as an oxidising and as a reducing agent depending upon the nature of the reacting species. In which of the following cases H2O2 acts as a reducing agent in acid medium? [JEE(Main)Online-2014]',
    ['MnO4-', 'SO3^2-', 'KI', 'Cr2O7^2-'],
    N(1),
  ),
  // Q6 [JEE(Main)Online-2015]
  sc(
    'Permanent hardness in water cannot be cured by: [JEE(Main)Online-2015]',
    ['Treatment with washing soda', "Calgon's method", 'Boiling', 'Ion exchange method'],
    N(3),
  ),
  // Q7 [JEE(Main)Online-2015]
  sc(
    'From the following statements regarding H2O2, choose the incorrect statement : [JEE(Main)Online-2015]',
    [
      'It has to be stored in plastic or wax lined glass bottles in dark',
      'It has to be kept away from dust',
      'It can act only as an oxidizing agent',
      'It decomposes on exposure to light',
    ],
    N(3),
  ),
  // Q8 [JEE(Main)-2017]
  sc(
    'In which of the following reaction, hydrogen peroxide acts as an oxidizing agent? [JEE(Main)-2017]',
    [
      'I2 + H2O2 + 2OH- → 2I- + 2H2O + O2',
      'HOCl + H2O2 → H3O+ + Cl- + O2',
      'PbS + 4H2O2 → PbSO4 + 4H2O',
      '2MnO4- + 3H2O2 → 2MnO2 + 3O2 + 2H2O + 2OH-',
    ],
    N(3),
  ),
  // Q9 [JEE(Main)-2018]
  sc(
    'Hydrogen peroxide oxidises [Fe(CN)6]^4- to [Fe(CN)6]^3- in acidic medium but reduces [Fe(CN)6]^3- to [Fe(CN)6]^4- in alkaline medium. The other products formed are, respectively: [JEE(Main)-2018]',
    [
      '(H2O + O2) and (H2O + OH-)',
      'H2O and (H2O + O2)',
      'H2O and (H2O + OH-)',
      '(H2O + O2) and H2O',
    ],
    N(2),
  ),
  // Q10 [JEE(Main)-2019]
  sc(
    'The chemical nature of hydrogen peroxide is :- [JEE(Main)-2019]',
    [
      'Oxidising and reducing agent in acidic medium, but not in basic medium.',
      'Oxidising and reducing agent in both acidic and basic medium',
      'Reducing agent in basic medium, but not in acidic medium',
      'Oxidising agent in acidic medium, but not in basic medium.',
    ],
    N(2),
  ),
  // Q11 [JEE(Main)-2019]
  sc(
    'The total number of isotopes of hydrogen and number of radioactive isotopes among them, respectively, are : [JEE(Main)-2019]',
    ['2 and 0', '3 and 2', '3 and 1', '2 and 1'],
    N(3),
  ),
  // Q12 [JEE(Main)-2019]
  sc(
    'The correct statements among (a) to (d) regarding H2 as a fuel are: [JEE(Main)-2019]\n(a) It produces less pollutant than petrol\n(b) A cylinder of compressed dihydrogen weighs ~30 times more than a petrol tank producing the same amount of energy\n(c) Dihydrogen is stored in tanks of metal alloys like NaNi5\n(d) On combustion, values of energy released per gram of liquid dihydrogen and LPG are 50 and 142 kJ, respectively',
    ['b and d only', 'a, b and c only', 'b, c and d only', 'a and c only'],
    N(2),
  ),
  // Q13 [JEE(Main)-2019]
  sc(
    'The correct statements among (a) to (b) are: [JEE(Main)-2019]\n(a) saline hydrides produce H2 gas when reacted with H2O.\n(b) reaction of LiAlH4 with BF3 leads to B2H6.\n(c) PH3 and CH4 are electron-rich and electron-precise hydrides, respectively.\n(d) HF and CH4 are called as molecular hydrides.',
    ['(c) and (d) only', '(a), (b) and (c) only', '(a), (b), (c) and (d)', '(a), (c) and (d) only'],
    N(3),
  ),
  // Q14 [JEE(Main)-2020]
  sc(
    'In comparison to the zeolite process for the removal of permanent hardness, the synthetic resins method is: [JEE(Main)-2020]',
    [
      'less efficient as it exchanges only anions',
      'more efficient as it can exchange only cations',
      'less efficient as the resins cannot be regenerated',
      'more efficient as it can exchange both cations as well as anions',
    ],
    N(4),
  ),
  // Q15 [JEE(Main)-2020]
  sc(
    'Hydrogen has three isotopes (A), (B) and (C). If the number of neutron(s) in (A), (B) and (C) respectively, are (x), (y) and (z), the sum of (x), (y) and (z) is: [JEE(Main)-2020]',
    ['4', '3', '2', '1'],
    N(2),
  ),
  // Q16 [JEE(Main)-2020]
  sc(
    'Among the statements (a) - (d), the correct ones are - [JEE(Main)-2020]\n(a) Decomposition of hydrogen peroxide gives dioxygen\n(b) Like hydrogen peroxide, compounds such as KClO3, Pb(NO3)2 and NaNO3 when heated liberated dioxygen\n(c) 2-Ethylanthraquinone is useful for the industrial preparation of hydrogen peroxide.\n(d) Hydrogen peroxide is used for the manufacture of sodium perborate',
    ['(a), (b) and (c) only', '(a) and (c) only', '(a), (b), (c) and (d)', '(a), (c) and (d) only'],
    N(3),
  ),
  // Q17 [J-Main 2021]
  sc(
    'Which of the following forms of hydrogen emits low energy β-particles? [J-Main 2021]',
    ['Deuterium 2H', 'Tritium 3H', 'Protium 1H', 'Proton H+'],
    N(2),
  ),
  // Q18 [J-Main 2021]
  sc(
    'Given below are two statements: [J-Main 2021]\nStatement I: H2O2 can act as both oxidising and reducing agent in basic medium.\nStatement II: In the hydrogen economy, the energy is transmitted in the form of dihydrogen.\nChoose the correct answer:',
    [
      'Both statement I and statement II are false',
      'Both statement I and statement II are true',
      'Statement I is true but statement II is false',
      'Statement I is false but statement II is true',
    ],
    N(2),
  ),
  // Q19 [J-Main 2021]
  sc(
    'The functional groups that are responsible for the ion-exchange property of cation and anion exchange resins, respectively, are: [J-Main 2021]',
    ['-SO3H and -NH2', '-SO3H and -COOH', '-NH2 and -COOH', '-NH2 and -SO3H'],
    N(1),
  ),
  // Q20 [J-Main 2021]
  sc(
    'The single largest industrial application of dihydrogen is: [J-Main 2021]',
    ['Manufacture of metal hydrides', 'Rocket fuel in space research', 'In the synthesis of ammonia', 'In the synthesis of nitric acid'],
    N(3),
  ),
  // Q21 [J-Main 2021]
  sc(
    'Which one of the following statements is incorrect? [J-Main 2021]',
    [
      'Atomic hydrogen is produced when H2 molecules at a high temperature are irradiated with UV radiation.',
      'At around 2000 K, the dissociation of dihydrogen into its atoms is nearly 8.1%.',
      'Bond dissociation enthalpy of H2 is highest among diatomic gaseous molecules which contain a single bond.',
      'Dihydrogen is produced on reacting zinc with HCl as well as NaOH(aq).',
    ],
    N(2),
  ),
  // Q22 [J-Main 2022]
  sc(
    'Dihydrogen reacts with CuO to give [J-Main 2022]',
    ['CuH2', 'Cu', 'Cu2O', 'Cu(OH)2'],
    N(2), // answer is option (2) Cu
  ),
];

// JEE Advanced Hydrogen (Q1-Q5), answers: B D C A A
const hyJeeAdvanced: QuestionDef[] = [
  // Q1 [IIT 1990]
  sc(
    'When zeolite (hydrated sodium aluminium silicate) is treated with hard water, the sodium ions are exchanged with :- [IIT 1990]',
    ['H+ ions', 'Ca2+ ions', 'SO4^2- ions', 'OH- ions'],
    L['B'],
  ),
  // Q2
  sc(
    'Which of the following statement is correct :-',
    [
      'Hydrogen has same ionisation potential as sodium',
      'H has same electronegativity as halogens',
      'It will not be liberated at anode',
      'H has oxidation state +1, zero and -1',
    ],
    L['D'],
  ),
  // Q3 [IIT 2002]
  sc(
    'Polyphosphates are used as water softening agent because they :- [IIT 2002]',
    [
      'Form soluble complexes with anionic species',
      'Precipitate anionic species',
      'Form soluble complexes with cationic species',
      'Precipitate cationic species.',
    ],
    L['C'],
  ),
  // Q4 [JEE Adv. 2014]
  sc(
    'Hydrogen peroxide in its reaction with KIO4 and NH2OH respectively, is acting as a [JEE Adv. 2014]',
    ['reducing agent, oxidising agent', 'reducing agent, reducing agent', 'oxidising agent, oxidising agent', 'oxidising agent, reducing agent'],
    L['A'],
  ),
  // Q5 [JEE Adv. 2017]
  sc(
    'Which of the following combination will produce H2 gas? [JEE Adv. 2017]',
    [
      'Zn metal and NaOH(aq.)',
      'Au metal and NaCN(aq.) in the presence of air',
      'Cu metal and conc. HNO3',
      'Fe metal and conc. HNO3',
    ],
    L['A'],
  ),
];

// ─── DB UPSERT HELPERS ────────────────────────────────────────────────────────

async function upsertSubject(name: string) {
  return prisma.subject.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertChapter(subjectId: string, name: string) {
  const existing = await prisma.chapter.findUnique({ where: { subjectId_name: { subjectId, name } } });
  if (existing) return existing;
  return prisma.chapter.create({ data: { subjectId, name } });
}

async function upsertTopic(chapterId: string, name: string) {
  const existing = await prisma.topic.findUnique({ where: { chapterId_name: { chapterId, name } } });
  if (existing) return existing;
  return prisma.topic.create({ data: { chapterId, name } });
}

async function seedQuestions(topicId: string, questions: QuestionDef[]): Promise<number> {
  let seeded = 0;
  for (const q of questions) {
    try {
      const created = await prisma.question.create({
        data: {
          topicId,
          type: q.type,
          status: 'PUBLISHED',
          questionText: q.questionText,
        },
      });
      if (q.options.length > 0) {
        await prisma.option.createMany({
          data: q.options.map((o, i) => ({
            questionId: created.id,
            position: i,
            optionText: o.optionText,
            isCorrect: o.isCorrect,
          })),
        });
      }
      seeded++;
    } catch (err) {
      console.error(`  ✗ Failed: "${q.questionText.slice(0, 60)}..."`, (err as Error).message);
    }
  }
  return seeded;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  Scientia Question Bank Seeder');
  console.log('='.repeat(60));

  let totalAttempted = 0;
  let totalSeeded = 0;

  // ── Subject
  const subject = await upsertSubject('Chemistry');
  console.log(`\nSubject: Chemistry (id=${subject.id})`);

  // ══════════════════════════════════════════════════════════
  // CHAPTER 1: f-Block Elements
  // ══════════════════════════════════════════════════════════
  const fbChapter = await upsertChapter(subject.id, 'f-Block Elements');
  console.log(`\nChapter: f-Block Elements (id=${fbChapter.id})`);

  // Topic: Exercise O-1
  {
    const topic = await upsertTopic(fbChapter.id, 'Exercise O-1');
    console.log(`  Topic: Exercise O-1 — seeding ${fbO1.length} questions...`);
    const n = await seedQuestions(topic.id, fbO1);
    console.log(`  ✓ ${n}/${fbO1.length} seeded`);
    totalAttempted += fbO1.length;
    totalSeeded += n;
  }

  // Topic: JEE Main
  {
    const topic = await upsertTopic(fbChapter.id, 'JEE Main');
    console.log(`  Topic: JEE Main — seeding ${fbJeeMain.length} questions...`);
    const n = await seedQuestions(topic.id, fbJeeMain);
    console.log(`  ✓ ${n}/${fbJeeMain.length} seeded`);
    totalAttempted += fbJeeMain.length;
    totalSeeded += n;
  }

  // ══════════════════════════════════════════════════════════
  // CHAPTER 2: Hydrogen and its Compounds
  // ══════════════════════════════════════════════════════════
  const hyChapter = await upsertChapter(subject.id, 'Hydrogen and its Compounds');
  console.log(`\nChapter: Hydrogen and its Compounds (id=${hyChapter.id})`);

  // Topic: Dihydrogen
  {
    const topic = await upsertTopic(hyChapter.id, 'Dihydrogen');
    console.log(`  Topic: Dihydrogen — seeding ${hyDihydrogen.length} questions...`);
    const n = await seedQuestions(topic.id, hyDihydrogen);
    console.log(`  ✓ ${n}/${hyDihydrogen.length} seeded`);
    totalAttempted += hyDihydrogen.length;
    totalSeeded += n;
  }

  // Topic: Water (H2O)
  {
    const topic = await upsertTopic(hyChapter.id, 'Water (H2O)');
    console.log(`  Topic: Water (H2O) — seeding ${hyWater.length} questions...`);
    const n = await seedQuestions(topic.id, hyWater);
    console.log(`  ✓ ${n}/${hyWater.length} seeded`);
    totalAttempted += hyWater.length;
    totalSeeded += n;
  }

  // Topic: Hydrogen Peroxide (H2O2)
  {
    const topic = await upsertTopic(hyChapter.id, 'Hydrogen Peroxide (H2O2)');
    console.log(`  Topic: Hydrogen Peroxide (H2O2) — seeding ${hyH2O2.length} questions...`);
    const n = await seedQuestions(topic.id, hyH2O2);
    console.log(`  ✓ ${n}/${hyH2O2.length} seeded`);
    totalAttempted += hyH2O2.length;
    totalSeeded += n;
  }

  // Topic: Exercise O-2
  {
    const topic = await upsertTopic(hyChapter.id, 'Exercise O-2');
    console.log(`  Topic: Exercise O-2 — seeding ${hyO2.length} questions...`);
    const n = await seedQuestions(topic.id, hyO2);
    console.log(`  ✓ ${n}/${hyO2.length} seeded`);
    totalAttempted += hyO2.length;
    totalSeeded += n;
  }

  // Topic: Exercise S-2 (Comprehension & Match)
  {
    const topic = await upsertTopic(hyChapter.id, 'Exercise S-2');
    console.log(`  Topic: Exercise S-2 — seeding ${hyS2.length} questions...`);
    const n = await seedQuestions(topic.id, hyS2);
    console.log(`  ✓ ${n}/${hyS2.length} seeded`);
    totalAttempted += hyS2.length;
    totalSeeded += n;
  }

  // Topic: JEE Main
  {
    const topic = await upsertTopic(hyChapter.id, 'JEE Main');
    console.log(`  Topic: JEE Main — seeding ${hyJeeMain.length} questions...`);
    const n = await seedQuestions(topic.id, hyJeeMain);
    console.log(`  ✓ ${n}/${hyJeeMain.length} seeded`);
    totalAttempted += hyJeeMain.length;
    totalSeeded += n;
  }

  // Topic: JEE Advanced
  {
    const topic = await upsertTopic(hyChapter.id, 'JEE Advanced');
    console.log(`  Topic: JEE Advanced — seeding ${hyJeeAdvanced.length} questions...`);
    const n = await seedQuestions(topic.id, hyJeeAdvanced);
    console.log(`  ✓ ${n}/${hyJeeAdvanced.length} seeded`);
    totalAttempted += hyJeeAdvanced.length;
    totalSeeded += n;
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log(`  TOTAL QUESTIONS IN PDFs : 126`);
  console.log(`  Skipped (integer/matrix): 7  (S-1 ×5, S-2 matrix ×2)`);
  console.log(`  TOTAL ATTEMPTED         : ${totalAttempted}`);
  console.log(`  TOTAL SEEDED SUCCESSFULLY: ${totalSeeded}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
