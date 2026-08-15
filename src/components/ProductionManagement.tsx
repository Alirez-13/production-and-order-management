import React, { useState } from 'react';
import { 
  Factory, 
  Clock, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  Boxes, 
  User, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  ShieldAlert,
  Send,
  Timer,
  CheckCircle2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  ProductionTask, 
  CustomerOrder, 
  WarehouseProduct, 
  AppUser, 
  ProductionStage,
  ThemeMode,
  ProductionLine 
} from '../types';
import { StorageService } from '../services/storageService';
import { formatNumber, formatDateFa, getPriorityBadge } from '../utils/formatters';

interface ProductionManagementProps {
  tasks: ProductionTask[];
  orders: CustomerOrder[];
  products: WarehouseProduct[];
  currentUser: AppUser;
  onRefreshData: () => void;
  theme?: ThemeMode;
}

export const ProductionManagement: React.FC<ProductionManagementProps> = ({
  tasks,
  orders,
  products,
  currentUser,
  onRefreshData,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedOrderToDispatch, setSelectedOrderToDispatch] = useState<CustomerOrder | null>(null);
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');

  const productionLines = StorageService.getProductionLines();

  // Assign form
  const [assignLine, setAssignLine] = useState(productionLines[0]?.name || 'خط مونتاژ عمومی');
  const [assignHours, setAssignHours] = useState(14);
  const [assignOperator, setAssignOperator] = useState('اپراتور شیفت روزانه');

  // Manual New Task Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [taskQuantity, setTaskQuantity] = useState(10);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskProductionLine, setTaskProductionLine] = useState(productionLines[0]?.name || 'خط ماشین‌کاری و CNC');
  const [taskEstimatedHours, setTaskEstimatedHours] = useState(16);
  const [taskOperator, setTaskOperator] = useState('تیم فنی خط ۱');
  const [taskNotes, setTaskNotes] = useState('');

  // Toast / Feedback
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check RBAC Permissions
  const canWrite = StorageService.checkPermission('production', 'write', currentUser);
  const canRead = StorageService.checkPermission('production', 'read', currentUser);

  // Filter tasks by line if selected
  const filteredTasks = tasks.filter((t) => {
    if (selectedLineFilter === 'all') return true;
    return t.productionLine === selectedLineFilter;
  });

  // Group tasks by 3 stages: Queued, In Production, Completed
  const queuedTasks = filteredTasks.filter((t) => t.stage === 'queued');
  const inProductionTasks = filteredTasks.filter((t) => t.stage === 'in_production');
  const completedTasks = filteredTasks.filter((t) => t.stage === 'completed');

  // Requirement: Unprocessed customer orders that need to be sent to production line
  const unprocessedOrders = orders.filter((o) => o.status === 'unprocessed');

  // Handle stage transitions
  const handleMoveStage = (taskId: string, targetStage: ProductionStage, newPercent?: number) => {
    if (!canWrite) {
      showToast('error', 'خطای دسترسی: شما فقط دسترسی خواندنی (Read-Only) به خط تولید دارید.');
      return;
    }
    const res = StorageService.updateTaskStage(taskId, targetStage, newPercent, currentUser.name);
    if (res.success) {
      if (targetStage === 'completed') {
        showToast('success', 'تولید تکمیل شد و موجودی به صورت خودکار به انبار افزوده شد.');
      } else {
        showToast('success', 'وضعیت خط تولید به‌روزرسانی شد.');
      }
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در تغییر وضعیت');
    }
  };

  // Handle sending unprocessed order to production line
  const handleSendOrderToLine = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrderToDispatch) return;
    if (!canWrite) {
      showToast('error', 'شما مجوز ثبت در خط تولید ندارید.');
      return;
    }

    const res = StorageService.sendOrderToProduction(
      selectedOrderToDispatch.id,
      assignLine,
      Number(assignHours),
      assignOperator
    );

    if (res.success) {
      showToast('success', `سفارش ${selectedOrderToDispatch.orderNumber} با موفقیت به صف خط تولید افزوده شد.`);
      setSelectedOrderToDispatch(null);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در ارسال به خط تولید');
    }
  };

  // Handle creating manual production task
  const handleCreateManualTask = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canWrite) {
      showToast('error', 'مجوز ایجاد دستور تولید ندارید.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    if (!prod) {
      showToast('error', 'محصولی انتخاب نشده است.');
      return;
    }

    const res = StorageService.createManualProductionTask({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      quantity: Number(taskQuantity),
      unit: prod.unit,
      stage: 'queued',
      progressPercent: 0,
      priority: taskPriority,
      startDate: new Date().toISOString(),
      estimatedHours: Number(taskEstimatedHours),
      productionLine: taskProductionLine,
      operatorName: taskOperator,
      notes: taskNotes,
    });

    if (res.success) {
      showToast('success', 'دستور تولید جدید به صف ساخت افزوده شد.');
      setIsNewTaskModalOpen(false);
      onRefreshData();
    } else {
      showToast('error', res.error || 'خطا در ثبت');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-lg transition-all animate-fadeIn ${
            notification.type === 'success'
              ? isDark
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : isDark
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-sm transition-all ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  مدیریت و مانیتورینگ خط تولید
                </h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  پیگیری آنلاین مراحل ساخت (در صف تولید، در حال ساخت، تکمیل شده) و واریز خودکار به انبار
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Line */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:inline">فیلتر خط:</span>
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
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {canWrite && (
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت دستور تولید جدید</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* UNPROCESSED ORDERS ALERT SECTION */}
      {/* ------------------------------------------------------------- */}
      {unprocessedOrders.length > 0 && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <h3 className={`text-sm font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                سفارش‌های پردازش‌نشده مشتریان ({formatNumber(unprocessedOrders.length)} سفارش در انتظار خط تولید)
              </h3>
            </div>
            <span className="text-xs text-amber-500 font-medium">جهت شروع ساخت به خط تولید اختصاص دهید</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unprocessedOrders.map((ord) => {
              const priorityBadge = getPriorityBadge(ord.priority);
              return (
                <div
                  key={ord.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#18181B] border-amber-900/40' : 'bg-white border-amber-200 shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-amber-400">{ord.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}
                      >
                        {priorityBadge.label}
                      </span>
                    </div>

                    <div className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {ord.customerCompany || ord.customerName}
                    </div>

                    <div className="text-xs text-gray-400 space-y-1">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="truncate">{it.productName}</span>
                          <span className="font-mono font-bold text-gray-300">{it.quantity} {it.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {canWrite && (
                    <button
                      onClick={() => setSelectedOrderToDispatch(ord)}
                      className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-gray-950 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      تخصیص و ارسال به خط تولید
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3 PRODUCTION STAGES COLUMNS (صف، در حال ساخت، تکمیل شده) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STAGE 1: QUEUED (در صف تولید) */}
        <div className="space-y-3">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#121214] border-blue-900/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">۱. در صف تولید (Queued)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
              {formatNumber(queuedTasks.length)}
            </span>
          </div>

          <div className="space-y-3">
            {queuedTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400">{task.taskCode}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {task.orderNumber ? `سفارش: ${task.orderNumber}` : 'تولید آزاد'}
                  </span>
                </div>

                <h4 className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.productName}
                </h4>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>تعداد درخواستی:</span>
                  <span className="font-mono font-bold text-gray-200">{formatNumber(task.quantity)} {task.unit}</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                  <span>خط تولید:</span>
                  <span className="font-semibold text-blue-400">{task.productionLine}</span>
                </div>

                {canWrite && (
                  <button
                    onClick={() => handleMoveStage(task.id, 'in_production', 35)}
                    className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    شروع عملیات ساخت در خط
                  </button>
                )}
              </div>
            ))}

            {queuedTasks.length === 0 && (
              <div className={`p-8 text-center rounded-2xl border text-xs text-gray-500 ${
                isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
              }`}>
                هیچ سفارشی در صف تولید قرار ندارد.
              </div>
            )}
          </div>
        </div>

        {/* STAGE 2: IN PRODUCTION (در حال تولید) */}
        <div className="space-y-3">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#121214] border-indigo-900/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold">۲. در حال ساخت در خط تولید (Active)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400">
              {formatNumber(inProductionTasks.length)}
            </span>
          </div>

          <div className="space-y-3">
            {inProductionTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400">{task.taskCode}</span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    در حال اجرا
                  </span>
                </div>

                <h4 className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.productName}
                </h4>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>تعداد:</span>
                  <span className="font-mono font-bold text-gray-200">{formatNumber(task.quantity)} {task.unit}</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                  <span>اپراتور مسوول:</span>
                  <span className="font-semibold text-gray-300">{task.operatorName}</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>پیشرفت خط تولید:</span>
                    <span className="font-mono font-bold text-indigo-400">{task.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-teal-400 to-indigo-500 transition-all duration-500"
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                </div>

                {canWrite && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleMoveStage(task.id, 'in_production', Math.min(100, task.progressPercent + 25))}
                      className={`py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                        isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      + پیشرفت ساخت
                    </button>
                    <button
                      onClick={() => handleMoveStage(task.id, 'completed', 100)}
                      className="py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      تکمیل و ورود به انبار
                    </button>
                  </div>
                )}
              </div>
            ))}

            {inProductionTasks.length === 0 && (
              <div className={`p-8 text-center rounded-2xl border text-xs text-gray-500 ${
                isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
              }`}>
                هیچ خط تولید فعالی در این لحظه وجود ندارد.
              </div>
            )}
          </div>
        </div>

        {/* STAGE 3: COMPLETED (تکمیل شده & واریز به انبار) */}
        <div className="space-y-3">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#121214] border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">۳. تکمیل شده و آماده در انبار (Done)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
              {formatNumber(completedTasks.length)}
            </span>
          </div>

          <div className="space-y-3">
            {completedTasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">{task.taskCode}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Boxes className="w-3 h-3" />
                    اضافه شد به انبار
                  </span>
                </div>

                <h4 className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.productName}
                </h4>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>تعداد تولید شده:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{formatNumber(task.quantity)} {task.unit}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                  <span>تاریخ تکمیل:</span>
                  <span className="text-gray-300 font-mono text-[11px]">
                    {formatDateFa(task.completedDate || task.startDate)}
                  </span>
                </div>
              </div>
            ))}

            {completedTasks.length === 0 && (
              <div className={`p-8 text-center rounded-2xl border text-xs text-gray-500 ${
                isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
              }`}>
                هنوز محصولی در این دوره تکمیل نشده است.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL: ASSIGN UNPROCESSED ORDER TO LINE */}
      {selectedOrderToDispatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className={`rounded-2xl border max-w-lg w-full p-6 space-y-4 ${
              isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                تخصیص سفارش {selectedOrderToDispatch.orderNumber} به خط تولید
              </h3>
              <button
                onClick={() => setSelectedOrderToDispatch(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendOrderToLine} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">انتخاب خط تولید مجری</label>
                <select
                  value={assignLine}
                  onChange={(e) => setAssignLine(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                >
                  {productionLines.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name} ({l.department || 'سالن اصلی'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">زمان تخمینی ساخت (ساعت)</label>
                  <input
                    type="number"
                    min="1"
                    value={assignHours}
                    onChange={(e) => setAssignHours(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">اپراتور / سرپرست خط</label>
                  <input
                    type="text"
                    value={assignOperator}
                    onChange={(e) => setAssignOperator(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
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
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 cursor-pointer shadow-sm"
                >
                  تایید و شروع صف تولید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE MANUAL PRODUCTION TASK */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className={`rounded-2xl border max-w-lg w-full p-6 space-y-4 ${
              isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ثبت دستور کار تولید آزاد (موجودی انبار)
              </h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">انتخاب محصول هدف</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (کد: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">تیراژ / تعداد تولید</label>
                  <input
                    type="number"
                    min="1"
                    value={taskQuantity}
                    onChange={(e) => setTaskQuantity(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                      isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">اولویت ساخت</label>
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">خط تولید مجری</label>
                <select
                  value={taskProductionLine}
                  onChange={(e) => setTaskProductionLine(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                >
                  {productionLines.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className={`px-4 py-2 text-xs rounded-xl border cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm"
                >
                  ثبت در صف خط تولید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
