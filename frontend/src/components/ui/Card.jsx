import React from 'react';

export default function Card({ className = '', children, as: Component = 'div', ...props }) {
  return (
    <Component
      {...props}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </Component>
  );
}

