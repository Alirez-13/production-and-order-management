import { useState, useMemo } from 'react';
import { CustomerOrder, OrderPriority, OrderStatus, OrderItem, AppUser, ThemeMode } from '../types';
import { StorageService } from '../services/storageService';
import { ToastMessage } from '../components/ui/ToastNotification';

export function useOrders(
  orders: CustomerOrder[],
  currentUser: AppUser,
  onRefreshData: () => void
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<CustomerOrder | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const canWrite = StorageService.checkPermission('orders', 'write', currentUser);
  const canRead = StorageService.checkPermission('orders', 'read', currentUser);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerCompany.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || o.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, searchQuery, statusFilter, priorityFilter]);

  const handleCreateOrder = async (orderData: {
    customerName: string;
    customerCompany?: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    requiredDeliveryDate: string;
    priority?: OrderPriority;
    items: OrderItem[];
    notes?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = StorageService.createOrder(orderData as any);
      if (res.success) {
        showToast('success', `سفارش شماره «${res.order?.orderNumber}» با موفقیت در سامانه ثبت گردید.`);
        setIsNewOrderModalOpen(false);
        onRefreshData();
        return true;
      } else {
        showToast('error', res.error || 'خطا در ثبت سفارش');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    const reason = prompt(`دلیل لغو سفارش ${orderNumber} را وارد فرمایید:`, 'انصراف مشتری یا تغییر اقلام');
    if (reason === null) return;
    const res = StorageService.cancelOrder(orderId, reason);
    if (res.success) {
      showToast('success', `سفارش «${orderNumber}» با موفقیت لغو شد.`);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در لغو سفارش');
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    isNewOrderModalOpen,
    setIsNewOrderModalOpen,
    selectedOrderDetails,
    setSelectedOrderDetails,
    toast,
    setToast,
    showToast,
    isLoading,
    canWrite,
    canRead,
    filteredOrders,
    handleCreateOrder,
    handleCancelOrder,
  };
}
