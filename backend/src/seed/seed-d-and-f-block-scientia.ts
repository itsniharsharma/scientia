/**
 * Seed: Scientia Chemistry Classes — d- and f-Block Elements
 * Run: npx tsx --env-file ../.env src/seed/seed-d-and-f-block-scientia.ts
 *
 * Subject : Chemistry
 *   Chapter: d- and f-Block Elements
 *     Topics: Sections A–H (JEE Main + NEET pattern, 100 MCQs)
 *
 * Source: Scientia Chemistry Classes — Dr. Raj Kumar Garg (Ph.D. Chemistry)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── helpers ───────────────────────────────────────────────────────────────────

type Opt = { optionText: string; isCorrect: boolean; position: number };
type SC  = { type: 'SINGLE_CHOICE'; questionText: string; options: Opt[] };

/** sc(text, [opt1, opt2, opt3, opt4], correctIndex0based) */
function sc(text: string, opts: string[], ci: number): SC {
  return {
    type: 'SINGLE_CHOICE',
    questionText: text,
    options: opts.map((o, i) => ({ optionText: o, isCorrect: i === ci, position: i + 1 })),
  };
}

// ─── SECTION A — Electronic Configuration and General Properties (Q1–Q12) ─────

const sectionA: SC[] = [
  sc(
    'The general electronic configuration of transition (d-block) elements is:',
    [
      '(n-1)d¹⁻¹⁰ns¹⁻²',
      '(n-1)d¹⁻¹⁰ns⁰',
      'nd¹⁻¹⁰(n+1)s¹⁻²',
      '(n-1)d⁰ns²',
    ],
    0,
  ),
  sc(
    'The element with the electronic configuration [Xe]4f¹⁴5d¹⁰6s² belongs to the:',
    [
      'd-block',
      'f-block',
      'p-block',
      's-block',
    ],
    0,
  ),
  sc(
    'The first (3d) transition series starts with the element:',
    [
      'Calcium (Z = 20)',
      'Scandium (Z = 21)',
      'Titanium (Z = 22)',
      'Zinc (Z = 30)',
    ],
    1,
  ),
  sc(
    'Which of the following is NOT a transition element (i.e., does not have an incomplete d-subshell in its ground state or common oxidation states)?',
    [
      'Zinc (Z = 30)',
      'Iron (Z = 26)',
      'Copper (Z = 29)',
      'Nickel (Z = 28)',
    ],
    0,
  ),
  sc(
    'The correct electronic configuration of Cr (Z = 24) is:',
    [
      '[Ar]3d⁴4s²',
      '[Ar]3d⁶4s⁰',
      '[Ar]3d³4s²4p¹',
      '[Ar]3d⁵4s¹',
    ],
    3,
  ),
  sc(
    'Which of the following elements has the electronic configuration [Ar]3d¹⁰4s²?',
    [
      'Zinc (Z = 30)',
      'Copper (Z = 29)',
      'Nickel (Z = 28)',
      'Iron (Z = 26)',
    ],
    0,
  ),
  sc(
    'The electronic configuration of Cu²⁺ (Z = 29) is:',
    [
      '[Ar]3d¹⁰4s¹',
      '[Ar]3d⁹4s²',
      '[Ar]3d⁹',
      '[Ar]3d¹⁰',
    ],
    2,
  ),
  sc(
    'Among the neutral atoms of the first transition series, the element with the maximum number of unpaired electrons is:',
    [
      'Cr (Z = 24) with 6 unpaired electrons ([Ar]3d⁵4s¹)',
      'Mn (Z = 25) with 5 unpaired electrons ([Ar]3d⁵4s²)',
      'Fe (Z = 26) with 4 unpaired electrons ([Ar]3d⁶4s²)',
      'Co (Z = 27) with 3 unpaired electrons ([Ar]3d⁷4s²)',
    ],
    0,
  ),
  sc(
    'The elements of the first transition series have incompletely filled:',
    [
      '4p orbitals',
      '3d orbitals',
      '4s orbitals',
      '3p orbitals',
    ],
    1,
  ),
  sc(
    'The total number of elements present in the first (3d) transition series is:',
    [
      '8',
      '9',
      '10',
      '11',
    ],
    2,
  ),
  sc(
    'The anomalous electronic configuration of Cu (Z = 29) is:',
    [
      '[Ar]3d⁹4s²',
      '[Ar]3d¹⁰4s¹',
      '[Ar]3d⁸4s²4p¹',
      '[Ar]3d¹⁰4p¹',
    ],
    1,
  ),
  sc(
    'Zn (Z = 30) is NOT considered a transition element because:',
    [
      'it has a completely filled d-subshell in both ground state and in all its common oxidation states',
      'it does not contain any d electrons',
      'it exhibits only one oxidation state',
      'its melting point is very low',
    ],
    0,
  ),
];

