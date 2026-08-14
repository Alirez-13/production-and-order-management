import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Send, 
  Eye, 
  Calendar, 
  Building, 
  Phone, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  CheckCircle2,
  Boxes,
  Truck,
  AlertCircle
} from 'lucide-react';
import { 
  CustomerOrder, 
  OrderItem, 
  WarehouseProduct, 
  AppUser, 
  OrderPriority, 
  OrderStatus,
  ThemeMode 
} from '../types';
import { StorageService } from '../services/storageService';
import { formatCurrency, formatNumber, formatDateFa, getOrderStatusBadge, getPriorityBadge } from '../utils/formatters';

interface CustomerOrdersProps {
  orders: CustomerOrder[];
  products: WarehouseProduct[];
  currentUser: AppUser;
  onRefreshData: () => void;
  onNavigateTab?: (tab: any) => void;
  theme?: ThemeMode;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({
  orders,
  products,
  currentUser,
  onRefreshData,
  onNavigateTab,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<CustomerOrder | null>(null);

  // New Order Form State
  const [customerName, setCustomerName] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState('2026-08-25');
  const [orderPriority, setOrderPriority] = useState<OrderPriority>('medium');
  const [orderNotes, setOrderNotes] = useState('');

  // Items in new order
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([
    {
      productId: products[0]?.id || 'prod_1',
      productName: products[0]?.name || 'محصول نمونه',
      sku: products[0]?.sku || 'PRD-MTR-400',
      unit: products[0]?.unit || 'عدد',
      quantity: 2,
      unitPrice: products[0]?.unitSalePrice || 12800000,
      totalPrice: (products[0]?.unitSalePrice || 12800000) * 2,
    },
  ]);

  // Toast / feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Permissions Check
  const canWrite = StorageService.checkPermission('orders', 'write', currentUser);
  const canRead = StorageService.checkPermission('orders', 'read', currentUser);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || o.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddItemRow = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setSelectedItems([
      ...selectedItems,
      {
        productId: firstProd.id,
        productName: firstProd.name,
        sku: firstProd.sku,
        unit: firstProd.unit,
        quantity: 1,
        unitPrice: firstProd.unitSalePrice,
        totalPrice: firstProd.unitSalePrice,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...selectedItems];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index] = {
          ...updated[index],
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          unitPrice: prod.unitSalePrice,
          totalPrice: prod.unitSalePrice * updated[index].quantity,
        };
      }
    } else if (field === 'quantity') {
      const qty = Math.max(1, Number(value) || 1);
      updated[index] = {
        ...updated[index],
        quantity: qty,
        totalPrice: updated[index].unitPrice * qty,
      };
    } else if (field === 'unitPrice') {
      const price = Math.max(0, Number(value) || 0);
      updated[index] = {
        ...updated[index],
        unitPrice: price,
        totalPrice: price * updated[index].quantity,
      };
    }
    setSelectedItems(updated);
  };

