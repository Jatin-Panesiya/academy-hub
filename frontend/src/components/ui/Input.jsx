import React, { useId } from 'react';

export default function Input({ className = '', label = '', id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;

  if (!label) {
    return (
      <input
        id={inputId}
        {...props}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${className}`}
      />
    );
  }

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="text-sm text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${className}`}
      />
    </div>
  );
}