// ─── SECTION B — Physical Properties and Atomic Radii (Q13–Q24) ───────────────

const sectionB: SC[] = [
  sc(
    'Which pair of transition elements has almost identical atomic radii due to lanthanoid contraction?',
    [
      'Ti and V',
      'Zr and Hf',
      'Mn and Re',
      'Fe and Os',
    ],
    1,
  ),
  sc(
    'The atomic radii of transition elements across the first transition series (Sc to Zn) generally:',
    [
      'increase steadily',
      'first decrease and then increase slightly towards the end',
      'remain nearly constant throughout',
      'decrease steadily',
    ],
    1,
  ),
  sc(
    'Transition metals have high melting points compared to s-block metals primarily because:',
    [
      'they form strong metallic bonds involving both s and d electrons',
      'they are heavier elements',
      'they possess more total electrons',
      'they exist as ionic solids',
    ],
    0,
  ),
  sc(
    'Among the metallic elements, the highest melting point belongs to:',
    [
      'Iron (Fe)',
      'Tungsten (W)',
      'Chromium (Cr)',
      'Titanium (Ti)',
    ],
    1,
  ),
  sc(
    'The high density of transition metals is primarily due to:',
    [
      'large atomic masses and correspondingly large atomic radii',
      'predominantly ionic bonding in the solid state',
      'relatively small atomic radii combined with high atomic masses',
      'covalent character of the metallic bond',
    ],
    2,
  ),
  sc(
    'Lanthanoid contraction arises because:',
    [
      '4f electrons provide poor shielding of the nuclear charge from one another',
      '4d electrons provide poor shielding',
      '4f electrons provide very effective shielding',
      'the nuclear charge decreases across the lanthanoid series',
    ],
    0,
  ),
  sc(
    'The first ionization enthalpies of transition metals, when compared to s-block and p-block elements of the same period, are generally:',
    [
      'higher than s-block but lower than most p-block elements',
      'lower than s-block metals',
      'higher than all p-block elements',
      'comparable to those of noble gases',
    ],
    0,
  ),
  sc(
    'The standard electrode potential of Mn²⁺/Mn is more negative than expected from the general trend. This is because:',
    [
      'Mn²⁺ has a very small ionic radius',
      'Mn²⁺ has an extra-stable half-filled 3d⁵ electronic configuration',
      'Mn has an unusually high ionization enthalpy',
      'Mn has anomalously low hydration enthalpy',
    ],
    1,
  ),
  sc(
    'The correct order of metallic (atomic) radii of Mn, Fe, Co and Ni is:',
    [
      'Mn > Fe > Co > Ni',
      'Ni > Co > Fe > Mn',
      'Fe > Mn > Co > Ni',
      'Co > Ni > Fe > Mn',
    ],
    0,
  ),
  sc(
    'The unusually low standard electrode potential of Cu²⁺/Cu (E° = +0.34 V) compared to the expected negative value is explained by:',
    [
      'the high atomic mass of copper',
      'the high second ionization enthalpy and relatively low hydration enthalpy of Cu²⁺',
      'the very high melting point of copper',
      'the absence of unpaired electrons in Cu⁰',
    ],
    1,
  ),
  sc(
    'The high electrical conductivity of transition metals is attributed to:',
    [
      'the presence of f electrons',
      'ionic bonding between metal atoms',
      'the presence of mobile delocalized d electrons along with s electrons',
      'their high atomic masses',
    ],
    2,
  ),
  sc(
    'The colour of transition metal ions in aqueous solution is primarily due to:',
    [
      'd-d electronic transitions in the presence of ligands (crystal field splitting)',
      's-to-p electronic transitions',
      's-to-d electronic transitions',
      'nuclear spin transitions',
    ],
    0,
  ),
];

