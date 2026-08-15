import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'max-w-md' | 'max-w-lg' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl';
  theme?: 'dark' | 'light';
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'max-w-2xl',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full ${maxWidth} rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all scale-100 ${
          isDark
            ? 'bg-[#121214] border-[#27272A] text-gray-200'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'border-[#27272A]' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}
              >
                {icon}
              </div>
            )}
            <div>
              <h2 id="modal-title" className="text-base font-bold">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#18181B] border-[#27272A] text-gray-400 hover:text-white'
                : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
            aria-label="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
