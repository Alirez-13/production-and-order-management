import React, { useState, useRef, useEffect } from "react";
import {
  Boxes,
  Search,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  History,
  Layers,
  Package,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  WarehouseProduct,
  CustomerOrder,
  InventoryLog,
  AppUser,
  ThemeMode,
} from "../types";
import { StorageService } from "../services/storageService";
import { formatCurrency, formatNumber, formatDateFa } from "../utils/formatters";

interface WarehouseManagementProps {
  products: WarehouseProduct[];
  orders: CustomerOrder[];
  logs: InventoryLog[];
  currentUser: AppUser;
  onRefreshData: () => void;
  onNavigateTab?: (tab: any) => void;
  theme?: ThemeMode;
}

type WarehouseSubTab = "inventory" | "dispatch" | "logs";

export const WarehouseManagement: React.FC<WarehouseManagementProps> = ({
  products,
  orders,
  logs,
  currentUser,
  onRefreshData,
  onNavigateTab,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  /* -------------------------------------------------
     State
  ------------------------------------------------- */

  const [activeSubTab, setActiveSubTab] = useState<WarehouseSubTab>("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductToAdjust, setSelectedProductToAdjust] =
    useState<WarehouseProduct | null>(null);
  const [newAdjustQty, setNewAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("شمارش ادواری انبار");

  const [selectedOrderToDispatch, setSelectedOrderToDispatch] =
    useState<CustomerOrder | null>(null);
  const [dispatchTrackingCode, setDispatchTrackingCode] = useState("");
  const [dispatchLogisticsNotes, setDispatchLogisticsNotes] = useState(
    "ارسال اکسپرس باربری",
  );

  /* -------------------------------------------------
     Toast (race-condition safe)
  ------------------------------------------------- */

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  /* -------------------------------------------------
     Permissions
  ------------------------------------------------- */

  const canWrite = StorageService.checkPermission(
    "warehouse",
    "write",
    currentUser,
  );
  const canRead = StorageService.checkPermission(
    "warehouse",
    "read",
    currentUser,
  );

  /* -------------------------------------------------
     Derived data (unchanged logic)
  ------------------------------------------------- */

  const readyToDispatchOrders = orders.filter((o) => o.status === "produced");
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.locationBin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stockQuantity * p.unitCost,
    0,
  );
  const totalStockUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const shortageCount = products.filter(
    (p) => p.stockQuantity <= p.minAlertThreshold,
  ).length;

  const getStockStatus = (p: WarehouseProduct) => {
    if (p.stockQuantity <= p.minAlertThreshold) {
      return {
        label: "کسری موجودی",
        bg: isDark ? "bg-rose-500/10" : "bg-rose-50",
        text: isDark ? "text-rose-400" : "text-rose-700",
        border: isDark ? "border-rose-500/20" : "border-rose-200",
      };
    }
    if (p.stockQuantity <= p.minAlertThreshold * 1.5) {
      return {
        label: "نزدیک به حداقل",
        bg: isDark ? "bg-amber-500/10" : "bg-amber-50",
        text: isDark ? "text-amber-400" : "text-amber-700",
        border: isDark ? "border-amber-500/20" : "border-amber-200",
      };
    }
    return {
      label: "موجودی کافی",
      bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
      text: isDark ? "text-emerald-400" : "text-emerald-700",
      border: isDark ? "border-emerald-500/20" : "border-emerald-200",
    };
  };

  /* -------------------------------------------------
     Handlers (unchanged logic)
  ------------------------------------------------- */

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductToAdjust) return;
    if (!canWrite) {
      showToast("error", "خطای دسترسی: شما مجوز ویرایش موجودی انبار را ندارید.");
      return;
    }

    const res = StorageService.adjustStockManually(
      selectedProductToAdjust.id,
      Number(newAdjustQty),
      adjustReason,
      currentUser.name,
    );

    if (res.success) {
      showToast(
        "success",
        `موجودی کالای ${selectedProductToAdjust.name} با موفقیت اصلاح شد.`,
      );
      setIsAdjustModalOpen(false);
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در اصلاح موجودی");
    }
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderToDispatch) return;
    if (!canWrite) {
      showToast("error", "شما مجوز صدور حواله خروج از انبار را ندارید.");
      return;
    }

    const tracking =
      dispatchTrackingCode.trim() ||
      `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    const res = StorageService.dispatchOrderFromWarehouse(
      selectedOrderToDispatch.id,
      tracking,
      dispatchLogisticsNotes,
      currentUser.name,
    );

    if (res.success) {
      showToast(
        "success",
        `سفارش ${selectedOrderToDispatch.orderNumber} با کد رهگیری ${tracking} با موفقیت ترخیص و به سابقه خروج پیوست.`,
      );
      setSelectedOrderToDispatch(null);
      setDispatchTrackingCode("");
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در ارسال سفارش");
    }
  };

  /* -------------------------------------------------
     Shared style tokens (matching Orders / Production)
  ------------------------------------------------- */

  const cardBase = isDark
    ? "bg-[#111827] border-[#1F2937]"
    : "bg-white border-slate-200 shadow-slate-100";

  const taskCardBase = isDark
    ? "bg-[#0B0F17] border-[#1F2937]"
    : "bg-white border-slate-200 shadow-xs";

  const inputBase = isDark
    ? "bg-[#18181B] border-[#1F2937] text-white"
    : "bg-slate-50 border-slate-300 text-slate-900";

  const tableHeadBase = isDark
    ? "border-[#1F2937] text-gray-400"
    : "border-slate-200 text-slate-800 font-bold";

  const subTabs: {
    key: WarehouseSubTab;
    label: string;
    icon: typeof Boxes;
    count: number;
  }[] = [
    { key: "inventory", label: "موجودی کالا و قفسه‌ها", icon: Boxes, count: products.length },
    { key: "dispatch", label: "سفارش‌های آماده ارسال به مشتری", icon: Truck, count: readyToDispatchOrders.length },
    { key: "logs", label: "تاریخچه ورود و خروج کالا", icon: History, count: logs.length },
  ];

  const EmptyState = ({
    icon: Icon,
    title,
    description,
  }: {
    icon: typeof Boxes;
    title: string;
    description: string;
  }) => (
    <div
      className={`col-span-full py-12 flex flex-col items-center justify-center gap-2 text-center rounded-2xl border ${cardBase}`}
    >
      <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
        {title}
      </h4>
      <p
        className={`text-xs max-w-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}
      >
        {description}
      </p>
    </div>
  );

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
          PAGE HEADER
         */}

      <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1
              className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-950"}`}
            >
              مدیریت انبار، موجودی و لجستیک خروج
            </h1>
            <p
              className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-700 font-medium"}`}
            >
              کنترل خودکار ورود تولیدات تکمیل‌شده، پایش قفسه‌ها و صدور بارنامه خروج برای مشتری
            </p>
          </div>
        </div>
      </div>

      {/*
          KPI CARDS
         */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBase}`}>
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-slate-800"}`}
            >
             تعداد کالاها
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-sm font-bold font-mono mt-2 ${isDark ? "text-white" : "text-slate-950"}`}
          >
            {formatNumber(products.length)}
            <span className="text-xs font-medium mr-1">قلم</span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-400 mt-2 font-bold">
            ارزش کل: {formatCurrency(totalInventoryValue)}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${cardBase}`}>
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-slate-800"}`}
            >
              موجودی کل
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-sm font-bold font-mono mt-2 ${isDark ? "text-white" : "text-slate-950"}`}
          >
            {formatNumber(totalStockUnits)}
            <span className="text-xs font-medium mr-1">واحد</span>
          </div>
          <div className="text-xs text-blue-800 dark:text-blue-400 mt-2 font-bold">
            مجموع موجودی همه قفسه‌ها
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab("inventory")}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            isDark
              ? "bg-[#111827] border-[#1F2937] hover:border-rose-500/40"
              : "bg-white border-slate-200 shadow-slate-100 hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-slate-800"}`}
            >
              کسری موجودی
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-sm font-bold font-mono mt-2 ${isDark ? "text-white" : "text-slate-950"}`}
          >
            {formatNumber(shortageCount)}
            <span className="text-xs font-medium mr-1">قلم کالا</span>
          </div>
          <div className="text-xs text-rose-700 dark:text-rose-400 mt-2 font-bold">
            زیر آستانه هشدار موجودی
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab("dispatch")}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            isDark
              ? "bg-[#111827] border-[#1F2937] hover:border-blue-500/40"
              : "bg-white border-slate-200 shadow-slate-100 hover:border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-slate-800"}`}
            >
              آماده ارسال
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-sm font-bold font-mono mt-2 ${isDark ? "text-white" : "text-slate-950"}`}
          >
            {formatNumber(readyToDispatchOrders.length)}
            <span className="text-xs font-medium mr-1">سفارش</span>
          </div>
          <div className="text-xs text-blue-800 dark:text-blue-400 mt-2 font-bold">
            منتظر صدور بارنامه خروج
          </div>
        </div>
      </div>

      {/*
          TABS (single accent color, orders-style)
         */}

      <div
        className={`flex items-center gap-2 flex-wrap border-b pb-3 ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}
      >
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              aria-current={isActive ? "true" : undefined}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : isDark
                    ? "text-gray-400 hover:text-white hover:bg-[#18181B]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>
                {tab.label} ({formatNumber(tab.count)})
              </span>
            </button>
          );
        })}
      </div>

      {/*
          TAB 1: INVENTORY (orders-style table, unit as its own column)
         */}

      {activeSubTab === "inventory" && (
        <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="relative w-full sm:w-72">
              <Search
                className={`w-4 h-4 absolute right-3 top-2.5 ${isDark ? "text-gray-500" : "text-slate-500"}`}
              />
              <input
                type="text"
                placeholder="جستجو در انبار، SKU، قفسه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border outline-none font-medium ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937] text-white focus:border-blue-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600"
                }`}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border outline-none cursor-pointer ${
                isDark
                  ? "bg-[#18181B] border-[#1F2937] text-gray-200"
                  : "bg-slate-50 border-slate-300 text-slate-800"
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

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${tableHeadBase}`}>
                  <th className="py-3 px-3 font-bold">کد SKU</th>
                  <th className="py-3 px-3 font-bold">نام کالا</th>
                  <th className="py-3 px-3 font-bold">واحد</th>
                  <th className="py-3 px-3 font-bold">دسته‌بندی</th>
                  <th className="py-3 px-3 font-bold">موجودی فعلی</th>
                  <th className="py-3 px-3 font-bold">آدرس قفسه / Bin</th>
                  <th className="py-3 px-3 font-bold">قیمت فروش</th>
                  <th className="py-3 px-3 font-bold">وضعیت</th>
                  <th className="py-3 px-3 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDark ? "divide-gray-800/40" : "divide-slate-200"}`}
              >
                {filteredProducts.map((p) => {
                  const status = getStockStatus(p);
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${isDark ? "hover:bg-[#18181B]/80" : "hover:bg-slate-50/80"}`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {p.sku}
                      </td>

                      <td
                        className={`py-3 px-3 font-bold ${isDark ? "text-gray-200" : "text-slate-950"}`}
                      >
                        {p.name}
                      </td>

                      <td
                        className={`py-3 px-3 ${isDark ? "text-gray-300" : "text-slate-700 font-medium"}`}
                      >
                        {p.unit}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] border ${
                            isDark
                              ? "bg-gray-800 border-gray-700 text-gray-300"
                              : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={isDark ? "text-gray-200" : "text-slate-900"}>
                          {formatNumber(p.stockQuantity)}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-3 font-mono text-[11px] ${isDark ? "text-blue-400" : "text-blue-700"}`}
                      >
                        {p.locationBin}
                      </td>

                      <td
                        className={`py-3 px-3 font-mono font-bold ${isDark ? "text-gray-300" : "text-slate-800"}`}
                      >
                        {formatCurrency(p.unitSalePrice)}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 w-fit ${status.bg} ${status.text} ${status.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {status.label}
                        </span>
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
                                ? "bg-[#18181B] border-[#1F2937] text-gray-300 hover:text-white hover:border-blue-500/40"
                                : "bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-950 hover:border-blue-500/40"
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

            {filteredProducts.length === 0 && (
              <div className="pt-4">
                <EmptyState
                  icon={Boxes}
                  title="کالایی یافت نشد"
                  description="هیچ کالایی با این جستجو یا دسته‌بندی در انبار ثبت نشده است."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/*
          TAB 2: DISPATCH (production-style cards)
         */}

      {activeSubTab === "dispatch" && (
        <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
          <div className="mb-4">
            <h3
              className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}
            >
              سفارشات تولیدشده آماده ارسال به مشتری
            </h3>
            <p
              className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-700 font-medium"}`}
            >
              با زدن دکمه «ارسال و صدور بارنامه»، سفارش ترخیص شده و به سابقه خرید مشتری افزوده می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyToDispatchOrders.map((ord) => (
              <div
                key={ord.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${taskCardBase}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">
                      {ord.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      تولید تکمیل شد (در انبار)
                    </span>
                  </div>

                  <h4
                    className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}
                  >
                    {ord.customerCompany || ord.customerName}
                  </h4>

                  <div
                    className={`space-y-1 pt-2 border-t ${isDark ? "border-[#1F2937] text-gray-400" : "border-slate-200 text-slate-600"}`}
                  >
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="truncate">{it.productName}</span>
                        <span
                          className={`font-mono font-bold ${isDark ? "text-gray-300" : "text-slate-800"}`}
                        >
                          {it.quantity} {it.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`flex justify-between text-xs pt-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}
                  >
                    <span>مبلغ فاکتور:</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(ord.totalAmount)}
                    </span>
                  </div>
                </div>

                {canWrite && (
                  <button
                    onClick={() => {
                      setSelectedOrderToDispatch(ord);
                      setDispatchTrackingCode(
                        `TRK-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
                      );
                    }}
                    className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    ارسال به مشتری و صدور بارنامه
                  </button>
                )}
              </div>
            ))}

            {readyToDispatchOrders.length === 0 && (
              <EmptyState
                icon={Truck}
                title="سفارشی برای ارسال وجود ندارد"
                description="در حال حاضر هیچ سفارش تولیدشده‌ای منتظر خروج از انبار نیست."
              />
            )}
          </div>
        </div>
      )}

      {/*
          TAB 3: LOGS (orders-style table)
         */}

      {activeSubTab === "logs" && (
        <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${tableHeadBase}`}>
                  <th className="py-3 px-3 font-bold">نوع تراکنش</th>
                  <th className="py-3 px-3 font-bold">نام کالا</th>
                  <th className="py-3 px-3 font-bold">تعداد تغییر</th>
                  <th className="py-3 px-3 font-bold">موجودی پس از تغییر</th>
                  <th className="py-3 px-3 font-bold">دلیل / سند</th>
                  <th className="py-3 px-3 font-bold">کاربر ثبت‌کننده</th>
                  <th className="py-3 px-3 font-bold">تاریخ و زمان</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDark ? "divide-gray-800/40" : "divide-slate-200"}`}
              >
                {logs.map((log) => {
                  const isPositive = log.quantityChange > 0;
                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${isDark ? "hover:bg-[#18181B]/80" : "hover:bg-slate-50/80"}`}
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPositive
                              ? isDark
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isDark
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {log.transactionType === "production_inflow"
                            ? "ورود از خط تولید"
                            : log.transactionType === "order_dispatch"
                              ? "خروج ارسال سفارش"
                              : log.transactionType === "purchase_inflow"
                                ? "ورود خرید مواد اولیه"
                                : "اصلاح انبارداری"}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-3 font-bold ${isDark ? "text-gray-200" : "text-slate-950"}`}
                      >
                        {log.productName}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isPositive
                            ? `+${formatNumber(log.quantityChange)}`
                            : formatNumber(log.quantityChange)}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-3 font-mono font-bold ${isDark ? "text-gray-300" : "text-slate-800"}`}
                      >
                        {formatNumber(log.balanceAfter)}
                      </td>

                      <td
                        className={`py-3 px-3 ${isDark ? "text-gray-400" : "text-slate-600"}`}
                      >
                        {log.reason || log.referenceNumber}
                      </td>

                      <td
                        className={`py-3 px-3 ${isDark ? "text-gray-400" : "text-slate-600"}`}
                      >
                        {log.performedBy}
                      </td>

                      <td
                        className={`py-3 px-3 font-mono text-[11px] ${isDark ? "text-gray-400" : "text-slate-600"}`}
                      >
                        {formatDateFa(log.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="pt-4">
                <EmptyState
                  icon={History}
                  title="هنوز تراکنشی ثبت نشده"
                  description="تاریخچه ورود و خروج کالا پس از اولین تراکنش انبار، اینجا نمایش داده می‌شود."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/*
          MODAL: MANUAL STOCK ADJUST
         */}

      {isAdjustModalOpen && selectedProductToAdjust && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setIsAdjustModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl border max-w-md w-full p-6 space-y-4 ${
              isDark
                ? "bg-[#121214] border-[#27272A] text-gray-200"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}
            >
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}
                >
                  اصلاح دستی موجودی: {selectedProductToAdjust.name}
                </h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${isDark ? "bg-[#18181B] border-[#1F2937]" : "bg-slate-50 border-slate-200"}`}
            >
              <div className={isDark ? "text-gray-400" : "text-slate-600"}>
                موجودی فعلی ثبت‌شده:
              </div>
              <div className="font-bold text-sm font-mono">
                {formatNumber(selectedProductToAdjust.stockQuantity)}{" "}
                {selectedProductToAdjust.unit}
              </div>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  موجودی جدید واقعی ({selectedProductToAdjust.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={newAdjustQty}
                  onChange={(e) => setNewAdjustQty(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  دلیل تغییر و شماره صورت‌جلسه
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div
                className={`flex items-center justify-end gap-3 pt-3 border-t ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}
              >
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
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
                  ثبت اصلاح موجودی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*
          MODAL: DISPATCH ORDER TO CUSTOMER
         */}

      {selectedOrderToDispatch && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setSelectedOrderToDispatch(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl border max-w-md w-full p-6 space-y-4 ${
              isDark
                ? "bg-[#121214] border-[#27272A] text-gray-200"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <h3
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}
                >
                  صدور بارنامه خروج
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderToDispatch(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Order summary */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-2 ${isDark ? "bg-[#18181B] border-[#1F2937]" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono font-bold text-blue-700 dark:text-blue-400">
                  <FileText className="w-3.5 h-3.5" />
                  {selectedOrderToDispatch.orderNumber}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  آماده ارسال
                </span>
              </div>

              <div
                className={`flex items-center justify-between pt-2 border-t ${isDark ? "border-[#27272A]" : "border-slate-200"}`}
              >
                <span className={isDark ? "text-gray-400" : "text-slate-600"}>
                  خریدار:
                </span>
                <span className="font-bold">
                  {selectedOrderToDispatch.customerCompany ||
                    selectedOrderToDispatch.customerName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-400" : "text-slate-600"}>
                  اقلام سفارش:
                </span>
                <span className="font-bold font-mono">
                  {selectedOrderToDispatch.items.length} قلم
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-400" : "text-slate-600"}>
                  مبلغ فاکتور:
                </span>
                <span className="font-bold font-mono text-blue-700 dark:text-blue-400">
                  {formatCurrency(selectedOrderToDispatch.totalAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  کد رهگیری پست / بارنامه
                </label>
                <input
                  type="text"
                  required
                  value={dispatchTrackingCode}
                  onChange={(e) => setDispatchTrackingCode(e.target.value)}
                  placeholder="مثال: TRK-EXP-849201"
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  توضیحات حمل و نام راننده/ناوگان
                </label>
                <input
                  type="text"
                  value={dispatchLogisticsNotes}
                  onChange={(e) => setDispatchLogisticsNotes(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div
                className={`flex items-center justify-end gap-3 pt-3 border-t ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedOrderToDispatch(null)}
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
