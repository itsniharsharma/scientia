import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts and route guards are always needed — keep eager
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { TeacherLayout } from '../layouts/TeacherLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Critical-path pages — loaded eagerly for instant first-paint
import { HomePage } from '../pages/home/HomePage';
import { TeacherLoginPage } from '../pages/auth/TeacherLoginPage';
import { StudentLoginPage } from '../pages/auth/StudentLoginPage';

// ── Lazy-loaded page chunks (split by route) ──────────────────────────────────
const AboutPage         = lazy(() => import('../pages/about/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage       = lazy(() => import('../pages/contact/ContactPage').then(m => ({ default: m.ContactPage })));
const SignupPage        = lazy(() => import('../pages/signup/SignupPage').then(m => ({ default: m.SignupPage })));

// Teacher portal
const TestListPage      = lazy(() => import('../pages/teacher/TestListPage').then(m => ({ default: m.TestListPage })));
const TestCreatePage    = lazy(() => import('../pages/teacher/TestCreatePage').then(m => ({ default: m.TestCreatePage })));
const TestDetailPage    = lazy(() => import('../pages/teacher/TestDetailPage').then(m => ({ default: m.TestDetailPage })));
const TestReviewPage    = lazy(() => import('../pages/teacher/TestReviewPage').then(m => ({ default: m.TestReviewPage })));
const TestAnalyticsPage = lazy(() => import('../pages/teacher/TestAnalyticsPage').then(m => ({ default: m.TestAnalyticsPage })));
const BatchesPage       = lazy(() => import('../pages/teacher/BatchesPage'));
const BatchDetailPage   = lazy(() => import('../pages/teacher/BatchDetailPage'));
const TeacherProfilePage = lazy(() => import('../pages/teacher/TeacherProfilePage'));

// Student portal
const DashboardPage        = lazy(() => import('../pages/student/DashboardPage').then(m => ({ default: m.DashboardPage })));
const StudentTestsPage     = lazy(() => import('../pages/student/StudentTestsPage').then(m => ({ default: m.StudentTestsPage })));
const InstructionsPage     = lazy(() => import('../pages/student/InstructionsPage').then(m => ({ default: m.InstructionsPage })));
const ExamRunnerPage       = lazy(() => import('../pages/student/ExamRunnerPage').then(m => ({ default: m.ExamRunnerPage })));
const ResultPage           = lazy(() => import('../pages/student/ResultPage').then(m => ({ default: m.ResultPage })));
const AttemptReviewPage    = lazy(() => import('../pages/student/AttemptReviewPage').then(m => ({ default: m.AttemptReviewPage })));
const StudentBatchesPage   = lazy(() => import('../pages/student/StudentBatchesPage'));
const StudentBatchDetailPage = lazy(() => import('../pages/student/StudentBatchDetailPage'));
const UpcomingTestsPage    = lazy(() => import('../pages/student/UpcomingTestsPage'));
const RecentTestsPage      = lazy(() => import('../pages/student/RecentTestsPage'));
const StudentProfilePage   = lazy(() => import('../pages/student/StudentProfilePage'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-700" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public marketing pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth pages */}
        <Route element={<AuthLayout />}>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/teacher/login" element={<TeacherLoginPage />} />
        </Route>

        {/* Teacher portal — requires TEACHER role */}
        <Route element={<ProtectedRoute allowedRoles={['TEACHER']} redirectTo="/teacher/login" />}>
          <Route element={<TeacherLayout />}>
            <Route path="/teacher/batches" element={<BatchesPage />} />
            <Route path="/teacher/batches/:batchId" element={<BatchDetailPage />} />
            <Route path="/teacher/batches/:batchId/tests/new" element={<TestCreatePage />} />
            <Route path="/teacher/tests" element={<TestListPage />} />
            <Route path="/teacher/tests/new" element={<TestCreatePage />} />
            <Route path="/teacher/tests/:testId" element={<TestDetailPage />} />
            <Route path="/teacher/tests/:testId/review" element={<TestReviewPage />} />
            <Route path="/teacher/tests/:testId/analytics" element={<TestAnalyticsPage />} />
            <Route path="/teacher/profile" element={<TeacherProfilePage />} />
          </Route>
        </Route>

        {/* Student portal — requires STUDENT role */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} redirectTo="/student/login" />}>
          {/* Full-screen exam runner — outside layout chrome */}
          <Route path="/student/attempts/:attemptId/exam" element={<ExamRunnerPage />} />

          <Route element={<StudentLayout />}>
            <Route path="/student/dashboard" element={<DashboardPage />} />
            <Route path="/student/batches" element={<StudentBatchesPage />} />
            <Route path="/student/batches/:batchId" element={<StudentBatchDetailPage />} />
            <Route path="/student/upcoming-tests" element={<UpcomingTestsPage />} />
            <Route path="/student/recent-tests" element={<RecentTestsPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            {/* Legacy route kept so existing bookmarks don't 404 */}
            <Route path="/student/tests" element={<StudentTestsPage />} />
            <Route path="/student/tests/:testId/instructions" element={<InstructionsPage />} />
            <Route path="/student/attempts/:attemptId/result" element={<ResultPage />} />
            <Route path="/student/attempts/:attemptId/review" element={<AttemptReviewPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