// ─── SECTION C — Ionisation Enthalpy and Oxidation States (Q25–Q38) ───────────

const sectionC: SC[] = [
  sc(
    'The highest oxidation state exhibited by manganese (Mn, Z = 25) is:',
    ['+4', '+6', '+7', '+5'],
    2,
  ),
  sc(
    'The highest oxidation state exhibited by chromium (Cr, Z = 24) in its compounds is:',
    ['+3', '+6', '+4', '+2'],
    1,
  ),
  sc(
    'Transition metals generally exhibit their highest oxidation states in compounds formed with:',
    [
      'sulfides',
      'halides (especially bromides)',
      'oxides and fluorides',
      'nitrides',
    ],
    2,
  ),
  sc(
    'The most stable oxidation state of iron in its compounds is:',
    ['+3', '+2', '+4', '+6'],
    0,
  ),
  sc(
    'Among the first-row transition elements, manganese (Mn) shows the maximum number of oxidation states. These are:',
    [
      '+2, +3, +4, +7 only',
      '+1, +2, +3, +4, +5, +6 only',
      '+2, +3, +4, +5, +6, +7 (six states)',
      '+1, +2, +3, +4 only',
    ],
    0,
  ),
  sc(
    'The oxidation state of manganese in the permanganate ion (MnO₄⁻) is:',
    ['+7', '+6', '+5', '+4'],
    0,
  ),
  sc(
    'The oxidation state of chromium in the dichromate ion (Cr₂O₇²⁻) is:',
    ['+3', '+4', '+6', '+7'],
    2,
  ),
  sc(
    'Which of the following species contains a metal in the +8 oxidation state?',
    [
      'CrO₄²⁻',
      'MnO₄⁻',
      'OsO₄',
      'FeO₄²⁻',
    ],
    2,
  ),
  sc(
    'Which transition metal primarily exists in only the +2 oxidation state in all its stable compounds?',
    [
      'Zn (Z = 30)',
      'Mn (Z = 25)',
      'Fe (Z = 26)',
      'Cu (Z = 29)',
    ],
    0,
  ),
  sc(
    'The second ionization enthalpy of Cr is anomalously high compared to the general trend because:',
    [
      'Cr has an unusually large atomic radius',
      'Cr has a fully filled 4s subshell',
      'Cr⁺ has a stable half-filled 3d⁵ configuration, and removing an electron from it requires extra energy',
      'Cr exhibits poor shielding by its core electrons',
    ],
    2,
  ),
  sc(
    'The +2 oxidation state is most stable at the end of the first transition series. The element showing the most stable +2 state is:',
    [
      'Ti²⁺',
      'Zn²⁺',
      'Cr²⁺',
      'V²⁺',
    ],
    1,
  ),
  sc(
    'The compound in which manganese is in its highest (+7) oxidation state is:',
    [
      'Mn₂O₇',
      'MnO₂',
      'MnO',
      'Mn₂O₃',
    ],
    0,
  ),
  sc(
    'The highest oxidation state of iron (+6) is found in:',
    [
      'ferrate ion FeO₄²⁻',
      'iron(III) oxide Fe₂O₃',
      'iron(II) oxide FeO',
      'iron pentacarbonyl Fe(CO)₅',
    ],
    0,
  ),
  sc(
    'The ionization enthalpies of transition metals across the first transition series:',
    [
      'decrease steadily from Sc to Zn',
      'do not change in any regular manner (vary irregularly)',
      'increase steadily from Sc to Zn',
      'remain essentially constant from Sc to Zn',
    ],
    1,
  ),
];

// ─── SECTION D — Colour, Magnetism, Catalysis and Alloys (Q39–Q52) ────────────

