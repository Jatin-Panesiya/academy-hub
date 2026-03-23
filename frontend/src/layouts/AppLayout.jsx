import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

export default function AppLayout() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded bg-slate-900/70" />
            <div className="text-lg font-semibold">
              <Link to="/">Academy Hub</Link>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">Role: {user?.role}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        <div className="flex gap-6">
          {isAuthenticated && user?.role === 'admin' ? (
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="rounded border border-slate-200 bg-white/70">
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500">Navigation</div>
                  <div className="mt-3 space-y-1">
                    {user?.role === 'admin' ? (
                      <>
                        <Link
                          className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          to="/admin"
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          to="/admin/students"
                        >
                          Students
                        </Link>
                        <Link
                          className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          to="/admin/courses"
                        >
                          Courses
                        </Link>
                        <Link
                          className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          to="/admin/batches"
                        >
                          Batches
                        </Link>
                        <Link
                          className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          to="/admin/attendance"
                        >
                          Attendance
                        </Link>
                        <Link
                          className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          to="/admin/payments"
                        >
                          Payments
                        </Link>
                        <Link
                          className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          to="/admin/assignments"
                        >
                          Assignments
                        </Link>
                      </>
                    ) : null}
                    {user?.role === 'student' ? (
                      <Link
                        className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        to="/student"
                      >
                        Student
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>
          ) : null}

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