  const handleRemoveItemRow = (index: number) => {
    if (selectedItems.length === 1) return;
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateOrderTotal = () => {
    return selectedItems.reduce((sum, it) => sum + it.totalPrice, 0);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      showToast('error', 'مجوز ثبت سفارش جدید برای شما تعریف نشده است.');
      return;
    }

    if (!customerName.trim()) {
      showToast('error', 'لطفاً نام مشتری را وارد نمایید.');
      return;
    }

    const res = StorageService.createCustomerOrder({
      customerName,
      customerCompany,
      customerPhone,
      customerEmail,
      customerAddress,
      items: selectedItems,
      totalAmount: calculateOrderTotal(),
      priority: orderPriority,
      requiredDeliveryDate,
      notes: orderNotes,
      createdBy: currentUser.name,
    });

    if (res.success) {
      showToast('success', `سفارش جدید با موفقیت در دیتابیس SQLite ثبت شد.`);
      setIsNewOrderModalOpen(false);
      // Reset form
      setCustomerName('');
      setCustomerCompany('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setOrderNotes('');
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در ثبت سفارش');
    }
  };

  // 1-Click Send to Production
  const handleQuickSendToProduction = (order: CustomerOrder) => {
    if (!canWrite) {
      showToast('error', 'شما مجوز ایجاد وظیفه تولید را ندارید.');
      return;
    }

    const lines = StorageService.getProductionLines();
    const defaultLine = lines[0]?.name || 'خط مونتاژ عمومی الف';

    const res = StorageService.sendOrderToProduction(
      order.id,
      defaultLine,
      12,
      'اپراتور شیفت'
    );

    if (res.success) {
      showToast('success', `سفارش ${order.orderNumber} به صف خط تولید منتقل شد.`);
      onRefreshData();
      if (onNavigateTab) {
        onNavigateTab('production');
      }
    } else {
      showToast('error', res.error || 'خطا در ارسال به خط تولید');
    }
  };

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

      {/* Top Controls Header */}
      <div
        className={`p-6 rounded-2xl border shadow-sm ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                مدیریت سفارش‌های مشتریان
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ثبت سفارش جدید، پیگیری وضعیت‌های تولید و ارسال با پایگاه داده SQLite
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="جستجو در سفارشات یا مشتری..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border outline-none ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                }`}
              />
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#18181B] border-[#27272A] text-gray-200'
                  : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="unprocessed">پردازش نشده (جدید)</option>
              <option value="queued">در صف تولید</option>
              <option value="in_production">در حال تولید</option>
              <option value="produced">تولید شده (در انبار)</option>
              <option value="dispatched">ارسال‌شده به مشتری</option>
            </select>

            {canWrite && (
              <button
                onClick={() => setIsNewOrderModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-gray-950 shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت سفارش جدید</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div
        className={`p-6 rounded-2xl border shadow-sm ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                <th className="py-3 px-3 font-semibold">شماره سفارش</th>
                <th className="py-3 px-3 font-semibold">مشتری / شرکت</th>
                <th className="py-3 px-3 font-semibold">اقلام سفارش</th>
                <th className="py-3 px-3 font-semibold">مبلغ کل</th>
                <th className="py-3 px-3 font-semibold">اولویت</th>
                <th className="py-3 px-3 font-semibold">وضعیت فرآیند</th>
                <th className="py-3 px-3 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {filteredOrders.map((order) => {
                const statusBadge = getOrderStatusBadge(order.status);
                const priorityBadge = getPriorityBadge(order.priority);
                const isUnprocessed = order.status === 'unprocessed';

                return (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-[#18181B]/80' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-teal-400">
                      {order.orderNumber}
                    </td>

                    <td className="py-3 px-3">
                      <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {order.customerName}
                      </div>
                      {order.customerCompany && (
                        <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {order.customerCompany}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] flex items-center gap-1">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{it.productName}</span>
                            <span className="text-gray-400 font-mono">({it.quantity} {it.unit})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}
                      >
                        {priorityBadge.label}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 w-fit ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {statusBadge.label}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isUnprocessed && canWrite && (
                          <button
                            onClick={() => handleQuickSendToProduction(order)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-gray-950 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                            title="ارسال سریع به خط تولید"
                          >
                            <Send className="w-3 h-3" />
                            <span>تولید</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-[#18181B] border-[#27272A] text-gray-300 hover:text-white hover:border-teal-500'
                              : 'bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900'
                          }`}
                          title="مشاهده جزئیات کامل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-xs">
              هیچ سفارشی با این شرایط جستجو یافت نشد.
            </div>
          )}
        </div>
      </div>

      {/* NEW ORDER MODAL */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className={`rounded-2xl border max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto ${
              isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ثبت سفارش مشتری جدید
                </h3>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">نام و نام خانوادگی خریدار *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مهندس رضوانی"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">نام شرکت / سازمان</label>
                  <input
                    type="text"
                    placeholder="مثال: فولاد خوزستان"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">شماره تماس</label>
                  <input
                    type="text"
                    placeholder="0912..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">اولویت انجام</label>
                  <select
                    value={orderPriority}
                    onChange={(e: any) => setOrderPriority(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="low">عادی (پایین)</option>
                    <option value="medium">متوسط</option>
                    <option value="high">بالا</option>
                    <option value="urgent">فوری و اضطراری</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">اقلام و محصولات سفارشی:</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن سطر کالا
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border grid grid-cols-12 gap-2 items-center text-xs ${
                        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                          className={`w-full p-1.5 rounded-lg border outline-none cursor-pointer ${
                            isDark ? 'bg-[#121214] border-[#27272A] text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                          className={`w-full p-1.5 font-mono text-center rounded-lg border outline-none ${
                            isDark ? 'bg-[#121214] border-[#27272A] text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div className="col-span-4 text-left font-mono font-bold text-emerald-400">
                        {formatCurrency(item.totalPrice)}
                      </div>

                      <div className="col-span-1 text-center">
                        {selectedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-400">جمع کل سفارش:</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {formatCurrency(calculateOrderTotal())}
                  </span>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className={`px-4 py-2 text-xs rounded-xl border cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 cursor-pointer shadow-sm"
                >
                  ثبت سفارش در سیستم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className={`rounded-2xl border max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                جزئیات سفارش: {selectedOrderDetails.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-gray-400 block">مشتری:</span>
                  <span className="font-bold text-sm">{selectedOrderDetails.customerName}</span>
                  {selectedOrderDetails.customerCompany && (
                    <span className="text-gray-400 block mt-0.5">{selectedOrderDetails.customerCompany}</span>
                  )}
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-gray-400 block">وضعیت:</span>
                  <span className="font-bold text-teal-400 text-sm">{getOrderStatusBadge(selectedOrderDetails.status).label}</span>
                  <span className="text-gray-400 block mt-0.5">
                    ثبت: {formatDateFa(selectedOrderDetails.orderDate)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">لیست کالاها:</h4>
                <div className="space-y-2">
                  {selectedOrderDetails.items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <span className="font-bold">{it.productName}</span>
                        <span className="text-gray-400 text-[11px] block font-mono">SKU: {it.sku}</span>
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
                <span className="font-semibold">جمع کل مبلغ:</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedOrderDetails.totalAmount)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
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
