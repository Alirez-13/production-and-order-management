import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  theme?: 'dark' | 'light';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'خطایی رخ داده است',
  message,
  onRetry,
  className = '',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isDark
          ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
          : 'bg-rose-50 border-rose-200 text-rose-800 shadow-xs'
      } ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
          }`}
        >
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <h4 className="font-bold text-sm">{title}</h4>
          <p className="text-xs opacity-90 mt-0.5 max-w-lg leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
            isDark
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
              : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>تلاش مجدد</span>
        </button>
      )}
    </div>
  );
};
