export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  SIGNUP: '/signup',
  STUDENT_LOGIN: '/student/login',
  TEACHER_LOGIN: '/teacher/login',
  TEACHER_TESTS: '/teacher/tests',
  TEACHER_TEST_NEW: '/teacher/tests/new',
  TEACHER_TEST: (id: string) => `/teacher/tests/${id}` as const,
  TEACHER_TEST_REVIEW: (id: string) => `/teacher/tests/${id}/review` as const,
} as const;

export type StaticRoute = Extract<(typeof ROUTES)[keyof typeof ROUTES], string>;
