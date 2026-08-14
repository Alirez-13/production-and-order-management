import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Printer, 
  Filter, 
  DollarSign, 
  Factory, 
  Truck, 
  ShieldAlert,
  ArrowUpRight,
  PieChart as PieIcon,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  CustomerOrder, 
  ProductionTask, 
  WarehouseProduct, 
  TimeRangeFilter, 
  AppUser,
  ThemeMode 
} from '../types';
import { StorageService } from '../services/storageService';
import { formatCurrency, formatNumber, formatDateFa } from '../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsReportsProps {
  orders: CustomerOrder[];
  productionTasks: ProductionTask[];
  products: WarehouseProduct[];
  timeFilter: TimeRangeFilter;
  onTimeFilterChange: (filter: TimeRangeFilter) => void;
  currentUser: AppUser;
  theme?: ThemeMode;
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  orders,
  productionTasks,
  products,
  timeFilter,
  onTimeFilterChange,
  currentUser,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [reportType, setReportType] = useState<'sales' | 'production' | 'warehouse'>('sales');

  const filteredOrders = orders.filter((o) => StorageService.isDateInFilter(o.orderDate, timeFilter));
  const dispatchedOrders = filteredOrders.filter((o) => o.status === 'dispatched');

  const totalSalesAmount = dispatchedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalProductionTasks = productionTasks.length;
  const completedProductionTasks = productionTasks.filter((t) => t.stage === 'completed').length;
  const totalWarehouseValue = products.reduce((sum, p) => sum + p.stockQuantity * p.unitCost, 0);

  // Chart data
  const weeklyProductionData = [
    { day: 'شنبه', completed: 18, queued: 12, target: 20 },
    { day: 'یکشنبه', completed: 24, queued: 15, target: 20 },
    { day: 'دوشنبه', completed: 20, queued: 10, target: 20 },
    { day: 'سه‌شنبه', completed: 28, queued: 8, target: 20 },
    { day: 'چهارشنبه', completed: 22, queued: 14, target: 20 },
    { day: 'پنج‌شنبه', completed: 16, queued: 6, target: 15 },
  ];

  const categoryShareData = [
    { name: 'اتوماسیون صنعتی', value: 45, color: '#0d9488' },
    { name: 'موتورهای الکتریکی', value: 30, color: '#6366f1' },
    { name: 'هیدرولیک و پنوماتیک', value: 15, color: '#f59e0b' },
    { name: 'تجهیزات کنترلی', value: 10, color: '#ec4899' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                گزارش‌های تحلیلی و شاخص‌های بهره‌وری
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                بررسی راندمان خطوط تولید، گردش انبار و نمودار مالی سفارشات تحویل‌شده
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ گزارش</span>
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 mt-6 border-b border-gray-800 pb-2">
          <button
            onClick={() => setReportType('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              reportType === 'sales'
                ? 'bg-teal-600 text-white'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            گزارش فروش و تحویل
          </button>
          <button
            onClick={() => setReportType('production')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              reportType === 'production'
                ? 'bg-teal-600 text-white'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            گزارش خطوط تولید و راندمان
          </button>
          <button
            onClick={() => setReportType('warehouse')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              reportType === 'warehouse'
                ? 'bg-teal-600 text-white'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            گزارش انبار و گردش موجودی
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <span className="text-xs text-gray-400 block">فروش تحقق‌یافته دوره</span>
          <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
            {formatCurrency(totalSalesAmount)}
          </span>
          <span className="text-[11px] text-gray-500 mt-1 block">
            {formatNumber(dispatchedOrders.length)} سفارش تحویل نهایی شد
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <span className="text-xs text-gray-400 block">راندمان تکمیل خط تولید</span>
          <span className="text-lg font-bold font-mono text-indigo-400 mt-1 block">
            {totalProductionTasks > 0 ? Math.round((completedProductionTasks / totalProductionTasks) * 100) : 0}%
          </span>
          <span className="text-[11px] text-gray-500 mt-1 block">
            {formatNumber(completedProductionTasks)} از {formatNumber(totalProductionTasks)} دستور ساخت تکمیل شد
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <span className="text-xs text-gray-400 block">موجودی سرمایه‌ای انبار</span>
          <span className="text-lg font-bold font-mono text-teal-400 mt-1 block">
            {formatCurrency(totalWarehouseValue)}
          </span>
          <span className="text-[11px] text-gray-500 mt-1 block">
            {formatNumber(products.length)} قلم کالای فعال
          </span>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            حجم خروجی تولید در طول روزهای کاری
          </h3>
          <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            مقایسه تیراژ تولید تکمیل‌شده و در صف نسبت به هدف
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProductionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272A' : '#E2E8F0'} vertical={false} />
                <XAxis dataKey="day" stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={11} />
                <YAxis stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                    borderColor: isDark ? '#27272A' : '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    direction: 'rtl',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="completed" name="تکمیل‌شده" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="queued" name="در صف" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border shadow-sm ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            سهم گروه‌های محصول در فروش
          </h3>
          <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            پراکندگی دسته‌بندی‌ها
          </p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryShareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                >
                  {categoryShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {categoryShareData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{c.name}</span>
                </div>
                <span className="font-mono font-bold">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
