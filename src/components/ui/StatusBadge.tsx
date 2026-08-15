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
        dir="rtl"
        className={`inline-flex items-center whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
          isDark
            ? `${badge.bgDark} ${badge.textDark} ${badge.borderDark}`
            : `${badge.bgLight} ${badge.textLight} ${badge.borderLight}`
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full ml-1.5 bg-current opacity-90 shrink-0" />
        <bdi dir="auto" className="inline-block whitespace-nowrap leading-none">
          {badge.label}
        </bdi>
      </span>
    );
  }

  if (type === 'priority') {
    const badge = getPriorityBadge(value);
    return (
      <span
        dir="rtl"
        className={`inline-flex items-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border transition-colors ${
          isDark
            ? `${badge.bgDark} ${badge.textDark} ${badge.borderDark}`
            : `${badge.bgLight} ${badge.textLight} ${badge.borderLight}`
        } ${className}`}
      >
        <bdi dir="auto" className="inline-block whitespace-nowrap leading-none">
          {badge.label}
        </bdi>
      </span>
    );
  }

  return (
    <span
      dir="rtl"
      className={`inline-flex items-center whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
        customColor || (isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-slate-100 text-slate-800 border-slate-300 font-bold')
      } ${className}`}
    >
      <bdi dir="auto" className="inline-block whitespace-nowrap leading-none">
        {customLabel || value}
      </bdi>
    </span>
  );
};