const sectionD: SC[] = [
  sc(
    'The coloured nature of transition metal ions in solution is attributed to:',
    [
      'complete filling of d-orbitals, which allows all wavelengths to be absorbed',
      'incomplete filling of d-orbitals, which allows d-d electronic transitions to occur',
      'the presence of f-electrons',
      'the high positive charge on the metal ion',
    ],
    1,
  ),
  sc(
    'Which of the following ions is colourless in aqueous solution?',
    [
      'Fe³⁺',
      'Cu²⁺',
      'Zn²⁺',
      'Mn²⁺',
    ],
    2,
  ),
  sc(
    'Transition metals serve as excellent catalysts primarily because:',
    [
      'they have very high melting points',
      'they exhibit variable oxidation states and an ability to form intermediary complexes',
      'they are strongly magnetic',
      'they possess very high densities',
    ],
    1,
  ),
  sc(
    'The paramagnetic properties of transition metal ions arise from:',
    [
      'the presence of unpaired d electrons',
      'the presence of only paired d electrons',
      'the presence of f electrons',
      'nuclear spin interactions',
    ],
    0,
  ),
  sc(
    'The spin-only magnetic moment of Ti³⁺ (Z = 22, configuration [Ar]3d¹) is:',
    [
      '0 BM',
      '1.73 BM',
      '2.83 BM',
      '3.87 BM',
    ],
    1,
  ),
  sc(
    'Steel is an alloy that consists primarily of:',
    [
      'iron and carbon',
      'iron and copper',
      'iron and zinc',
      'iron and nickel',
    ],
    0,
  ),
  sc(
    'Which transition metal is employed as the catalyst in the Haber process for the industrial synthesis of ammonia?',
    [
      'Iron (Fe)',
      'Vanadium (V)',
      'Nickel (Ni)',
      'Platinum (Pt)',
    ],
    0,
  ),
  sc(
    'The spin-only magnetic moment of Mn²⁺ (Z = 25, configuration [Ar]3d⁵) is approximately:',
    [
      '3.87 BM',
      '5.92 BM',
      '4.90 BM',
      '2.83 BM',
    ],
    1,
  ),
  sc(
    'Nickel is widely used as a heterogeneous catalyst in:',
    [
      'the hydrogenation of vegetable oils',
      'the contact process for H₂SO₄ manufacture',
      'the Haber process for NH₃ synthesis',
      'the Ostwald process for HNO₃ manufacture',
    ],
    0,
  ),
  sc(
    'Among the following aqueous solutions, the one that appears deep blue in colour is:',
    [
      'FeSO₄ solution',
      'CuSO₄ solution',
      'K₂Cr₂O₇ solution',
      'KMnO₄ solution',
    ],
    1,
  ),
  sc(
    'Bronze is an alloy composed of:',
    [
      'copper and tin',
      'copper and zinc',
      'copper and nickel',
      'copper and aluminium',
    ],
    0,
  ),
  sc(
    'Which transition metal oxide is used as the catalyst in the contact process for the manufacture of sulphuric acid?',
    [
      'Fe₂O₃',
      'V₂O₅',
      'CrO₃',
      'MnO₂',
    ],
    1,
  ),
  sc(
    'The colour of an aqueous solution of KMnO₄ is:',
    [
      'purple (violet)',
      'blue',
      'green',
      'orange',
    ],
    0,
  ),
  sc(
    'The spin-only magnetic moment of Cu²⁺ (Z = 29, configuration [Ar]3d⁹) is approximately:',
    [
      '1.73 BM',
      '2.83 BM',
      '0 BM',
      '3.87 BM',
    ],
    0,
  ),
];

// ─── SECTION E — Electrode Potentials and Stability (Q53–Q62) ─────────────────

