/** Synthetic Scientia documentation used by the evaluation dataset and its
 *  tests — small, deterministic, and covers every content category the
 *  spec calls for (mission/vision, features, a pricing table, policies,
 *  FAQs, limitations, future improvements) without depending on a binary
 *  PDF fixture. Fed through the real structure-extractor and chunker; only
 *  pdf-parse's raw text extraction is mocked in tests/evaluation. Split
 *  into pages so the pricing table (detected separately from prose, like a
 *  real pdf-parse table) lands on the Subscriptions page. */
export interface FixturePage {
  text: string;
  tables?: string[][][];
}

export const FIXTURE_PRICING_TABLE: string[][] = [
  ['Plan', 'Price', 'Students'],
  ['Free', '0', '50'],
  ['Pro', '999', '500'],
  ['Enterprise', 'Custom', 'Unlimited'],
];

export const FIXTURE_PAGES: FixturePage[] = [
  {
    text: `Mission and Vision

Scientia exists to make high-quality examination preparation accessible to every student, regardless of location or background. Our vision is to become the leading platform for JEE and NEET preparation in India.

Platform Features

Scientia offers batch management, automated test generation, and a curated QBank of practice questions organized by subject and topic.

1.1 Test Generation

Teachers can generate tests automatically from the QBank by selecting a subject and one or more topics. The fairness algorithm ensures no student sees the exact same question set twice within a short window.

1.2 Batch Management

Teachers organize students into batches. Tests can be assigned to a specific batch or made available to all students.`,
  },
  {
    text: `Subscriptions

Scientia offers the following plans for institutions.`,
    tables: [FIXTURE_PRICING_TABLE],
  },
  {
    text: `Policies

Scientia does not sell student data to third parties. All personally identifiable information is encrypted at rest. Refunds are available within 14 days of purchase if fewer than 5 tests have been created.

Frequently Asked Questions

Can a student belong to more than one organisation? Yes, a student can be assigned to multiple organisations by their teachers and will see academic data from all of them.

Is there a mobile app? Scientia does not currently offer a native mobile app; the web platform is fully responsive.

Known Limitations

The current version of Scientia does not support offline test-taking. Question image uploads are limited to standard image formats and do not support scanned handwritten answer sheets.

Future Improvements

Planned improvements include an AI-powered helpdesk assistant, deeper analytics for teachers, and support for additional exam boards beyond JEE and NEET.`,
  },
];
