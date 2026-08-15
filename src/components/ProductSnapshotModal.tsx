import React from 'react';
import { ProductSnapshot, ThemeMode } from '../types';
import { formatCurrency, formatNumber, formatDateFa } from '../utils/formatters';
import { 
  Camera, 
  X, 
  Calendar, 
  User, 
  Tag, 
  Factory, 
  Boxes, 
  DollarSign, 
  ShieldCheck, 
  FileText, 
  Info,
  Clock
} from 'lucide-react';

interface ProductSnapshotModalProps {
  snapshot: ProductSnapshot | null;
  onClose: () => void;
  theme?: ThemeMode;
}

export const ProductSnapshotModal: React.FC<ProductSnapshotModalProps> = ({
  snapshot,
  onClose,
  theme = 'dark',
}) => {
  if (!snapshot) return null;
  const isDark = theme === 'dark';

  const reasonLabels: Record<string, { label: string; color: string }> = {
    production_completed: { label: 'اتمام تولید و تحویل به انبار', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    order_dispatched: { label: 'خروج کالا و ارسال به مشتری', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    product_updated: { label: 'به‌روزرسانی کاتالوگ محصول', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    product_discontinued: { label: 'توقف تولید / بایگانی کالا', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    manual_audit: { label: 'ممیزی و کنترل کیفی انبار', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };

  const reasonInfo = reasonLabels[snapshot.snapshotReason] || {
    label: snapshot.snapshotReason,
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div
        className={`rounded-2xl border max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  اسنپ‌شات تاریخی مشخصات محصول
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${reasonInfo.color}`}>
                  {reasonInfo.label}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                شناسه ثبت تغییرناپذیر: <span className="font-mono text-teal-400">{snapshot.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'bg-[#18181B] border-[#27272A] text-gray-400 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Identity Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                {snapshot.sku}
              </span>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {snapshot.productName}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
              <span>دسته‌بندی: <b className="text-gray-300">{snapshot.category}</b></span>
              <span>•</span>
              <span>خط تولید: <b className="text-gray-300">{snapshot.productionLineName || 'تعریف‌نشده'}</b></span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-gray-400 block">تیراژ ثبت‌شده در رویداد</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {formatNumber(snapshot.quantity)} {snapshot.unit}
            </span>
          </div>
        </div>

        {/* Financial & Technical Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
              <DollarSign className="w-4 h-4" />
              <span>اطلاعات مالی در زمان ثبت</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">بهای تمام‌شده واحد:</span>
                <span className="font-mono font-bold text-gray-300">{formatCurrency(snapshot.unitCost)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">قیمت مصوب فروش واحد:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(snapshot.unitSalePrice)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">ارزش کل این بچ:</span>
                <span className="font-mono font-bold text-teal-300">{formatCurrency(snapshot.unitSalePrice * snapshot.quantity)}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <span>ممیزی و رفرنس سیستمی</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">شماره ارجاع / دستور:</span>
                <span className="font-mono font-bold text-gray-200">{snapshot.referenceCode || snapshot.referenceId || '---'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">مسئول ثبت رویداد:</span>
                <span className="font-bold text-gray-300">{snapshot.capturedBy}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">تاریخ و ساعت دقیق:</span>
                <span className="font-mono text-gray-300">{formatDateFa(snapshot.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs & Notes */}
        {snapshot.specifications && Object.keys(snapshot.specifications).length > 0 && (
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="text-xs font-bold text-gray-300 block">مشخصات فنی و مهندسی محصول در این مقطع:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.entries(snapshot.specifications).map(([key, val]) => (
                <div key={key} className="p-2 rounded-lg bg-black/20 border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">{key}</span>
                  <span className="font-medium text-gray-200">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {snapshot.notes && (
          <div
            className={`p-3 rounded-xl border text-xs ${
              isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <span className="text-gray-400 block mb-1">یادداشت و توضیحات ثبت:</span>
            <p>{snapshot.notes}</p>
          </div>
        )}

        {/* Integrity Notice */}
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
          isDark ? 'bg-teal-950/20 border-teal-800/40 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-800'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>
            این سند یک تصویر دائمی و غیرقابل بازنویسی (Immutable Snapshot) است که در تاریخچه پایگاه‌داده بایگانی شده و حتی در صورت توقف تولید یا حذف کاتالوگ محصول، برای همیشه قابل استعلام خواهد بود.
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