const sectionE: SC[] = [
  sc(
    'The standard electrode potential of Cu²⁺/Cu is +0.34 V (positive). This implies that copper:',
    [
      'readily dissolves in dilute H₂SO₄',
      'does not dissolve in dilute H₂SO₄ but dissolves readily in concentrated HNO₃',
      'dissolves in all mineral acids',
      'is completely chemically inert',
    ],
    1,
  ),
  sc(
    'Given E°(Fe³⁺/Fe²⁺) = +0.77 V, which of the following reductions can Fe³⁺ bring about in aqueous solution? [E°(I₂/I⁻) = +0.54 V; E°(Cu²⁺/Cu) = +0.34 V; E°(Br₂/Br⁻) = +1.08 V; E°(Ag⁺/Ag) = +0.80 V]',
    [
      'Oxidation of I⁻ to I₂',
      'Oxidation of Cu to Cu²⁺',
      'Oxidation of Br⁻ to Br₂',
      'Oxidation of Ag to Ag⁺',
    ],
    0,
  ),
  sc(
    'Fe³⁺ is more stable than Fe²⁺ in aqueous solution primarily because:',
    [
      'Fe³⁺ has the extra stability of a half-filled 3d⁵ electronic configuration',
      'Fe³⁺ has a higher charge density than Fe²⁺',
      'Fe³⁺ is smaller and therefore more stable',
      'Fe³⁺ has a lower hydration enthalpy than Fe²⁺',
    ],
    0,
  ),
  sc(
    'Which of the following is a powerful oxidising agent in acidic medium?',
    [
      'MnO₄⁻ (permanganate) in acidic medium',
      'MnO₄²⁻ (manganate)',
      'Mn²⁺',
      'MnO₂ in neutral medium',
    ],
    0,
  ),
  sc(
    'The E° value for Mn³⁺/Mn²⁺ is very high (+1.57 V), making Mn³⁺ a powerful oxidising agent in aqueous solution. The primary reason is:',
    [
      'Mn²⁺ has an unusually small ionic radius',
      'Mn²⁺ possesses an extra-stable half-filled 3d⁵ configuration',
      'Mn has an anomalously high third ionization enthalpy',
      'Mn has an unusually high density',
    ],
    1,
  ),
  sc(
    'The very negative E° value of Cr³⁺/Cr²⁺ (−0.41 V) indicates that:',
    [
      'Cr²⁺ is a strong reducing agent',
      'Cr³⁺ is a strong reducing agent',
      'Cr²⁺ is a strong oxidising agent',
      'Cr³⁺ is a strong oxidising agent',
    ],
    0,
  ),
  sc(
    'The standard electrode potential of Zn²⁺/Zn is −0.76 V. This indicates that:',
    [
      'Zn²⁺ is difficult to reduce (i.e., Zn is a good reducing agent)',
      'Zn²⁺ is easily reduced under standard conditions',
      'Zinc does not dissolve in dilute acids',
      'Zinc is a noble metal',
    ],
    0,
  ),
  sc(
    'The E° value for Co³⁺/Co²⁺ is very high (+1.97 V). This indicates that:',
    [
      'Co³⁺ is a very strong oxidising agent and is reduced readily to Co²⁺ in aqueous solution',
      'Co²⁺ is a very strong oxidising agent',
      'Co³⁺ is thermodynamically stable in aqueous solution',
      'Co²⁺ is unstable and readily oxidised to Co³⁺ in water',
    ],
    0,
  ),
  sc(
    'Among the following first-row transition metal ions, the thermodynamically most stable ion (considering extra stability from d-electron configuration) is:',
    [
      'Fe³⁺ (half-filled 3d⁵ configuration)',
      'Ti⁴⁺ (empty 3d⁰ configuration)',
      'Cu²⁺ (3d⁹ configuration)',
      'Cr²⁺ (3d⁴ configuration)',
    ],
    0,
  ),
  sc(
    'The disproportionation of Mn³⁺ in aqueous solution produces:',
    [
      'Mn⁰ and MnO₄⁻',
      'Mn⁰ and Mn²⁺',
      'Mn²⁺ and MnO₂ (Mn⁴⁺)',
      'MnO₄⁻ and MnO₂',
    ],
    2,
  ),
];

// ─── SECTION F — Potassium Dichromate and Potassium Permanganate (Q63–Q76) ────

