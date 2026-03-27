import React from 'react';

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

export function SkeletonLine({ className = '' }) {
  return <Skeleton className={`h-4 w-full ${className}`} />;
}

export function SkeletonBlock({ className = '' }) {
  return <Skeleton className={`h-24 w-full ${className}`} />;
}

