import React from 'react';

const base =
  'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

const styles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

export default function Button({ variant = 'secondary', className = '', ...props }) {
  return <button {...props} className={`${base} ${styles[variant] ?? styles.secondary} ${className}`} />;
}