const sectionF: SC[] = [
  sc(
    'The colour of potassium dichromate (K₂Cr₂O₇) crystals is:',
    [
      'orange-red',
      'yellow',
      'green',
      'violet',
    ],
    0,
  ),
  sc(
    'When H₂S is passed through an acidified solution of K₂Cr₂O₇, the dichromate is reduced to:',
    [
      'CrO₄²⁻',
      'Cr³⁺',
      'Cr²⁺',
      'CrO₃',
    ],
    1,
  ),
  sc(
    'In acidic solution, the dichromate ion (Cr₂O₇²⁻) acts as:',
    [
      'an oxidising agent',
      'a reducing agent',
      'an amphoteric species',
      'a base',
    ],
    0,
  ),
  sc(
    'When KOH is added to a solution of K₂Cr₂O₇, the solution changes colour from orange to:',
    [
      'green (Cr³⁺)',
      'blue',
      'yellow (due to formation of CrO₄²⁻)',
      'violet',
    ],
    2,
  ),
  sc(
    'The structure of the dichromate ion (Cr₂O₇²⁻) consists of:',
    [
      'one Cr atom in a tetrahedral environment',
      'two separate CrO₄²⁻ tetrahedra with no bridging oxygen',
      'two CrO₄ tetrahedra sharing one corner oxygen atom',
      'two octahedrally coordinated Cr centres sharing an edge',
    ],
    2,
  ),
  sc(
    'In acidic medium, one mole of KMnO₄ (MnO₄⁻) oxidises how many moles of Fe²⁺ to Fe³⁺?',
    [
      '3',
      '5',
      '7',
      '2',
    ],
    1,
  ),
  sc(
    'The colour of an aqueous solution of KMnO₄ is:',
    [
      'purple (violet)',
      'green',
      'orange',
      'blue',
    ],
    0,
  ),
  sc(
    'KMnO₄ acts as the strongest oxidising agent in:',
    [
      'neutral medium',
      'basic (alkaline) medium',
      'acidic medium',
      'all media with equal strength',
    ],
    2,
  ),
  sc(
    'The product of reduction of KMnO₄ in strongly acidic medium is:',
    [
      'Mn²⁺ (pale pink / nearly colourless)',
      'MnO₂ (brown precipitate)',
      'MnO₄²⁻ (green)',
      'Mn³⁺',
    ],
    0,
  ),
  sc(
    'The product of reduction of KMnO₄ in neutral or faintly alkaline medium is:',
    [
      'MnO₂ (brown precipitate)',
      'Mn²⁺ (colourless solution)',
      'MnO₄²⁻ (green)',
      'Mn(OH)₂ (white precipitate)',
    ],
    0,
  ),
  sc(
    'How many moles of oxalic acid (H₂C₂O₄) are oxidised by one mole of KMnO₄ in acidic solution?',
    [
      '5/2 (2.5 moles)',
      '5',
      '3',
      '2',
    ],
    0,
  ),
  sc(
    'The geometry of the permanganate ion (MnO₄⁻) is:',
    [
      'tetrahedral',
      'square planar',
      'octahedral',
      'linear',
    ],
    0,
  ),
  sc(
    'K₂Cr₂O₇ is industrially prepared from chromite ore (FeCr₂O₄) by:',
    [
      'fusion with Na₂CO₃ in air → sodium chromate → acidification → sodium dichromate → treatment with KCl → K₂Cr₂O₇',
      'direct dissolution of chromite ore in water',
      'electrolysis of chromite in molten salt',
      'high-temperature roasting of chromite with sulfur',
    ],
    0,
  ),
  sc(
    'The oxidation number of manganese in the manganate ion (MnO₄²⁻) is:',
    [
      '+6',
      '+7',
      '+5',
      '+4',
    ],
    0,
  ),
];

// ─── SECTION G — The Lanthanoids (Q77–Q90) ────────────────────────────────────

