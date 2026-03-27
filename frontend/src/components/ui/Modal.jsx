import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, title, description, children, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div
        className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-sm"
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-gray-200 p-4">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          {description ? <div className="mt-1 text-sm text-gray-600">{description}</div> : null}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

