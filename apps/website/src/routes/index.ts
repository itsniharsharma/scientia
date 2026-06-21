export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  SIGNUP: '/signup',
  STUDENT_LOGIN: '/student/login',
  TEACHER_LOGIN: '/teacher/login',

  // Teacher portal
  TEACHER_TESTS: '/teacher/tests',
  TEACHER_TEST_NEW: '/teacher/tests/new',
  TEACHER_TEST: (id: string) => `/teacher/tests/${id}` as const,
  TEACHER_TEST_REVIEW: (id: string) => `/teacher/tests/${id}/review` as const,
  TEACHER_TEST_ANALYTICS: (id: string) => `/teacher/tests/${id}/analytics` as const,
  TEACHER_BATCHES: '/teacher/batches',
  TEACHER_BATCH: (id: string) => `/teacher/batches/${id}` as const,
  TEACHER_BATCH_TEST_NEW: (batchId: string) => `/teacher/batches/${batchId}/tests/new` as const,
  TEACHER_PROFILE: '/teacher/profile',

  // Student portal
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_TESTS: '/student/tests',
  STUDENT_BATCHES: '/student/batches',
  STUDENT_BATCH: (id: string) => `/student/batches/${id}` as const,
  STUDENT_UPCOMING_TESTS: '/student/upcoming-tests',
  STUDENT_RECENT_TESTS: '/student/recent-tests',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_TEST_INSTRUCTIONS: (testId: string) => `/student/tests/${testId}/instructions` as const,
  STUDENT_EXAM: (attemptId: string) => `/student/attempts/${attemptId}/exam` as const,
  STUDENT_RESULT: (attemptId: string) => `/student/attempts/${attemptId}/result` as const,
  STUDENT_REVIEW: (attemptId: string) => `/student/attempts/${attemptId}/review` as const,
} as const;

export type StaticRoute = Extract<(typeof ROUTES)[keyof typeof ROUTES], string>;
