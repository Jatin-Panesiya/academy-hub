import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../services/api.js';

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token');
    if (!t) return null;
    const payload = decodeJwtPayload(t);
    if (!payload) return null;
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role ?? 'student',
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'token') return;
      const nextToken = e.newValue;
      setToken(nextToken);
      if (!nextToken) {
        setUser(null);
        return;
      }
      const payload = decodeJwtPayload(nextToken);
      if (!payload) {
        setUser(null);
        return;
      }
      setUser({
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role ?? 'student',
        mustChangePassword: Boolean(payload.mustChangePassword),
      });
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token: jwtToken, user: userData } = res.data ?? {};
      if (!jwtToken) throw new Error('Login failed: missing token');

      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData ?? decodeJwtPayload(jwtToken));
      return { user: userData };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/change-password', { currentPassword, newPassword });
      const { token: jwtToken, user: userData } = res.data ?? {};
      if (!jwtToken) throw new Error('Password change failed: missing token');
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData ?? decodeJwtPayload(jwtToken));
      return { user: userData };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      changePassword,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, user, loading, login, changePassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