const sectionG: SC[] = [
  sc(
    'The general electronic configuration of lanthanoid elements is:',
    [
      '[Xe]4f¹⁻¹⁴5d⁰⁻¹6s²',
      '[Xe]4f¹⁻¹⁴5d²6s²',
      '[Kr]4f¹⁻¹⁴5d¹6s²',
      '[Xe]5f¹⁻¹⁴6d¹7s²',
    ],
    0,
  ),
  sc(
    'Lanthanoid contraction is caused by:',
    [
      'an increase in nuclear charge without any change in the number of electrons',
      'poor (imperfect) shielding of one 4f electron by another within the same 4f subshell',
      'very efficient shielding by 4f electrons',
      'a decrease in nuclear charge across the series',
    ],
    1,
  ),
  sc(
    'An important consequence of lanthanoid contraction is that:',
    [
      'Zr (4d series) and Hf (5d series) have almost identical atomic radii and very similar chemical properties',
      'lanthanoids are all larger than actinoids',
      'all lanthanoids are radioactive',
      'lanthanoid ions are colourless in solution',
    ],
    0,
  ),
  sc(
    'The most common and stable oxidation state of lanthanoid elements is:',
    [
      '+3',
      '+2',
      '+4',
      '+1',
    ],
    0,
  ),
  sc(
    'Cerium (Ce, Z = 58) exhibits an anomalous +4 oxidation state because:',
    [
      'Ce⁴⁺ attains the extra-stable empty 4f⁰ electronic configuration',
      'Ce has an unusually high fourth ionization enthalpy',
      'Ce is smaller than other lanthanoids',
      'Ce⁴⁺ attains the extra-stable fully filled 4f¹⁴ configuration',
    ],
    0,
  ),
  sc(
    'Europium (Eu, Z = 63) and Ytterbium (Yb, Z = 70) show a stable +2 oxidation state because:',
    [
      'they have unusually large atomic radii among lanthanoids',
      'Eu²⁺ (4f⁷) and Yb²⁺ (4f¹⁴) gain extra stability from half-filled and fully-filled 4f configurations respectively',
      'both elements are radioactive',
      'they have lower ionization enthalpies than other lanthanoids',
    ],
    1,
  ),
  sc(
    'Lanthanoid elements are also known as:',
    [
      'rare earth elements',
      'actinoids',
      'chalcogens',
      'halogens',
    ],
    0,
  ),
  sc(
    'The basic character of lanthanoid hydroxides Ln(OH)₃ across the series from La to Lu:',
    [
      'increases steadily from La(OH)₃ to Lu(OH)₃',
      'decreases steadily from La(OH)₃ (most basic) to Lu(OH)₃ (least basic)',
      'remains essentially constant across the series',
      'alternates between basic and weakly acidic',
    ],
    1,
  ),
  sc(
    'The total number of lanthanoid elements (from La to Lu) in the periodic table is:',
    [
      '10',
      '12',
      '14',
      '16',
    ],
    2,
  ),
  sc(
    'The separation of individual lanthanoid elements from one another (due to their very similar properties) is best achieved by:',
    [
      'ion-exchange chromatography',
      'fractional distillation',
      'electrolysis from molten salts',
      'fractional crystallisation',
    ],
    0,
  ),
  sc(
    'When lanthanoid metals are dissolved in dilute mineral acids, the products are:',
    [
      'H₂ gas and Ln³⁺ salts in solution',
      'Ln²⁺ salts only, with no gas evolution',
      'O₂ gas and lanthanoid oxides',
      'no reaction occurs',
    ],
    0,
  ),
  sc(
    'The magnetic moments of lanthanoid ions are significantly larger than spin-only predictions because:',
    [
      'only the spin contribution of 4f electrons matters',
      'both spin and orbital angular momentum contributions of 4f electrons are significant',
      'all lanthanoid ions are diamagnetic',
      'all lanthanoid ions have equal magnetic moments',
    ],
    1,
  ),
  sc(
    'The colour of lanthanoid ions in solution is primarily attributed to:',
    [
      'd-d electronic transitions',
      'f-f electronic transitions (between 4f energy levels split by the crystal field)',
      'charge-transfer transitions exclusively',
      'nuclear hyperfine interactions',
    ],
    1,
  ),
  sc(
    'The steady decrease in atomic (ionic) radii of lanthanoids from La to Lu is known as lanthanoid contraction. It occurs because:',
    [
      'the nuclear charge increases but electron–electron repulsion between 4f electrons increases proportionally',
      'the nuclear charge increases by one unit per element but the 4f electrons shield each other poorly, so the effective nuclear charge felt by outer electrons increases steadily',
      'the number of f electrons decreases across the series',
      'the ionic radii increase due to added f electrons',
    ],
    1,
  ),
];

// ─── SECTION H — The Actinoids and Comparisons (Q91–Q100) ─────────────────────

