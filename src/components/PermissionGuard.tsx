import React from 'react';
import { ShieldAlert, Lock, ArrowRight, UserCheck, ShieldOff } from 'lucide-react';
import { AppUser, ModuleName, ThemeMode } from '../types';
import { StorageService } from '../services/storageService';

interface PermissionGuardProps {
  module: ModuleName;
  action?: 'read' | 'write';
  currentUser: AppUser;
  onNavigateTab: (tab: any) => void;
  theme?: ThemeMode;
  children: React.ReactNode;
}

const moduleNamesFa: Record<ModuleName, { title: string; desc: string }> = {
  products: { title: 'محصولات و خطوط ساخت', desc: 'مشاهده و تعریف مشخصات قطعات، کالاها و خطوط تولید' },
  production: { title: 'مدیریت خط تولید و مونتاژ', desc: 'مانیتورینگ صف، ایستگاه‌های کاری و اتمام ساخت' },
  orders: { title: 'سفارش‌های مشتریان', desc: 'ثبت، رهگیری و ارسال سفارش‌ها به خطوط تولید' },
  warehouse: { title: 'انبارداری و لجستیک', desc: 'موجودی قطعات، ورود کالا و صدور حواله خروج' },
  reports: { title: 'گزارش‌های تحلیلی و فروش', desc: 'داشبورد آماری، بازدهی خطوط و خروجی اکسل' },
  users: { title: 'مدیریت کاربران و امنیت (RBAC)', desc: 'تعریف نقش‌ها و ماتریس مجوزهای Read/Write' },
};

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action = 'read',
  currentUser,
  onNavigateTab,
  theme = 'dark',
  children,
}) => {
  const isDark = theme === 'dark';
  const targetAction: 'read' | 'write' = action === 'write' ? 'write' : 'read';
  const hasPermission = StorageService.checkPermission(module, targetAction, currentUser);
  const roles = StorageService.getRoles();
  const userRole = roles.find((r) => r.id === currentUser.roleId);
  const info = moduleNamesFa[module] || { title: module, desc: '' };

  if (hasPermission) {
    return <>{children}</>;
  }

  const roleDefaultRead = Boolean(userRole?.permissions[module]?.read);

  return (
    <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center text-center py-16 transition-all ${
      isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5 shadow-inner">
        <ShieldOff className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
        <Lock className="w-3.5 h-3.5" />
        <span>خطای دسترسی ۴۰۳ (مجوز مسدود شده است)</span>
      </div>

      <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        عدم دسترسی به بخش «{info.title}»
      </h2>

      <p className={`text-xs max-w-md mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        کاربر گرامی <span className="font-semibold text-teal-400">{currentUser.name}</span> ({currentUser.department})، 
        مجوز <span className="font-semibold text-rose-400">{action === 'read' ? 'مشاهده و خواندن (Read)' : 'ویرایش و ثبت (Write)'}</span> برای ماژول «{info.title}» برای شما غیرفعال است.
      </p>

      {/* User and Role Breakdown Box */}
      <div className={`p-4 rounded-xl border text-right max-w-md w-full mb-6 text-xs space-y-2.5 ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">نقش سازمانی شما:</span>
          <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {userRole?.titleFa || currentUser.roleId}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">وضعیت دسترسی پیش‌فرض نقش:</span>
          <span className="font-mono text-xs text-gray-300">
            {roleDefaultRead ? 'مجاز به خواندن' : 'مسدود'}
          </span>
        </div>
        {currentUser.customPermissions && (
          <div className="flex items-center justify-between border-t pt-2 border-gray-700/50">
            <span className="text-amber-400 font-medium">سفارشی‌سازی اختصاصی (Custom RBAC):</span>
            <span className="font-semibold text-rose-400">دسترسی مسدود شده</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => onNavigateTab('dashboard')}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-900/20"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به داشبورد اصلی
        </button>

        {StorageService.checkPermission('users', 'read', currentUser) && (
          <button
            onClick={() => onNavigateTab('security')}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer ${
              isDark 
                ? 'bg-[#18181B] border-[#27272A] text-gray-300 hover:text-white hover:bg-[#202026]'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserCheck className="w-4 h-4 text-purple-400" />
            تنظیم ماتریس دسترسی (RBAC)
          </button>
        )}
      </div>
    </div>
  );
};
