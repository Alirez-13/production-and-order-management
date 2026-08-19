import React, { useState, useRef, useEffect } from "react";
import {
  WarehouseProduct,
  ProductCategory,
  ProductionLine,
  AppUser,
  ProductSnapshot,
} from "../types";
import { StorageService } from "../services/storageService";
import { formatCurrency, formatPersianNumber, formatDateFa } from "../utils/formatters";
import { ProductSnapshotsHistoryModal } from "./ProductSnapshotsHistoryModal";
import { ProductSnapshotModal } from "./ProductSnapshotModal";
import {
  Package,
  Plus,
  Search,
  Factory,
  Tag,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Boxes,
  History,
  Archive,
  RotateCcw,
  Camera,
} from "lucide-react";

interface ProductCatalogProps {
  products: WarehouseProduct[];
  categories: ProductCategory[];
  productionLines: ProductionLine[];
  currentUser: AppUser;
  onRefreshData: () => void;
  onNavigateTab?: (tab: any) => void;
  theme?: "dark" | "light";
}

type CatalogSubTab = "list" | "add_product" | "categories" | "lines";

export function ProductCatalog({
  products,
  categories,
  productionLines,
  currentUser,
  onRefreshData,
  onNavigateTab,
  theme = "dark",
}: ProductCatalogProps) {
  const isDark = theme === "dark";

  // Permission: currentUser must be passed through so the real role is evaluated
  const canWrite =
    StorageService.checkPermission("products", "write", currentUser) ||
    StorageService.checkPermission("warehouse", "write", currentUser);

  /* -------------------------------------------------
     State
  ------------------------------------------------- */

  const [activeSubTab, setActiveSubTab] = useState<CatalogSubTab>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "discontinued">("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [isAllSnapshotsModalOpen, setIsAllSnapshotsModalOpen] = useState(false);
  const [selectedProductForSnapshots, setSelectedProductForSnapshots] =
    useState<WarehouseProduct | null>(null);
  const [selectedSingleSnapshot, setSelectedSingleSnapshot] = useState<ProductSnapshot | null>(null);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    categoryId: "",
    category: "",
    productionLineId: "",
    productionLineName: "",
    unit: "عدد",
    stockQuantity: 0,
    minAlertThreshold: 10,
    locationBin: "",
    unitCost: 0,
    unitSalePrice: 0,
    description: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: "#3B82F6",
    description: "",
  });

  const [lineForm, setLineForm] = useState({
    name: "",
    code: "",
    department: "سالن اصلی",
    capacityPerDay: 20,
    description: "",
    status: "active" as const,
  });

  /* -------------------------------------------------
     Toast (race-condition safe)
  ------------------------------------------------- */

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setNotification({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  /* -------------------------------------------------
     Form helpers (unchanged logic, numeric coercion added on edit)
  ------------------------------------------------- */

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      sku: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      categoryId: categories[0]?.id || "",
      category: categories[0]?.name || "موتورهای الکتریکی",
      productionLineId: productionLines[0]?.id || "",
      productionLineName: productionLines[0]?.name || "خط اصلی",
      unit: "عدد",
      stockQuantity: 0,
      minAlertThreshold: 10,
      locationBin: "انبار A",
      unitCost: 0,
      unitSalePrice: 0,
      description: "",
    });
  };

  const handleOpenAddProduct = () => {
    resetProductForm();
    setActiveSubTab("add_product");
  };

  const handleOpenEditProduct = (prod: WarehouseProduct) => {
    setEditingProductId(prod.id);
    setProductForm({
      sku: prod.sku,
      name: prod.name,
      categoryId: prod.categoryId || categories.find((c) => c.name === prod.category)?.id || "",
      category: prod.category,
      productionLineId: prod.productionLineId || "",
      productionLineName: prod.productionLineName || "",
      unit: prod.unit || "عدد",
      // Coerced to Number: guards against legacy records stored as strings
      stockQuantity: Number(prod.stockQuantity) || 0,
      minAlertThreshold: Number(prod.minAlertThreshold) || 10,
      locationBin: prod.locationBin || "",
      unitCost: Number(prod.unitCost) || 0,
      unitSalePrice: Number(prod.unitSalePrice) || 0,
      description: prod.description || "",
    });
    setActiveSubTab("add_product");
  };

  /* -------------------------------------------------
     Handlers (unchanged business logic)
  ------------------------------------------------- */

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.sku.trim()) {
      showToast("error", "لطفاً نام محصول و کد کالا (SKU) را وارد نمایید.");
      return;
    }

    const matchedCat = categories.find((c) => c.id === productForm.categoryId);
    const matchedLine = productionLines.find((l) => l.id === productForm.productionLineId);

    const payload = {
      ...productForm,
      category: matchedCat ? matchedCat.name : productForm.category || "عمومی",
      categoryId: productForm.categoryId,
      productionLineId: productForm.productionLineId,
      productionLineName: matchedLine ? matchedLine.name : productForm.productionLineName || "",
      stockQuantity: Number(productForm.stockQuantity) || 0,
      minAlertThreshold: Number(productForm.minAlertThreshold) || 10,
      unitCost: Number(productForm.unitCost) || 0,
      unitSalePrice: Number(productForm.unitSalePrice) || 0,
    };

    if (editingProductId) {
      const res = StorageService.updateProduct(editingProductId, payload);
      if (res.success) {
        showToast("success", `محصول «${payload.name}» با موفقیت به‌روزرسانی شد.`);
        onRefreshData();
        setActiveSubTab("list");
      } else {
        showToast("error", res.error || "خطا در ویرایش محصول");
      }
    } else {
      const res = StorageService.addProduct(payload);
      if (res.success) {
        showToast("success", `محصول جدید «${payload.name}» به خط تولید و انبار اضافه شد.`);
        onRefreshData();
        setActiveSubTab("list");
      } else {
        showToast("error", res.error || "خطا در ثبت محصول");
      }
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!confirm(`آیا از حذف محصول «${name}» اطمینان دارید؟`)) return;
    const res = StorageService.deleteProduct(id);
    if (res.success) {
      showToast("success", `محصول «${name}» حذف شد.`);
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در حذف");
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast("error", "لطفاً نام دسته‌بندی را وارد کنید.");
      return;
    }
    const res = StorageService.createCategory(categoryForm);
    if (res.success) {
      showToast("success", `دسته‌بندی «${categoryForm.name}» با موفقیت افزوده شد.`);
      setCategoryForm({ name: "", color: "#3B82F6", description: "" });
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در افزودن دسته‌بندی");
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (!confirm(`آیا از حذف دسته‌بندی «${name}» اطمینان دارید؟`)) return;
    const res = StorageService.deleteCategory(id);
    if (res.success) {
      showToast("success", `دسته‌بندی «${name}» حذف شد.`);
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در حذف دسته‌بندی");
    }
  };

  const handleSaveLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineForm.name.trim()) {
      showToast("error", "لطفاً نام خط تولید را وارد کنید.");
      return;
    }
    const code = lineForm.code.trim() || `LINE-${Math.floor(100 + Math.random() * 900)}`;
    const res = StorageService.createProductionLine({ ...lineForm, code });
    if (res.success) {
      showToast("success", `خط تولید «${lineForm.name}» با موفقیت ایجاد شد.`);
      setLineForm({
        name: "",
        code: "",
        department: "سالن اصلی",
        capacityPerDay: 20,
        description: "",
        status: "active",
      });
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در تعریف خط تولید");
    }
  };

  const handleDeleteLine = (id: string, name: string) => {
    if (!confirm(`آیا از حذف خط تولید «${name}» اطمینان دارید؟`)) return;
    const res = StorageService.deleteProductionLine(id);
    if (res.success) {
      showToast("success", `خط تولید «${name}» حذف شد.`);
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در حذف خط تولید");
    }
  };

  const handleDiscontinueProduct = (prod: WarehouseProduct) => {
    const reason = prompt(
      `دلیل توقف تولید و بایگانی محصول «${prod.name}» را وارد نمایید:`,
      "تغییر سبد محصول و پایان چرخه عمر کالا",
    );
    if (reason === null) return;
    const res = StorageService.discontinueProduct(prod.id, reason || "توقف خط تولید", currentUser.name);
    if (res.success) {
      showToast(
        "success",
        `تولید محصول «${prod.name}» متوقف شد و اسنپ‌شات نهایی در تاریخچه بایگاری گردید.`,
      );
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در توقف تولید");
    }
  };

  const handleReactivateProduct = (prod: WarehouseProduct) => {
    if (!confirm(`آیا می‌خواهید محصول «${prod.name}» را مجدداً به چرخه تولید فعال بازگردانید؟`)) return;
    const res = StorageService.reactivateProduct(prod.id, currentUser.name);
    if (res.success) {
      showToast("success", `محصول «${prod.name}» با موفقیت فعال و به خط تولید بازگردانده شد.`);
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در فعال‌سازی مجدد");
    }
  };

  /* -------------------------------------------------
     Derived data (unchanged logic)
  ------------------------------------------------- */

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.locationBin && p.locationBin.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q));

    const targetCat = categories.find(
      (c) => c.id === selectedCategoryFilter || c.name === selectedCategoryFilter,
    );
    const matchesCategory =
      selectedCategoryFilter === "all" ||
      p.categoryId === selectedCategoryFilter ||
      p.category === selectedCategoryFilter ||
      (targetCat && (p.category === targetCat.name || p.categoryId === targetCat.id));

    const targetLine = productionLines.find(
      (l) => l.id === selectedLineFilter || l.name === selectedLineFilter || l.code === selectedLineFilter,
    );
    const matchesLine =
      selectedLineFilter === "all" ||
      p.productionLineId === selectedLineFilter ||
      p.productionLineName === selectedLineFilter ||
      (targetLine &&
        (p.productionLineName === targetLine.name ||
          p.productionLineId === targetLine.id ||
          p.productionLineName === targetLine.code));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (!p.status || p.status === "active")) ||
      (statusFilter === "discontinued" && (p.status === "discontinued" || p.status === "archived"));

    const matchesLowStock = !showLowStockOnly || p.stockQuantity <= p.minAlertThreshold;

    return matchesSearch && matchesCategory && matchesLine && matchesStatus && matchesLowStock;
  });

  const getProductCountForCategory = (catName: string, catId?: string) => {
    return products.filter(
      (p) => (catId && p.categoryId === catId) || p.category === catName || (catId && p.category === catName),
    ).length;
  };

  const getProductCountForLine = (lineId: string, lineName: string) => {
    return products.filter(
      (p) => p.productionLineId === lineId || p.productionLineName === lineName || (lineId && p.productionLineName === lineName),
    ).length;
  };

  const activeProductsCount = products.filter((p) => !p.status || p.status === "active").length;
  const discontinuedProductsCount = products.filter(
    (p) => p.status === "discontinued" || p.status === "archived",
  ).length;
  const shortageProductsCount = products.filter((p) => p.stockQuantity <= p.minAlertThreshold).length;

  /* -------------------------------------------------
     Shared style tokens (matching Orders / Production / Warehouse)
  ------------------------------------------------- */

  const cardBase = isDark
    ? "bg-[#111827] border-[#1F2937]"
    : "bg-white border-slate-200 shadow-slate-100";

  const taskCardBase = isDark
    ? "bg-[#0B0F17] border-[#1F2937]"
    : "bg-white border-slate-200 shadow-xs";

  const inputBase = isDark
    ? "bg-[#18181B] border-[#1F2937] text-white focus:border-blue-500"
    : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600";

  const labelBase = `text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-700"}`;

  const borderBase = isDark ? "border-[#1F2937]" : "border-slate-200";

  const subTabs: { key: CatalogSubTab; label: string; icon: typeof Package; count: number | null }[] = [
    { key: "list", label: "فهرست کالاها", icon: Package, count: products.length },
    ...(canWrite
      ? ([
          {
            key: "add_product" as CatalogSubTab,
            label: editingProductId ? "ویرایش کالا" : "افزودن محصول جدید",
            icon: Plus,
            count: null,
          },
        ])
      : []),
    { key: "categories", label: "دسته‌بندی‌ها", icon: Tag, count: categories.length },
    { key: "lines", label: "خطوط تولید", icon: Factory, count: productionLines.length },
  ];

  const EmptyState = ({
    icon: Icon,
    title,
    description,
  }: {
    icon: typeof Package;
    title: string;
    description: string;
  }) => (
    <div className={`col-span-full p-12 text-center rounded-2xl border ${cardBase}`}>
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}>{title}</h3>
      <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>{description}</p>
    </div>
  );

  /* -------------------------------------------------
     Render
  ------------------------------------------------- */

  return (
    <div className="space-y-5">
      {/* =================================================
          TOAST */}

      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-lg animate-fadeIn ${
            notification.type === "success"
              ? isDark
                ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
              : isDark
                ? "bg-rose-950/80 border-rose-800 text-rose-200"
                : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* =================================================
          PAGE HEADER */}

      <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
              مدیریت کاتالوگ و تعریف محصولات
            </h1>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-700 font-medium"}`}>
              تعریف کالاهای اختصاصی، اختصاص به خطوط تولید و دسته‌بندی‌های دلخواه
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          KPI CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBase}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-slate-800"}`}>
              کل محصولات ثبت‌شده
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-sm font-bold font-mono mt-2 ${isDark ? "text-white" : "text-slate-950"}`}>
            {formatPersianNumber(products.length)}
            <span className="text-xs font-medium mr-1">قلم کالا</span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-400 mt-2 font-bold">
            کل کاتالوگ تعریف‌شده
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${cardBase}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-slate-800"}`}>
              در حال تولید (فعال)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-sm font-bold font-mono mt-2 ${isDark ? "text-white" : "text-slate-950"}`}>
            {formatPersianNumber(activeProductsCount)}
            <span className="text-xs font-medium mr-1">قلم کالا</span>
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-2 font-bold">
            در چرخهٔ فعال تولید
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("discontinued");
            setActiveSubTab("list");
          }}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            isDark
              ? "bg-[#111827] border-[#1F2937] hover:border-slate-500/40"
              : "bg-white border-slate-200 shadow-slate-100 hover:border-slate-400/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-slate-800"}`}>
              متوقف‌شده (بایگانی)
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? "bg-gray-500/15 text-gray-400" : "bg-slate-200 text-slate-600"
              }`}
            >
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-sm font-bold font-mono mt-2 ${isDark ? "text-white" : "text-slate-950"}`}>
            {formatPersianNumber(discontinuedProductsCount)}
            <span className="text-xs font-medium mr-1">قلم کالا</span>
          </div>
          <div className={`text-xs mt-2 font-bold ${isDark ? "text-gray-400" : "text-slate-600"}`}>
            خارج از چرخهٔ تولید
          </div>
        </div>

        <div
          onClick={() => {
            setShowLowStockOnly(true);
            setActiveSubTab("list");
          }}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            isDark
              ? "bg-[#111827] border-[#1F2937] hover:border-rose-500/40"
              : "bg-white border-slate-200 shadow-slate-100 hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-slate-800"}`}>
              کسری موجودی بحرانی
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-sm font-bold font-mono mt-2 ${isDark ? "text-white" : "text-slate-950"}`}>
            {formatPersianNumber(shortageProductsCount)}
            <span className="text-xs font-medium mr-1">قلم کالا</span>
          </div>
          <div className="text-xs text-rose-700 dark:text-rose-400 mt-2 font-bold">
            زیر آستانه هشدار موجودی
          </div>
        </div>
      </div>

      {/* =================================================
          TABS (single accent color) + snapshot history action */}

      <div className={`flex items-center justify-between flex-wrap gap-3 border-b pb-3 ${borderBase}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === "add_product") {
                    handleOpenAddProduct();
                  } else {
                    setActiveSubTab(tab.key);
                  }
                }}
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
                  {tab.label}
                  {tab.count !== null ? ` (${formatPersianNumber(tab.count)})` : ""}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsAllSnapshotsModalOpen(true)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
            isDark
              ? "bg-blue-950/30 border-blue-800/50 text-blue-300 hover:bg-blue-900/40"
              : "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
          }`}
          title="مشاهده تمام اسنپ‌شات‌های ثبت‌شده تاریخی محصولات"
        >
          <History className="w-4 h-4" />
          <span>تاریخچه اسنپ‌شات‌ها</span>
        </button>
      </div>

      {/* =================================================
          1. PRODUCT LIST */}

      {activeSubTab === "list" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div
            className={`p-4 rounded-xl border flex flex-col lg:flex-row gap-3 items-start justify-between ${cardBase}`}
          >
            <div className="relative w-full lg:w-80">
              <Search
                className={`w-4 h-4 absolute right-3 top-3 ${isDark ? "text-gray-500" : "text-slate-500"}`}
              />
              <input
                type="text"
                placeholder="جستجو با نام کالا، کد SKU یا قفسه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-9 pl-3 py-2 text-xs rounded-xl border outline-none font-medium ${inputBase}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937] text-gray-200 focus:border-blue-500"
                    : "bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-600"
                }`}
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedLineFilter}
                onChange={(e) => setSelectedLineFilter(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937] text-gray-200 focus:border-blue-500"
                    : "bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-600"
                }`}
              >
                <option value="all">همه خطوط تولید</option>
                {productionLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937] text-gray-200 focus:border-blue-500"
                    : "bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-600"
                }`}
              >
                <option value="all">تمام وضعیت‌ها</option>
                <option value="active">🟢 در حال تولید (فعال)</option>
                <option value="discontinued">⚪ توقف تولید (بایگانی شده)</option>
              </select>

              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                  showLowStockOnly
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : isDark
                      ? "bg-[#18181B] border-[#1F2937] text-gray-400 hover:text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                کالاهای با موجودی بحرانی
              </button>
            </div>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => {
              const matchedCat = categories.find((c) => c.id === prod.categoryId || c.name === prod.category);
              const matchedLine = productionLines.find(
                (l) => l.id === prod.productionLineId || l.name === prod.productionLineName,
              );
              const isLowStock = prod.stockQuantity <= prod.minAlertThreshold;
              const isDiscontinued = prod.status === "discontinued" || prod.status === "archived";

              return (
                <div
                  key={prod.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isDiscontinued ? "opacity-80" : ""
                  } ${taskCardBase}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          {prod.sku}
                        </span>
                        {isDiscontinued ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                              isDark
                                ? "bg-gray-500/15 text-gray-400 border-gray-500/30"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <Archive className="w-3 h-3" />
                            توقف تولید (بایگانی)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            در حال تولید
                          </span>
                        )}
                      </div>

                      {matchedCat && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1 text-blue-600"

                        >
                          <span>{matchedCat.name}</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className={`text-sm font-bold line-clamp-1 ${isDark ? "text-white" : "text-slate-950"}`}>
                        {prod.name}
                      </h3>
                      {prod.description && (
                        <p className={`text-xs mt-1 line-clamp-2 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? "bg-[#18181B] border-[#1F2937]" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                        <Factory className="w-3.5 h-3.5 text-blue-500" />
                        خط ساخت:
                      </span>
                      <span className={`font-semibold ${isDark ? "text-gray-200" : "text-slate-800"}`}>
                        {matchedLine ? matchedLine.name : prod.productionLineName || "تعریف نشده"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div
                        className={`p-2.5 rounded-xl border flex flex-col ${
                          isLowStock
                            ? isDark
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-rose-50 border-rose-200 text-rose-700"
                            : isDark
                              ? "bg-[#18181B] border-[#1F2937] text-gray-300"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className={isDark ? "text-gray-400" : "text-slate-500"}>موجودی انبار</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-sm font-bold font-mono">
                            {formatPersianNumber(prod.stockQuantity)}
                          </span>
                          <span className="text-[10px]">{prod.unit}</span>
                        </div>
                        {isLowStock && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                            بحرانی
                          </span>
                        )}
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border flex flex-col ${
                          isDark ? "bg-[#18181B] border-[#1F2937]" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <span className={isDark ? "text-gray-400" : "text-slate-500"}>قیمت فروش واحد</span>
                        <span className="text-xs font-bold font-mono text-blue-700 dark:text-blue-400 mt-0.5">
                          {formatCurrency(prod.unitSalePrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-wrap ${borderBase}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                        قفسه:
                        <b className={`font-mono ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                          {prod.locationBin || "تعیین‌نشده"}
                        </b>
                      </span>

                      <button
                        onClick={() => setSelectedProductForSnapshots(prod)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                          isDark
                            ? "bg-[#18181B] border-[#1F2937] text-blue-400 hover:bg-blue-950/30"
                            : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        }`}
                        title="مشاهده تاریخچه اسنپ‌شات‌های تولید و لجستیک این محصول"
                      >
                        <Camera className="w-3 h-3" />
                        <span>اسنپ‌شات‌ها</span>
                      </button>
                    </div>

                    {canWrite && (
                      <div className="flex w-full justify-end items-end gap-1">
                        {isDiscontinued ? (
                          <button
                            onClick={() => handleReactivateProduct(prod)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDark
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title="فعال‌سازی مجدد و بازگشت به خط تولید"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDiscontinueProduct(prod)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDark
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            }`}
                            title="توقف تولید و ثبت اسنپ‌شات پایانی در تاریخچه"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isDark
                              ? "bg-[#18181B] border-[#1F2937] text-gray-400 hover:text-white hover:border-blue-500/40"
                              : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-950"
                          }`}
                          title="ویرایش محصول"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isDark
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                              : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                          }`}
                          title="حذف کامل از کاتالوگ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <EmptyState
                icon={Package}
                title="محصولی با این مشخصات یافت نشد"
                description="می‌توانید فیلترها را تغییر داده یا از دکمه «افزودن محصول جدید» برای ایجاد کالای اختصاصی استفاده کنید."
              />
            )}
          </div>
        </div>
      )}

      {/* =================================================
          2. ADD / EDIT PRODUCT FORM */}

      {activeSubTab === "add_product" && (
        <div className={`p-6 rounded-2xl border max-w-3xl mx-auto shadow-xs ${cardBase}`}>
          <div className={`flex items-center justify-between border-b pb-4 mb-6 ${borderBase}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
                  {editingProductId ? "ویرایش اطلاعات محصول" : "تعریف محصول جدید در خط تولید"}
                </h2>
                <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-700 font-medium"}`}>
                  تعیین مشخصات فنی، کد کالا، خط تولید مجری و دسته‌بندی مرتبط
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab("list")}
              className={`px-3 py-1.5 text-xs rounded-xl border cursor-pointer ${
                isDark
                  ? "bg-[#18181B] border-[#1F2937] text-gray-300"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              انصراف
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelBase}>نام کالا / قطعه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الکتروموتور ۵.۵ کیلووات تک‌فاز"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelBase}>کد اختصاصی کالا (SKU) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: MTR-55KW-1400"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelBase}>دسته‌بندی (Category)</label>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab("categories")}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    + افزودن دسته‌بندی جدید
                  </button>
                </div>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => {
                    const selected = categories.find((c) => c.id === e.target.value);
                    setProductForm({
                      ...productForm,
                      categoryId: e.target.value,
                      category: selected ? selected.name : "",
                    });
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none cursor-pointer ${inputBase}`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelBase}>خط تولید مجری (Production Line)</label>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab("lines")}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    + تعریف خط تولید جدید
                  </button>
                </div>
                <select
                  value={productForm.productionLineId}
                  onChange={(e) => {
                    const selected = productionLines.find((l) => l.id === e.target.value);
                    setProductForm({
                      ...productForm,
                      productionLineId: e.target.value,
                      productionLineName: selected ? selected.name : "",
                    });
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none cursor-pointer ${inputBase}`}
                >
                  {productionLines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelBase}>واحد شمارش</label>
                <select
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none cursor-pointer ${inputBase}`}
                >
                  <option value="عدد">عدد</option>
                  <option value="دستگاه">دستگاه</option>
                  <option value="کیلوگرم">کیلوگرم</option>
                  <option value="متر">متر</option>
                  <option value="بسته">بسته</option>
                  <option value="پالت">پالت</option>
                  <option value="ست">ست</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelBase}>موجودی اولیه در انبار</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.stockQuantity}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelBase}>حداقل نقطه سفارش (هشدار کسری)</label>
                <input
                  type="number"
                  min="1"
                  value={productForm.minAlertThreshold}
                  onChange={(e) =>
                    setProductForm({ ...productForm, minAlertThreshold: Number(e.target.value) })
                  }
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelBase}>موقعیت فیزیکی / قفسه در انبار</label>
                <input
                  type="text"
                  placeholder="مثال: قفسه B-14 / سالن ۲"
                  value={productForm.locationBin}
                  onChange={(e) => setProductForm({ ...productForm, locationBin: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelBase}>بهای تمام‌شده تولید (تومان)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={productForm.unitCost}
                  onChange={(e) => setProductForm({ ...productForm, unitCost: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelBase}>قیمت فروش به مشتری (تومان)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={productForm.unitSalePrice}
                  onChange={(e) => setProductForm({ ...productForm, unitSalePrice: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelBase}>توضیحات و مشخصات فنی کالا</label>
              <textarea
                rows={3}
                placeholder="توضیحات تکمیلی، مشخصات ولتاژ، استانداردها، نقشه فنی..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${inputBase}`}
              />
            </div>

            <div className={`flex items-center justify-end gap-3 pt-4 border-t ${borderBase}`}>
              <button
                type="button"
                onClick={() => setActiveSubTab("list")}
                className={`px-5 py-2.5 text-xs rounded-xl border cursor-pointer ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937] text-gray-300"
                    : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {editingProductId ? "ذخیره تغییرات" : "ثبت و اختصاص به خط تولید"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================
          3. CATEGORIES MANAGEMENT */}

      {activeSubTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {canWrite && (
            <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-blue-400" />
                <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
                  افزودن دسته‌بندی جدید
                </h3>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelBase}>نام دسته‌بندی *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تجهیزات حرارتی و کوره"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${inputBase}`}
                  />
                </div>



                <div className="space-y-1.5">
                  <label className={labelBase}>توضیحات</label>
                  <textarea
                    rows={2}
                    placeholder="شرح کوتاه درباره این گروه کالایی..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${inputBase}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  + ذخیره دسته‌بندی
                </button>
              </form>
            </div>
          )}

          <div className={`space-y-3 ${canWrite ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
              دسته‌بندی‌های تعریف‌شده ({formatPersianNumber(categories.length)})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const count = getProductCountForCategory(cat.name, cat.id);
                return (
                  <div key={cat.id} className={`p-4 rounded-xl border flex items-start justify-between ${cardBase}`}>
                    <div className="flex items-start gap-3">


                      <div>
                        <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
                          {cat.name}
                        </h4>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                          {cat.description || "بدون توضیحات"}
                        </p>
                        <span className="inline-block mt-2 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          {formatPersianNumber(count)} محصول ثبت‌شده
                        </span>
                      </div>
                    </div>

                    {canWrite && categories.length > 1 && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 cursor-pointer"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {categories.length === 0 && (
                <EmptyState
                  icon={Tag}
                  title="دسته‌بندی‌ای ثبت نشده"
                  description="از فرم کنار همین صفحه، اولین دسته‌بندی محصولات را تعریف کنید."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          4. PRODUCTION LINES MANAGEMENT */}

      {activeSubTab === "lines" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {canWrite && (
            <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
              <div className="flex items-center gap-2 mb-4">
                <Factory className="w-5 h-5 text-blue-400" />
                <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
                  تعریف خط تولید جدید
                </h3>
              </div>

              <form onSubmit={handleSaveLine} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelBase}>نام خط تولید *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خط مونتاژ بردهای الکترونیکی"
                    value={lineForm.name}
                    onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${inputBase}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelBase}>کد خط (شناسه)</label>
                    <input
                      type="text"
                      placeholder="LINE-ELC-07"
                      value={lineForm.code}
                      onChange={(e) => setLineForm({ ...lineForm, code: e.target.value })}
                      className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelBase}>ظرفیت روزانه (واحد)</label>
                    <input
                      type="number"
                      min="1"
                      value={lineForm.capacityPerDay}
                      onChange={(e) => setLineForm({ ...lineForm, capacityPerDay: Number(e.target.value) })}
                      className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${inputBase}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelBase}>دپارتمان / سالن کارخانه</label>
                  <input
                    type="text"
                    placeholder="مثال: سالن مونتاژ ۲"
                    value={lineForm.department}
                    onChange={(e) => setLineForm({ ...lineForm, department: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${inputBase}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelBase}>شرح خط و تجهیزات مستقر</label>
                  <textarea
                    rows={2}
                    placeholder="شرح دستگاه‌ها، ایستگاه‌های کنترل کیفیت و..."
                    value={lineForm.description}
                    onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${inputBase}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  + راه‌اندازی و ثبت خط تولید
                </button>
              </form>
            </div>
          )}

          <div className={`space-y-3 ${canWrite ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
              خطوط تولید فعال در کارخانه ({formatPersianNumber(productionLines.length)})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {productionLines.map((line) => {
                const count = getProductCountForLine(line.id, line.name);
                return (
                  <div key={line.id} className={`p-4 rounded-xl border flex flex-col justify-between ${cardBase}`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          {line.code}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          فعال در مدار
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
                        {line.name}
                      </h4>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                        {line.description || line.department || "سالن تولید"}
                      </p>

                      <div
                        className={`pt-2 flex items-center justify-between text-xs border-t ${borderBase} ${
                          isDark ? "text-gray-400" : "text-slate-600"
                        }`}
                      >
                        <span>
                          ظرفیت روزانه:
                          <b className={`font-mono ${isDark ? "text-gray-200" : "text-slate-800"}`}>
                            {formatPersianNumber(line.capacityPerDay || 20)} واحد
                          </b>
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {formatPersianNumber(count)} کالا
                        </span>
                      </div>
                    </div>

                    {canWrite && productionLines.length > 1 && (
                      <div className={`mt-3 pt-2 border-t flex justify-end ${borderBase}`}>
                        <button
                          onClick={() => handleDeleteLine(line.id, line.name)}
                          className="text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف خط
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {productionLines.length === 0 && (
                <EmptyState
                  icon={Factory}
                  title="خط تولیدی ثبت نشده"
                  description="از فرم کنار همین صفحه، اولین خط تولید کارخانه را تعریف کنید."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Snapshots History Modal */}
      {(isAllSnapshotsModalOpen || selectedProductForSnapshots) && (
        <ProductSnapshotsHistoryModal
          productId={selectedProductForSnapshots?.id}
          productName={selectedProductForSnapshots?.name}
          onClose={() => {
            setIsAllSnapshotsModalOpen(false);
            setSelectedProductForSnapshots(null);
          }}
          onViewSnapshotDetails={(snapshot) => setSelectedSingleSnapshot(snapshot)}
          theme={theme}
        />
      )}

      {/* Single Snapshot Details Modal */}
      {selectedSingleSnapshot && (
        <ProductSnapshotModal
          snapshot={selectedSingleSnapshot}
          onClose={() => setSelectedSingleSnapshot(null)}
          theme={theme}
        />
      )}
    </div>
  );
}
