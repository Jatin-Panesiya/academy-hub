import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

function roleToRedirectPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'student') return '/student';
  return '/';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, user, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const roleRedirect = useMemo(() => roleToRedirectPath(user?.role), [user?.role]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.mustChangePassword) {
        navigate('/reset-password', { replace: true });
        return;
      }
      navigate(roleRedirect, { replace: true });
    }
  }, [isAuthenticated, user?.mustChangePassword, roleRedirect, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    const nextFieldErrors = {};
    const normalizedEmail = email.trim();
    const normalizedPassword = password;

    if (!normalizedEmail) nextFieldErrors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) nextFieldErrors.email = 'Enter a valid email address.';

    if (!normalizedPassword) nextFieldErrors.password = 'Password is required.';
    else if (normalizedPassword.length < 6) nextFieldErrors.password = 'Password must be at least 6 characters.';

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    try {
      const { user: loggedInUser } = await login({ email: normalizedEmail, password: normalizedPassword });
      if (loggedInUser?.mustChangePassword) {
        navigate('/reset-password', { replace: true });
        return;
      }
      navigate(roleToRedirectPath(loggedInUser?.role ?? user?.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Login failed');
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={onSubmit} className="rounded border border-slate-200 bg-white/70">
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-semibold">Login</h1>

          {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="space-y-1">
            <label className="text-sm text-slate-600">Email</label>
            <input
              className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
            {fieldErrors.email ? <div className="text-xs text-red-600">{fieldErrors.email}</div> : null}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-600">Password</label>
            <input
              className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
            {fieldErrors.password ? <div className="text-xs text-red-600">{fieldErrors.password}</div> : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}

