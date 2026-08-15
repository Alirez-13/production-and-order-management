import React from 'react';
import { 
  LayoutDashboard, 
  Factory, 
  ShoppingBag, 
  Boxes, 
  BarChart3, 
  ShieldAlert, 
  Code2,
  Lock,
  Edit3,
  Eye,
  Layers,
  Database
} from 'lucide-react';
import { AppUser, ModuleName, ThemeMode } from '../types';
import { StorageService } from '../services/storageService';

export type ActiveTab = 'dashboard' | 'products' | 'production' | 'orders' | 'warehouse' | 'reports' | 'security' | 'api_docs';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: AppUser;
  counts: {
    unprocessedOrders: number;
    activeProduction: number;
    lowStockItems: number;
    dispatchedOrders: number;
    totalProducts?: number;
  };
  theme?: ThemeMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  counts,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const getPermissionBadge = (moduleName: ModuleName) => {
    const hasRead = StorageService.checkPermission(moduleName, 'read', currentUser);
    const hasWrite = StorageService.checkPermission(moduleName, 'write', currentUser);

    if (hasRead && hasWrite) {
      return {
        label: 'R/W کامل',
        bg: isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <Edit3 className="w-2.5 h-2.5" />,
      };
    } else if (hasRead && !hasWrite) {
      return {
        label: 'فقط خواندن',
        bg: isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Eye className="w-2.5 h-2.5" />,
      };
    } else {
      return {
        label: 'مسدود',
        bg: isDark ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <Lock className="w-2.5 h-2.5" />,
      };
    }
  };

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'داشبورد و سابقه خرید',
      sublabel: 'شاخص‌ها و سوابق مشتری',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: counts.dispatchedOrders > 0 ? `${counts.dispatchedOrders} ارسال‌شده` : undefined,
      badgeColor: isDark ? 'bg-teal-950/60 text-teal-300 border border-teal-800/60' : 'bg-teal-100 text-teal-800 border border-teal-200',
      module: null,
    },
    {
      id: 'products' as ActiveTab,
      label: 'محصولات و خطوط ساخت',
      sublabel: 'تعریف کالا، دسته‌بندی و خطوط',
      icon: <Layers className="w-5 h-5" />,
      badge: counts.totalProducts !== undefined ? `${counts.totalProducts} محصول` : undefined,
      badgeColor: isDark ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60' : 'bg-blue-100 text-blue-800 border border-blue-200',
      module: 'products' as ModuleName,
    },
    {
      id: 'production' as ActiveTab,
      label: 'مدیریت خط تولید',
      sublabel: 'صف، در حال ساخت، تکمیل',
      icon: <Factory className="w-5 h-5" />,
      badge: counts.activeProduction > 0 ? `${counts.activeProduction} در جریان` : undefined,
      badgeColor: isDark ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/60' : 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      module: 'production' as ModuleName,
    },
    {
      id: 'orders' as ActiveTab,
      label: 'سفارش‌های مشتریان',
      sublabel: 'ثبت، پیگیری و صف‌بندی',
      icon: <ShoppingBag className="w-5 h-5" />,
      badge: counts.unprocessedOrders > 0 ? `${counts.unprocessedOrders} جدید` : undefined,
      badgeColor: isDark ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60' : 'bg-amber-100 text-amber-800 border border-amber-200',
      module: 'orders' as ModuleName,
    },
    {
      id: 'warehouse' as ActiveTab,
      label: 'مدیریت انبار و لجستیک',
      sublabel: 'موجودی، ورود کالا و ارسال',
      icon: <Boxes className="w-5 h-5" />,
      badge: counts.lowStockItems > 0 ? `${counts.lowStockItems} کسری` : undefined,
      badgeColor: isDark ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60' : 'bg-rose-100 text-rose-800 border border-rose-200',
      module: 'warehouse' as ModuleName,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'گزارش‌ها و نمودار فروش',
      sublabel: 'تحلیل روندها و بازدهی',
      icon: <BarChart3 className="w-5 h-5" />,
      badge: undefined,
      module: 'reports' as ModuleName,
    },
    {
      id: 'security' as ActiveTab,
      label: 'مدیریت دسترسی و کاربران',
      sublabel: 'ماتریس دسترسی Read/Write',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: 'RBAC',
      badgeColor: isDark ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60' : 'bg-purple-100 text-purple-800 border border-purple-200',
      module: 'users' as ModuleName,
    },
    {
      id: 'api_docs' as ActiveTab,
      label: 'مستندات و کنسول API',
      sublabel: 'Express + SQLite RESTful',
      icon: <Code2 className="w-5 h-5" />,
      badge: 'Express',
      badgeColor: isDark ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      module: null,
    },
  ];

  return (
    <aside className={`w-full md:w-64 rounded-2xl flex flex-col shrink-0 shadow-xs self-start transition-colors border ${
      isDark ? 'bg-[#111113] border-gray-800/80' : 'bg-white border-slate-200'
    }`}>
      <div className="p-3 space-y-1.5 flex-1">
        <div className={`text-[11px] font-bold tracking-normal uppercase px-3 py-1 mb-1 ${
          isDark ? 'text-gray-400' : 'text-slate-800'
        }`}>
          بخش‌های عملیاتی کارخانه
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const perm = item.module ? getPermissionBadge(item.module) : null;
          const hasRead = item.module ? StorageService.checkPermission(item.module, 'read', currentUser) : true;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-right p-2.5 rounded-xl flex items-start gap-3 transition-all relative cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/20 font-bold'
                  : hasRead
                  ? isDark 
                    ? 'text-gray-200 hover:bg-[#1E1E22] hover:text-white'
                    : 'text-slate-900 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                  : isDark 
                    ? 'text-gray-500 bg-[#0F0F12] opacity-60' 
                    : 'text-slate-500 bg-slate-50 opacity-60'
              }`}
            >
              <div className={`p-1 rounded-lg shrink-0 ${isActive ? 'text-white' : isDark ? 'text-gray-400' : 'text-slate-700'}`}>
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] truncate mt-0.5 font-medium ${
                  isActive ? 'text-teal-100' : isDark ? 'text-gray-400' : 'text-slate-700'
                }`}>
                  {item.sublabel}
                </p>

                {/* Permission indicator pill */}
                {perm && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <span
                      className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        isActive ? 'bg-white/15 text-white border-white/20' : `${perm.bg}`
                      }`}
                    >
                      {perm.icon}
                      <span>{perm.label}</span>
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer info in sidebar */}
      <div className={`p-3 m-3 rounded-xl border text-[11px] space-y-1 ${
        isDark ? 'bg-[#0F0F12] border-gray-800/80 text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className={`flex items-center justify-between font-bold ${isDark ? 'text-gray-200' : 'text-slate-950'}`}>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            پایگاه داده SQLite
          </span>
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            فعال
          </span>
        </div>
        <div className={`text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>
          ذخیره‌سازی پایدار در دیتابیس محلی کارخانه
        </div>
      </div>
    </aside>
  );
};
