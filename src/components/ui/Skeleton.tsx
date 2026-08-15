import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'table-row';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  count = 1,
}) => {
  const items = Array.from({ length: count });

  if (variant === 'circle') {
    return (
      <div className="flex gap-2">
        {items.map((_, i) => (
          <div
            key={i}
            className={`rounded-full animate-pulse bg-gray-200 dark:bg-gray-800 ${className}`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214] animate-pulse space-y-3"
            aria-hidden="true"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-24" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
            <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded-md w-32" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60 animate-pulse" aria-hidden="true">
        {items.map((_, i) => (
          <tr key={i} className="h-14">
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-36" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28" /></td>
            <td className="px-4 py-3"><div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-24" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" /></td>
          </tr>
        ))}
      </tbody>
    );
  }

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
};
