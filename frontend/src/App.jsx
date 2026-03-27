import { Outlet, Route, Routes } from 'react-router-dom';

import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/Login.jsx';
import ResetPasswordPage from './pages/ResetPassword.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import StudentsList from './pages/admin/StudentsList.jsx';
import StudentForm from './pages/admin/StudentForm.jsx';
import CoursesPage from './pages/admin/CoursesPage.jsx';
import AttendancePage from './pages/admin/AttendancePage.jsx';
import PaymentsPage from './pages/admin/PaymentsPage.jsx';
import AssignmentsPage from './pages/admin/AssignmentsPage.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute roles={['admin', 'student']} />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<StudentsList />} />
          <Route path="/admin/students/new" element={<StudentForm />} />
          <Route path="/admin/students/:id/edit" element={<StudentForm />} />
          <Route path="/admin/courses" element={<CoursesPage />} />
          <Route path="/admin/attendance" element={<AttendancePage />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          <Route path="/admin/assignments" element={<AssignmentsPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['student']} />}>
          <Route path="/student" element={<StudentDashboard />} />
        </Route>

        <Route path="*" element={<div className="p-6 text-slate-600">Page not found.</div>} />
      </Route>
    </Routes>
  );
}

