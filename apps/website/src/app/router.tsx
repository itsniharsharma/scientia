import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { TeacherLayout } from '../layouts/TeacherLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { HomePage } from '../pages/home/HomePage';
import { AboutPage } from '../pages/about/AboutPage';
import { ContactPage } from '../pages/contact/ContactPage';
import { SignupPage } from '../pages/signup/SignupPage';
import { StudentLoginPage } from '../pages/auth/StudentLoginPage';
import { TeacherLoginPage } from '../pages/auth/TeacherLoginPage';
import { TestListPage } from '../pages/teacher/TestListPage';
import { TestCreatePage } from '../pages/teacher/TestCreatePage';
import { TestDetailPage } from '../pages/teacher/TestDetailPage';
import { TestReviewPage } from '../pages/teacher/TestReviewPage';

export function AppRouter() {
  return (
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
      <Route
        element={
          <ProtectedRoute
            allowedRoles={['TEACHER']}
            redirectTo="/teacher/login"
          />
        }
      >
        <Route element={<TeacherLayout />}>
          <Route path="/teacher/tests" element={<TestListPage />} />
          <Route path="/teacher/tests/new" element={<TestCreatePage />} />
          <Route path="/teacher/tests/:testId" element={<TestDetailPage />} />
          <Route path="/teacher/tests/:testId/review" element={<TestReviewPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
