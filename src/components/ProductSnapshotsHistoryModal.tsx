import React, { useState } from "react";
import { ProductSnapshot, ThemeMode } from "../types";
import { StorageService } from "../services/storageService";
import {
  formatCurrency,
  formatNumber,
  formatDateFa,
} from "../utils/formatters";
import { ProductSnapshotModal } from "./ProductSnapshotModal";
import {
  History,
  X,
  Search,
  Truck,
  Factory,
  Eye,
  Archive,
  RefreshCw,
} from "lucide-react";

interface ProductSnapshotsHistoryModalProps {
  productId?: string;
  productName?: string;
  onClose: () => void;
  theme?: ThemeMode;
}

export const ProductSnapshotsHistoryModal: React.FC<
  ProductSnapshotsHistoryModalProps
> = ({ productId, productName, onClose, theme = "dark" }) => {
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<ProductSnapshot | null>(null);

  const allSnapshots = productId
    ? StorageService.getProductSnapshots(productId)
    : StorageService.getProductSnapshots();

  const filteredSnapshots = allSnapshots.filter((snap) => {
    const q = searchQuery.toLowerCase().trim();
    const capturedBy = snap.operatorOrUser || snap.capturedBy || "";
    const snapReason = snap.context || snap.snapshotReason || "";
    const matchesSearch =
      !q ||
      snap.productName.toLowerCase().includes(q) ||
      snap.sku.toLowerCase().includes(q) ||
      (snap.referenceCode && snap.referenceCode.toLowerCase().includes(q)) ||
      capturedBy.toLowerCase().includes(q);

    const matchesReason = reasonFilter === "all" || snapReason === reasonFilter;

    return matchesSearch && matchesReason;
  });

  const reasonLabels: Record<
    string,
    { label: string; color: string; icon: any }
  > = {
    production_completed: {
      label: "اتمام تولید",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: Factory,
    },
    order_dispatched: {
      label: "ارسال به مشتری",
      color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      icon: Truck,
    },
    line_change: {
      label: "تغییر وضعیت / فعال‌سازی",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: RefreshCw,
    },
    discontinued: {
      label: "توقف تولید / بایگانی",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: Archive,
    },
    manual_archive: {
      label: "بایگانی دستی",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      icon: History,
    },
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fadeIn">
        <div
          className={`rounded-2xl border max-w-4xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col ${
            isDark
              ? "bg-[#121214] border-[#27272A] text-gray-200"
              : "bg-white border-gray-200 text-gray-800"
          }`}
        >
          {/* Header */}
          <div
  className={`flex items-center justify-between border-b pb-4 shrink-0 ${
    isDark ? "border-[#1F2937]" : "border-slate-200"
  }`}
>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl   bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2
                  className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  تاریخچه اسنپ‌شات‌های ثبت‌شده در پایگاه‌داده
                  {productName ? ` (${productName})` : ""}
                </h2>
                <p
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  ردیابی جامع و دائمی تغییرات، هزینه‌ها، مشخصات و رکوردهای ارسال
                  و تولید محصول
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? "bg-[#18181B] border-[#27272A] text-gray-400 hover:text-white"
                  : "bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Bar */}
          <div
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
              isDark
                ? "bg-[#18181B] border-[#27272A]"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="relative w-full sm:w-72">
              <Search
                className={`w-3.5 h-3.5 absolute right-3 top-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              />
              <input
                type="text"
                placeholder="جستجو در اسنپ‌شات‌ها (کد کالا، شماره دستور، کاربر)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-8 pl-3 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark
                    ? "bg-[#121214] border-[#27272A] text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                نوع رویداد:
              </span>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark
                    ? "bg-[#121214] border-[#27272A] text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="all">همه رویدادها</option>
                <option value="production_completed">اتمام تولید</option>
                <option value="order_dispatched">ارسال به مشتری</option>
                <option value="line_change">تغییر وضعیت / فعال‌سازی</option>
                <option value="discontinued">توقف تولید / بایگانی</option>
              </select>
            </div>
          </div>

          {/* Snapshots Table / List */}
          <div
  className={`overflow-y-auto flex-1 border rounded-xl ${
    isDark ? "border-[#1F2937]" : "border-slate-200"
  }`}
>
            <table className="w-full text-right text-xs">
              <thead
  className={`sticky top-0 border-b z-10 ${
    isDark
      ? "bg-[#18181B] border-[#1F2937]"
      : "bg-slate-50 border-slate-200"
  }`}
>
                <tr className={isDark ? "text-gray-400" : "text-gray-500"}>
                  <th className="py-2.5 px-3 font-semibold">شناسه / زمان</th>
                  <th className="py-2.5 px-3 font-semibold">رویداد</th>
                  <th className="py-2.5 px-3 font-semibold">نام و کد کالا</th>
                  <th className="py-2.5 px-3 font-semibold">تیراژ</th>
                  <th className="py-2.5 px-3 font-semibold">بهای تمام‌شده</th>
                  <th className="py-2.5 px-3 font-semibold">قیمت فروش</th>
                  <th className="py-2.5 px-3 font-semibold">مسئول / رفرنس</th>
                  <th className="py-2.5 px-3 font-semibold text-center">
                    جزئیات
                  </th>
                </tr>
              </thead>
              <tbody
  className={`divide-y ${
    isDark ? "divide-[#1F2937]" : "divide-slate-200"
  }`}
>
                {filteredSnapshots.map((snap) => {
                  const snapContext =
                    snap.context || snap.snapshotReason || "manual_archive";
                  const reason = reasonLabels[snapContext] || {
                    label: snapContext,
                    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
                    icon: History,
                  };
                  const Icon = reason.icon;
                  const capturedDate =
                    snap.snapshotTakenAt ||
                    snap.timestamp ||
                    snap.capturedAt ||
                    "";
                  const operator =
                    snap.operatorOrUser || snap.capturedBy || "کاربر سیستم";
                  const qty =
                    snap.producedQuantity !== undefined
                      ? snap.producedQuantity
                      : snap.quantity !== undefined
                        ? snap.quantity
                        : 0;

                  return (
                    <tr
                      key={snap.id}
                      className={`transition-colors ${
                        isDark ? "hover:bg-[#18181B]/80" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">
                        <div>{formatDateFa(capturedDate)}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {snap.id.substring(0, 14)}...
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${reason.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          {reason.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div
                          className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-900"}`}
                        >
                          {snap.productName}
                        </div>
                        <div className="font-mono text-[10px] text-blue-400">
                          {snap.sku}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                        {formatNumber(qty)} {snap.unit}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-blue-400">
                        {formatCurrency(snap.unitCost)}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                        {formatCurrency(snap.unitSalePrice)}
                      </td>

                      <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                        <div>{operator}</div>
                        {snap.referenceCode && (
                          <div className="font-mono text-[10px] text-indigo-400">
                            {snap.referenceCode}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedSnapshot(snap)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredSnapshots.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-500">
                هیچ اسنپ‌شاتی با فیلترهای انتخابی یافت نشد.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 shrink-0 text-xs text-gray-400">
            <span className={isDark ? "text-gray-400" : "text-slate-600"}>
  مجموع اسنپ‌شات‌های ثبت‌شده:
  <b className={isDark ? "text-gray-200" : "text-slate-900"}> </b>
            </span>
            <button
              onClick={onClose}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl border cursor-pointer ${
  isDark
    ? "bg-[#18181B] border-[#1F2937] text-gray-300 hover:text-white"
    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
}`}
            >
              بستن
            </button>
          </div>
        </div>
      </div>

      {selectedSnapshot && (
        <ProductSnapshotModal
          snapshot={selectedSnapshot}
          onClose={() => setSelectedSnapshot(null)}
          theme={theme}
        />
      )}
    </>
  );
};
