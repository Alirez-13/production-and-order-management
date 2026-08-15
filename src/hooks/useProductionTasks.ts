import { useState, useMemo } from 'react';
import { ProductionTask, CustomerOrder, ProductionStage, OrderPriority, AppUser } from '../types';
import { StorageService } from '../services/storageService';
import { ToastMessage } from '../components/ui/ToastNotification';

export function useProductionTasks(
  tasks: ProductionTask[],
  orders: CustomerOrder[],
  currentUser: AppUser,
  onRefreshData: () => void
) {
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedOrderToDispatch, setSelectedOrderToDispatch] = useState<CustomerOrder | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const canWrite = StorageService.checkPermission('production', 'write', currentUser);
  const canRead = StorageService.checkPermission('production', 'read', currentUser);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedLineFilter === 'all') return true;
      return t.productionLine === selectedLineFilter;
    });
  }, [tasks, selectedLineFilter]);

  const queuedTasks = useMemo(() => filteredTasks.filter((t) => t.stage === 'queued'), [filteredTasks]);
  const inProductionTasks = useMemo(() => filteredTasks.filter((t) => t.stage === 'in_production'), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter((t) => t.stage === 'completed'), [filteredTasks]);
  const unprocessedOrders = useMemo(() => orders.filter((o) => o.status === 'unprocessed'), [orders]);

  const handleMoveStage = (taskId: string, targetStage: ProductionStage, newPercent?: number) => {
    if (!canWrite) {
      showToast('error', 'خطای دسترسی: شما مجوز تغییر وضعیت خط تولید را ندارید.');
      return;
    }
    const res = StorageService.updateProductionTaskStage(taskId, targetStage, newPercent);
    if (res.success) {
      const stageName =
        targetStage === 'in_production'
          ? 'در حال ساخت'
          : targetStage === 'completed'
          ? 'تکمیل و انتقال به انبار'
          : 'در صف ساخت';
      showToast('success', `وضعیت دستور ساخت به «${stageName}» تغییر یافت.`);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در تغییر مرحله ساخت');
    }
  };

  const handleCreateTask = (data: {
    productId: string;
    targetQuantity: number;
    priority?: OrderPriority;
    productionLine: string;
    estimatedHours?: number;
    assignedOperator?: string;
    notes?: string;
    relatedOrderId?: string;
    relatedOrderNumber?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = StorageService.createProductionTask(data);
      if (res.success) {
        showToast('success', `دستور ساخت «${res.task?.taskCode}» با موفقیت در خط تولید ایجاد گردید.`);
        setIsNewTaskModalOpen(false);
        onRefreshData();
        return true;
      } else {
        showToast('error', res.error || 'خطا در ثبت دستور ساخت');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectedLineFilter,
    setSelectedLineFilter,
    isNewTaskModalOpen,
    setIsNewTaskModalOpen,
    selectedOrderToDispatch,
    setSelectedOrderToDispatch,
    toast,
    setToast,
    showToast,
    isLoading,
    canWrite,
    canRead,
    filteredTasks,
    queuedTasks,
    inProductionTasks,
    completedTasks,
    unprocessedOrders,
    handleMoveStage,
    handleCreateTask,
  };
}
