import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  theme?: 'dark' | 'light';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`py-14 px-6 text-center rounded-2xl border flex flex-col items-center justify-center transition-colors ${
        isDark
          ? 'bg-[#121214]/60 border-[#27272A] text-gray-400'
          : 'bg-white border-gray-200 text-gray-600 shadow-xs'
      } ${className}`}
      role="region"
      aria-label={title}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105 ${
          isDark
            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
            : 'bg-teal-50 text-teal-700 border border-teal-200'
        }`}
      >
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      <h3 className={`text-base font-bold mb-1.5 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
        {title}
      </h3>

      <p className="text-xs max-w-md text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
            isDark
              ? 'bg-teal-500 text-zinc-950 hover:bg-teal-400 focus:ring-2 focus:ring-teal-500/50'
              : 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-2 focus:ring-teal-600/40'
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
