import React, { useState } from 'react';
import { 
  WarehouseProduct, 
  ProductCategory, 
  ProductionLine, 
  AppUser,
  ProductSnapshot 
} from '../types';
import { StorageService } from '../services/storageService';
import { formatCurrency, formatPersianNumber, formatDateFa } from '../utils/formatters';
import { ProductSnapshotsHistoryModal } from './ProductSnapshotsHistoryModal';
import { ProductSnapshotModal } from './ProductSnapshotModal';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Factory, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  Boxes,
  Sparkles,
  Sliders,
  DollarSign,
  History,
  Archive,
  RotateCcw,
  Camera
} from 'lucide-react';

interface ProductCatalogProps {
  products: WarehouseProduct[];
  categories: ProductCategory[];
  productionLines: ProductionLine[];
  currentUser: AppUser;
  onRefreshData: () => void;
  onNavigateTab?: (tab: any) => void;
  theme?: 'dark' | 'light';
}

export function ProductCatalog({
  products,
  categories,
  productionLines,
  currentUser,
  onRefreshData,
  onNavigateTab,
  theme = 'dark',
}: ProductCatalogProps) {
  const isDark = theme === 'dark';
  const canWrite = StorageService.checkPermission('products', 'write') || StorageService.checkPermission('warehouse', 'write');

  // Active view: 'list' | 'add_product' | 'categories' | 'lines'
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'add_product' | 'categories' | 'lines'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'discontinued'>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Snapshot Modals
  const [isAllSnapshotsModalOpen, setIsAllSnapshotsModalOpen] = useState(false);
  const [selectedProductForSnapshots, setSelectedProductForSnapshots] = useState<WarehouseProduct | null>(null);
  const [selectedSingleSnapshot, setSelectedSingleSnapshot] = useState<ProductSnapshot | null>(null);

  // Form states for adding/editing product
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    categoryId: '',
    category: '',
    productionLineId: '',
    productionLineName: '',
    unit: 'عدد',
    stockQuantity: 0,
    minAlertThreshold: 10,
    locationBin: '',
    unitCost: 0,
    unitSalePrice: 0,
    description: '',
  });

  // Form states for Category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#3B82F6',
    icon: '🏷️',
    description: '',
  });

  // Form states for Production Line
  const [lineForm, setLineForm] = useState({
    name: '',
    code: '',
    department: 'سالن اصلی',
    capacityPerDay: 20,
    description: '',
    status: 'active' as const,
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Reset product form
  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      sku: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      categoryId: categories[0]?.id || '',
      category: categories[0]?.name || 'موتورهای الکتریکی',
      productionLineId: productionLines[0]?.id || '',
      productionLineName: productionLines[0]?.name || 'خط اصلی',
      unit: 'عدد',
      stockQuantity: 0,
      minAlertThreshold: 10,
      locationBin: 'انبار A',
      unitCost: 0,
      unitSalePrice: 0,
      description: '',
    });
  };

  // Start adding product
  const handleOpenAddProduct = () => {
    resetProductForm();
    setActiveSubTab('add_product');
  };

  // Start editing product
  const handleOpenEditProduct = (prod: WarehouseProduct) => {
    setEditingProductId(prod.id);
    setProductForm({
      sku: prod.sku,
      name: prod.name,
      categoryId: prod.categoryId || categories.find(c => c.name === prod.category)?.id || '',
      category: prod.category,
      productionLineId: prod.productionLineId || '',
      productionLineName: prod.productionLineName || '',
      unit: prod.unit || 'عدد',
      stockQuantity: prod.stockQuantity,
      minAlertThreshold: prod.minAlertThreshold,
      locationBin: prod.locationBin || '',
      unitCost: prod.unitCost,
      unitSalePrice: prod.unitSalePrice,
      description: prod.description || '',
    });
    setActiveSubTab('add_product');
  };

  // Save product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.sku.trim()) {
      showToast('error', 'لطفاً نام محصول و کد کالا (SKU) را وارد نمایید.');
      return;
    }

    const matchedCat = categories.find((c) => c.id === productForm.categoryId);
    const matchedLine = productionLines.find((l) => l.id === productForm.productionLineId);

    const payload = {
      ...productForm,
      category: matchedCat ? matchedCat.name : productForm.category || 'عمومی',
      categoryId: productForm.categoryId,
      productionLineId: productForm.productionLineId,
      productionLineName: matchedLine ? matchedLine.name : productForm.productionLineName || '',
      stockQuantity: Number(productForm.stockQuantity) || 0,
      minAlertThreshold: Number(productForm.minAlertThreshold) || 10,
      unitCost: Number(productForm.unitCost) || 0,
      unitSalePrice: Number(productForm.unitSalePrice) || 0,
    };

    if (editingProductId) {
      const res = StorageService.updateProduct(editingProductId, payload);
      if (res.success) {
        showToast('success', `محصول «${payload.name}» با موفقیت به‌روزرسانی شد.`);
        onRefreshData();
        setActiveSubTab('list');
      } else {
        showToast('error', res.error || 'خطا در ویرایش محصول');
      }
    } else {
      const res = StorageService.addProduct(payload);
      if (res.success) {
        showToast('success', `محصول جدید «${payload.name}» به خط تولید و انبار اضافه شد.`);
        onRefreshData();
        setActiveSubTab('list');
      } else {
        showToast('error', res.error || 'خطا در ثبت محصول');
      }
    }
  };

  // Delete product
  const handleDeleteProduct = (id: string, name: string) => {
    if (!confirm(`آیا از حذف محصول «${name}» اطمینان دارید؟`)) return;
    const res = StorageService.deleteProduct(id);
    if (res.success) {
      showToast('success', `محصول «${name}» حذف شد.`);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در حذف');
    }
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast('error', 'لطفاً نام دسته‌بندی را وارد کنید.');
      return;
    }
    const res = StorageService.createCategory(categoryForm);
    if (res.success) {
      showToast('success', `دسته‌بندی «${categoryForm.name}» با موفقیت افزوده شد.`);
      setCategoryForm({ name: '', color: '#3B82F6', icon: '🏷️', description: '' });
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در افزودن دسته‌بندی');
    }
  };

  // Delete Category
  const handleDeleteCategory = (id: string, name: string) => {
    if (!confirm(`آیا از حذف دسته‌بندی «${name}» اطمینان دارید؟`)) return;
    const res = StorageService.deleteCategory(id);
    if (res.success) {
      showToast('success', `دسته‌بندی «${name}» حذف شد.`);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در حذف دسته‌بندی');
    }
  };

  // Save Production Line
  const handleSaveLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineForm.name.trim()) {
      showToast('error', 'لطفاً نام خط تولید را وارد کنید.');
      return;
    }
    const code = lineForm.code.trim() || `LINE-${Math.floor(100 + Math.random() * 900)}`;
    const res = StorageService.createProductionLine({ ...lineForm, code });
    if (res.success) {
      showToast('success', `خط تولید «${lineForm.name}» با موفقیت ایجاد شد.`);
      setLineForm({
        name: '',
        code: '',
        department: 'سالن اصلی',
        capacityPerDay: 20,
        description: '',
        status: 'active',
      });
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در تعریف خط تولید');
    }
  };

  // Delete Line
  const handleDeleteLine = (id: string, name: string) => {
    if (!confirm(`آیا از حذف خط تولید «${name}» اطمینان دارید؟`)) return;
    const res = StorageService.deleteProductionLine(id);
    if (res.success) {
      showToast('success', `خط تولید «${name}» حذف شد.`);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در حذف خط تولید');
    }
  };

  // Discontinue product (creates archival snapshot)
  const handleDiscontinueProduct = (prod: WarehouseProduct) => {
    const reason = prompt(`دلیل توقف تولید و بایگانی محصول «${prod.name}» را وارد نمایید:`, 'تغییر سبد محصول و پایان چرخه عمر کالا');
    if (reason === null) return;
    const res = StorageService.discontinueProduct(prod.id, reason || 'توقف خط تولید', currentUser.name);
    if (res.success) {
      showToast('success', `تولید محصول «${prod.name}» متوقف شد و اسنپ‌شات نهایی در تاریخچه پایگاه‌داده بایگانی گردید.`);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در توقف تولید');
    }
  };

  // Reactivate product
  const handleReactivateProduct = (prod: WarehouseProduct) => {
    if (!confirm(`آیا می‌خواهید محصول «${prod.name}» را مجدداً به چرخه تولید فعال بازگردانید؟`)) return;
    const res = StorageService.reactivateProduct(prod.id, currentUser.name);
    if (res.success) {
      showToast('success', `محصول «${prod.name}» با موفقیت فعال و به خط تولید بازگردانده شد.`);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در فعال‌سازی مجدد');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.locationBin && p.locationBin.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q));

    // Resolve category filter against ID and Name
    const targetCat = categories.find((c) => c.id === selectedCategoryFilter || c.name === selectedCategoryFilter);
    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      p.categoryId === selectedCategoryFilter ||
      p.category === selectedCategoryFilter ||
      (targetCat && (p.category === targetCat.name || p.categoryId === targetCat.id));

    // Resolve line filter against ID, Code and Name
    const targetLine = productionLines.find((l) => l.id === selectedLineFilter || l.name === selectedLineFilter || l.code === selectedLineFilter);
    const matchesLine =
      selectedLineFilter === 'all' ||
      p.productionLineId === selectedLineFilter ||
      p.productionLineName === selectedLineFilter ||
      (targetLine && (p.productionLineName === targetLine.name || p.productionLineId === targetLine.id || p.productionLineName === targetLine.code));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (!p.status || p.status === 'active')) ||
      (statusFilter === 'discontinued' && (p.status === 'discontinued' || p.status === 'archived'));

    const matchesLowStock = !showLowStockOnly || p.stockQuantity <= p.minAlertThreshold;

    return matchesSearch && matchesCategory && matchesLine && matchesStatus && matchesLowStock;
  });

  // Category counts
  const getProductCountForCategory = (catName: string, catId?: string) => {
    return products.filter((p) => (catId && p.categoryId === catId) || p.category === catName || (catId && p.category === catName)).length;
  };

  // Line counts
  const getProductCountForLine = (lineId: string, lineName: string) => {
    return products.filter((p) => p.productionLineId === lineId || p.productionLineName === lineName || (lineId && p.productionLineName === lineName)).length;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-lg transition-all animate-fadeIn ${
            notification.type === 'success'
              ? isDark
                ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : isDark
              ? 'bg-rose-950/80 border-rose-800/80 text-rose-200'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div
        className={`p-6 rounded-2xl border transition-all shadow-sm ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  مدیریت کاتالوگ و تعریف محصولات
                </h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  تعریف کالاهای اختصاصی، اختصاص به خطوط تولید و دسته‌بندی‌های دلخواه
                </p>
              </div>
            </div>
          </div>

          {/* Quick Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'list'
                  ? isDark
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-teal-600 text-white shadow-sm'
                  : isDark
                  ? 'bg-[#18181B] text-gray-400 hover:text-white border border-[#27272A]'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Package className="w-4 h-4" />
              فهرست کالاها ({formatPersianNumber(products.length)})
            </button>

            {canWrite && (
              <button
                onClick={handleOpenAddProduct}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'add_product'
                    ? isDark
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                      : 'bg-teal-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-[#18181B] text-gray-400 hover:text-white border border-[#27272A]'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                {editingProductId ? 'ویرایش کالا' : 'افزودن محصول جدید'}
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('categories')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'categories'
                  ? isDark
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-teal-600 text-white shadow-sm'
                  : isDark
                  ? 'bg-[#18181B] text-gray-400 hover:text-white border border-[#27272A]'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              دسته‌بندی‌ها ({formatPersianNumber(categories.length)})
            </button>

            <button
              onClick={() => setActiveSubTab('lines')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'lines'
                  ? isDark
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-teal-600 text-white shadow-sm'
                  : isDark
                  ? 'bg-[#18181B] text-gray-400 hover:text-white border border-[#27272A]'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Factory className="w-4 h-4" />
              خطوط تولید ({formatPersianNumber(productionLines.length)})
            </button>

            <button
              onClick={() => setIsAllSnapshotsModalOpen(true)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isDark
                  ? 'bg-teal-950/40 border-teal-800/60 text-teal-300 hover:bg-teal-900/40'
                  : 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
              }`}
              title="مشاهده تمام اسنپ‌شات‌های ثبت‌شده تاریخی محصولات"
            >
              <History className="w-4 h-4" />
              <span>تاریخچه اسنپ‌شات‌ها</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. PRODUCT LIST VIEW */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div
            className={`p-4 rounded-xl border flex flex-col lg:flex-row gap-3 items-center justify-between transition-all ${
              isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            {/* Search input */}
            <div className="relative w-full lg:w-80">
              <Search className={`w-4 h-4 absolute right-3 top-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="جستجو با نام کالا، کد SKU یا قفسه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-9 pl-3 py-2 text-xs rounded-xl border outline-none transition-all ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                }`}
              />
            </div>

            {/* Select Category */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] text-gray-200 focus:border-teal-500'
                    : 'bg-gray-50 border-gray-300 text-gray-800 focus:border-teal-600'
                }`}
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || '📦'} {c.name}
                  </option>
                ))}
              </select>

              {/* Select Line */}
              <select
                value={selectedLineFilter}
                onChange={(e) => setSelectedLineFilter(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] text-gray-200 focus:border-teal-500'
                    : 'bg-gray-50 border-gray-300 text-gray-800 focus:border-teal-600'
                }`}
              >
                <option value="all">همه خطوط تولید</option>
                {productionLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    🏭 {l.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] text-gray-200 focus:border-teal-500'
                    : 'bg-gray-50 border-gray-300 text-gray-800 focus:border-teal-600'
                }`}
              >
                <option value="all">تمام وضعیت‌ها</option>
                <option value="active">🟢 در حال تولید (فعال)</option>
                <option value="discontinued">⚪ توقف تولید (بایگانی شده)</option>
              </select>

              {/* Low stock toggle */}
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                  showLowStockOnly
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : isDark
                    ? 'bg-[#18181B] border-[#27272A] text-gray-400 hover:text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                کالاهای با موجودی بحرانی
              </button>
            </div>
          </div>

          {/* Products Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => {
              const matchedCat = categories.find((c) => c.id === prod.categoryId || c.name === prod.category);
              const matchedLine = productionLines.find((l) => l.id === prod.productionLineId || l.name === prod.productionLineName);
              const isLowStock = prod.stockQuantity <= prod.minAlertThreshold;
              const isDiscontinued = prod.status === 'discontinued' || prod.status === 'archived';

              return (
                <div
                  key={prod.id}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${
                    isDiscontinued
                      ? isDark
                        ? 'bg-[#151518] border-gray-800/80 opacity-90'
                        : 'bg-gray-50/90 border-gray-200 opacity-90'
                      : isDark
                      ? 'bg-[#121214] border-[#27272A] hover:border-gray-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top badging */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          {prod.sku}
                        </span>
                        {isDiscontinued ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30 flex items-center gap-1">
                            <Archive className="w-3 h-3" />
                            توقف تولید (بایگانی)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            در حال تولید
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {matchedCat && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1"
                            style={{
                              backgroundColor: `${matchedCat.color || '#3B82F6'}15`,
                              borderColor: `${matchedCat.color || '#3B82F6'}30`,
                              color: matchedCat.color || '#3B82F6',
                            }}
                          >
                            <span>{matchedCat.icon || '🏷️'}</span>
                            <span>{matchedCat.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Name & Description */}
                    <div>
                      <h3 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {prod.name}
                      </h3>
                      {prod.description && (
                        <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {prod.description}
                        </p>
                      )}
                    </div>

                    {/* Production Line Badge */}
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Factory className="w-3.5 h-3.5 text-teal-400" />
                        خط ساخت:
                      </span>
                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {matchedLine ? matchedLine.name : prod.productionLineName || 'تعریف نشده'}
                      </span>
                    </div>

                    {/* Stock & Location */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div
                        className={`p-2.5 rounded-xl border flex flex-col ${
                          isLowStock
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : isDark
                            ? 'bg-[#18181B] border-[#27272A] text-gray-300'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="text-[10px] text-gray-400">موجودی انبار</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-bold font-mono">
                            {formatPersianNumber(prod.stockQuantity)}
                          </span>
                          <span className="text-[10px]">{prod.unit}</span>
                          {isLowStock && <span className="text-[10px] text-rose-400 font-medium">(بحرانی)</span>}
                        </div>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border flex flex-col ${
                          isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span className="text-[10px] text-gray-400">قیمت فروش واحد</span>
                        <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                          {formatCurrency(prod.unitSalePrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Snapshot history */}
                  <div
                    className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
                      isDark ? 'border-[#27272A]' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">
                        قفسه: <b className="font-mono text-gray-300">{prod.locationBin || 'تعیین‌نشده'}</b>
                      </span>

                      {/* Snapshots Button */}
                      <button
                        onClick={() => setSelectedProductForSnapshots(prod)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#1c1c20] border-gray-700 text-teal-400 hover:bg-teal-950/30'
                            : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                        }`}
                        title="مشاهده تاریخچه اسنپ‌شات‌های تولید و لجستیک این محصول"
                      >
                        <Camera className="w-3 h-3" />
                        <span>اسنپ‌شات‌ها</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {canWrite && (
                        <>
                          {isDiscontinued ? (
                            <button
                              onClick={() => handleReactivateProduct(prod)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isDark
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
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
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
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
                                ? 'bg-[#18181B] border-[#27272A] text-gray-400 hover:text-white hover:border-teal-500'
                                : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900'
                            }`}
                            title="ویرایش محصول"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDark
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                            }`}
                            title="حذف کامل از کاتالوگ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div
              className={`p-12 text-center rounded-2xl border ${
                isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
              }`}
            >
              <Package className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-40" />
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                محصولی با این مشخصات یافت نشد
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                می‌توانید فیلترها را تغییر داده یا از دکمه «افزودن محصول جدید» برای ایجاد کالای اختصاصی استفاده کنید.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ADD / EDIT PRODUCT FORM */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'add_product' && (
        <div
          className={`p-6 rounded-2xl border max-w-3xl mx-auto shadow-sm ${
            isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-4 mb-6 border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingProductId ? 'ویرایش اطلاعات محصول' : 'تعریف محصول جدید در خط تولید'}
                </h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  تعیین مشخصات فنی، کد کالا، خط تولید مجری و دسته‌بندی مرتبط
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('list')}
              className={`px-3 py-1.5 text-xs rounded-xl border cursor-pointer ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              انصراف
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">نام کالا / قطعه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الکتروموتور ۵.۵ کیلووات تک‌فاز"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                />
              </div>

              {/* SKU */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">کد اختصاصی کالا (SKU) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: MTR-55KW-1400"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">دسته‌بندی (Category)</label>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('categories')}
                    className="text-[11px] text-teal-400 hover:underline cursor-pointer"
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
                      category: selected ? selected.name : '',
                    });
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-gray-200 focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || '🏷️'} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Production Line Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">خط تولید مجری (Production Line)</label>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('lines')}
                    className="text-[11px] text-teal-400 hover:underline cursor-pointer"
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
                      productionLineName: selected ? selected.name : '',
                    });
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-gray-200 focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                >
                  {productionLines.map((l) => (
                    <option key={l.id} value={l.id}>
                      🏭 {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">واحد شمارش</label>
                <select
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-gray-200 focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
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

              {/* Initial Stock */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">موجودی اولیه در انبار</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.stockQuantity}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                />
              </div>

              {/* Min Alert Threshold */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">حداقل نقطه سفارش (هشدار کسری)</label>
                <input
                  type="number"
                  min="1"
                  value={productForm.minAlertThreshold}
                  onChange={(e) => setProductForm({ ...productForm, minAlertThreshold: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                />
              </div>

              {/* Location Bin */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">موقعیت فیزیکی / قفسه در انبار</label>
                <input
                  type="text"
                  placeholder="مثال: قفسه B-14 / سالن ۲"
                  value={productForm.locationBin}
                  onChange={(e) => setProductForm({ ...productForm, locationBin: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                />
              </div>

              {/* Unit Cost */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">بهای تمام‌شده تولید (تومان)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={productForm.unitCost}
                  onChange={(e) => setProductForm({ ...productForm, unitCost: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                />
              </div>

              {/* Unit Sale Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">قیمت فروش به مشتری (تومان)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={productForm.unitSalePrice}
                  onChange={(e) => setProductForm({ ...productForm, unitSalePrice: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                  }`}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">توضیحات و مشخصات فنی کالا</label>
              <textarea
                rows={3}
                placeholder="توضیحات تکمیلی، مشخصات ولتاژ، استانداردها، نقشه فنی..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                className={`px-5 py-2.5 text-xs rounded-xl border cursor-pointer ${
                  isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                {editingProductId ? 'ذخیره تغییرات' : 'ثبت و اختصاص به خط تولید'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CATEGORIES MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Category Card */}
          {canWrite && (
            <div
              className={`p-6 rounded-2xl border shadow-sm ${
                isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-teal-400" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  افزودن دسته‌بندی جدید
                </h3>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">نام دسته‌بندی *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تجهیزات حرارتی و کوره"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">آیکون (ایموجی)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                      className={`w-full px-3 py-2 text-xs text-center rounded-xl border outline-none ${
                        isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">رنگ بج (Color)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                        className="w-10 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono text-gray-400">{categoryForm.color}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">توضیحات</label>
                  <textarea
                    rows={2}
                    placeholder="شرح کوتاه درباره این گروه کالایی..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  + ذخیره دسته‌بندی
                </button>
              </form>
            </div>
          )}

          {/* Existing Categories List */}
          <div className={`space-y-3 ${canWrite ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              دسته‌بندی‌های تعریف‌شده ({formatPersianNumber(categories.length)})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const count = getProductCountForCategory(cat.name, cat.id);
                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-xl border flex items-start justify-between ${
                      isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border"
                        style={{
                          backgroundColor: `${cat.color || '#3B82F6'}15`,
                          borderColor: `${cat.color || '#3B82F6'}30`,
                        }}
                      >
                        {cat.icon || '🏷️'}
                      </div>

                      <div>
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {cat.name}
                        </h4>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {cat.description || 'بدون توضیحات'}
                        </p>
                        <span className="inline-block mt-2 text-[11px] font-medium text-teal-400">
                          {formatPersianNumber(count)} محصول ثبت‌شده
                        </span>
                      </div>
                    </div>

                    {canWrite && categories.length > 1 && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="text-gray-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. PRODUCTION LINES MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'lines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Line Form */}
          {canWrite && (
            <div
              className={`p-6 rounded-2xl border shadow-sm ${
                isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Factory className="w-5 h-5 text-teal-400" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  تعریف خط تولید جدید
                </h3>
              </div>

              <form onSubmit={handleSaveLine} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">نام خط تولید *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خط مونتاژ بردهای الکترونیکی"
                    value={lineForm.name}
                    onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? 'bg-[#18181B] border-[#27272A] text-white focus:border-teal-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">کد خط (شناسه)</label>
                    <input
                      type="text"
                      placeholder="LINE-ELC-07"
                      value={lineForm.code}
                      onChange={(e) => setLineForm({ ...lineForm, code: e.target.value })}
                      className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                        isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">ظرفیت روزانه (واحد)</label>
                    <input
                      type="number"
                      min="1"
                      value={lineForm.capacityPerDay}
                      onChange={(e) => setLineForm({ ...lineForm, capacityPerDay: Number(e.target.value) })}
                      className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                        isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">دپارتمان / سالن کارخانه</label>
                  <input
                    type="text"
                    placeholder="مثال: سالن مونتاژ ۲"
                    value={lineForm.department}
                    onChange={(e) => setLineForm({ ...lineForm, department: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">شرح خط و تجهیزات مستقر</label>
                  <textarea
                    rows={2}
                    placeholder="شرح دستگاه‌ها، ایستگاه‌های کنترل کیفیت و..."
                    value={lineForm.description}
                    onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  + راه‌اندازی و ثبت خط تولید
                </button>
              </form>
            </div>
          )}

          {/* Lines List */}
          <div className={`space-y-3 ${canWrite ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              خطوط تولید فعال در کارخانه ({formatPersianNumber(productionLines.length)})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {productionLines.map((line) => {
                const count = getProductCountForLine(line.id, line.name);
                return (
                  <div
                    key={line.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          {line.code}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          فعال در مدار
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {line.name}
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {line.description || line.department || 'سالن تولید'}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-gray-800">
                        <span>ظرفیت روزانه: <b className="font-mono text-gray-200">{formatPersianNumber(line.capacityPerDay || 20)} واحد</b></span>
                        <span className="text-teal-400 font-medium">{formatPersianNumber(count)} کالا</span>
                      </div>
                    </div>

                    {canWrite && productionLines.length > 1 && (
                      <div className="mt-3 pt-2 border-t border-gray-800 flex justify-end">
                        <button
                          onClick={() => handleDeleteLine(line.id, line.name)}
                          className="text-gray-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف خط
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Product Snapshots History Modal (Filtered by product if selected, or all if selectedProductForSnapshots is null) */}
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
