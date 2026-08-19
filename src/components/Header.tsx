import React, { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  AlertTriangle,
  UserCheck,
  Sun,
  Moon,
  Factory,
} from "lucide-react";

import { AppUser, TimeRangeFilter, UserRole, ThemeMode } from "../types";

import { StorageService } from "../services/storageService";

interface HeaderProps {
  currentUser: AppUser;
  roles: UserRole[];
  onUserChange: (userId: string) => void;

  timeFilter: TimeRangeFilter;
  onTimeFilterChange: (filter: TimeRangeFilter) => void;

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

  lowStockCount,
  urgentOrdersCount,

  theme,
  onToggleTheme,
}) => {
  const isDark = theme === "dark";

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
        setIsTimeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const users = StorageService.getUsers();

  const currentRole = roles.find((r) => r.id === currentUser.roleId);

  const timeFilterLabels: Record<TimeRangeFilter, string> = {
    today: "امروز",
    week: "این هفته",
    last_7_days: "۷ روز گذشته",

    month: "این ماه",
    this_month: "ماه جاری",

    last_30_days: "۳۰ روز گذشته",

    this_quarter: "سه ماهه (فصل)",

    year: "امسال",
    this_year: "سال جاری",

    all: "تمام دوره‌ها",
  };

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-colors ${
        isDark ? "bg-[#111827] border-[#1F2937]" : "bg-white border-[#E2E8F0]"
      }`}
    >
      <div className="max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}

          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-blue-50 border-blue-100 text-blue-600"
              }`}
            >
              <Factory className="w-[19px] h-[19px]" strokeWidth={1.8} />
            </div>

            <h1
              className={`text-[15px] font-semibold ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              سامانه مدیریت تولید و سفارشات
            </h1>
          </div>

          {/* Right Controls */}

          <div ref={dropdownRef} className="flex items-center gap-2 sm:gap-3">
            {/* Alerts */}

            {(lowStockCount > 0 || urgentOrdersCount > 0) && (
              <div
                className={`hidden lg:flex min-h-10 items-center gap-2 px-3 py-2 border rounded-xl text-xs font-medium ${
                  isDark
                    ? "bg-blue-500/5 border-blue-500/15 text-slate-300"
                    : "bg-blue-50/70 border-blue-100 text-slate-700"
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    isDark ? "text-blue-400" : "text-blue-600"
                  }`}
                />

                <span className="whitespace-nowrap">
                  {urgentOrdersCount > 0 && `${urgentOrdersCount} سفارش فوری`}

                  {urgentOrdersCount > 0 && lowStockCount > 0 && " | "}

                  {lowStockCount > 0 && `${lowStockCount} کسری انبار`}
                </span>
              </div>
            )}

            {/* Time Filter */}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsTimeDropdownOpen(!isTimeDropdownOpen);

                  setIsUserDropdownOpen(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                  isDark
                    ? "bg-slate-900/70 hover:bg-slate-800 border-slate-700/80 text-slate-300"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
                title="فیلتر بازه زمانی"
              >
                <CalendarDays
                  className={`w-4 h-4 ${
                    isDark ? "text-blue-400" : "text-blue-600"
                  }`}
                />

                <span className="hidden sm:inline">بازه:</span>

                <span
                  className={`font-semibold ${
                    isDark ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  {timeFilterLabels[timeFilter]}
                </span>

                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  } ${isTimeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTimeDropdownOpen && (
                <div
                  className={`absolute left-0 mt-2 w-48 rounded-xl border py-1.5 z-40 shadow-xl origin-top transition-all duration-200 ease-out ${
                    isDark
                      ? "bg-[#111827] border-[#1F2937]"
                      : "bg-white border-[#E2E8F0]"
                  } *: ${
                    isTimeDropdownOpen
                      ? "opacity-100 scale-100 visible"
                      : "opacity-0 scale-95 invisible"
                  }`}
                >
                  <div
                    className={`px-3 py-2 text-xs font-semibold border-b ${
                      isDark
                        ? "text-slate-400 border-[#1F2937]"
                        : "text-slate-500 border-slate-200"
                    }`}
                  >
                    بازه زمانی گزارشات
                  </div>

                  {(Object.keys(timeFilterLabels) as TimeRangeFilter[]).map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => {
                          onTimeFilterChange(key);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 text-sm flex items-center justify-between transition-colors cursor-pointer ${
                          timeFilter === key
                            ? isDark
                              ? "text-blue-300 bg-blue-500/10 font-semibold"
                              : "text-blue-700 bg-blue-50 font-semibold"
                            : isDark
                              ? "text-slate-300 hover:bg-slate-800/70"
                              : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{timeFilterLabels[key]}</span>

                        {timeFilter === key && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDark ? "bg-blue-400" : "bg-blue-600"
                            }`}
                          />
                        )}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}

            <button
              type="button"
              onClick={onToggleTheme}
              className={`w-10 h-10 rounded-xl transition-colors border flex items-center justify-center cursor-pointer ${
                isDark
                  ? "bg-[#111827] hover:bg-slate-800/70 text-slate-300 border-[#1F2937]"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-[#E2E8F0]"
              }`}
              title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-blue-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>
            {/* User Role Switcher */}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsUserDropdownOpen(!isUserDropdownOpen);

                  setIsTimeDropdownOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 border rounded-xl transition-colors text-right cursor-pointer ${
                  isDark
                    ? "bg-[#111827] hover:bg-slate-800/70 border-[#1F2937]"
                    : "bg-white hover:bg-slate-50 border-[#E2E8F0]"
                }`}
              >
                <div className="hidden md:block text-right">
                  <div
                    className={`text-sm font-semibold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {currentUser.name}
                  </div>

                  <div
                    className={`text-xs font-medium mt-0.5 ${
                      isDark ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    {currentRole?.titleFa || "نقش کاربری"}
                  </div>
                </div>

                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  } ${isUserDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isUserDropdownOpen && (
                <div
                  className={`absolute left-0 mt-2 w-72 rounded-xl border py-2 z-40 shadow-xl origin-top transition-all duration-200 ease-out ${
                    isDark
                      ? "bg-[#111827] border-[#1F2937]"
                      : "bg-white border-[#E2E8F0]"
                  }
                  ${
isUserDropdownOpen
? "opacity-100 scale-100 visible"
: "opacity-0 scale-95 invisible"
}`}
                >
                  <div
                    className={`px-4 py-2.5 border-b ${
                      isDark ? "border-[#1F2937]" : "border-slate-200"
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold ${
                        isDark ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      تغییر کاربر و نقش (RBAC)
                    </div>

                    <div
                      className={`text-xs mt-1 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
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

                            setIsUserDropdownOpen(false);
                          }}
                          className={`w-full text-right px-3 py-2.5 flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isCurrent
                              ? isDark
                                ? "bg-blue-500/10 text-blue-200"
                                : "bg-blue-50 text-blue-800"
                              : isDark
                                ? "text-slate-300 hover:bg-slate-800/70"
                                : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {u.name}
                            </div>

                            <div
                              className={`text-xs truncate mt-0.5 ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {role?.titleFa}
                            </div>
                          </div>

                          {isCurrent && (
                            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={`px-3 pt-2.5 border-t flex items-center justify-between text-xs ${
                      isDark
                        ? "border-[#1F2937] text-slate-400"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>مدیریت دسترسی کاربران</span>

                    <span
                      className={`font-semibold ${
                        isDark ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      Read/Write Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
