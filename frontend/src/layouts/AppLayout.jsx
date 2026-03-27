import { Link, Outlet, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';

import { useAuth } from '../hooks/useAuth.js';

import { ToastProvider } from '../components/ui/ToastProvider.jsx';
import academyHub from '../assets/academyHub.png';
import Button from '../components/ui/Button.jsx';

function MenuItem({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`block rounded-lg px-3 py-2 text-sm transition ${
        active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );
}

export default function AppLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isStudent = isAuthenticated && user?.role === 'student';

  const navItems = useMemo(() => {
    if (isAdmin) {
      return [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/students', label: 'Students' },
        { to: '/admin/courses', label: 'Courses' },
        { to: '/admin/attendance', label: 'Attendance' },
        { to: '/admin/payments', label: 'Payments' },
        { to: '/admin/assignments', label: 'Assignments' },
      ];
    }

    if (isStudent) {
      return [{ to: '/student', label: 'Dashboard' }];
    }

    return [];
  }, [isAdmin, isStudent]);

  function isActive(to) {
    if (to === '/admin') return location.pathname === '/admin';
    return location.pathname === to;
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <ToastProvider>
      <div className="h-screen overflow-hidden bg-[#F9FAFB] text-gray-900">
        <div className="flex h-full min-h-0">
          {isAuthenticated && isAdmin ? (
            <>
              {/* Desktop sidebar */}
              <aside className="hidden h-screen w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
                <div className="flex items-center gap-3 px-5 py-5">
                  <img src={academyHub} alt="Academy Hub" className="h-9 w-9" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">Academy Hub</div>
                    <div className="truncate text-xs text-gray-500">{user?.role}</div>
                  </div>
                </div>

                <nav className="px-3 pb-6">
                  <div className="space-y-1">
                    {navItems.map((it) => (
                      <MenuItem key={it.to} to={it.to} label={it.label} active={isActive(it.to)} />
                    ))}
                  </div>
                </nav>
              </aside>

              {/* Mobile sidebar */}
              {mobileOpen ? (
                <div className="fixed inset-0 z-40 lg:hidden overflow-hidden">
                  <button
                    type="button"
                    className="absolute inset-0 bg-gray-900/40"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close sidebar"
                  />
                  <aside className="absolute left-0 top-0 h-full w-72 border-r border-gray-200 bg-white">
                    <div className="flex items-center gap-3 px-5 py-5">
                      <img src={academyHub} alt="Academy Hub" className="h-9 w-9" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900">Academy Hub</div>
                        <div className="truncate text-xs text-gray-500">{user?.role}</div>
                      </div>
                    </div>
                    <nav className="px-3 pb-6">
                      <div className="space-y-1">
                        {navItems.map((it) => (
                          <Link
                            key={it.to}
                            to={it.to}
                            onClick={closeMobile}
                            className={`block rounded-lg px-3 py-2 text-sm transition ${
                              isActive(it.to) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {it.label}
                          </Link>
                        ))}
                      </div>
                    </nav>
                  </aside>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="flex min-w-0 min-h-0 flex-1 flex-col">
            <header className="flex-shrink-0 w-full border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
                <div className="flex items-center gap-3">
                  {isAuthenticated && isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setMobileOpen(true)}
                      className="lg:hidden rounded-lg p-2 hover:bg-gray-100 text-gray-700"
                      aria-label="Open sidebar"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M3 5H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M3 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M3 15H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  ) : null}
                  <div className="hidden sm:block">
                    <div className="text-sm font-semibold text-gray-900">Academy Hub</div>
                  </div>
                </div>

                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                      <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700 font-semibold text-sm">
                        {String(user?.name ?? 'U')
                          .trim()
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <Button variant="danger" onClick={logout}>
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </header>

            <main className="w-full flex-1 min-h-0 overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

