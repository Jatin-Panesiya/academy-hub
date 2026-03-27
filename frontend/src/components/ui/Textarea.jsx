import React from 'react';

export default function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-[96px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${className}`}
    />
  );
}

