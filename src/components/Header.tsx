import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  RefreshCw, 
  ChevronDown, 
  AlertTriangle, 
  Sparkles,
  UserCheck,
  Sun,
  Moon,
  Database
} from 'lucide-react';
import { AppUser, TimeRangeFilter, UserRole, ThemeMode } from '../types';
import { StorageService } from '../services/storageService';

interface HeaderProps {
  currentUser: AppUser;
  roles: UserRole[];
  onUserChange: (userId: string) => void;
  timeFilter: TimeRangeFilter;
  onTimeFilterChange: (filter: TimeRangeFilter) => void;
  onRefreshData: () => void;
  lowStockCount: number;
  urgentOrdersCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  roles,
  onUserChange,
  timeFilter,
  onTimeFilterChange,
  onRefreshData,
  lowStockCount,
  urgentOrdersCount,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const users = StorageService.getUsers();
  const currentRole = roles.find((r) => r.id === currentUser.roleId);

  const timeFilterLabels: Record<TimeRangeFilter, string> = {
    today: 'امروز',
    week: 'این هفته',
    last_7_days: '۷ روز گذشته',
    month: 'این ماه',
    this_month: 'ماه جاری',
    last_30_days: '۳۰ روز گذشته',
    this_quarter: 'سه ماهه (فصل)',
    year: 'امسال',
    this_year: 'سال جاری',
    all: 'تمام دوره‌ها',
  };

