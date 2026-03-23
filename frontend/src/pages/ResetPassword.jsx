import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

function roleToRedirectPath(role) {
  return role === 'admin' ? '/admin' : '/student';
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      const { user: nextUser } = await changePassword({ currentPassword, newPassword });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigate(roleToRedirectPath(nextUser?.role ?? user?.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to change password');
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={onSubmit} className="rounded border border-slate-200 bg-white/70">
        <div className="space-y-4 p-4">
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="text-sm text-slate-600">
            For security, please change your temporary password to continue.
          </p>

          {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          {success ? (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm text-slate-600">Current Password</label>
            <input
              type="password"
              className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-600">New Password</label>
            <input
              type="password"
              className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-600">Confirm New Password</label>
            <input
              type="password"
              className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
