import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Save,
  X,
} from 'lucide-react';

import {
  AppUser,
  UserRole,
  ModuleName,
  ThemeMode,
} from '../types';

import { StorageService } from '../services/storageService';

interface SecurityRBACProps {
  currentUser: AppUser;
  roles: UserRole[];
  onRefreshData: () => void;
  theme?: ThemeMode;
}

export const SecurityRBAC: React.FC<SecurityRBACProps> = ({
  currentUser,
  roles,
  onRefreshData,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const users = StorageService.getUsers();

  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser.id
  );

  const [
    editingPermissions,
    setEditingPermissions,
  ] = useState<
    Record<
      ModuleName,
      {
        read: boolean;
        write: boolean;
      }
    > | null
  >(null);

  // --------------------------------------------------
  // New User Modal
  // --------------------------------------------------

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  const [newUserRole, setNewUserRole] = useState(
    roles[1]?.id || 'prod_manager'
  );

  // --------------------------------------------------
  // Security Permission
  // --------------------------------------------------

  const canManageSecurity = StorageService.checkPermission(
    'users',
    'write',
    currentUser
  );

  // --------------------------------------------------
  // Selected User
  // --------------------------------------------------

  const selectedUser =
    users.find((u) => u.id === selectedUserId) || users[0];

  const selectedUserRole = roles.find(
    (r) => r.id === selectedUser?.roleId
  );

  // --------------------------------------------------
  // Effective Permissions
  // --------------------------------------------------

  const effectivePermissions: Record<
    ModuleName,
    {
      read: boolean;
      write: boolean;
    }
  > =
    editingPermissions ||
    selectedUser?.customPermissions ||
    selectedUserRole?.permissions || {
      products: {
        read: false,
        write: false,
      },
      production: {
        read: false,
        write: false,
      },
      orders: {
        read: false,
        write: false,
      },
      warehouse: {
        read: false,
        write: false,
      },
      reports: {
        read: false,
        write: false,
      },
      users: {
        read: false,
        write: false,
      },
    };

  // --------------------------------------------------
  // Module Labels
  // --------------------------------------------------

  const moduleLabels: Record<
    ModuleName,
    {
      name: string;
      desc: string;
    }
  > = {
    products: {
      name: 'محصولات و خطوط',
      desc: 'تعریف کالا، افزودن دسته‌بندی و خطوط تولید اختصاصی',
    },

    production: {
      name: 'مدیریت خط تولید',
      desc: 'مانیتورینگ و تغییر وضعیت صف، در حال تولید و تکمیل',
    },

    orders: {
      name: 'سفارش‌های مشتریان',
      desc: 'ثبت، صف‌بندی و انتقال سفارش‌ها به خطوط تولید',
    },

    warehouse: {
      name: 'انبار و لجستیک',
      desc: 'اصلاح موجودی، واریز تولید و صدور بارنامه ارسال به مشتری',
    },

    reports: {
      name: 'گزارش‌ها و نمودارها',
      desc: 'مشاهده آمار فروش، راندمان کارخانه و فایل اکسل',
    },

    users: {
      name: 'دسترسی و امنیت',
      desc: 'مدیریت نقش‌ها، کاربران و ماتریس Read / Write',
    },
  };

  // --------------------------------------------------
  // Toggle Permission
  // --------------------------------------------------

  const handleTogglePermission = (
    module: ModuleName,
    type: 'read' | 'write'
  ) => {
    if (!canManageSecurity) {
      alert(
        'خطای دسترسی: شما مجوز ویرایش ماتریس دسترسی را ندارید.'
      );
      return;
    }

    const currentModulePerm =
      effectivePermissions[module] || {
        read: false,
        write: false,
      };

    const newValue = !currentModulePerm[type];

    const updated = {
      ...effectivePermissions,

      [module]: {
        ...currentModulePerm,

        [type]: newValue,

        // Write همیشه به Read نیاز دارد
        ...(type === 'write' && newValue
          ? {
              read: true,
            }
          : {}),

        // اگر Read خاموش شود، Write هم باید خاموش شود
        ...(type === 'read' && !newValue
          ? {
              write: false,
            }
          : {}),
      },
    };

    setEditingPermissions(updated);
  };

  // --------------------------------------------------
  // Save Permissions
  // --------------------------------------------------

  const handleSavePermissions = () => {
    if (!canManageSecurity || !editingPermissions || !selectedUser) {
      return;
    }

    StorageService.updateUserPermissions(
      selectedUserId,
      editingPermissions
    );

    setEditingPermissions(null);

    onRefreshData();

    alert(
      `مجوزهای دسترسی کاربر «${selectedUser.name}» با موفقیت ذخیره شد.`
    );
  };

  // --------------------------------------------------
  // Create User
  // --------------------------------------------------

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageSecurity) {
      alert('شما مجوز ایجاد کاربر جدید را ندارید.');
      return;
    }

    if (!newUserName.trim()) {
      alert('لطفاً نام کاربر را وارد کنید.');
      return;
    }

    const res = StorageService.createUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),

      // Default values
      department: 'واحد عملیات و تولید',
      roleId: newUserRole,
      avatar: '👨‍💼',
      isActive: true,
    });

    if (res.success && res.user) {
      setIsNewUserModalOpen(false);

      setNewUserName('');
      setNewUserEmail('');

      setNewUserRole(
        roles[1]?.id || 'prod_manager'
      );

      setSelectedUserId(res.user.id);

      setEditingPermissions(null);

      onRefreshData();

      alert(
        `کاربر جدید «${res.user.name}» با موفقیت اضافه شد.`
      );
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="space-y-6">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div
        className={`p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#111113] border-white/[0.06]'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Title */}
          <div className="flex items-center gap-3">

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div>
              <h1
                className={`text-2xl font-bold tracking-tight ${
                  isDark
                    ? 'text-white'
                    : 'text-gray-900'
                }`}
              >
                ماتریس کنترل دسترسی و امنیت
              </h1>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}
              >
                مدیریت نقش‌ها و مجوزهای دسترسی کاربران به ماژول‌های سامانه
              </p>
            </div>

          </div>

          {/* Add User */}
          {canManageSecurity && (
            <button
              type="button"
              onClick={() =>
                setIsNewUserModalOpen(true)
              }
              className={`px-4 py-2.5 rounded-xl text-xs cursor-pointer font-semibold flex items-center gap-2 transition-colors ${
                isDark
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-blue-500 text-white hover:bg-blue-500'
              }`}
            >
              <Plus className="w-4 h-4" />

              <span>
                افزودن کاربر جدید
              </span>
            </button>
          )}

        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===================================================
            USER LIST
        =================================================== */}

        <div
          className={`p-5 rounded-2xl border ${
            isDark
              ? 'bg-[#121214] border-white/[0.06]'
              : 'bg-white border-gray-200'
          }`}
        >

          <div className="mb-4">
            <h3
              className={`text-sm font-bold ${
                isDark
                  ? 'text-gray-200'
                  : 'text-gray-800'
              }`}
            >
              کاربران سامانه
            </h3>

            <p
              className={`text-[11px] mt-1 ${
                isDark
                  ? 'text-gray-500'
                  : 'text-gray-500'
              }`}
            >
              کاربر موردنظر را برای مشاهده و مدیریت دسترسی انتخاب کنید.
            </p>
          </div>

          <div className="space-y-2">

            {users.map((u) => {
              const role = roles.find(
                (r) => r.id === u.roleId
              );

              const isSelected =
                u.id === selectedUserId;

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setEditingPermissions(null);
                  }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-all border ${
                    isSelected
                      ? isDark
                        ? 'bg-white/[0.06] text-white border-blue-500/50'
                        : 'bg-blue-50 text-gray-900 border-blue-300'
                      : isDark
                      ? 'bg-[#18181B] border-white/[0.06] text-gray-300 hover:bg-[#202023] hover:border-white/[0.1]'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >


                  {/* User Info */}
                  <div className="flex-1 min-w-0">

                    <div className="text-xs font-bold truncate">
                      {u.name}
                    </div>

                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        isSelected
                          ? isDark
                            ? 'text-blue-300'
                            : 'text-blue-600'
                          : isDark
                          ? 'text-gray-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {role?.titleFa || 'بدون نقش'}
                      {' • '}
                      {u.department}
                    </div>

                  </div>


                </button>
              );
            })}

          </div>
        </div>

        {/* ===================================================
            PERMISSION MATRIX
        =================================================== */}

        <div
          className={`lg:col-span-2 p-6 rounded-2xl border ${
            isDark
              ? 'bg-[#121214] border-white/[0.06]'
              : 'bg-white border-gray-200'
          }`}
        >

          {/* Matrix Header */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b ${
              isDark
                ? 'border-white/[0.06]'
                : 'border-gray-200'
            }`}
          >

            <div>

              <h3
                className={`text-sm font-bold ${
                  isDark
                    ? 'text-white'
                    : 'text-gray-900'
                }`}
              >
                ماتریس دسترسی
                {selectedUser
                  ? `: ${selectedUser.name}`
                  : ''}
              </h3>

              <p
                className={`text-xs mt-1 ${
                  isDark
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}
              >
                نقش پایه:{' '}

                <span
                  className={`font-bold ${
                    isDark
                      ? 'text-blue-400'
                      : 'text-blue-600'
                  }`}
                >
                  {selectedUserRole?.titleFa ||
                    'بدون نقش'}
                </span>
              </p>

            </div>

            {/* Save */}
            {editingPermissions &&
              canManageSecurity && (
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />

                  <span>
                    ذخیره تغییرات
                  </span>
                </button>
              )}

          </div>

          {/* Matrix */}
          <div className="overflow-x-auto">

            <table className="w-full text-right text-xs">

              <thead>
                <tr
                  className={`border-b ${
                    isDark
                      ? 'border-white/[0.06] text-gray-400'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >

                  <th className="py-3 px-3 font-semibold">
                    بخش / ماژول
                  </th>

                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                    مجوز خواندن
                    <span className="opacity-60">
                      {' '}
                      (Read)
                    </span>
                  </th>

                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                    مجوز ویرایش
                    <span className="opacity-60">
                      {' '}
                      (Write)
                    </span>
                  </th>

                </tr>
              </thead>

              <tbody
                className={`divide-y ${
                  isDark
                    ? 'divide-white/[0.05]'
                    : 'divide-gray-100'
                }`}
              >

                {(Object.keys(
                  moduleLabels
                ) as ModuleName[]).map(
                  (mod) => {
                    const perm =
                      effectivePermissions[mod] || {
                        read: false,
                        write: false,
                      };

                    return (
                      <tr
                        key={mod}
                        className={
                          isDark
                            ? 'hover:bg-white/[0.02]'
                            : 'hover:bg-gray-50'
                        }
                      >

                        {/* Module */}
                        <td className="py-4 px-3">

                          <div
                            className={`font-bold ${
                              isDark
                                ? 'text-gray-200'
                                : 'text-gray-900'
                            }`}
                          >
                            {
                              moduleLabels[mod]
                                .name
                            }
                          </div>

                          <div
                            className={`text-[11px] mt-1 leading-5 max-w-md ${
                              isDark
                                ? 'text-gray-500'
                                : 'text-gray-500'
                            }`}
                          >
                            {
                              moduleLabels[mod]
                                .desc
                            }
                          </div>

                        </td>

                        {/* Read */}
                        <td className="py-4 px-3 text-center">

                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(
                                mod,
                                'read'
                              )
                            }
                            disabled={
                              !canManageSecurity
                            }
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                              !canManageSecurity
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer'
                            } ${
                              perm.read
                                ? isDark
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : isDark
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15'
                                : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {perm.read
                              ? '✓ فعال'
                              : '✕ مسدود'}
                          </button>

                        </td>

                        {/* Write */}
                        <td className="py-4 px-3 text-center">

                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(
                                mod,
                                'write'
                              )
                            }
                            disabled={
                              !canManageSecurity
                            }
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                              !canManageSecurity
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer'
                            } ${
                              perm.write
                                ? isDark
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/15'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                                : isDark
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15'
                                : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {perm.write
                              ? '✓ مجاز'
                              : '✕ غیرمجاز'}
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>
            </table>

          </div>

        </div>
      </div>

      {/* =====================================================
          CREATE USER MODAL
      ===================================================== */}

      {isNewUserModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsNewUserModalOpen(false);
            }
          }}
        >

          <div
            className={`rounded-2xl border max-w-md w-full p-6 ${
              isDark
                ? 'bg-[#121214] border-white/[0.08] text-gray-200'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >

            {/* Modal Header */}
            <div
              className={`flex items-center justify-between border-b pb-4 mb-5 ${
                isDark
                  ? 'border-white/[0.06]'
                  : 'border-gray-200'
              }`}
            >

              <div>
                <h3
                  className={`text-base font-bold ${
                    isDark
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}
                >
                  تعریف کاربر جدید
                </h3>

                <p
                  className={`text-[11px] mt-1 ${
                    isDark
                      ? 'text-gray-500'
                      : 'text-gray-500'
                  }`}
                >
                  اطلاعات اولیه کاربر را وارد کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsNewUserModalOpen(false)
                }
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleCreateUser}
              className="space-y-4"
            >

              {/* Name */}
              <div className="space-y-1.5">

                <label
                  className={`text-xs font-semibold ${
                    isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}
                >
                  نام و نام خانوادگی *
                </label>

                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) =>
                    setNewUserName(
                      e.target.value
                    )
                  }
                  placeholder="مثلاً علی رضایی"
                  className={`w-full px-3 py-2.5 text-xs rounded-xl border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#18181B] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-blue-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400'
                  }`}
                />

              </div>

              {/* Email */}
              <div className="space-y-1.5">

                <label
                  className={`text-xs font-semibold ${
                    isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}
                >
                  ایمیل سازمانی
                </label>

                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) =>
                    setNewUserEmail(
                      e.target.value
                    )
                  }
                  placeholder="example@company.ir"
                  className={`w-full px-3 py-2.5 text-xs rounded-xl border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#18181B] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-blue-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400'
                  }`}
                />

              </div>

              {/* Role */}
              <div className="space-y-1.5">

                <label
                  className={`text-xs font-semibold ${
                    isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}
                >
                  نقش کاربری پیش‌فرض
                </label>

                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(
                      e.target.value
                    )
                  }
                  className={`w-full px-3 py-2.5 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark
                      ? 'bg-[#18181B] border-white/[0.08] text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >

                  {roles.map((r) => (
                    <option
                      key={r.id}
                      value={r.id}
                    >
                      {r.titleFa}
                    </option>
                  ))}

                </select>

              </div>

              {/* Info */}
              <div
                className={`p-3 rounded-xl border text-[11px] leading-5 ${
                  isDark
                    ? 'bg-blue-500/5 border-blue-500/10 text-gray-400'
                    : 'bg-blue-50 border-blue-100 text-gray-600'
                }`}
              >
                کاربر جدید با نقش انتخاب‌شده ایجاد می‌شود.
                سطح دسترسی پایه نیز از همین نقش دریافت خواهد شد.
              </div>

              {/* Actions */}
              <div
                className={`flex items-center justify-end gap-3 pt-4 border-t ${
                  isDark
                    ? 'border-white/[0.06]'
                    : 'border-gray-200'
                }`}
              >

                <button
                  type="button"
                  onClick={() =>
                    setIsNewUserModalOpen(false)
                  }
                  className={`px-4 py-2.5 text-xs rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-[#18181B] border-white/[0.08] text-gray-300 hover:bg-[#202023]'
                      : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                >
                  ثبت کاربر
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