const sectionH: SC[] = [
  sc(
    'The general electronic configuration of actinoid elements is:',
    [
      '[Rn]5f¹⁻¹⁴6d⁰⁻¹7s²',
      '[Xe]5f¹⁻¹⁴6d¹7s²',
      '[Rn]4f¹⁻¹⁴5d¹6s²',
      '[Kr]5f¹⁻¹⁴6d¹7s²',
    ],
    0,
  ),
  sc(
    'All actinoid elements are:',
    [
      'radioactive',
      'paramagnetic only',
      'coloured in all oxidation states',
      'gaseous under standard conditions',
    ],
    0,
  ),
  sc(
    'Actinoids exhibit a much wider range of oxidation states than lanthanoids. The main reason is:',
    [
      'actinoids have larger atomic radii than lanthanoids',
      'the 5f, 6d, and 7s orbitals are very close in energy, allowing electrons from all three subshells to participate in bonding',
      'actinoids have more total electrons than lanthanoids',
      'all actinoids are radioactive, which makes their electrons more reactive',
    ],
    1,
  ),
  sc(
    'The maximum oxidation state shown by uranium (U, Z = 92) in its compounds is:',
    [
      '+4',
      '+5',
      '+6',
      '+8',
    ],
    2,
  ),
  sc(
    'The most stable and most commonly observed oxidation state of the actinoid elements is:',
    [
      '+3',
      '+2',
      '+4',
      '+5',
    ],
    0,
  ),
  sc(
    'Actinoid contraction per element compared to lanthanoid contraction per element is:',
    [
      'greater (larger decrease in radius per element)',
      'smaller',
      'exactly the same',
      'zero (no contraction in actinoids)',
    ],
    0,
  ),
  sc(
    'The first member of the actinoid series is:',
    [
      'Actinium (Ac, Z = 89)',
      'Thorium (Th, Z = 90)',
      'Uranium (U, Z = 92)',
      'Plutonium (Pu, Z = 94)',
    ],
    0,
  ),
  sc(
    'The atomic number of thorium (Th), the second actinoid element, is:',
    [
      '90',
      '92',
      '94',
      '89',
    ],
    0,
  ),
  sc(
    'Compared to lanthanoids, actinoids have a greater tendency to form coordination complexes because:',
    [
      'actinoids form weaker bonds with ligands',
      'actinoids are larger and the 5f orbitals extend further, making them more available for complex formation',
      'actinoids and lanthanoids have an identical tendency for complex formation',
      'actinoids do not form any stable complexes',
    ],
    1,
  ),
  sc(
    'The 5f orbitals of actinoids participate more readily in bonding compared to the 4f orbitals of lanthanoids because:',
    [
      '5f orbitals are fully filled in all actinoids',
      '5f orbitals are more radially diffuse, extend further from the nucleus, and are less effectively shielded',
      '5f orbitals are at a lower energy level than 4f orbitals',
      'actinoids have fewer electrons than lanthanoids',
    ],
    1,
  ),
];

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Scientia Chemistry — d- and f-Block Elements (100 MCQs)...\n');

  const subject = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry' },
  });

  const chapter = await prisma.chapter.upsert({
    where: { subjectId_name: { subjectId: subject.id, name: 'd- and f-Block Elements' } },
    update: {},
    create: { name: 'd- and f-Block Elements', subjectId: subject.id },
  });

  const sections: Array<{ name: string; questions: SC[] }> = [
    { name: 'Section A - Electronic Configuration and General Properties', questions: sectionA },
    { name: 'Section B - Physical Properties and Atomic Radii',            questions: sectionB },
    { name: 'Section C - Ionisation Enthalpy and Oxidation States',        questions: sectionC },
    { name: 'Section D - Colour, Magnetism, Catalysis and Alloys',         questions: sectionD },
    { name: 'Section E - Electrode Potentials and Stability',              questions: sectionE },
    { name: 'Section F - Potassium Dichromate and Potassium Permanganate', questions: sectionF },
    { name: 'Section G - The Lanthanoids',                                 questions: sectionG },
    { name: 'Section H - The Actinoids and Comparisons',                   questions: sectionH },
  ];

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const section of sections) {
    const topic = await prisma.topic.upsert({
      where: { chapterId_name: { chapterId: chapter.id, name: section.name } },
      update: {},
      create: { name: section.name, chapterId: chapter.id },
    });

    let created = 0;
    let skipped = 0;

    for (const q of section.questions) {
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

    totalCreated += created;
    totalSkipped += skipped;
    console.log(`  ${section.name}: ${created} created, ${skipped} skipped`);
  }

  const totalAttempted = totalCreated + totalSkipped;

  console.log('\n─────────────────────────────────────────────────');
  console.log(`Total questions attempted : ${totalAttempted}`);
  console.log(`Created                  : ${totalCreated}`);
  console.log(`Already existed (skipped): ${totalSkipped}`);
  console.log(`Success rate             : ${totalAttempted > 0 ? ((totalCreated / totalAttempted) * 100).toFixed(1) : '0.0'}%`);
  console.log('─────────────────────────────────────────────────');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
