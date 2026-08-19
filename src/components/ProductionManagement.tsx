import React, { useState } from "react";
import {
  Factory,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  Plus,
  Boxes,
  Sparkles,
  Send,
  CheckCircle2,
} from "lucide-react";
import {
  ProductionTask,
  CustomerOrder,
  WarehouseProduct,
  AppUser,
  ProductionStage,
  ThemeMode,
} from "../types";
import { StorageService } from "../services/storageService";
import { formatNumber, formatDateFa, getPriorityBadge } from "../utils/formatters";

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
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  /* -------------------------------------------------
     State
  ------------------------------------------------- */

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedOrderToDispatch, setSelectedOrderToDispatch] =
    useState<CustomerOrder | null>(null);
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>("all");

  const productionLines = StorageService.getProductionLines();

  // Assign form
  const [assignLine, setAssignLine] = useState(
    productionLines[0]?.name || "خط مونتاژ عمومی",
  );
  const [assignHours, setAssignHours] = useState(14);
  const [assignOperator, setAssignOperator] = useState("اپراتور شیفت روزانه");

  // Manual New Task Form State
  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id || "",
  );
  const [taskQuantity, setTaskQuantity] = useState(10);
  const [taskPriority, setTaskPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [taskProductionLine, setTaskProductionLine] = useState(
    productionLines[0]?.name || "خط ماشین‌کاری و CNC",
  );
  const [taskEstimatedHours, setTaskEstimatedHours] = useState(16);
  const [taskOperator, setTaskOperator] = useState("تیم فنی خط ۱");
  const [taskNotes, setTaskNotes] = useState("");

  // Toast / Feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  /* -------------------------------------------------
     Permissions
  ------------------------------------------------- */

  const canWrite = StorageService.checkPermission(
    "production",
    "write",
    currentUser,
  );
  const canRead = StorageService.checkPermission(
    "production",
    "read",
    currentUser,
  );

  /* -------------------------------------------------
     Filter / Group
  ------------------------------------------------- */

  const filteredTasks = tasks.filter((t) => {
    if (selectedLineFilter === "all") return true;
    return t.productionLine === selectedLineFilter;
  });

  const queuedTasks = filteredTasks.filter((t) => t.stage === "queued");
  const inProductionTasks = filteredTasks.filter(
    (t) => t.stage === "in_production",
  );
  const completedTasks = filteredTasks.filter((t) => t.stage === "completed");

  const unprocessedOrders = orders.filter((o) => o.status === "unprocessed");

  /* -------------------------------------------------
     Handlers (unchanged logic)
  ------------------------------------------------- */

  const handleMoveStage = (
    taskId: string,
    targetStage: ProductionStage,
    newPercent?: number,
  ) => {
    if (!canWrite) {
      showToast(
        "error",
        "خطای دسترسی: شما فقط دسترسی خواندنی (Read-Only) به خط تولید دارید.",
      );
      return;
    }
    const res = StorageService.updateTaskStage(
      taskId,
      targetStage,
      newPercent,
      currentUser.name,
    );
    if (res.success) {
      if (targetStage === "completed") {
        showToast(
          "success",
          "تولید تکمیل شد و موجودی به صورت خودکار به انبار افزوده شد.",
        );
      } else {
        showToast("success", "وضعیت خط تولید به‌روزرسانی شد.");
      }
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در تغییر وضعیت");
    }
  };

  const handleSendOrderToLine = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrderToDispatch) return;
    if (!canWrite) {
      showToast("error", "شما مجوز ثبت در خط تولید ندارید.");
      return;
    }

    const res = StorageService.sendOrderToProduction(
      selectedOrderToDispatch.id,
      assignLine,
      Number(assignHours),
      assignOperator,
    );

    if (res.success) {
      showToast(
        "success",
        `سفارش ${selectedOrderToDispatch.orderNumber} با موفقیت به صف خط تولید افزوده شد.`,
      );
      setSelectedOrderToDispatch(null);
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در ارسال به خط تولید");
    }
  };

  const handleCreateManualTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canWrite) {
      showToast("error", "مجوز ایجاد دستور تولید ندارید.");
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    if (!prod) {
      showToast("error", "محصولی انتخاب نشده است.");
      return;
    }

    const res = StorageService.createManualProductionTask({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      quantity: Number(taskQuantity),
      unit: prod.unit,
      stage: "queued",
      progressPercent: 0,
      priority: taskPriority,
      startDate: new Date().toISOString(),
      estimatedHours: Number(taskEstimatedHours),
      productionLine: taskProductionLine,
      operatorName: taskOperator,
      notes: taskNotes,
    });

    if (res.success) {
      showToast("success", "دستور تولید جدید به صف ساخت افزوده شد.");
      setIsNewTaskModalOpen(false);
      onRefreshData();
    } else {
      showToast("error", res.error || "خطا در ثبت");
    }
  };

  /* -------------------------------------------------
     Stage visual tokens (queued / active / completed)
  ------------------------------------------------- */

  const stageTokens = {
    queued: {
      badgeBg: isDark ? "bg-amber-500/10" : "bg-amber-50",
      badgeText: isDark ? "text-amber-400" : "text-amber-700",
      badgeBorder: isDark ? "border-amber-500/20" : "border-amber-200",
      countBg: isDark ? "bg-amber-500/15" : "bg-amber-100",
      countText: isDark ? "text-amber-400" : "text-amber-700",
    },
    active: {
      badgeBg: isDark ? "bg-blue-500/10" : "bg-blue-50",
      badgeText: isDark ? "text-blue-400" : "text-blue-700",
      badgeBorder: isDark ? "border-blue-500/20" : "border-blue-200",
      countBg: isDark ? "bg-blue-500/15" : "bg-blue-100",
      countText: isDark ? "text-blue-400" : "text-blue-700",
    },
    completed: {
      badgeBg: isDark ? "bg-blue-500/10" : "bg-emerald-50",
      badgeText: isDark ? "text-emerald-400" : "text-emerald-700",
      badgeBorder: isDark ? "border-emerald-500/20" : "border-emerald-200",
      countBg: isDark ? "bg-emerald-500/15" : "bg-emerald-100",
      countText: isDark ? "text-emerald-400" : "text-emerald-700",
    },
  };

  const cardBase = isDark
    ? "bg-[#111827] border-[#1F2937]"
    : "bg-white border-slate-200 shadow-slate-100";

  const taskCardBase = isDark
    ? "bg-[#0B0F17] border-[#1F2937]"
    : "bg-white border-slate-200 shadow-xs";

  // Config for the 3-stage production stepper (rail + nodes)
  const stageMeta = [
    {
      key: "queued",
      n: "۱",
      icon: Clock,
      iconColor: "text-amber-500",
      title: "در صف تولید",
      desc: "منتظر شروع ساخت در خط",
      tokens: stageTokens.queued,
      count: queuedTasks.length,
    },
    {
      key: "active",
      n: "۲",
      icon: Play,
      iconColor: "text-blue-500",
      title: "در حال ساخت",
      desc: "در حال اجرا روی خط تولید",
      tokens: stageTokens.active,
      count: inProductionTasks.length,
    },
    {
      key: "completed",
      n: "۳",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      title: "تکمیل و در انبار",
      desc: "واریز خودکار به موجودی انبار",
      tokens: stageTokens.completed,
      count: completedTasks.length,
    },
  ];

  /* -------------------------------------------------
     Render
  ------------------------------------------------- */

  return (
    <div className="space-y-5">
      {/*
          TOAST
         */}

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

      {/*
          HEADER CARD
         */}

      <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h1
                className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-950"}`}
              >
                مدیریت و مانیتورینگ خط تولید
              </h1>
              <p
                className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-700 font-medium"}`}
              >
                پیگیری آنلاین مراحل ساخت و واریز خودکار محصول تکمیل‌شده به انبار
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs hidden sm:inline ${isDark ? "text-gray-400" : "text-slate-600 font-medium"}`}
              >
                فیلتر خط:
              </span>
              <select
                value={selectedLineFilter}
                onChange={(e) => setSelectedLineFilter(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer font-medium ${
                  isDark
                    ? "bg-[#18181B] border-[#1F2937] text-gray-200 focus:border-blue-500"
                    : "bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-600"
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت دستور تولید جدید</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/*
          UNPROCESSED ORDERS ALERT
         */}

      {unprocessedOrders.length > 0 && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark
              ? "bg-amber-950/20 border-amber-800/40"
              : "bg-amber-50/70 border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h3
                className={`text-sm font-bold ${isDark ? "text-amber-300" : "text-amber-900"}`}
              >
                سفارش‌های پردازش‌نشده مشتریان ({formatNumber(unprocessedOrders.length)} سفارش در انتظار خط تولید)
              </h3>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-500 font-semibold">
              جهت شروع ساخت به خط تولید اختصاص دهید
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unprocessedOrders.map((ord) => {
              const priorityBadge = getPriorityBadge(ord.priority);
              return (
                <div
                  key={ord.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isDark
                      ? "bg-[#111827] border-amber-900/40"
                      : "bg-white border-amber-200 shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}
                      >
                        {priorityBadge.label}
                      </span>
                    </div>

                    <div
                      className={`text-xs font-bold ${isDark ? "text-gray-200" : "text-slate-950"}`}
                    >
                      {ord.customerCompany || ord.customerName}
                    </div>

                    <div
                      className={`space-y-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}
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

      {/*
          PRODUCTION FLOW — ۱. صف  →  ۲. ساخت  →  ۳. انبار
         */}

      <div className={`p-6 rounded-2xl border shadow-xs ${cardBase}`}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h2
            className={`text-base font-bold ${isDark ? "text-white" : "text-slate-950"}`}
          >
            مسیر فرآیند تولید
          </h2>
        </div>
        <p
          className={`text-xs mb-6 ${isDark ? "text-gray-400" : "text-slate-700 font-medium"}`}
        >
          هر دستور تولید این سه مرحله را به ترتیب طی می‌کند: از صف، به خط ساخت، تا ورود خودکار به انبار
        </p>

        {/* ---- Stage stepper (rail) — desktop: horizontal, mobile: vertical ---- */}
        <div className="hidden lg:grid grid-cols-3 relative mb-7">
          <div
            className={`absolute top-5 h-0.5 bg-gradient-to-l from-amber-400 via-blue-400 to-blue-400 ${
              isDark ? "opacity-25" : "opacity-30"
            }`}
            style={{ insetInlineStart: "16.6667%", insetInlineEnd: "16.6667%" }}
          />
          {stageMeta.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex flex-col items-center text-center px-3">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold z-10 ${s.tokens.badgeBg} ${s.tokens.badgeText} ${s.tokens.badgeBorder} ${
                    isDark ? "ring-4 ring-[#111827]" : "ring-4 ring-white"
                  }`}
                >
                  {s.n}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${s.iconColor}`} />
                  <h3
                    className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-950"}`}
                  >
                    {s.title}
                  </h3>
                </div>
                <p
                  className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-600"}`}
                >
                  {s.desc}
                </p>
                <span
                  className={`mt-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${s.tokens.countBg} ${s.tokens.countText}`}
                >
                  {formatNumber(s.count)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="lg:hidden flex flex-col mb-6">
          {stageMeta.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.key}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 shrink-0 rounded-full border-2 flex items-center justify-center text-sm font-bold ${s.tokens.badgeBg} ${s.tokens.badgeText} ${s.tokens.badgeBorder}`}
                  >
                    {s.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${s.iconColor}`} />
                        <h3
                          className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-950"}`}
                        >
                          {s.title}
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${s.tokens.countBg} ${s.tokens.countText}`}
                      >
                        {formatNumber(s.count)}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-600"}`}
                    >
                      {s.desc}
                    </p>
                  </div>
                </div>
                {idx < stageMeta.length - 1 && (
                  <div className="w-10 flex justify-center py-1">
                    <div
                      className={`w-0.5 h-4 ${isDark ? "bg-[#27272A]" : "bg-slate-200"}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ---- Task cards for each stage, aligned under their stepper node ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* STAGE 1: QUEUED */}
          <div className="space-y-3">
            {queuedTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${taskCardBase}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {task.taskCode}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${isDark ? "text-gray-400" : "text-slate-500"}`}
                  >
                    {task.orderNumber ? `سفارش: ${task.orderNumber}` : "تولید آزاد"}
                  </span>
                </div>

                <h4
                  className={`text-sm font-bold mt-2 ${isDark ? "text-white" : "text-slate-950"}`}
                >
                  {task.productName}
                </h4>

                <div
                  className={`mt-2 flex items-center justify-between text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}
                >
                  <span>تعداد درخواستی:</span>
                  <span
                    className={`font-mono font-bold ${isDark ? "text-gray-200" : "text-slate-900"}`}
                  >
                    {formatNumber(task.quantity)} {task.unit}
                  </span>
                </div>

                <div
                  className={`mt-1 flex items-center justify-between text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}
                >
                  <span>خط تولید:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {task.productionLine}
                  </span>
                </div>

                {canWrite && (
                  <button
                    onClick={() => handleMoveStage(task.id, "in_production", 35)}
                    className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    شروع عملیات ساخت در خط
                  </button>
                )}
              </div>
            ))}

            {queuedTasks.length === 0 && (
              <div
                className={`p-8 text-center rounded-2xl border text-xs ${
                  isDark
                    ? "bg-[#0B0F17] border-[#1F2937] text-gray-500"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                هیچ سفارشی در صف تولید قرار ندارد.
              </div>
            )}
          </div>

          {/* STAGE 2: IN PRODUCTION */}
          <div className="space-y-3">
            {inProductionTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${taskCardBase}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {task.taskCode}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    در حال اجرا
                  </span>
                </div>

                <h4
                  className={`text-sm font-bold mt-2 ${isDark ? "text-white" : "text-slate-950"}`}
                >
                  {task.productName}
                </h4>

                <div
                  className={`mt-2 flex items-center justify-between text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}
                >
                  <span>تعداد:</span>
                  <span
                    className={`font-mono font-bold ${isDark ? "text-gray-200" : "text-slate-900"}`}
                  >
                    {formatNumber(task.quantity)} {task.unit}
                  </span>
                </div>

                <div
                  className={`mt-1 flex items-center justify-between text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}
                >
                  <span>اپراتور مسوول:</span>
                  <span
                    className={`font-semibold ${isDark ? "text-gray-300" : "text-slate-800"}`}
                  >
                    {task.operatorName}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div
                    className={`flex items-center justify-between text-[11px] ${isDark ? "text-gray-400" : "text-slate-600"}`}
                  >
                    <span>پیشرفت خط تولید:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {task.progressPercent}%
                    </span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-800" : "bg-slate-200"}`}
                  >
                    <div
                      className="h-full bg-gradient-to-l from-blue-400 to-blue-600 transition-all duration-500"
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                </div>

                {canWrite && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        handleMoveStage(
                          task.id,
                          "in_production",
                          Math.min(100, task.progressPercent + 25),
                        )
                      }
                      className={`py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                        isDark
                          ? "bg-[#18181B] border-[#1F2937] text-gray-300"
                          : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      + پیشرفت ساخت
                    </button>
                    <button
                      onClick={() => handleMoveStage(task.id, "completed", 100)}
                      className="py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      تکمیل و ورود به انبار
                    </button>
                  </div>
                )}
              </div>
            ))}

            {inProductionTasks.length === 0 && (
              <div
                className={`p-8 text-center rounded-2xl border text-xs ${
                  isDark
                    ? "bg-[#0B0F17] border-[#1F2937] text-gray-500"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                هیچ خط تولید فعالی در این لحظه وجود ندارد.
              </div>
            )}
          </div>

          {/* STAGE 3: COMPLETED */}
          <div className="space-y-3">
            {completedTasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${taskCardBase}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {task.taskCode}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Boxes className="w-3 h-3" />
                    اضافه شد به انبار
                  </span>
                </div>

                <h4
                  className={`text-sm font-bold mt-2 ${isDark ? "text-white" : "text-slate-950"}`}
                >
                  {task.productName}
                </h4>

                <div
                  className={`mt-2 flex items-center justify-between text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}
                >
                  <span>تعداد تولید شده:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    +{formatNumber(task.quantity)} {task.unit}
                  </span>
                </div>

                <div
                  className={`mt-1 flex items-center justify-between text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}
                >
                  <span>تاریخ تکمیل:</span>
                  <span
                    className={`font-mono text-[11px] ${isDark ? "text-gray-300" : "text-slate-700"}`}
                  >
                    {formatDateFa(task.completedDate || task.startDate)}
                  </span>
                </div>
              </div>
            ))}

            {completedTasks.length === 0 && (
              <div
                className={`p-8 text-center rounded-2xl border text-xs ${
                  isDark
                    ? "bg-[#0B0F17] border-[#1F2937] text-gray-500"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                هنوز محصولی در این دوره تکمیل نشده است.
              </div>
            )}
          </div>
        </div>
      </div>

      {/*
          MODAL: ASSIGN UNPROCESSED ORDER TO LINE
         */}

      {selectedOrderToDispatch && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setSelectedOrderToDispatch(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl border max-w-lg w-full p-6 space-y-4 ${
              isDark
                ? "bg-[#121214] border-[#27272A] text-gray-200"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}
              >
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
                <label className="text-xs font-semibold">
                  انتخاب خط تولید مجری
                </label>
                <select
                  value={assignLine}
                  onChange={(e) => setAssignLine(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark
                      ? "bg-[#18181B] border-[#1F2937] text-white"
                      : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                >
                  {productionLines.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name} ({l.department || "سالن اصلی"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    زمان تخمینی ساخت (ساعت)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={assignHours}
                    onChange={(e) => setAssignHours(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937] text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    اپراتور / سرپرست خط
                  </label>
                  <input
                    type="text"
                    value={assignOperator}
                    onChange={(e) => setAssignOperator(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937] text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
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
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-gray-950 cursor-pointer shadow-sm"
                >
                  تایید و شروع صف تولید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*
          MODAL: CREATE MANUAL PRODUCTION TASK
         */}

      {isNewTaskModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setIsNewTaskModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl border max-w-lg w-full p-6 space-y-4 ${
              isDark
                ? "bg-[#121214] border-[#27272A] text-gray-200"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"}`}
              >
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
                <label className="text-xs font-semibold">انتخاب محصول هدف</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark
                      ? "bg-[#18181B] border-[#1F2937] text-white"
                      : "bg-slate-50 border-slate-300 text-slate-900"
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
                  <label className="text-xs font-semibold">تیراژ / تعداد تولید</label>
                  <input
                    type="number"
                    min="1"
                    value={taskQuantity}
                    onChange={(e) => setTaskQuantity(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937] text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">اولویت ساخت</label>
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                      isDark
                        ? "bg-[#18181B] border-[#1F2937] text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
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
                <label className="text-xs font-semibold">خط تولید مجری</label>
                <select
                  value={taskProductionLine}
                  onChange={(e) => setTaskProductionLine(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark
                      ? "bg-[#18181B] border-[#1F2937] text-white"
                      : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                >
                  {productionLines.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`flex items-center justify-end gap-3 pt-3 border-t ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}
              >
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
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
