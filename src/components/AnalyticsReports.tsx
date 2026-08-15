import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Printer, 
  Filter, 
  DollarSign, 
  Factory, 
  Truck, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownLeft,
  PieChart as PieIcon, 
  CheckCircle, 
  FileSpreadsheet,
  Package,
  Layers,
  Activity,
  Boxes,
  Clock,
  Eye,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { 
  CustomerOrder, 
  ProductionTask, 
  WarehouseProduct, 
  TimeRangeFilter, 
  AppUser,
  ThemeMode,
  ProductSnapshot 
} from '../types';
import { StorageService } from '../services/storageService';
import { formatCurrency, formatNumber, formatDateFa, formatPersianNumber } from '../utils/formatters';
import { ProductSnapshotModal } from './ProductSnapshotModal';
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
  const [selectedSnapshot, setSelectedSnapshot] = useState<ProductSnapshot | null>(null);

  // Time-filtered data
  const filteredOrders = orders.filter((o) => StorageService.isDateInFilter(o.orderDate, timeFilter));
  const dispatchedOrders = filteredOrders.filter((o) => o.status === 'dispatched');
  const allDispatchedOrders = orders.filter((o) => o.status === 'dispatched');

  const productionLines = StorageService.getProductionLines();
  const inventoryLogs = StorageService.getInventoryLogs();

  // 1. SALES METRICS
  const totalDispatchedRevenue = dispatchedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAllRevenue = allDispatchedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = dispatchedOrders.length > 0 ? totalDispatchedRevenue / dispatchedOrders.length : 0;
  const pendingOrdersCount = orders.filter((o) => o.status !== 'dispatched').length;

  // Sales monthly / dynamic trend
  const salesTrendData = [
    { period: 'فروردین', amount: 145000000, ordersCount: 12 },
    { period: 'اردیبهشت', amount: 198000000, ordersCount: 16 },
    { period: 'خرداد', amount: 240000000, ordersCount: 22 },
    { period: 'تیر', amount: 215000000, ordersCount: 19 },
    { period: 'مرداد', amount: 290000000, ordersCount: 26 },
    { period: 'شهریور', amount: 340000000, ordersCount: 31 },
  ];

  // Top Customers Data
  const customerSalesMap: Record<string, { name: string; amount: number; count: number }> = {};
  allDispatchedOrders.forEach((ord) => {
    const cust = ord.customerCompany || ord.customerName;
    if (!customerSalesMap[cust]) {
      customerSalesMap[cust] = { name: cust, amount: 0, count: 0 };
    }
    customerSalesMap[cust].amount += ord.totalAmount;
    customerSalesMap[cust].count += 1;
  });
  const topCustomersData = Object.values(customerSalesMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Sales by Category
  const categorySalesMap: Record<string, number> = {};
  allDispatchedOrders.forEach((ord) => {
    ord.items.forEach((it) => {
      const prod = products.find((p) => p.id === it.productId || p.sku === it.sku);
      const cat = prod?.category || 'سایر دسته‌ها';
      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + it.totalPrice;
    });
  });
  const categoryColors = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#10b981'];
  const categorySalesData = Object.entries(categorySalesMap).map(([name, val], idx) => ({
    name,
    value: val,
    color: categoryColors[idx % categoryColors.length],
  }));

  // 2. PRODUCTION METRICS
  const totalTasks = productionTasks.length;
  const completedTasks = productionTasks.filter((t) => t.stage === 'completed').length;
  const inProgressTasks = productionTasks.filter((t) => t.stage === 'in_production').length;
  const queuedTasks = productionTasks.filter((t) => t.stage === 'queued').length;
  const productionEfficiencyPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalProducedUnits = productionTasks
    .filter((t) => t.stage === 'completed')
    .reduce((sum, t) => sum + t.quantity, 0);

  // Output by Production Line
  const lineOutputMap: Record<string, { name: string; completed: number; inProgress: number; queued: number }> = {};
  productionLines.forEach((line) => {
    lineOutputMap[line.name] = { name: line.name, completed: 0, inProgress: 0, queued: 0 };
  });
  productionTasks.forEach((t) => {
    const lineKey = t.productionLine || 'خط عمومی';
    if (!lineOutputMap[lineKey]) {
      lineOutputMap[lineKey] = { name: lineKey, completed: 0, inProgress: 0, queued: 0 };
    }
    if (t.stage === 'completed') lineOutputMap[lineKey].completed += t.quantity;
    else if (t.stage === 'in_production') lineOutputMap[lineKey].inProgress += t.quantity;
    else lineOutputMap[lineKey].queued += t.quantity;
  });
  const linePerformanceData = Object.values(lineOutputMap);

  // 3. WAREHOUSE METRICS
  const totalWarehouseCapital = products.reduce((sum, p) => sum + p.stockQuantity * p.unitCost, 0);
  const totalStockUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minAlertThreshold).length;
  const totalLogsCount = inventoryLogs.length;

  // Inventory valuation by category
  const categoryInventoryMap: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.category || 'عمومی';
    categoryInventoryMap[cat] = (categoryInventoryMap[cat] || 0) + p.stockQuantity * p.unitCost;
  });
  const categoryInventoryData = Object.entries(categoryInventoryMap).map(([name, val], idx) => ({
    name,
    value: val,
    color: categoryColors[idx % categoryColors.length],
  }));

  // Top stock levels vs thresholds
  const topStockComparisonData = products.slice(0, 6).map((p) => ({
    name: p.name.length > 15 ? `${p.name.substring(0, 15)}...` : p.name,
    stockQuantity: p.stockQuantity,
    minAlertThreshold: p.minAlertThreshold,
  }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div
        className={`p-6 rounded-2xl border shadow-sm ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}
      >
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
                تحلیل جامع عملکرد فروش و تحویل، راندمان خطوط تولید و چرخه موجودی انبارها
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter Toggle */}
            <div
              className={`p-1 rounded-xl border flex items-center gap-1 text-xs ${
                isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-100 border-gray-200'
              }`}
            >
              {(['all', 'year', 'month', 'week', 'today'] as TimeRangeFilter[]).map((filterKey) => {
                const labels: Partial<Record<TimeRangeFilter, string>> = {
                  all: 'همه دوره‌ها',
                  year: 'امسال',
                  month: 'این ماه',
                  week: 'این هفته',
                  today: 'امروز',
                };
                const active = timeFilter === filterKey;
                return (
                  <button
                    key={filterKey}
                    onClick={() => onTimeFilterChange(filterKey)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-teal-600 text-white shadow-xs'
                        : isDark
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {labels[filterKey]}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handlePrint}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#18181B] border-[#27272A] text-gray-300 hover:text-white'
                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ گزارش</span>
            </button>
          </div>
        </div>

        {/* 3 DISTINCT TAB SELECTIONS */}
        <div className="flex items-center gap-2 mt-6 border-b border-gray-800 pb-2">
          <button
            onClick={() => setReportType('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              reportType === 'sales'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>۱. گزارش فروش و تحویل</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {formatPersianNumber(dispatchedOrders.length)}
            </span>
          </button>

          <button
            onClick={() => setReportType('production')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              reportType === 'production'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>۲. گزارش خطوط تولید و راندمان</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {formatPersianNumber(completedTasks)}
            </span>
          </button>

          <button
            onClick={() => setReportType('warehouse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              reportType === 'warehouse'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>۳. گزارش انبار و گردش موجودی</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {formatPersianNumber(products.length)}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SALES & DELIVERY REPORT (گزارش فروش و تحویل) */}
      {/* ========================================================================= */}
      {reportType === 'sales' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sales KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>فروش تحویل‌شده دوره</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400 block">
                {formatCurrency(totalDispatchedRevenue)}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                مجموع فروش قطعی: {formatCurrency(totalAllRevenue)}
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>سفارشات ترخیص و ارسال‌شده</span>
                <Truck className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-xl font-bold font-mono text-teal-400 block">
                {formatPersianNumber(dispatchedOrders.length)} سفارش
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                {formatPersianNumber(pendingOrdersCount)} سفارش در جریان تولید
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>میانگین ارزش فاکتور (AOV)</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xl font-bold font-mono text-indigo-400 block">
                {formatCurrency(avgOrderValue)}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                بر اساس سفارشات تحویل‌شده
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>مشتریان فعال تجاری</span>
                <CheckCircle className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xl font-bold font-mono text-amber-400 block">
                {formatPersianNumber(Object.keys(customerSalesMap).length)} شرکت
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                با سابقه خرید موفق در سیستم
              </span>
            </div>
          </div>

          {/* Sales Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Revenue Trend Chart */}
            <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    روند درآمدی و فروش ماهانه
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    نمودار ارزش فروش محقق‌شده و تعداد سفارشات در بازه‌های زمانی
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrendData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272A' : '#E2E8F0'} vertical={false} />
                    <XAxis dataKey="period" stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={11} />
                    <YAxis stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={11} tickFormatter={(v) => `${v / 1000000}M`} />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{
                        backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                        borderColor: isDark ? '#27272A' : '#CBD5E1',
                        borderRadius: '8px',
                        fontSize: '11px',
                        direction: 'rtl',
                      }}
                    />
                    <Area type="monotone" dataKey="amount" name="ارزش فروش (تومان)" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#salesGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Distribution by Category */}
            <div className={`p-6 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                توزیع درآمد بر اساس دسته‌بندی
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                سهم ریالی گروه‌های کالایی از فروش
              </p>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySalesData.length > 0 ? categorySalesData : [{ name: 'عمومی', value: 1, color: '#0d9488' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      dataKey="value"
                    >
                      {categorySalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
                {categorySalesData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-300">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Customers Bar Chart */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              برترین خریداران بر اساس حجم ریالی معاملات
            </h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              رتبه‌بندی مشتریان عمده صنعتی
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272A' : '#E2E8F0'} horizontal={false} />
                  <XAxis type="number" stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={11} tickFormatter={(v) => `${v / 1000000}M`} />
                  <YAxis type="category" dataKey="name" stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={11} width={130} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{
                      backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                      borderColor: isDark ? '#27272A' : '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '11px',
                      direction: 'rtl',
                    }}
                  />
                  <Bar dataKey="amount" name="ارزش خرید (تومان)" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dispatched Orders Audit Table */}
          <div
            className={`p-6 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  فهرست سفارشات ارسال‌شده با اسنپ‌شات مشخصات کالا
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  سوابق خروج کالا و تصاویر پایدار قیمت و مشخصات در لحظه تحویل
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                    <th className="py-3 px-3 font-semibold">شماره سفارش</th>
                    <th className="py-3 px-3 font-semibold">مشتری</th>
                    <th className="py-3 px-3 font-semibold">کد رهگیری / بارنامه</th>
                    <th className="py-3 px-3 font-semibold">اقلام و تیراژ</th>
                    <th className="py-3 px-3 font-semibold">مبلغ کل فاکتور</th>
                    <th className="py-3 px-3 font-semibold">تاریخ ارسال</th>
                    <th className="py-3 px-3 font-semibold text-center">اسنپ‌شات اقلام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {allDispatchedOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#18181B]/80' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-teal-400">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {ord.customerCompany || ord.customerName}
                        </div>
                        <div className="text-[10px] text-gray-500">{ord.customerName}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-indigo-400">
                        {ord.trackingCode || '---'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-300">
                          {ord.items.map((it, idx) => (
                            <span key={idx} className="block text-[11px]">
                              {it.productName} ({it.quantity} {it.unit})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-400">
                        {ord.dispatchedDate ? formatDateFa(ord.dispatchedDate) : formatDateFa(ord.orderDate)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (ord.snapshots && ord.snapshots.length > 0) {
                              setSelectedSnapshot(ord.snapshots[0]);
                            } else if (ord.items[0]?.productSnapshot) {
                              setSelectedSnapshot(ord.items[0].productSnapshot);
                            } else {
                              const prod = products.find((p) => p.id === ord.items[0]?.productId);
                              if (prod) {
                                setSelectedSnapshot({
                                  id: `snap_${ord.id}`,
                                  productId: prod.id,
                                  sku: prod.sku,
                                  productName: prod.name,
                                  category: prod.category,
                                  unit: prod.unit,
                                  unitCost: prod.unitCost,
                                  unitSalePrice: prod.unitSalePrice,
                                  productionLineName: prod.productionLineName,
                                  specifications: prod.specifications,
                                  quantity: ord.items[0]?.quantity || 1,
                                  timestamp: ord.dispatchedDate || ord.orderDate,
                                  capturedBy: 'سیستم لجستیک خروج',
                                  snapshotReason: 'order_dispatched',
                                  referenceId: ord.id,
                                  referenceCode: ord.orderNumber,
                                  notes: `ارسال سفارش ${ord.orderNumber} به همراه کد رهگیری ${ord.trackingCode || ''}`,
                                });
                              }
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          مشاهده سند
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allDispatchedOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-gray-500">
                        هنوز سفارشی به عنوان ارسال‌شده به مشتری ثبت نشده است.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCTION LINES & EFFICIENCY REPORT (گزارش خطوط تولید و راندمان) */}
      {/* ========================================================================= */}
      {reportType === 'production' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Production KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>کل تیراژ تکمیل‌شده</span>
                <Factory className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xl font-bold font-mono text-indigo-400 block">
                {formatPersianNumber(totalProducedUnits)} قطعه
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                از مجموع {formatPersianNumber(completedTasks)} دستور کار
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>راندمان تحقق برنامه (OEE)</span>
                <Activity className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-xl font-bold font-mono text-teal-400 block">
                {productionEfficiencyPercent}%
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                نسبت دستورات تکمیل‌شده به کل
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>در حال ساخت روی خطوط</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xl font-bold font-mono text-amber-400 block">
                {formatPersianNumber(inProgressTasks)} دستور
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                {formatPersianNumber(queuedTasks)} دستور در صف انتظار
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>خطوط ساخت فعال</span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400 block">
                {formatPersianNumber(productionLines.length)} خط
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                ظرفیت اسمی: {formatPersianNumber(productionLines.reduce((s, l) => s + l.capacityPerDay, 0))} قطعه/روز
              </span>
            </div>
          </div>

          {/* Production Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Output by Line Chart */}
            <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                تیراژ تولید و پیشرفت به تفکیک خطوط ساخت
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                مقایسه حجم قطعات تکمیل‌شده، در دست ساخت و در صف در هر ایستگاه
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={linePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272A' : '#E2E8F0'} vertical={false} />
                    <XAxis dataKey="name" stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={10} />
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
                    <Bar dataKey="completed" name="تکمیل‌شده (انبار)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inProgress" name="در حال ساخت" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="queued" name="در صف ساخت" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Production Lines Load Cards */}
            <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                بار کاری و ظرفیت ایستگاه‌ها
              </h3>
              <div className="space-y-3">
                {productionLines.map((line) => {
                  const lineTasks = productionTasks.filter((t) => t.productionLine === line.name);
                  const activeCount = lineTasks.filter((t) => t.stage === 'in_production').length;
                  const loadPercent = Math.min(100, Math.round((activeCount / Math.max(1, line.capacityPerDay / 5)) * 100));

                  return (
                    <div
                      key={line.id}
                      className={`p-3 rounded-xl border space-y-1.5 ${
                        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">{line.name}</span>
                        <span className="font-mono text-[11px] text-teal-400">{loadPercent}% لود کاری</span>
                      </div>
                      <div className="w-full bg-gray-700/40 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            loadPercent > 80 ? 'bg-rose-500' : loadPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${loadPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>ظرفیت روزانه: {line.capacityPerDay} قطعه</span>
                        <span>{activeCount} دستور فعال</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Production Tasks Audit Table */}
          <div
            className={`p-6 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}
          >
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              دفتر گزارش کارکرد دستورات تولید (MES Production Log)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                    <th className="py-3 px-3 font-semibold">کد دستور</th>
                    <th className="py-3 px-3 font-semibold">محصول</th>
                    <th className="py-3 px-3 font-semibold">خط ساخت</th>
                    <th className="py-3 px-3 font-semibold">تیراژ</th>
                    <th className="py-3 px-3 font-semibold">اپراتور مجری</th>
                    <th className="py-3 px-3 font-semibold">وضعیت</th>
                    <th className="py-3 px-3 font-semibold text-center">اسنپ‌شات فنی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {productionTasks.map((t) => (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#18181B]/80' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-teal-400">{t.taskCode}</td>
                      <td className="py-3 px-3 font-semibold">{t.productName}</td>
                      <td className="py-3 px-3 text-indigo-400">{t.productionLine}</td>
                      <td className="py-3 px-3 font-mono font-bold">{formatPersianNumber(t.quantity)}</td>
                      <td className="py-3 px-3 text-gray-400">{t.operatorName || 'اپراتور شیفت'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.stage === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : t.stage === 'in_production'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {t.stage === 'completed' ? 'تکمیل و انبارش' : t.stage === 'in_production' ? 'در حال ساخت' : 'در صف'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (t.productSnapshot) {
                              setSelectedSnapshot(t.productSnapshot);
                            } else {
                              const prod = products.find((p) => p.id === t.productId || p.sku === t.sku);
                              if (prod) {
                                setSelectedSnapshot({
                                  id: `snap_${t.id}`,
                                  productId: prod.id,
                                  sku: prod.sku,
                                  productName: prod.name,
                                  category: prod.category,
                                  unit: prod.unit,
                                  unitCost: prod.unitCost,
                                  unitSalePrice: prod.unitSalePrice,
                                  productionLineName: t.productionLine,
                                  specifications: prod.specifications,
                                  quantity: t.quantity,
                                  timestamp: t.completedDate || new Date().toISOString(),
                                  capturedBy: t.operatorName || 'اپراتور تولید',
                                  snapshotReason: 'production_completed',
                                  referenceId: t.id,
                                  referenceCode: t.taskCode,
                                  notes: `دستور کار تولید ${t.taskCode} - خط ${t.productionLine}`,
                                });
                              }
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          مشاهده سند
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WAREHOUSE & INVENTORY REPORT (گزارش انبار و گردش موجودی) */}
      {/* ========================================================================= */}
      {reportType === 'warehouse' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Warehouse KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>ارزش سرمایه‌ای انبارها</span>
                <Boxes className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400 block">
                {formatCurrency(totalWarehouseCapital)}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                مجموع بهای تمام‌شده موجودی‌های انبار
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>مجموع تیراژ قطعات در انبار</span>
                <Package className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-xl font-bold font-mono text-teal-400 block">
                {formatPersianNumber(totalStockUnits)} واحد
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                در قالب {formatPersianNumber(products.length)} ردیف کالای فعال
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>اقلام نیازمند سفارش (کسری)</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xl font-bold font-mono text-rose-400 block">
                {formatPersianNumber(lowStockCount)} کالا
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                کمتر از حد هشدار تعریف‌شده
              </span>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>تراکنش‌های انبار ثبت‌شده</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xl font-bold font-mono text-indigo-400 block">
                {formatPersianNumber(totalLogsCount)} رویداد
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                گردش ورودی و خروجی کالا
              </span>
            </div>
          </div>

          {/* Warehouse Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock Level vs Threshold */}
            <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                مقایسه موجودی انبار با نقطه سفارش بحرانی
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                بررسی موجودی فیزیکی در برابر آستانه هشدار برای کالاهای منتخب
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topStockComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272A' : '#E2E8F0'} vertical={false} />
                    <XAxis dataKey="name" stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={10} />
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
                    <Bar dataKey="stockQuantity" name="موجودی فعلی" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="minAlertThreshold" name="حد هشدار کسری" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventory Valuation by Category */}
            <div className={`p-6 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                سهم سرمایه‌ای دسته‌بندی‌ها
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ارزش انباشته انبار بر اساس گروه‌ها
              </p>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryInventoryData.length > 0 ? categoryInventoryData : [{ name: 'عمومی', value: 1, color: '#10b981' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      dataKey="value"
                    >
                      {categoryInventoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
                {categoryInventoryData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-300">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Transaction Logs */}
          <div
            className={`p-6 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
            }`}
          >
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ریز تراکنش‌های دفاتر انبار (دفتر ورود و خروج کالا)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                    <th className="py-3 px-3 font-semibold">نوع عملیات</th>
                    <th className="py-3 px-3 font-semibold">نام و کد کالا</th>
                    <th className="py-3 px-3 font-semibold">میزان تغییر</th>
                    <th className="py-3 px-3 font-semibold">موجودی پس از تغییر</th>
                    <th className="py-3 px-3 font-semibold">سند / ارجاع</th>
                    <th className="py-3 px-3 font-semibold">کاربر ثبت‌کننده</th>
                    <th className="py-3 px-3 font-semibold">تاریخ و زمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {inventoryLogs.slice(0, 15).map((log) => {
                    const isPositive = log.quantityChange > 0;
                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#18181B]/80' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isPositive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {log.type === 'in_from_production'
                              ? 'ورود از خط تولید'
                              : log.type === 'out_to_customer'
                              ? 'خروج ارسال به مشتری'
                              : 'اصلاح دستی موجودی'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{log.productName}</div>
                          <div className="font-mono text-[10px] text-teal-400">{log.sku}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? `+${formatPersianNumber(log.quantityChange)}` : formatPersianNumber(log.quantityChange)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-300">
                          {formatPersianNumber(log.resultingQuantity)}
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-[11px]">
                          {log.referenceText || log.referenceId}
                        </td>
                        <td className="py-3 px-3 text-gray-400">
                          {log.performedBy}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-400">
                          {formatDateFa(log.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Modal */}
      {selectedSnapshot && (
        <ProductSnapshotModal
          snapshot={selectedSnapshot}
          onClose={() => setSelectedSnapshot(null)}
          theme={theme}
        />
      )}
    </div>
  );
};
