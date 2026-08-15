import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onClose,
  theme = 'dark',
}) => {
  if (!toast) return null;
  const isDark = theme === 'dark';
  const isSuccess = toast.type === 'success';

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300"
      role="status"
      aria-live="polite"
    >
      <div
        className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 ${
          isSuccess
            ? isDark
              ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : isDark
            ? 'bg-rose-950/90 border-rose-700/80 text-rose-200'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="بستن اعلان"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
