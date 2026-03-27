import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

export default function ProtectedRoute({ roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-slate-600">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    // If the user is authenticated but trying to access a route for the wrong role,
    // send them to the correct dashboard instead of "/".
    const destination =
      user?.role === 'admin' ? '/admin' : user?.role === 'student' ? '/student' : '/login';
    return <Navigate to={destination} replace />;
  }

  if (user?.mustChangePassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  return <Outlet />;
}

