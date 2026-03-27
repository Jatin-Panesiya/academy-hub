import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  const borderStyle = styles[toast.type] ?? styles.info;

  return (
    <div
      className={`w-[320px] rounded-xl border p-3 shadow-sm ${borderStyle}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}
        </div>
        <div className="min-w-0 flex-1">
          {toast.title ? <div className="text-sm font-semibold">{toast.title}</div> : null}
          {toast.message ? <div className="mt-0.5 text-sm text-gray-700/90">{toast.message}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-lg p-1 text-gray-600 hover:bg-white/40"
          aria-label="Dismiss toast"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M6 6L14 14M14 6L6 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, { title, message, durationMs = 4000 } = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast = { id, type, title, message };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
    window.setTimeout(() => dismiss(id), durationMs);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      toast: {
        success: (opts) => push('success', opts),
        error: (opts) => push('error', opts),
        info: (opts) => push('info', opts),
      },
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length ? (
        <div className="pointer-events-none fixed right-4 top-16 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}

