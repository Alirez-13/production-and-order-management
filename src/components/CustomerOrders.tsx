import React, { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Factory,
  Truck,
  ClipboardList,
  FileText,
} from "lucide-react";

import {
  CustomerOrder,
  OrderItem,
  WarehouseProduct,
  AppUser,
  OrderPriority,
  ThemeMode,
} from "../types";

import { StorageService } from "../services/storageService";

import {
  formatCurrency,
  formatNumber,
  formatDateFa,
  getOrderStatusBadge,
  getPriorityBadge,
} from "../utils/formatters";

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
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  /* -------------------------------------------------
     State
  ------------------------------------------------- */

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<CustomerOrder | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [requiredDeliveryDate, setRequiredDeliveryDate] =
    useState("2026-08-25");

  const [orderPriority, setOrderPriority] = useState<OrderPriority>("medium");

  const [orderNotes, setOrderNotes] = useState("");

  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([
    {
      productId: products[0]?.id || "prod_1",
      productName: products[0]?.name || "محصول نمونه",
      sku: products[0]?.sku || "PRD-MTR-400",
      unit: products[0]?.unit || "عدد",
      quantity: 2,
      unitPrice: products[0]?.unitSalePrice || 12800000,
      totalPrice: (products[0]?.unitSalePrice || 12800000) * 2,
    },
  ]);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  /* -------------------------------------------------
     Permissions
  ------------------------------------------------- */

  const canWrite = StorageService.checkPermission(
    "orders",
    "write",
    currentUser,
  );

  const canRead = StorageService.checkPermission("orders", "read", currentUser);

  /* -------------------------------------------------
     Toast
  ------------------------------------------------- */

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  /* -------------------------------------------------
     KPI Data
  ------------------------------------------------- */

  const totalOrders = orders.length;

  const newOrders = orders.filter(
    (order) => order.status === "unprocessed",
  ).length;

  const productionOrders = orders.filter(
    (order) => order.status === "queued" || order.status === "in_production",
  ).length;

  const dispatchedOrders = orders.filter(
    (order) => order.status === "dispatched",
  ).length;

  /* -------------------------------------------------
     Filter Orders
  ------------------------------------------------- */

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      order.customerName.toLowerCase().includes(query) ||
      order.customerCompany.toLowerCase().includes(query) ||
      order.orderNumber.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" || order.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  /* -------------------------------------------------
     Order Items
  ------------------------------------------------- */

  const handleAddItemRow = () => {
    const firstProduct = products[0];

    if (!firstProduct) return;

    setSelectedItems([
      ...selectedItems,
      {
        productId: firstProduct.id,
        productName: firstProduct.name,
        sku: firstProduct.sku,
        unit: firstProduct.unit,
        quantity: 1,
        unitPrice: firstProduct.unitSalePrice,
        totalPrice: firstProduct.unitSalePrice,
      },
    ]);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof OrderItem,
    value: any,
  ) => {
    const updated = [...selectedItems];

    if (field === "productId") {
      const product = products.find((item) => item.id === value);

      if (product) {
        updated[index] = {
          ...updated[index],
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unit: product.unit,
          unitPrice: product.unitSalePrice,
          totalPrice: product.unitSalePrice * updated[index].quantity,
        };
      }
    }

    if (field === "quantity") {
      const quantity = Math.max(1, Number(value) || 1);

      updated[index] = {
        ...updated[index],
        quantity,
        totalPrice: updated[index].unitPrice * quantity,
      };
    }

    if (field === "unitPrice") {
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
    return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  /* -------------------------------------------------
     Create Order
  ------------------------------------------------- */

  const handleCreateOrder = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canWrite) {
      showToast("error", "مجوز ثبت سفارش جدید برای شما تعریف نشده است.");
      return;
    }

    if (!customerName.trim()) {
      showToast("error", "لطفاً نام مشتری را وارد نمایید.");
      return;
    }

    const result = StorageService.createCustomerOrder({
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

    if (result.success) {
      showToast("success", "سفارش جدید با موفقیت در دیتابیس SQLite ثبت شد.");

      setIsNewOrderModalOpen(false);

      setCustomerName("");
      setCustomerCompany("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
      setOrderNotes("");

      onRefreshData();
    } else {
      showToast("error", result.error || "خطا در ثبت سفارش");
    }
  };

  /* -------------------------------------------------
     Send To Production
  ------------------------------------------------- */

  const handleQuickSendToProduction = (order: CustomerOrder) => {
    if (!canWrite) {
      showToast("error", "شما مجوز ایجاد وظیفه تولید را ندارید.");
      return;
    }

    const lines = StorageService.getProductionLines();

    const defaultLine = lines[0]?.name || "خط مونتاژ عمومی الف";

    const result = StorageService.sendOrderToProduction(
      order.id,
      defaultLine,
      12,
      "اپراتور شیفت",
    );

    if (result.success) {
      showToast(
        "success",
        `سفارش ${order.orderNumber} به صف خط تولید منتقل شد.`,
      );

      onRefreshData();

      if (onNavigateTab) {
        onNavigateTab("production");
      }
    } else {
      showToast("error", result.error || "خطا در ارسال به خط تولید");
    }
  };

  /* -------------------------------------------------
     Render
  ------------------------------------------------- */

  return (
    <div className="space-y-5">
      {/*
          TOAST
         */}

      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-lg animate-fadeIn ${
            toast.type === "success"
              ? isDark
                ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
              : isDark
                ? "bg-rose-950/80 border-rose-800 text-rose-200"
                : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}

          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/*
          HEADER CARD
         */}

      <div
        className={`p-6 rounded-2xl border shadow-xs ${
          isDark
            ? "bg-[#111827] border-[#1F2937]"
            : "bg-white border-slate-200 shadow-slate-100"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>

            <div>
              <h1
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                مدیریت سفارش‌های مشتریان
              </h1>

              <p
                className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-slate-700 font-medium"
                }`}
              >
                ثبت سفارش جدید، پیگیری وضعیت تولید و ارسال
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}

            <div className="relative w-full sm:w-64">
              <Search
                className={`w-4 h-4 absolute right-3 top-2.5 ${
                  isDark ? "text-gray-500" : "text-slate-500"
                }`}
              />

              <input
                type="text"
                placeholder="جستجو در سفارشات یا مشتری..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className={`w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border outline-none font-medium ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937] text-white focus:border-blue-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600"
                }`}
              />
            </div>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border outline-none cursor-pointer ${
                isDark
                  ? "bg-[#18181B] border-[#1F2937] text-gray-200"
                  : "bg-slate-50 border-slate-300 text-slate-800"
              }`}
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="unprocessed">پردازش نشده</option>
              <option value="queued">در صف تولید</option>
              <option value="in_production">در حال تولید</option>
              <option value="produced">تولید شده</option>
              <option value="dispatched">ارسال‌شده</option>
            </select>

            {/* Priority */}

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border outline-none cursor-pointer ${
                isDark
                  ? "bg-[#18181B] border-[#1F2937] text-gray-200"
                  : "bg-slate-50 border-slate-300 text-slate-800"
              }`}
            >
              <option value="all">همه اولویت‌ها</option>
              <option value="low">عادی</option>
              <option value="medium">متوسط</option>
              <option value="high">بالا</option>
              <option value="urgent">فوری</option>
            </select>

            {canWrite && (
              <button
                onClick={() => setIsNewOrderModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                ثبت سفارش جدید
              </button>
            )}
          </div>
        </div>
      </div>

      {/*
          KPI CARDS
         */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}

        <div
          className={`p-5 rounded-2xl border shadow-xs ${
            isDark
              ? "bg-[#111827] border-[#1F2937]"
              : "bg-white border-slate-200 shadow-slate-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${
                isDark ? "text-gray-400" : "text-slate-800"
              }`}
            >
              کل سفارش‌ها
            </span>

            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>

          <div
            className={`text-sm font-bold font-mono mt-2 ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {formatNumber(totalOrders)}
            <span className="text-xs font-medium mr-1">سفارش</span>
          </div>

          <div className="text-xs text-blue-700 dark:text-blue-400 mt-2 font-bold">
            تمام سفارش‌های ثبت‌شده
          </div>
        </div>

        {/* New Orders */}

        <div
          onClick={() => setStatusFilter("unprocessed")}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            isDark
              ? "bg-[#111827] border-[#1F2937] hover:border-blue-500/40"
              : "bg-white border-slate-200 shadow-slate-100 hover:border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${
                isDark ? "text-gray-400" : "text-slate-800"
              }`}
            >
              سفارش‌های جدید
            </span>

            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div
            className={`text-sm font-bold font-mono mt-2 ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {formatNumber(newOrders)}
            <span className="text-xs font-medium mr-1">سفارش</span>
          </div>

          <div className="text-xs text-blue-800 dark:text-blue-400 mt-2 font-bold">
            نیازمند تخصیص خط تولید
          </div>
        </div>

        {/* Production */}

        <div
          onClick={() => {
            setStatusFilter("all");
            if (onNavigateTab) {
              onNavigateTab("production");
            }
          }}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            isDark
              ? "bg-[#111827] border-[#1F2937] hover:border-blue-500/40"
              : "bg-white border-slate-200 shadow-slate-100 hover:border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${
                isDark ? "text-gray-400" : "text-slate-800"
              }`}
            >
              سفارش‌های در تولید
            </span>

            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
          </div>

          <div
            className={`text-sm font-bold font-mono mt-2 ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {formatNumber(productionOrders)}
            <span className="text-xs font-medium mr-1">سفارش</span>
          </div>

          <div className="text-xs text-blue-800 dark:text-blue-400 mt-2 font-bold">
            در صف یا در حال ساخت
          </div>
        </div>

        {/* Dispatched */}

        <div
          onClick={() => setStatusFilter("dispatched")}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            isDark
              ? "bg-[#111827] border-[#1F2937] hover:border-blue-500/40"
              : "bg-white border-slate-200 shadow-slate-100 hover:border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${
                isDark ? "text-gray-400" : "text-slate-800"
              }`}
            >
              سفارش‌های ارسال‌شده
            </span>

            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <div
            className={`text-sm font-bold font-mono mt-2 ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {formatNumber(dispatchedOrders)}
            <span className="text-xs font-medium mr-1">سفارش</span>
          </div>

          <div className="text-xs text-blue-800 dark:text-blue-400 mt-2 font-bold">
            تحویل‌شده به مشتری
          </div>
        </div>
      </div>

      {/*
          ORDERS TABLE
         */}

      <div
        className={`p-6 rounded-2xl border shadow-xs ${
          isDark
            ? "bg-[#111827] border-[#1F2937]"
            : "bg-white border-slate-200 shadow-slate-100"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              className={`text-base font-bold ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              فهرست سفارش‌ها
            </h2>

            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-400" : "text-slate-700 font-medium"
              }`}
            >
              مدیریت و پیگیری چرخه سفارش مشتریان
            </p>
          </div>

          <span
            className={`text-xs font-bold ${
              isDark ? "text-gray-400" : "text-slate-600"
            }`}
          >
            {formatNumber(filteredOrders.length)} سفارش
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr
                className={`border-b ${
                  isDark
                    ? "border-[#1F2937] text-gray-400"
                    : "border-slate-200 text-slate-800 font-bold"
                }`}
              >
                <th className="py-3 px-3 font-bold">شماره سفارش</th>

                <th className="py-3 px-3 font-bold">مشتری / شرکت</th>

                <th className="py-3 px-3 font-bold">اقلام سفارش</th>

                <th className="py-3 px-3 font-bold">مبلغ کل</th>

                <th className="py-3 px-3 font-bold">اولویت</th>

                <th className="py-3 px-3 font-bold">وضعیت فرآیند</th>

                <th className="py-3 px-3 font-bold text-center">عملیات</th>
              </tr>
            </thead>

            <tbody
              className={`divide-y ${
                isDark ? "divide-gray-800/40" : "divide-slate-200"
              }`}
            >
              {filteredOrders.map((order) => {
                const statusBadge = getOrderStatusBadge(order.status);

                const priorityBadge = getPriorityBadge(order.priority);

                const isUnprocessed = order.status === "unprocessed";

                return (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      isDark ? "hover:bg-[#18181B]/80" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {order.orderNumber}
                    </td>

                    <td className="py-3 px-3">
                      <div
                        className={`font-bold ${
                          isDark ? "text-gray-200" : "text-slate-950"
                        }`}
                      >
                        {order.customerName}
                      </div>

                      {order.customerCompany && (
                        <div
                          className={`text-[11px] font-medium ${
                            isDark ? "text-gray-400" : "text-slate-600"
                          }`}
                        >
                          {order.customerCompany}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 text-[11px]"
                          >
                            <span
                              className={
                                isDark
                                  ? "text-gray-300"
                                  : "text-slate-900 font-medium"
                              }
                            >
                              {item.productName}
                            </span>

                            <span
                              className={`font-mono ${
                                isDark ? "text-gray-400" : "text-slate-600"
                              }`}
                            >
                              ({item.quantity} {item.unit})
                            </span>
                          </div>
                        ))}

                        {order.items.length > 3 && (
                          <span
                            className={`text-[10px] font-semibold ${
                              isDark ? "text-gray-400" : "text-slate-600"
                            }`}
                          >
                            + {order.items.length - 3} قلم دیگر
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isDark
                            ? `${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`
                            : order.priority === "urgent"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : order.priority === "high"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : order.priority === "medium"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {priorityBadge.label}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 w-fit ${
                          isDark
                            ? `${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`
                            : order.status === "unprocessed"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : order.status === "queued"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : order.status === "in_production"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : order.status === "produced"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : order.status === "dispatched"
                                      ? "bg-teal-50 text-teal-700 border-teal-200"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
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
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                            title="ارسال سریع به خط تولید"
                          >
                            <Send className="w-3 h-3" />
                            تولید
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isDark
                              ? "bg-[#18181B] border-[#1F2937] text-gray-300 hover:text-white hover:border-blue-500/40"
                              : "bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-950 hover:border-blue-500/40"
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
            <div className="text-center py-10 text-slate-500 text-xs">
              هیچ سفارشی با این شرایط جستجو یافت نشد.
            </div>
          )}
        </div>
      </div>

      {/*
          NEW ORDER MODAL
         */}

      {isNewOrderModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setIsNewOrderModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl border max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto ${
              isDark
                ? "bg-[#121214] border-[#27272A] text-gray-200"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? "border-[#1F2937]" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" />

                <h3
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-950"
                  }`}
                >
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
                  <label className="text-xs font-semibold">
                    نام و نام خانوادگی خریدار *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="مثال: مهندس رضوانی"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937] text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    نام شرکت / سازمان
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: فولاد خوزستان"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937] text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">شماره تماس</label>

                  <input
                    type="text"
                    placeholder="0912..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937] text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">اولویت انجام</label>

                  <select
                    value={orderPriority}
                    onChange={(e) =>
                      setOrderPriority(e.target.value as OrderPriority)
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937] text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="low">عادی</option>

                    <option value="medium">متوسط</option>

                    <option value="high">بالا</option>

                    <option value="urgent">فوری و اضطراری</option>
                  </select>
                </div>
              </div>

              {/* Items */}

              <div
                className={`space-y-2 pt-3 border-t ${
                  isDark ? "border-[#1F2937]" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    اقلام و محصولات سفارش:
                  </span>

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
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
                        isDark
                          ? "bg-[#18181B] border-[#1F2937]"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            handleUpdateItem(index, "productId", e.target.value)
                          }
                          className={`w-full p-1.5 rounded-lg border outline-none cursor-pointer ${
                            isDark
                              ? "bg-[#111827] border-[#1F2937] text-white"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        >
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(index, "quantity", e.target.value)
                          }
                          className={`w-full p-1.5 font-mono text-center rounded-lg border outline-none ${
                            isDark
                              ? "bg-[#111827] border-[#1F2937] text-white"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        />
                      </div>

                      <div className="col-span-4 text-left font-mono font-bold text-blue-700 dark:text-blue-400">
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
                  <span
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-slate-600"
                    }`}
                  >
                    جمع کل سفارش:
                  </span>

                  <span className="text-sm font-bold font-mono text-blue-700 dark:text-blue-400">
                    {formatCurrency(calculateOrderTotal())}
                  </span>
                </div>
              </div>

              {/* Buttons */}

              <div
                className={`flex items-center justify-end gap-3 pt-3 border-t ${
                  isDark ? "border-[#1F2937]" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className={`px-4 py-2 text-xs rounded-xl border cursor-pointer ${
                    isDark
                      ? "bg-[#18181B] border-[#1F2937] text-gray-300"
                      : "bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-sm"
                >
                  ثبت سفارش در سیستم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*
          ORDER DETAILS MODAL
         */}

      {selectedOrderDetails && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setSelectedOrderDetails(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl border max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
              isDark
                ? "bg-[#121214] border-[#27272A] text-gray-200"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? "border-[#1F2937]" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />

                <h3
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-950"
                  }`}
                >
                  جزئیات سفارش: {selectedOrderDetails.orderNumber}
                </h3>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span className="text-gray-400 block">مشتری:</span>

                <span className="font-bold text-sm">
                  {selectedOrderDetails.customerName}
                </span>

                {selectedOrderDetails.customerCompany && (
                  <span className="text-gray-400 block mt-0.5">
                    {selectedOrderDetails.customerCompany}
                  </span>
                )}
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span className="text-gray-400 block">وضعیت:</span>

                <span className="font-bold text-blue-400 text-sm">
                  {getOrderStatusBadge(selectedOrderDetails.status).label}
                </span>

                <span className="text-gray-400 block mt-0.5">
                  ثبت: {formatDateFa(selectedOrderDetails.orderDate)}
                </span>
              </div>
            </div>

            {/* Items */}

            <div>
              <h4 className="text-xs font-semibold mb-2">لیست کالاها:</h4>

              <div className="space-y-2">
                {selectedOrderDetails.items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937]"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div>
                      <span className="font-bold">{item.productName}</span>

                      <span className="text-gray-400 text-[11px] block font-mono">
                        SKU: {item.sku}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="font-mono font-bold">
                        {item.quantity} {item.unit}
                      </span>

                      <span className="text-blue-400 text-[11px] block font-mono">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`flex items-center justify-between pt-3 border-t ${
                isDark ? "border-[#1F2937]" : "border-slate-200"
              }`}
            >
              <span className="font-semibold">جمع کل مبلغ:</span>

              <span className="text-base font-bold font-mono text-blue-700 dark:text-blue-400">
                {formatCurrency(selectedOrderDetails.totalAmount)}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
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
