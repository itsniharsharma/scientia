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

  // Student portal
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_TESTS: '/student/tests',
  STUDENT_TEST_INSTRUCTIONS: (testId: string) => `/student/tests/${testId}/instructions` as const,
  STUDENT_EXAM: (attemptId: string) => `/student/attempts/${attemptId}/exam` as const,
  STUDENT_RESULT: (attemptId: string) => `/student/attempts/${attemptId}/result` as const,
} as const;

export type StaticRoute = Extract<(typeof ROUTES)[keyof typeof ROUTES], string>;
