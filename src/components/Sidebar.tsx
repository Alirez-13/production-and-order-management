import React from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Factory,
  Warehouse,
  BarChart3,
  Settings,
  Code2,
  Database,
  DatabaseBackup,
} from "lucide-react";
import { AppUser, ModuleName, ThemeMode } from "../types";
import { StorageService } from "../services/storageService";

export type ActiveTab =
  | "dashboard"
  | "products"
  | "production"
  | "orders"
  | "warehouse"
  | "reports"
  | "security"
  | "api_docs";

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
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  const navItems = [
    {
      id: "dashboard" as ActiveTab,
      label: "داشبورد",
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: undefined,
      module: null,
    },
    {
      id: "orders" as ActiveTab,
      label: "سفارش‌ها",
      icon: <ClipboardList className="w-5 h-5" />,
      badge:
        counts.unprocessedOrders > 0 ? counts.unprocessedOrders : undefined,
      module: "orders" as ModuleName,
    },
    {
      id: "products" as ActiveTab,
      label: "محصولات",
      icon: <Package className="w-5 h-5" />,
      badge:
        counts.totalProducts !== undefined ? counts.totalProducts : undefined,
      module: "products" as ModuleName,
    },
    {
      id: "production" as ActiveTab,
      label: "تولید",
      icon: <Factory className="w-5 h-5" />,
      badge: counts.activeProduction > 0 ? counts.activeProduction : undefined,
      module: "production" as ModuleName,
    },
    {
      id: "warehouse" as ActiveTab,
      label: "انبار و ارسال",
      icon: <Warehouse className="w-5 h-5" />,
      badge: counts.lowStockItems > 0 ? counts.lowStockItems : undefined,
      module: "warehouse" as ModuleName,
    },
    {
      id: "reports" as ActiveTab,
      label: "گزارش‌ها",
      icon: <BarChart3 className="w-5 h-5" />,
      badge: undefined,
      module: "reports" as ModuleName,
    },
    {
      id: "security" as ActiveTab,
      label: "کاربران و دسترسی",
      icon: <Settings className="w-5 h-5" />,
      badge: undefined,
      module: "users" as ModuleName,
    },
    {
      id: "api_docs" as ActiveTab,
      label: "مستندات API",
      icon: <Code2 className="w-5 h-5" />,
      badge: undefined,
      module: null,
    },
  ];
  const handleResetData = async () => {
    if (
      window.confirm(
        "آیا از بازنشانی دیتابیس SQLite و بازیابی داده‌های نمونه کارخانه مطمئن هستید؟",
      )
    ) {
      await StorageService.resetAllData();
      window.location.reload();
    }
  };

  return (
    <aside
      className={`w-full md:w-[248px] rounded-2xl flex flex-col shrink-0 self-start transition-colors border ${
        isDark ? "bg-[#111827] border-[#1F2937]" : "bg-white border-[#E2E8F0]"
      }`}
    >
      <div className="p-3 space-y-1.5 flex-1">
        <div
          className={`px-3 pt-2 pb-3 text-xs font-semibold ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          منوی اصلی
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          const hasRead = item.module
            ? StorageService.checkPermission(item.module, "read", currentUser)
            : true;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-right cursor-pointer ${
                isActive
                  ? isDark
                    ? "bg-blue-500/10 text-blue-300"
                    : "bg-blue-50 text-blue-700"
                  : hasRead
                    ? isDark
                      ? "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    : isDark
                      ? "text-slate-600 opacity-50"
                      : "text-slate-400 opacity-60"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? isDark
                      ? "text-blue-300"
                      : "text-blue-600"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                }`}
              >
                {item.icon}
              </span>

              <span className="flex-1 min-w-0 text-sm font-medium">
                {item.label}
              </span>

              {item.badge !== undefined && (
                <span
                  className={`min-w-[22px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    isActive
                      ? isDark
                        ? "bg-blue-500/15 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                      : isDark
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info in sidebar */}

      <div
        className={`mx-3 mb-3 mt-2 px-3 py-3 rounded-xl border ${
          isDark
            ? "bg-slate-900/60 border-slate-800"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`flex items-center gap-2 text-xs font-semibold ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            SQLite
          </span>

          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            فعال
          </span>
        </div>
        {currentUser.roleId === "super_admin" && (
          <div
            className={`mt-5 pt-4 border-t ${
              isDark ? "border-[#1F2937]" : "border-[#E2E8F0]"
            }`}
          >
            <div
              className={`px-3 pb-2 text-xs font-semibold ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              مدیریت سیستم
            </div>

            <button
              type="button"
              onClick={handleResetData}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-right cursor-pointer ${
                isDark
                  ? "text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                  : "text-slate-600 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <DatabaseBackup className="w-5 h-5" />
              </span>

              <span className="flex-1 min-w-0 text-sm font-medium">
                بازنشانی پایگاه داده
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
