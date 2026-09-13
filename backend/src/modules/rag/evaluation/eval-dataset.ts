export type QuestionCategory =
  | 'direct-fact'
  | 'semantic'
  | 'exact-terminology'
  | 'policy'
  | 'subscription-table'
  | 'unanswerable';

export interface EvalQuestion {
  id: string;
  category: QuestionCategory;
  query: string;
  /** A section or subsection title expected among the retrieved chunks.
   *  `null` for questions the fixture document genuinely does not answer —
   *  the point of those is to verify the system says so instead of
   *  guessing, not to check retrieval accuracy. */
  expectedSection: string | null;
  answerable: boolean;
}

// 24 questions across every category the spec asks for. Extend this list
// as real usage surfaces gaps — the target is representative coverage, not
// an exhaustive question bank.
export const EVAL_DATASET: EvalQuestion[] = [
  // Direct fact
  { id: 'q1', category: 'direct-fact', query: "What is Scientia's vision?", expectedSection: 'Mission and Vision', answerable: true },
  { id: 'q2', category: 'direct-fact', query: 'Does Scientia sell student data to third parties?', expectedSection: 'Policies', answerable: true },
  { id: 'q3', category: 'direct-fact', query: 'How many days does the refund window cover?', expectedSection: 'Policies', answerable: true },
  { id: 'q4', category: 'direct-fact', query: 'Does Scientia have a native mobile app?', expectedSection: 'Frequently Asked Questions', answerable: true },
  { id: 'q5', category: 'direct-fact', query: 'Does Scientia support offline test-taking?', expectedSection: 'Known Limitations', answerable: true },

  // Semantic (paraphrased, no exact keyword overlap with the source text)
  { id: 'q6', category: 'semantic', query: 'How does the platform stop a student seeing a repeated question set?', expectedSection: 'Test Generation', answerable: true },
  { id: 'q7', category: 'semantic', query: 'How can a teacher organize their students into groups?', expectedSection: 'Batch Management', answerable: true },
  { id: 'q8', category: 'semantic', query: 'What is coming next for the platform?', expectedSection: 'Future Improvements', answerable: true },
  { id: 'q9', category: 'semantic', query: 'How is student personal information kept safe?', expectedSection: 'Policies', answerable: true },

  // Exact terminology
  { id: 'q10', category: 'exact-terminology', query: 'What is the QBank?', expectedSection: 'Platform Features', answerable: true },
  { id: 'q11', category: 'exact-terminology', query: 'What does the fairness algorithm do?', expectedSection: 'Test Generation', answerable: true },
  { id: 'q12', category: 'exact-terminology', query: 'What exams does Scientia support, JEE and NEET?', expectedSection: 'Mission and Vision', answerable: true },
  { id: 'q13', category: 'exact-terminology', query: 'What is a batch in Scientia?', expectedSection: 'Batch Management', answerable: true },

  // Policy
  { id: 'q14', category: 'policy', query: 'What is the refund policy?', expectedSection: 'Policies', answerable: true },
  { id: 'q15', category: 'policy', query: 'Is personally identifiable information encrypted?', expectedSection: 'Policies', answerable: true },

  // Subscription / table-derived
  { id: 'q16', category: 'subscription-table', query: 'How much does the Pro plan cost?', expectedSection: 'Subscriptions', answerable: true },
  { id: 'q17', category: 'subscription-table', query: 'How many students does the Free plan support?', expectedSection: 'Subscriptions', answerable: true },
  { id: 'q18', category: 'subscription-table', query: 'What is the price of the Enterprise plan?', expectedSection: 'Subscriptions', answerable: true },
  { id: 'q19', category: 'subscription-table', query: 'Which plan supports unlimited students?', expectedSection: 'Subscriptions', answerable: true },

  // Multi-org (from the FAQ, exercises cross-feature phrasing)
  { id: 'q20', category: 'direct-fact', query: 'Can a student belong to more than one organisation?', expectedSection: 'Frequently Asked Questions', answerable: true },

  // Unanswerable — absent from the fixture documentation entirely
  { id: 'q21', category: 'unanswerable', query: 'What programming language is Scientia written in?', expectedSection: null, answerable: false },
  { id: 'q22', category: 'unanswerable', query: "Who is Scientia's CEO?", expectedSection: null, answerable: false },
  { id: 'q23', category: 'unanswerable', query: 'Does Scientia integrate with Zoom for live classes?', expectedSection: null, answerable: false },
  { id: 'q24', category: 'unanswerable', query: 'Which cloud provider hosts Scientia servers?', expectedSection: null, answerable: false },
];
