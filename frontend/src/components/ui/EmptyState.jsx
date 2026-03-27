import React from 'react';

function DefaultIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6.25 2.5C5.55964 2.5 5 3.05964 5 3.75V16.25C5 16.9404 5.55964 17.5 6.25 17.5H13.75C14.4404 17.5 15 16.9404 15 16.25V7.5L12 4.5V3.75C12 3.05964 11.4404 2.5 10.75 2.5H6.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 8.25H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function EmptyState({
  title = 'Nothing to show',
  message = 'Try adjusting your filters or creating a new record.',
  icon = <DefaultIcon />,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="text-blue-600">{icon}</div>
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-600">{message}</div>
    </div>
  );
}

