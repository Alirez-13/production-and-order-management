import { useState, useMemo, FormEvent } from 'react';
import { WarehouseProduct, CustomerOrder, InventoryLog, AppUser } from '../types';
import { StorageService } from '../services/storageService';
import { ToastMessage } from '../components/ui/ToastNotification';

export function useWarehouse(
  products: WarehouseProduct[],
  orders: CustomerOrder[],
  logs: InventoryLog[],
  currentUser: AppUser,
  onRefreshData: () => void
) {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'dispatch' | 'logs'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductToAdjust, setSelectedProductToAdjust] = useState<WarehouseProduct | null>(null);
  const [newAdjustQty, setNewAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('شمارش ادواری انبار');

  const [selectedOrderToDispatch, setSelectedOrderToDispatch] = useState<CustomerOrder | null>(null);
  const [dispatchTrackingCode, setDispatchTrackingCode] = useState('');
  const [dispatchLogisticsNotes, setDispatchLogisticsNotes] = useState('ارسال اکسپرس باربری');

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const canWrite = StorageService.checkPermission('warehouse', 'write', currentUser);
  const canRead = StorageService.checkPermission('warehouse', 'read', currentUser);

  const readyToDispatchOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'produced');
  }, [orders]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.locationBin.toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, categoryFilter]);

  const handleAdjustStock = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProductToAdjust) return;
    if (!canWrite) {
      showToast('error', 'خطای دسترسی: شما مجوز ویرایش موجودی انبار را ندارید.');
      return;
    }
    const res = StorageService.adjustStock(selectedProductToAdjust.id, newAdjustQty, adjustReason);
    if (res.success) {
      showToast('success', `موجودی کالای «${selectedProductToAdjust.name}» به تعداد ${newAdjustQty} اصلاح و ثبت شد.`);
      setIsAdjustModalOpen(false);
      setSelectedProductToAdjust(null);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در اصلاح موجودی');
    }
  };

  const handleDispatchOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrderToDispatch) return;
    if (!canWrite) {
      showToast('error', 'خطای دسترسی: شما مجوز خروج بار از انبار را ندارید.');
      return;
    }
    const res = StorageService.dispatchOrder(selectedOrderToDispatch.id, dispatchTrackingCode, dispatchLogisticsNotes);
    if (res.success) {
      showToast('success', `سفارش «${selectedOrderToDispatch.orderNumber}» با موفقیت ترخیص و تحویل سیستم لجستیک گردید.`);
      setSelectedOrderToDispatch(null);
      setDispatchTrackingCode('');
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در ارسال سفارش');
    }
  };

  return {
    activeSubTab,
    setActiveSubTab,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    isAdjustModalOpen,
    setIsAdjustModalOpen,
    selectedProductToAdjust,
    setSelectedProductToAdjust,
    newAdjustQty,
    setNewAdjustQty,
    adjustReason,
    setAdjustReason,
    selectedOrderToDispatch,
    setSelectedOrderToDispatch,
    dispatchTrackingCode,
    setDispatchTrackingCode,
    dispatchLogisticsNotes,
    setDispatchLogisticsNotes,
    toast,
    setToast,
    showToast,
    isLoading,
    canWrite,
    canRead,
    readyToDispatchOrders,
    categories,
    filteredProducts,
    handleAdjustStock,
    handleDispatchOrder,
  };
}
