import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Factory, 
  Boxes, 
  CheckCircle2, 
  Truck, 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Calendar, 
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { 
  CustomerOrder, 
  ProductionTask, 
  WarehouseProduct, 
  TimeRangeFilter, 
  AppUser,
  ThemeMode 
} from '../types';
import { formatCurrency, formatNumber, formatDateFa, getOrderStatusBadge, getPriorityBadge } from '../utils/formatters';
import { StorageService } from '../services/storageService';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardProps {
  orders: CustomerOrder[];
  productionTasks: ProductionTask[];
  products: WarehouseProduct[];
  timeFilter: TimeRangeFilter;
  currentUser: AppUser;
  onNavigateTab: (tab: any) => void;
  theme?: ThemeMode;
}

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  productionTasks,
  products,
  timeFilter,
  currentUser,
  onNavigateTab,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<CustomerOrder | null>(null);

  // Dispatched orders = Customer Purchase History ("سابقه خرید مشتری")
  const dispatchedOrders = orders.filter((o) => o.status === 'dispatched');
  
  const filteredDispatchedOrders = dispatchedOrders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      o.customerCompany.toLowerCase().includes(customerSearch.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (o.trackingCode && o.trackingCode.toLowerCase().includes(customerSearch.toLowerCase()));
    const matchesTime = StorageService.isDateInFilter(o.dispatchedDate || o.orderDate, timeFilter);
    return matchesSearch && matchesTime;
  });

  // Calculate KPIs
  const totalRevenue = dispatchedOrders
    .filter((o) => StorageService.isDateInFilter(o.dispatchedDate || o.orderDate, timeFilter))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeInProductionTasks = productionTasks.filter((t) => t.stage === 'in_production');
  const queuedProductionTasks = productionTasks.filter((t) => t.stage === 'queued');
  const completedProductionTasks = productionTasks.filter((t) => t.stage === 'completed');
  const unprocessedOrders = orders.filter((o) => o.status === 'unprocessed');

  const totalWarehouseValue = products.reduce((sum, p) => sum + p.stockQuantity * p.unitCost, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minAlertThreshold).length;

  // Chart data
  const statusDistributionData = [
    { name: 'ارسال‌شده به مشتری', value: dispatchedOrders.length, color: '#0d9488' },
    { name: 'آماده در انبار', value: orders.filter((o) => o.status === 'produced').length, color: '#10b981' },
    { name: 'در حال ساخت در خط', value: orders.filter((o) => o.status === 'in_production').length, color: '#6366f1' },
    { name: 'در صف ساخت', value: orders.filter((o) => o.status === 'queued').length, color: '#3b82f6' },
    { name: 'پردازش نشده', value: unprocessedOrders.length, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  const salesTrendData = [
    { day: 'شنبه', revenue: totalRevenue * 0.12, orders: 4 },
    { day: 'یکشنبه', revenue: totalRevenue * 0.18, orders: 6 },
    { day: 'دوشنبه', revenue: totalRevenue * 0.15, orders: 5 },
    { day: 'سه‌شنبه', revenue: totalRevenue * 0.22, orders: 8 },
    { day: 'چهارشنبه', revenue: totalRevenue * 0.19, orders: 7 },
    { day: 'پنج‌شنبه', revenue: totalRevenue * 0.14, orders: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-slate-200 shadow-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-800'}`}>
              درآمد سفارش‌های تحویل‌شده
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg font-bold font-mono mt-2 ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400 mt-2 font-bold">
            <Truck className="w-3.5 h-3.5" />
            <span>{formatNumber(filteredDispatchedOrders.length)} سفارش با موفقیت ارسال شد</span>
          </div>
        </div>

        {/* Unprocessed Orders */}
        <div 
          onClick={() => onNavigateTab('orders')}
          className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer ${
            isDark ? 'bg-[#121214] border-[#27272A] hover:border-amber-500/50' : 'bg-white border-slate-200 hover:border-amber-500 shadow-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-800'}`}>
              سفارش‌های جدید (پردازش نشده)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg font-bold font-mono mt-2 ${isDark ? 'text-slate-950' : 'text-slate-950'}`}>
            {formatNumber(unprocessedOrders.length)} <span className="text-xs font-medium">سفارش</span>
          </div>
          <div className="text-xs text-amber-800 dark:text-amber-400 mt-2 font-bold flex items-center gap-1">
            <span>نیاز به تخصیص خط تولید</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Active Production Lines */}
        <div 
          onClick={() => onNavigateTab('production')}
          className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer ${
            isDark ? 'bg-[#121214] border-[#27272A] hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-500 shadow-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-800'}`}>
              دستورهای در خط تولید
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg font-bold font-mono mt-2 ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {formatNumber(activeInProductionTasks.length + queuedProductionTasks.length)}{' '}
            <span className="text-xs font-medium">دستور ساخت</span>
          </div>
          <div className="text-xs text-indigo-800 dark:text-indigo-400 mt-2 font-bold flex items-center gap-1">
            <span>{formatNumber(activeInProductionTasks.length)} در حال ساخت | {formatNumber(queuedProductionTasks.length)} در صف</span>
          </div>
        </div>

        {/* Warehouse Inventory */}
        <div 
          onClick={() => onNavigateTab('warehouse')}
          className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer ${
            isDark ? 'bg-[#121214] border-[#27272A] hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500 shadow-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-800'}`}>
              ارزش موجودی کالا در انبار
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg font-bold font-mono mt-2 ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {formatCurrency(totalWarehouseValue)}
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-emerald-800 dark:text-emerald-400 font-bold">{formatNumber(products.length)} قلم کالا</span>
            {lowStockCount > 0 && (
              <span className="text-rose-800 dark:text-rose-400 font-bold">{formatNumber(lowStockCount)} کسری موجودی</span>
            )}
          </div>
        </div>

      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales trend chart */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-xs ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-slate-200 shadow-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                روند تحویل و ترخیص کالا از انبار
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-700 font-medium'}`}>
                نمودار جریان درآمد حاصل از تحویل سفارشات ارسال‌شده
              </p>
            </div>
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/30">
              MES Stream
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272A' : '#CBD5E1'} vertical={false} />
                <XAxis dataKey="day" stroke={isDark ? '#71717A' : '#475569'} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? '#71717A' : '#475569'} fontSize={10} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                    borderColor: isDark ? '#27272A' : '#94A3B8',
                    borderRadius: '12px',
                    fontSize: '11px',
                    direction: 'rtl',
                    color: isDark ? '#F4F4F5' : '#090D16',
                    fontWeight: 600
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'مبلغ تحویل']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order status breakdown */}
        <div className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-slate-200 shadow-slate-100'
        }`}>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
              پراکندگی وضعیت سفارشات
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-700 font-medium'} mb-2`}>
              چرخه از سفارش جدید تا ارسال نهایی
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                      borderColor: isDark ? '#27272A' : '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '11px',
                      direction: 'rtl',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend items */}
          <div className="space-y-1.5 mt-2">
            {statusDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.name}</span>
                </div>
                <span className="font-mono font-bold">{formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* REQUIREMENT: CUSTOMER PURCHASE HISTORY (سابقه خرید مشتری) */}
      {/* ------------------------------------------------------------- */}
      <div className={`p-6 rounded-2xl border shadow-xs ${
        isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-slate-200 shadow-slate-100'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
          isDark ? 'border-gray-800' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                سابقه خرید مشتریان (سفارش‌های ارسال‌شده از انبار)
              </h2>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-700 font-medium'}`}>
              سفارشاتی که پس از تکمیل در خط تولید و ترخیص از انبار با کد رهگیری برای مشتری ارسال شده‌اند.
            </p>
          </div>

          {/* Search in customer history */}
          <div className="relative w-full sm:w-72">
            <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isDark ? 'text-gray-500' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="جستجو بر اساس مشتری، شرکت یا کد رهگیری..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className={`w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border outline-none font-medium ${
                isDark 
                  ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-600'
              }`}
            />
          </div>
        </div>

        {/* Dispatched Orders Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-slate-200 text-slate-800 font-bold'}`}>
                <th className="py-3 px-3 font-bold">شماره سفارش</th>
                <th className="py-3 px-3 font-bold">نام مشتری و شرکت</th>
                <th className="py-3 px-3 font-bold">اقلام و محصولات</th>
                <th className="py-3 px-3 font-bold">مبلغ کل (تومان)</th>
                <th className="py-3 px-3 font-bold">تاریخ ارسال</th>
                <th className="py-3 px-3 font-bold">کد رهگیری پست/باربری</th>
                <th className="py-3 px-3 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-800/40' : 'divide-slate-200'}`}>
              {filteredDispatchedOrders.map((order) => (
                <tr 
                  key={order.id}
                  className={`transition-colors ${
                    isDark ? 'hover:bg-[#18181B]/80' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Order Number */}
                  <td className="py-3 px-3 font-mono font-bold text-teal-700 dark:text-teal-400">
                    {order.orderNumber}
                  </td>

                  {/* Customer Info */}
                  <td className="py-3 px-3">
                    <div className={`font-bold ${isDark ? 'text-gray-200' : 'text-slate-950'}`}>
                      {order.customerName}
                    </div>
                    {order.customerCompany && (
                      <div className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        {order.customerCompany}
                      </div>
                    )}
                  </td>

                  {/* Items summary */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((it, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                          <span className={isDark ? 'text-gray-300' : 'text-slate-900 font-medium'}>{it.productName}</span>
                          <span className={`font-mono ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>({it.quantity} {it.unit})</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                          + {order.items.length - 2} قلم دیگر
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(order.totalAmount)}
                  </td>

                  {/* Date */}
                  <td className={`py-3 px-3 text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>
                    {formatDateFa(order.dispatchedDate || order.orderDate)}
                  </td>

                  {/* Tracking Code */}
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-mono text-[11px] font-bold border border-indigo-500/20">
                      {order.trackingCode || 'TRK-DEFAULT'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedOrderForDetails(order)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isDark 
                          ? 'bg-[#18181B] border-[#27272A] text-gray-300 hover:text-white hover:border-teal-500' 
                          : 'bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-950 hover:border-slate-300'
                      }`}
                      title="مشاهده جزئیات سفارش و فاکتور"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDispatchedOrders.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              سفارش تحویل‌شده‌ای با این مشخصات یافت نشد.
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`rounded-2xl border max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  رسید سابقه خرید: {selectedOrderForDetails.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-gray-400 block">نام مشتری:</span>
                <span className="font-bold text-sm">{selectedOrderForDetails.customerName}</span>
                {selectedOrderForDetails.customerCompany && (
                  <span className="text-gray-400 block mt-0.5">{selectedOrderForDetails.customerCompany}</span>
                )}
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-gray-400 block">کد رهگیری پستی / بارنامه:</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {selectedOrderForDetails.trackingCode || 'TRK-ONLINE'}
                </span>
                <span className="text-gray-400 block mt-0.5">
                  ارسال: {formatDateFa(selectedOrderForDetails.dispatchedDate || selectedOrderForDetails.orderDate)}
                </span>
              </div>
            </div>

            {/* Items list */}
            <div>
              <h4 className="text-xs font-semibold mb-2">اقلام تحویل‌شده:</h4>
              <div className="space-y-2">
                {selectedOrderForDetails.items.map((it, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold">{it.productName}</span>
                      <span className="text-gray-400 font-mono text-[11px] block">SKU: {it.sku}</span>
                    </div>
                    <div className="text-left">
                      <span className="font-mono font-bold">{it.quantity} {it.unit}</span>
                      <span className="text-emerald-400 text-[11px] block font-mono">{formatCurrency(it.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <span className="text-xs font-semibold">مبلغ کل فاکتور:</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {formatCurrency(selectedOrderForDetails.totalAmount)}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="w-full py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-white cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