  const handleResetData = async () => {
    if (window.confirm('آیا از بازنشانی دیتابیس SQLite و بازیابی داده‌های نمونه کارخانه مطمئن هستید؟')) {
      await StorageService.resetAllData();
      onRefreshData();
    }
  };

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors shadow-xs ${
      isDark ? 'bg-[#0F0F11] border-gray-800/80' : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/10 shrink-0">
              <span className="text-xl font-black">⚙️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-bold leading-tight ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
                  سامانه مدیریت تولید و سفارشات
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  isDark 
                    ? 'bg-teal-950/60 text-teal-300 border-teal-800/60' 
                    : 'bg-teal-50 text-teal-800 border-teal-300'
                }`}>
                  <Database className="w-3 h-3 text-teal-600" />
                  Express + SQLite
                </span>
              </div>
              <p className={`text-xs hidden sm:block ${isDark ? 'text-gray-400' : 'text-slate-700 font-medium'}`}>
                سیستم آنلاین خط تولید (در صف / در حال تولید / تکمیل شده) و انبارداری یکپارچه
              </p>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Urgent & Stock Alerts Pill */}
            {(lowStockCount > 0 || urgentOrdersCount > 0) && (
              <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1 border rounded-xl text-xs font-semibold ${
                isDark 
                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-200' 
                  : 'bg-amber-100 border-amber-300 text-amber-950 shadow-xs'
              }`}>
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                <span className="whitespace-nowrap">
                  {urgentOrdersCount > 0 && `${urgentOrdersCount} سفارش فوری`}
                  {urgentOrdersCount > 0 && lowStockCount > 0 && ' | '}
                  {lowStockCount > 0 && `${lowStockCount} کسری انبار`}
                </span>
              </div>
            )}

            {/* Time Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                  isDark
                    ? 'bg-[#161618] hover:bg-[#1E1E22] text-gray-200 border-gray-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                }`}
                title="فیلتر بازه زمانی"
              >
                <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-slate-700'}`} />
                <span className={`hidden sm:inline ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>بازه:</span>
                <span className="font-bold">{timeFilterLabels[timeFilter]}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-slate-700'}`} />
              </button>

              {isTimeDropdownOpen && (
                <div 
                  className={`absolute left-0 mt-1 w-44 rounded-xl shadow-2xl border py-1.5 z-40 animate-in fade-in ${
                    isDark ? 'bg-[#161618] border-gray-800' : 'bg-white border-slate-300 shadow-slate-300/60'
                  }`}
                  onClick={() => setIsTimeDropdownOpen(false)}
                >
                  <div className={`px-3 py-1 text-[11px] font-bold border-b ${
                    isDark ? 'text-gray-400 border-gray-800/80' : 'text-slate-800 border-slate-200'
                  }`}>
                    بازه زمانی گزارشات
                  </div>
                  {(Object.keys(timeFilterLabels) as TimeRangeFilter[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => onTimeFilterChange(key)}
                      className={`w-full text-right px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        timeFilter === key 
                          ? isDark ? 'text-teal-400 font-bold bg-teal-950/40' : 'text-teal-900 font-bold bg-teal-100/80'
                          : isDark ? 'text-gray-300 hover:bg-[#202026]' : 'text-slate-800 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <span>{timeFilterLabels[key]}</span>
                      {timeFilter === key && <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-2 rounded-xl transition-all border cursor-pointer ${
                isDark
                  ? 'bg-[#161618] hover:bg-[#1E1E22] text-amber-400 border-gray-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border-slate-300'
              }`}
              title={isDark ? 'تغییر به تم روشن (Light Mode)' : 'تغییر به تم تاریک (Dark Mode)'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Active Role Switcher (RBAC) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`flex items-center gap-2.5 px-3 py-1.5 border rounded-xl transition-colors text-right cursor-pointer ${
                  isDark
                    ? 'bg-[#161618] hover:bg-[#1E1E22] border-gray-800'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
              >
                <div className="text-lg">{currentUser.avatar}</div>
                <div className="hidden md:block text-right">
                  <div className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
                    {currentUser.name}
                    <ShieldCheck className="w-3 h-3 text-teal-600 inline" />
                  </div>
                  <div className={`text-[10px] font-bold ${isDark ? 'text-teal-400' : 'text-teal-800'}`}>
                    {currentRole?.titleFa || 'نقش کاربری'}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-slate-700'}`} />
              </button>

              {isUserDropdownOpen && (
                <div 
                  className={`absolute left-0 mt-1 w-72 rounded-xl shadow-2xl border py-2 z-40 animate-in fade-in ${
                    isDark ? 'bg-[#161618] border-gray-800' : 'bg-white border-slate-300 shadow-slate-300/60'
                  }`}
                  onClick={() => setIsUserDropdownOpen(false)}
                >
                  <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
                    <div className={`text-xs font-bold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
                      تغییر کاربر و نقش (RBAC)
                    </div>
                    <div className={`text-[11px] mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>
                      مجوزهای Read / Write بلادرنگ تغییر می‌کنند
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {users.map((u) => {
                      const role = roles.find((r) => r.id === u.roleId);
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            StorageService.setCurrentUserId(u.id);
                            onUserChange(u.id);
                          }}
                          className={`w-full text-right px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isCurrent 
                              ? isDark ? 'bg-teal-950/40 text-teal-200 font-semibold' : 'bg-teal-100/90 text-teal-950 font-bold'
                              : isDark ? 'text-gray-300 hover:bg-[#202026]' : 'text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-lg">{u.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">{u.name}</div>
                            <div className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-slate-600 font-medium'}`}>{role?.titleFa}</div>
                          </div>
                          {isCurrent && <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className={`px-3 pt-2 border-t flex items-center justify-between text-[11px] ${
                    isDark ? 'border-gray-800 text-gray-400' : 'border-slate-200 text-slate-700 font-medium'
                  }`}>
                    <span>مدیریت دسترسی کاربران</span>
                    <span className={`font-bold ${isDark ? 'text-teal-400' : 'text-teal-800'}`}>Read/Write Active</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Data Button */}
            <button
              type="button"
              onClick={handleResetData}
              title="بازنشانی پایگاه داده SQLite و بارگذاری مجدد اطلاعات کارخانه"
              className={`p-2 rounded-xl transition-colors border cursor-pointer ${
                isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-[#161618] border-transparent hover:border-gray-800'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
