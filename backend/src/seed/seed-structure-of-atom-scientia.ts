/**
 * Seed: Scientia Chemistry Classes — Structure of Atom
 * Run: npx tsx --env-file ../.env src/seed/seed-structure-of-atom-scientia.ts
 *
 * Subject : Chemistry
 *   Chapter: Structure of Atom
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

// ─── SECTION A — Atomic Models (Q1–Q10) ───────────────────────────────────────

const sectionA: SC[] = [
  sc(
    'The e/m ratio of cathode ray particles was found to be independent of the nature of the gas taken in the discharge tube. This observation established that:',
    [
      'electrons are universal constituents of all matter',
      'cathode rays consist of positively charged particles',
      'the mass of the electron depends on the gas taken',
      'cathode rays travel in straight lines',
    ],
    0,
  ),
  sc(
    'The charge on the electron was determined by Millikan\'s oil drop experiment as 1.6 × 10⁻¹⁹ C. Combined with Thomson\'s e/m value, this allowed calculation of:',
    [
      'the radius of the electron',
      'the mass of the electron',
      'the spin of the electron',
      'the size of the nucleus',
    ],
    1,
  ),
  sc(
    'In Rutherford\'s α-ray scattering experiment, most of the α-particles passed through the gold foil undeflected. This shows that:',
    [
      'the nucleus is positively charged',
      'most of the space inside the atom is empty',
      'α-particles are heavier than electrons',
      'electrons revolve around the nucleus',
    ],
    1,
  ),
  sc(
    'Which observation of the α-scattering experiment could NOT be explained by Thomson\'s plum-pudding model?',
    [
      'Deflection of a few α-particles through very large angles',
      'Straight-line motion of cathode rays',
      'Neutrality of the atom as a whole',
      'Production of anode rays in the discharge tube',
    ],
    0,
  ),
  sc(
    '⁴⁰₁₈Ar, ⁴⁰₁₉K and ⁴⁰₂₀Ca are examples of:',
    ['isotopes', 'isobars', 'isotones', 'isoelectronic species'],
    1,
  ),
  sc(
    'The number of neutrons in ²³⁸₉₂U is:',
    ['92', '238', '146', '330'],
    2,
  ),
  sc(
    'Among the following, the charge-to-mass (e/m) ratio is maximum for:',
    ['proton', 'α-particle', 'electron', 'deuteron'],
    2,
  ),
  sc(
    'Unlike cathode rays, the characteristics of anode (canal) rays depend upon the gas taken in the discharge tube because:',
    [
      'anode rays are electromagnetic waves',
      'anode rays consist of the ionised residues of the gas itself',
      'anode rays are produced at the cathode',
      'the gas absorbs the anode rays',
    ],
    1,
  ),
  sc(
    'According to classical electromagnetic theory, Rutherford\'s planetary model of the atom fails because a revolving electron should:',
    [
      'move in elliptical orbits only',
      'continuously radiate energy and spiral into the nucleus',
      'repel the nucleus',
      'have quantised angular momentum',
    ],
    1,
  ),
  sc(
    'The correct increasing order of specific charge (e/m) of electron (e), proton (p), neutron (n) and α-particle (α) is:',
    ['n < p < α < e', 'n < α < p < e', 'α < n < p < e', 'e < p < α < n'],
    1,
  ),
];

// ─── SECTION B — Bohr Model (Q11–Q25) ────────────────────────────────────────

const sectionB: SC[] = [
  sc(
    'The energy of the second Bohr orbit of the hydrogen atom is −328 kJ mol⁻¹. Hence the energy of the fourth Bohr orbit is:',
    ['−41 kJ mol⁻¹', '−82 kJ mol⁻¹', '−164 kJ mol⁻¹', '−1312 kJ mol⁻¹'],
    1,
  ),
  sc(
    'The radius of the second Bohr orbit of Li²⁺ ion (in Å) is: (radius of first Bohr orbit of H = 0.529 Å)',
    ['0.529', '0.705', '1.058', '2.116'],
    1,
  ),
  sc(
    'The ratio of the radii of the first orbits of H, He⁺ and Li²⁺ is:',
    ['1 : 2 : 3', '6 : 3 : 2', '9 : 4 : 1', '1 : 4 : 9'],
    1,
  ),
  sc(
    'The ratio of the velocity of the electron in the first orbit to that in the third orbit of the hydrogen atom is:',
    ['1 : 3', '3 : 1', '1 : 9', '9 : 1'],
    1,
  ),
  sc(
    'The ionisation energy of the hydrogen atom is 13.6 eV. The ionisation energy of He⁺ ion in its ground state is:',
    ['13.6 eV', '27.2 eV', '54.4 eV', '6.8 eV'],
    2,
  ),
  sc(
    'The energy required to excite the electron of a hydrogen atom from the ground state to the second orbit is:',
    ['3.4 eV', '13.6 eV', '10.2 eV', '1.9 eV'],
    2,
  ),
  sc(
    'The energy of the first excited state of the Li²⁺ ion is: (IE of H atom = 13.6 eV)',
    ['−13.6 eV', '−30.6 eV', '−122.4 eV', '−3.4 eV'],
    1,
  ),
  sc(
    'Which transition in the He⁺ ion emits radiation of the same wavelength as the n = 2 → n = 1 transition in the hydrogen atom?',
    ['n = 2 → n = 1', 'n = 3 → n = 2', 'n = 4 → n = 2', 'n = 4 → n = 3'],
    2,
  ),
  sc(
    'According to Bohr\'s postulate, the angular momentum of the electron in the third orbit of hydrogen is:',
    ['h/2π', '3h/2π', '2h/3π', '9h/2π'],
    1,
  ),
  sc(
    'The ratio of the time periods of revolution of the electron in the second orbit to the first orbit of the hydrogen atom is:',
    ['2 : 1', '4 : 1', '8 : 1', '16 : 1'],
    2,
  ),
  sc(
    'Bohr\'s model can successfully explain the spectrum of which of the following species?',
    ['He atom', 'H₂ molecule', 'Li²⁺ ion', 'O atom'],
    2,
  ),
  sc(
    'The potential energy of the electron in the ground state of the hydrogen atom is:',
    ['−13.6 eV', '−27.2 eV', '+13.6 eV', '−6.8 eV'],
    1,
  ),
  sc(
    'In a Bohr orbit, the ratio of the magnitudes of kinetic energy to potential energy of the electron is:',
    ['1 : 1', '1 : 2', '2 : 1', '1 : 4'],
    1,
  ),
  sc(
    'The radius of which orbit of the Be³⁺ ion is equal to the radius of the first Bohr orbit of hydrogen?',
    ['n = 1', 'n = 2', 'n = 3', 'n = 4'],
    1,
  ),
  sc(
    'Among the following transitions in the hydrogen atom, the photon of highest energy is emitted in:',
    ['n = 3 → n = 2', 'n = 4 → n = 3', 'n = 2 → n = 1', 'n = 5 → n = 4'],
    2,
  ),
];

// ─── SECTION C — Hydrogen Spectrum (Q26–Q37) ──────────────────────────────────

const sectionC: SC[] = [
  sc(
    'The Lyman series of the hydrogen spectrum lies in the region:',
    ['visible', 'infrared', 'ultraviolet', 'microwave'],
    2,
  ),
  sc(
    'The shortest wavelength (series limit) of the Balmer series of hydrogen is: (R = 1.097 × 10⁷ m⁻¹)',
    ['911.7 Å', '1216 Å', '3646 Å', '6563 Å'],
    2,
  ),
  sc(
    'The longest wavelength line of the Lyman series of hydrogen corresponds to: (R = 1.097 × 10⁷ m⁻¹)',
    ['λ = 1216 Å (n = 2 → 1)', 'λ = 912 Å (n = ∞ → 1)', 'λ = 6563 Å (n = 3 → 2)', 'λ = 1026 Å (n = 3 → 1)'],
    0,
  ),
  sc(
    'The number of spectral lines produced when an electron in the 5th orbit of hydrogen drops to the ground state is:',
    ['5', '8', '10', '20'],
    2,
  ),
  sc(
    'The Hα line of the Balmer series (n = 3 → n = 2) of hydrogen has a wavelength of approximately:',
    ['121.6 nm', '656 nm', '486 nm', '364.6 nm'],
    1,
  ),
  sc(
    'Which series of the hydrogen spectrum falls in the visible region?',
    ['Lyman', 'Balmer', 'Paschen', 'Brackett'],
    1,
  ),
  sc(
    'The ratio of the longest wavelengths of the Lyman and Balmer series of hydrogen is:',
    ['3 : 4', '5 : 27', '1 : 4', '27 : 5'],
    1,
  ),
  sc(
    'The wave number of the n = 3 → n = 1 transition in hydrogen is: (RH = 109677 cm⁻¹)',
    ['82258 cm⁻¹', '97491 cm⁻¹', '102823 cm⁻¹', '109677 cm⁻¹'],
    1,
  ),
  sc(
    'In the Paschen series of hydrogen, the spectral line of maximum wavelength arises from the transition:',
    ['n = 4 → n = 3', 'n = 5 → n = 3', 'n = ∞ → n = 3', 'n = 4 → n = 1'],
    0,
  ),
  sc(
    'An electron in the n = 6 level of hydrogen cascades down to the ground state. The number of lines belonging specifically to the Balmer series in the resulting spectrum is:',
    ['15', '10', '4', '5'],
    2,
  ),
  sc(
    'The wave number of the series limit of the Lyman series of the He⁺ ion is: (RH = 109677 cm⁻¹)',
    ['109677 cm⁻¹', '219354 cm⁻¹', '438708 cm⁻¹', '54839 cm⁻¹'],
    2,
  ),
  sc(
    'Match the spectral series of hydrogen with the lower level n₁ and region: A. Lyman B. Balmer C. Paschen D. Pfund | I. n₁ = 3, infrared  II. n₁ = 1, ultraviolet  III. n₁ = 5, infrared  IV. n₁ = 2, visible',
    ['A-II, B-IV, C-I, D-III', 'A-II, B-I, C-IV, D-III', 'A-IV, B-II, C-I, D-III', 'A-II, B-IV, C-III, D-I'],
    0,
  ),
];

// ─── SECTION D — EM Radiation & Photoelectric Effect (Q38–Q49) ────────────────

const sectionD: SC[] = [
  sc(
    'A radio station broadcasts on a frequency of 1368 kHz. The wavelength of the electromagnetic radiation emitted by the transmitter is: (c = 3 × 10⁸ m s⁻¹)',
    ['219.3 m', '218.2 m', '21.9 m', '2192 m'],
    0,
  ),
  sc(
    'The energy of a photon of light of wavelength 45 nm is: (h = 6.63 × 10⁻³⁴ J s, c = 3 × 10⁸ m s⁻¹)',
    ['6.67 × 10⁻¹⁵ J', '4.42 × 10⁻¹⁸ J', '4.42 × 10⁻¹⁵ J', '6.67 × 10⁻¹⁷ J'],
    1,
  ),
  sc(
    'A 60 W monochromatic source emits light of wavelength 663 nm. The number of photons emitted per second is: (h = 6.63 × 10⁻³⁴ J s)',
    ['1 × 10¹⁹', '2 × 10²⁰', '3 × 10²⁰', '2 × 10¹⁹'],
    1,
  ),
  sc(
    'In the photoelectric effect, if the frequency of incident light is below the threshold frequency of the metal:',
    [
      'electrons are emitted with low kinetic energy',
      'electrons are emitted after a time lag',
      'no electrons are emitted however high the intensity',
      'electrons are emitted only if the light is polarised',
    ],
    2,
  ),
  sc(
    'Light of wavelength 4000 Å falls on a metal of work function 1.6 eV. The maximum kinetic energy of the emitted photoelectrons is: (use hc = 12400 eV Å)',
    ['1.5 eV', '3.1 eV', '4.7 eV', '0.5 eV'],
    0,
  ),
  sc(
    'In the graph of maximum kinetic energy of photoelectrons versus frequency of incident radiation, the slope of the straight line equals:',
    ['the work function', 'Planck\'s constant h', 'the threshold frequency', 'charge of the electron'],
    1,
  ),
  sc(
    'When the intensity of light falling on a metal surface (frequency above threshold) is doubled, then:',
    [
      'the maximum kinetic energy of photoelectrons is doubled',
      'the number of photoelectrons emitted per second is doubled',
      'the work function is halved',
      'the threshold frequency is doubled',
    ],
    1,
  ),
  sc(
    'Light of wavelength 300 nm falls on a metal of work function 2.13 eV. The stopping potential required is approximately: (use hc = 1240 eV nm)',
    ['1.0 V', '2.0 V', '4.1 V', '0.5 V'],
    1,
  ),
  sc(
    'Among photons of red, yellow, green and violet light, the photon of maximum energy is that of:',
    ['red light', 'yellow light', 'green light', 'violet light'],
    3,
  ),
  sc(
    'The correct order of increasing wavelength of electromagnetic radiations is:',
    [
      'γ-rays < X-rays < UV < visible < IR < microwave < radio',
      'radio < microwave < IR < visible < UV < X-rays < γ-rays',
      'X-rays < γ-rays < UV < IR < visible < radio < microwave',
      'γ-rays < UV < X-rays < visible < microwave < IR < radio',
    ],
    0,
  ),
  sc(
    'When an iron rod is heated to progressively higher temperatures, the wavelength of maximum intensity of the emitted radiation:',
    [
      'shifts to longer wavelength',
      'shifts to shorter wavelength',
      'remains unchanged',
      'first increases then decreases',
    ],
    1,
  ),
  sc(
    'The energy of one mole of photons of radiation of frequency 5 × 10¹⁴ Hz is approximately: (h = 6.63 × 10⁻³⁴ J s, NA = 6.02 × 10²³ mol⁻¹)',
    ['100 kJ mol⁻¹', '200 kJ mol⁻¹', '300 kJ mol⁻¹', '400 kJ mol⁻¹'],
    1,
  ),
];

// ─── SECTION E — Dual Nature & Uncertainty Principle (Q50–Q61) ────────────────

const sectionE: SC[] = [
  sc(
    'The de Broglie wavelength of an electron (m = 9.1 × 10⁻³¹ kg) moving with a velocity of 10⁶ m s⁻¹ is approximately:',
    ['7.3 × 10⁻¹⁰ m', '3.65 × 10⁻¹⁰ m', '7.3 × 10⁻⁹ m', '1.46 × 10⁻¹⁰ m'],
    0,
  ),
  sc(
    'The de Broglie wavelength of an electron accelerated from rest through a potential difference of 100 V is approximately:',
    ['12.27 Å', '1.227 Å', '0.1227 Å', '2.454 Å'],
    1,
  ),
  sc(
    'A cricket ball of mass 100 g moves with a velocity of 100 m s⁻¹. Its de Broglie wavelength is of the order of:',
    ['10⁻²⁵ m', '10⁻³⁰ m', '10⁻³⁵ m', '10⁻¹⁵ m'],
    2,
  ),
  sc(
    'A proton and an α-particle move with the same velocity. The ratio of their de Broglie wavelengths λp : λα is:',
    ['1 : 4', '4 : 1', '1 : 2', '2 : 1'],
    1,
  ),
  sc(
    'An electron, a proton, a neutron and an α-particle all have the same kinetic energy. The longest de Broglie wavelength belongs to the:',
    ['α-particle', 'proton', 'neutron', 'electron'],
    3,
  ),
  sc(
    'Bohr\'s condition of quantised angular momentum (mvr = nh/2π) follows naturally from de Broglie\'s hypothesis when:',
    [
      'the electron wave forms a standing wave in the orbit: 2πr = nλ',
      'the electron collides with photons',
      'the orbit radius equals the wavelength',
      'the nucleus also behaves as a wave',
    ],
    0,
  ),
  sc(
    'The number of complete de Broglie waves formed by the electron in the third Bohr orbit of hydrogen is:',
    ['1', '2', '3', '6'],
    2,
  ),
  sc(
    'The uncertainty in the velocity of an electron is 5.7 × 10⁵ m s⁻¹. The minimum uncertainty in its position is approximately: (m = 9.1 × 10⁻³¹ kg, h = 6.63 × 10⁻³⁴ J s)',
    ['1.0 × 10⁻¹⁰ m', '1.0 × 10⁻⁸ m', '5.0 × 10⁻¹⁰ m', '1.0 × 10⁻¹² m'],
    0,
  ),
  sc(
    'If the uncertainty in the position of an electron were zero, the uncertainty in its momentum would be:',
    ['zero', 'h/4π', 'less than h/4π', 'infinite'],
    3,
  ),
  sc(
    'The Heisenberg uncertainty principle has no practical significance for a moving car because:',
    [
      'the car moves too slowly',
      'the mass of the car is very large, making the uncertainties immeasurably small',
      'cars are not charged particles',
      'the principle applies only to electrons',
    ],
    1,
  ),
  sc(
    'An electron and a photon have the same de Broglie wavelength. The quantity that is necessarily the same for both is:',
    ['kinetic energy', 'total energy', 'momentum', 'velocity'],
    2,
  ),
  sc(
    'The wave nature of electrons was experimentally verified by:',
    [
      'Millikan\'s oil drop experiment',
      'the Davisson–Germer diffraction experiment',
      'Rutherford\'s scattering experiment',
      'the photoelectric experiment',
    ],
    1,
  ),
];

// ─── SECTION F — Quantum Numbers & Orbitals (Q62–Q77) ─────────────────────────

const sectionF: SC[] = [
  sc(
    'Which of the following sets of quantum numbers is NOT possible?',
    [
      'n = 3, l = 2, m = −2, s = +1/2',
      'n = 4, l = 0, m = 0, s = −1/2',
      'n = 3, l = 3, m = 0, s = +1/2',
      'n = 2, l = 1, m = +1, s = −1/2',
    ],
    2,
  ),
  sc(
    'The maximum number of electrons that can be accommodated in the subshell with n = 4 and l = 3 is:',
    ['10', '14', '6', '2'],
    1,
  ),
  sc(
    'The total number of orbitals in the shell with n = 3 is:',
    ['3', '6', '9', '18'],
    2,
  ),
  sc(
    'The maximum number of electrons in the shell with principal quantum number n = 4 is:',
    ['16', '32', '50', '8'],
    1,
  ),
  sc(
    'For l = 2, the possible values of the magnetic quantum number m are:',
    ['0, 1, 2', '−1, 0, +1', '−2, −1, 0, +1, +2', '−3 to +3'],
    2,
  ),
  sc(
    'The orbital angular momentum of an electron in a p orbital is:',
    ['zero', '(h/2π)√2', '(h/2π)√6', 'h/2π'],
    1,
  ),
  sc(
    'The spin-only magnetic moment of the Cr³⁺ ion (Z = 24) is:',
    ['2.83 BM', '3.87 BM', '4.90 BM', '5.92 BM'],
    1,
  ),
  sc(
    'The orbital angular momentum of an electron in a 2s orbital is:',
    ['h/2π', '(h/2π)√2', 'zero', 'h/4π'],
    2,
  ),
  sc(
    'The number of electrons in a neon atom (Z = 10) having azimuthal quantum number l = 1 is:',
    ['2', '4', '6', '8'],
    2,
  ),
  sc(
    'The probability of finding the electron of a pz orbital is zero:',
    ['along the z-axis', 'in the xy-plane', 'in the xz-plane', 'in the yz-plane'],
    1,
  ),
  sc(
    'The dz² orbital differs from the other four d orbitals because it has:',
    [
      'four lobes along the axes',
      'two lobes along the z-axis with a ring (torus) in the xy-plane',
      'no electron density anywhere on the axes',
      'only one lobe',
    ],
    1,
  ),
  sc(
    'The d orbital whose lobes lie along the x and y axes is:',
    ['dxy', 'dyz', 'dx²−y²', 'dzx'],
    2,
  ),
  sc(
    'The quantum number that does NOT follow from the solution of the Schrödinger wave equation is:',
    ['principal (n)', 'azimuthal (l)', 'magnetic (m)', 'spin (s)'],
    3,
  ),
  sc(
    'For the shell n = 4, the possible values of the azimuthal quantum number l are:',
    ['1, 2, 3', '0, 1, 2, 3', '0, 1, 2, 3, 4', 'only 0 and 1'],
    1,
  ),
  sc(
    'The orientation of an orbital in space is governed by the:',
    ['principal quantum number', 'azimuthal quantum number', 'magnetic quantum number', 'spin quantum number'],
    2,
  ),
  sc(
    'The number of orbitals having n = 4 and l = 2 is:',
    ['1', '3', '5', '7'],
    2,
  ),
];

// ─── SECTION G — Electronic Configuration (Q78–Q90) ──────────────────────────

const sectionG: SC[] = [
  sc(
    'According to the Aufbau principle, the subshell filled immediately after 3p is:',
    ['3d', '4s', '4p', '3f'],
    1,
  ),
  sc(
    'The electronic configuration of chromium (Z = 24) is [Ar]3d⁵4s¹ rather than [Ar]3d⁴4s² because:',
    [
      'the 4s orbital cannot hold two electrons',
      'of the extra stability associated with a half-filled 3d subshell',
      'the 3d orbital is always filled before 4s',
      'chromium is a metal',
    ],
    1,
  ),
  sc(
    'The number of unpaired electrons in the Cu²⁺ ion (Z = 29) and its spin-only magnetic moment are respectively:',
    ['2 and 2.83 BM', '1 and 1.73 BM', '0 and 0 BM', '3 and 3.87 BM'],
    1,
  ),
  sc(
    'The spin-only magnetic moment of the Fe³⁺ ion (Z = 26) is:',
    ['1.73 BM', '3.87 BM', '4.90 BM', '5.92 BM'],
    3,
  ),
  sc(
    'Which of the following ions is NOT isoelectronic with argon (Z = 18)?',
    ['K⁺', 'Ca²⁺', 'S²⁻', 'Na⁺'],
    3,
  ),
  sc(
    'According to the Pauli exclusion principle:',
    [
      'electrons occupy orbitals of lowest energy first',
      'no two electrons in an atom can have the same set of all four quantum numbers',
      'pairing does not begin until each orbital of a subshell holds one electron',
      'electrons revolve in fixed circular orbits',
    ],
    1,
  ),
  sc(
    'Applying Hund\'s rule, the number of unpaired electrons in the nitrogen atom (Z = 7) is:',
    ['1', '2', '3', '0'],
    2,
  ),
  sc(
    'The number of unpaired electrons in the Mn²⁺ ion (Z = 25) is:',
    ['3', '4', '5', '7'],
    2,
  ),
  sc(
    'Among Fe²⁺, Mn²⁺, Cr³⁺ and Cu⁺, the ion with the maximum number of unpaired electrons is:',
    ['Fe²⁺', 'Mn²⁺', 'Cr³⁺', 'Cu⁺'],
    1,
  ),
  sc(
    'The electronic configuration of copper (Z = 29) is:',
    ['[Ar]3d⁹4s²', '[Ar]3d¹⁰4s¹', '[Ar]3d¹⁰4s²', '[Ar]3d⁸4s²4p¹'],
    1,
  ),
  sc(
    'Among the isoelectronic species N³⁻, O²⁻, F⁻ and Na⁺, the one with the largest radius is:',
    ['Na⁺', 'F⁻', 'O²⁻', 'N³⁻'],
    3,
  ),
  sc(
    'Which of the following electronic configurations violates the Pauli exclusion principle?',
    ['1s² 2s² 2p³', '1s² 2s³', '1s² 2s² 2p⁶', '1s¹'],
    1,
  ),
  sc(
    'The four quantum numbers of the last (differentiating) electron of potassium (Z = 19) are:',
    [
      'n = 3, l = 2, m = 0, s = +1/2',
      'n = 4, l = 0, m = 0, s = +1/2',
      'n = 4, l = 1, m = 0, s = +1/2',
      'n = 3, l = 0, m = 0, s = −1/2',
    ],
    1,
  ),
];

// ─── SECTION H — Nodes & Wave Function (Q91–Q100) ─────────────────────────────

const sectionH: SC[] = [
  sc(
    'The number of radial and angular nodes in the 3s orbital are respectively:',
    ['0 and 2', '2 and 0', '1 and 1', '3 and 0'],
    1,
  ),
  sc(
    'The total number of nodes in a 4p orbital is:',
    ['1', '2', '3', '4'],
    2,
  ),
  sc(
    'An orbital has 2 radial nodes and 1 angular node. The orbital is:',
    ['3p', '4p', '4d', '3d'],
    1,
  ),
  sc(
    'The number of nodal planes in the dxy orbital is:',
    ['0', '1', '2', '3'],
    2,
  ),
  sc(
    'For the 1s orbital of the hydrogen atom, the radial probability distribution 4πr²ψ² is maximum at a distance of:',
    ['zero (at the nucleus)', '0.529 Å', '1.058 Å', '2.116 Å'],
    1,
  ),
  sc(
    'The splitting of spectral lines in the presence of an external magnetic field is called:',
    ['Stark effect', 'Zeeman effect', 'Raman effect', 'Compton effect'],
    1,
  ),
  sc(
    'In the hydrogen atom, the energies of the 2s and 2p orbitals are:',
    ['2s lower than 2p', '2p lower than 2s', 'exactly equal', 'dependent on the electron spin'],
    2,
  ),
  sc(
    'In a multi-electron atom, the correct order of energy of the 4s, 3d and 4p subshells is:',
    ['3d < 4s < 4p', '4s < 3d < 4p', '4s < 4p < 3d', '3d < 4p < 4s'],
    1,
  ),
  sc(
    'Regarding the wave function ψ obtained from the Schrödinger equation, the physically meaningful quantity is:',
    [
      'ψ itself, which gives the exact position of the electron',
      'ψ², which gives the probability density of finding the electron',
      'ψ², which gives the exact orbit of the electron',
      '1/ψ, which gives the energy',
    ],
    1,
  ),
  sc(
    'The de Broglie wavelength of the electron in the third Bohr orbit of the hydrogen atom is approximately:',
    ['3.3 Å', '6.6 Å', '10 Å', '13.3 Å'],
    2,
  ),
];

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Scientia Chemistry — Structure of Atom (100 MCQs)...\n');

  const subject = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry' },
  });

  const chapter = await prisma.chapter.upsert({
    where: { subjectId_name: { subjectId: subject.id, name: 'Structure of Atom' } },
    update: {},
    create: { name: 'Structure of Atom', subjectId: subject.id },
  });

  const sections: Array<{ name: string; questions: SC[] }> = [
    { name: 'Section A - Atomic Models',                         questions: sectionA },
    { name: 'Section B - Bohr Model',                           questions: sectionB },
    { name: 'Section C - Hydrogen Spectrum',                    questions: sectionC },
    { name: 'Section D - EM Radiation & Photoelectric Effect',  questions: sectionD },
    { name: 'Section E - Dual Nature & Uncertainty Principle',  questions: sectionE },
    { name: 'Section F - Quantum Numbers & Orbitals',           questions: sectionF },
    { name: 'Section G - Electronic Configuration',             questions: sectionG },
    { name: 'Section H - Nodes & Wave Function',                questions: sectionH },
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
