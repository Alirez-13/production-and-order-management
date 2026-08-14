import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Truck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Edit3, 
  History, 
  Package, 
  Layers, 
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  WarehouseProduct, 
  CustomerOrder, 
  InventoryLog, 
  AppUser,
  ThemeMode 
} from '../types';
import { StorageService } from '../services/storageService';
import { formatCurrency, formatNumber, formatDateFa } from '../utils/formatters';

interface WarehouseManagementProps {
  products: WarehouseProduct[];
  orders: CustomerOrder[];
  logs: InventoryLog[];
  currentUser: AppUser;
  onRefreshData: () => void;
  onNavigateTab?: (tab: any) => void;
  theme?: ThemeMode;
}

export const WarehouseManagement: React.FC<WarehouseManagementProps> = ({
  products,
  orders,
  logs,
  currentUser,
  onRefreshData,
  onNavigateTab,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'dispatch' | 'logs'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductToAdjust, setSelectedProductToAdjust] = useState<WarehouseProduct | null>(null);
  const [newAdjustQty, setNewAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('شمارش ادواری انبار');

  // Dispatch Order State
  const [selectedOrderToDispatch, setSelectedOrderToDispatch] = useState<CustomerOrder | null>(null);
  const [dispatchTrackingCode, setDispatchTrackingCode] = useState('');
  const [dispatchLogisticsNotes, setDispatchLogisticsNotes] = useState('ارسال اکسپرس باربری');

  // Toast / feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Permissions Check
  const canWrite = StorageService.checkPermission('warehouse', 'write', currentUser);
  const canRead = StorageService.checkPermission('warehouse', 'read', currentUser);

  // Orders produced and ready in warehouse for customer dispatch
  const readyToDispatchOrders = orders.filter((o) => o.status === 'produced');

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.locationBin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Handle Manual Stock Adjustment
  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductToAdjust) return;
    if (!canWrite) {
      showToast('error', 'خطای دسترسی: شما مجوز ویرایش موجودی انبار را ندارید.');
      return;
    }

    const res = StorageService.adjustStockManually(
      selectedProductToAdjust.id,
      Number(newAdjustQty),
      adjustReason,
      currentUser.name
    );

    if (res.success) {
      showToast('success', `موجودی کالای ${selectedProductToAdjust.name} با موفقیت اصلاح شد.`);
      setIsAdjustModalOpen(false);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در اصلاح موجودی');
    }
  };

  // Handle Dispatch Order to Customer
  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderToDispatch) return;
    if (!canWrite) {
      showToast('error', 'شما مجوز صدور حواله خروج از انبار را ندارید.');
      return;
    }

    const tracking = dispatchTrackingCode.trim() || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    const res = StorageService.dispatchOrderFromWarehouse(
      selectedOrderToDispatch.id,
      tracking,
      dispatchLogisticsNotes,
      currentUser.name
    );

    if (res.success) {
      showToast('success', `سفارش ${selectedOrderToDispatch.orderNumber} با کد رهگیری ${tracking} ترخیص شد و به سابقه خرید مشتریان پیوست.`);
      setSelectedOrderToDispatch(null);
      setDispatchTrackingCode('');
      onRefreshData();
      if (onNavigateTab) {
        onNavigateTab('dashboard');
      }
    } else {
      showToast('error', res.error || 'خطا در ارسال سفارش');
    }
  };

  const totalInventoryValue = products.reduce((sum, p) => sum + p.stockQuantity * p.unitCost, 0);
  const totalStockUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-lg transition-all animate-fadeIn ${
            toast.type === 'success'
              ? isDark
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : isDark
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-sm ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                مدیریت انبار، موجودی و لجستیک خروج
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                کنترل خودکار ورود تولیدات تکمیل‌شده، پایش قفسه‌ها و صدور بارنامه خروج برای مشتری
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
            }`}>
              <span className="text-gray-400">کل ارزش موجودی انبار:</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(totalInventoryValue)}</span>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-[#18181B]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>موجودی کالا و قفسه‌ها ({formatNumber(products.length)})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dispatch')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'dispatch'
                ? 'bg-teal-600 text-white shadow-sm'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-[#18181B]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>سفارش‌های آماده ارسال به مشتری ({formatNumber(readyToDispatchOrders.length)})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-[#18181B]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>تاریخچه ورود و خروج کالا</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: INVENTORY TABLE */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'inventory' && (
        <div
          className={`p-6 rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
          }`}
        >
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="relative w-full sm:w-72">
              <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="جستجو در انبار، SKU، قفسه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border outline-none ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] text-white focus:border-emerald-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-emerald-600'
                }`}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border outline-none cursor-pointer ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <th className="py-3 px-3 font-semibold">کد SKU</th>
                  <th className="py-3 px-3 font-semibold">نام کالا</th>
                  <th className="py-3 px-3 font-semibold">دسته‌بندی</th>
                  <th className="py-3 px-3 font-semibold">موجودی فعلی</th>
                  <th className="py-3 px-3 font-semibold">آدرس قفسه / Bin</th>
                  <th className="py-3 px-3 font-semibold">قیمت فروش</th>
                  <th className="py-3 px-3 font-semibold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minAlertThreshold;
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#18181B]/80' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-teal-400">
                        {p.sku}
                      </td>

                      <td className="py-3 px-3">
                        <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{p.name}</div>
                        <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.unit}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] border ${
                          isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}>
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono font-bold">
                          <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                            {formatNumber(p.stockQuantity)} {p.unit}
                          </span>
                          {isLow && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              کسری
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-indigo-400">
                        {p.locationBin}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-gray-300">
                        {formatCurrency(p.unitSalePrice)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {canWrite && (
                          <button
                            onClick={() => {
                              setSelectedProductToAdjust(p);
                              setNewAdjustQty(p.stockQuantity);
                              setIsAdjustModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDark
                                ? 'bg-[#18181B] border-[#27272A] text-gray-300 hover:text-white hover:border-emerald-500'
                                : 'bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900'
                            }`}
                            title="اصلاح دستی موجودی (شمارش انبار)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: ORDERS READY FOR CUSTOMER DISPATCH */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'dispatch' && (
        <div
          className={`p-6 rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
          }`}
        >
          <div className="mb-4">
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              سفارشات تولیدشده آماده ارسال به مشتری
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              با زدن دکمه «ارسال و صدور بارنامه»، سفارش ترخیص شده و به سابقه خرید مشتری در داشبورد افزوده می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyToDispatchOrders.map((ord) => (
              <div
                key={ord.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-teal-400">{ord.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      تولید تکمیل شد (در انبار)
                    </span>
                  </div>

                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {ord.customerCompany || ord.customerName}
                  </div>

                  <div className="text-xs text-gray-400 space-y-1 pt-1 border-t border-gray-800">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>{it.productName}</span>
                        <span className="font-mono font-bold text-gray-300">{it.quantity} {it.unit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-gray-400">مبلغ فاکتور:</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(ord.totalAmount)}</span>
                  </div>
                </div>

                {canWrite && (
                  <button
                    onClick={() => {
                      setSelectedOrderToDispatch(ord);
                      setDispatchTrackingCode(`TRK-EXP-${Math.floor(100000 + Math.random() * 900000)}`);
                    }}
                    className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    ارسال به مشتری و صدور بارنامه
                  </button>
                )}
              </div>
            ))}

            {readyToDispatchOrders.length === 0 && (
              <div className={`col-span-full py-12 text-center text-xs text-gray-500 rounded-2xl border ${
                isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
              }`}>
                هیچ سفارش آماده ارسالی در حال حاضر در انبار نیست.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: INVENTORY LOGS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'logs' && (
        <div
          className={`p-6 rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <th className="py-3 px-3 font-semibold">نوع تراکنش</th>
                  <th className="py-3 px-3 font-semibold">نام کالا</th>
                  <th className="py-3 px-3 font-semibold">تعداد تغییر</th>
                  <th className="py-3 px-3 font-semibold">موجودی پس از تغییر</th>
                  <th className="py-3 px-3 font-semibold">دلیل / سند</th>
                  <th className="py-3 px-3 font-semibold">کاربر ثبت‌کننده</th>
                  <th className="py-3 px-3 font-semibold">تاریخ و زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {logs.map((log) => {
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
                          {log.transactionType === 'production_inflow'
                            ? 'ورود از خط تولید'
                            : log.transactionType === 'order_dispatch'
                            ? 'خروج ارسال سفارش'
                            : log.transactionType === 'purchase_inflow'
                            ? 'ورود خرید مواد اولیه'
                            : 'اصلاح انبارداری'}
                        </span>
                      </td>

                      <td className={`py-3 px-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {log.productName}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${formatNumber(log.quantityChange)}` : formatNumber(log.quantityChange)}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-gray-300">
                        {formatNumber(log.balanceAfter)}
                      </td>

                      <td className="py-3 px-3 text-gray-400">
                        {log.reason || log.referenceNumber}
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
      )}

      {/* MODAL: MANUAL STOCK ADJUST */}
      {isAdjustModalOpen && selectedProductToAdjust && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className={`rounded-2xl border max-w-md w-full p-6 space-y-4 ${
              isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                اصلاح دستی موجودی: {selectedProductToAdjust.name}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  موجودی جدید واقعی ({selectedProductToAdjust.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={newAdjustQty}
                  onChange={(e) => setNewAdjustQty(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">دلیل تغییر و شماره صورت‌جلسه</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className={`px-4 py-2 text-xs rounded-xl border cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                >
                  ثبت اصلاح موجودی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH ORDER TO CUSTOMER */}
      {selectedOrderToDispatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className={`rounded-2xl border max-w-md w-full p-6 space-y-4 ${
              isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-400" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  صدور بارنامه خروج برای: {selectedOrderToDispatch.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderToDispatch(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4">
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-gray-400">خریدار:</div>
                <div className="font-bold text-sm">{selectedOrderToDispatch.customerName}</div>
                {selectedOrderToDispatch.customerCompany && (
                  <div className="text-gray-400">{selectedOrderToDispatch.customerCompany}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">کد رهگیری پست / بارنامه</label>
                <input
                  type="text"
                  required
                  value={dispatchTrackingCode}
                  onChange={(e) => setDispatchTrackingCode(e.target.value)}
                  placeholder="مثال: TRK-EXP-849201"
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">توضیحات حمل و نام راننده/ناوگان</label>
                <input
                  type="text"
                  value={dispatchLogisticsNotes}
                  onChange={(e) => setDispatchLogisticsNotes(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrderToDispatch(null)}
                  className={`px-4 py-2 text-xs rounded-xl border cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-sm"
                >
                  تایید خروج و ثبت در سابقه مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
