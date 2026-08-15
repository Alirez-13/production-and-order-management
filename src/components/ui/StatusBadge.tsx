import React from 'react';
import { getOrderStatusBadge, getPriorityBadge } from '../../utils/formatters';

interface StatusBadgeProps {
  type: 'orderStatus' | 'priority' | 'custom';
  value: string;
  customLabel?: string;
  customColor?: string;
  className?: string;
  theme?: 'dark' | 'light';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  customLabel,
  customColor,
  className = '',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  if (type === 'orderStatus') {
    const badge = getOrderStatusBadge(value);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
          isDark
            ? `${badge.bgDark} ${badge.textDark} ${badge.borderDark}`
            : `${badge.bgLight} ${badge.textLight} ${badge.borderLight}`
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
        {badge.label}
      </span>
    );
  }

  if (type === 'priority') {
    const badge = getPriorityBadge(value);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-colors ${
          isDark
            ? `${badge.bgDark} ${badge.textDark} ${badge.borderDark}`
            : `${badge.bgLight} ${badge.textLight} ${badge.borderLight}`
        } ${className}`}
      >
        {badge.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
        customColor || (isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-800 border-slate-200')
      } ${className}`}
    >
      {customLabel || value}
    </span>
  );
};
