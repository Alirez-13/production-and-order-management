import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  Plus, 
  Key, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  Edit3, 
  Eye, 
  Users, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { AppUser, UserRole, ModuleName, ThemeMode } from '../types';
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
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [editingPermissions, setEditingPermissions] = useState<Record<ModuleName, { read: boolean; write: boolean }> | null>(null);

  // New user form modal
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('واحد عملیات و تولید');
  const [newUserRole, setNewUserRole] = useState(roles[1]?.id || 'prod_manager');
  const [newUserAvatar, setNewUserAvatar] = useState('👨‍💼');

  // Check if current user has Write permission on Users/Security
  const canManageSecurity = StorageService.checkPermission('users', 'write', currentUser);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const selectedUserRole = roles.find((r) => r.id === selectedUser.roleId);

  // Current effective permissions for selected user
  const effectivePermissions: Record<ModuleName, { read: boolean; write: boolean }> = 
    editingPermissions ||
    selectedUser.customPermissions ||
    selectedUserRole?.permissions || {
      products: { read: false, write: false },
      production: { read: false, write: false },
      orders: { read: false, write: false },
      warehouse: { read: false, write: false },
      reports: { read: false, write: false },
      users: { read: false, write: false },
    };

  const moduleLabels: Record<ModuleName, { name: string; desc: string }> = {
    products: { name: 'محصولات و خطوط', desc: 'تعریف کالا، افزودن دسته‌بندی و خطوط تولید اختصاصی' },
    production: { name: 'مدیریت خط تولید', desc: 'مانیتورینگ و تغییر وضعیت صف، در حال تولید و تکمیل' },
    orders: { name: 'سفارش‌های مشتریان', desc: 'ثبت، صف‌بندی و انتقال سفارش‌ها به خطوط تولید' },
    warehouse: { name: 'انبار و لجستیک', desc: 'اصلاح موجودی، واریز تولید و صدور بارنامه ارسال به مشتری' },
    reports: { name: 'گزارش‌ها و نمودارها', desc: 'مشاهده آمار فروش، راندمان کارخانه و فایل اکسل' },
    users: { name: 'دسترسی و امنیت', desc: 'مدیریت نقش‌ها، کاربران و ماتریس Read/Write' },
  };

  const handleTogglePermission = (module: ModuleName, type: 'read' | 'write') => {
    if (!canManageSecurity) {
      alert('خطای دسترسی: شما مجوز ویرایش ماتریس دسترسی را ندارید.');
      return;
    }

    const currentModulePerm = effectivePermissions[module] || { read: false, write: false };
    const newValue = !currentModulePerm[type];

    const updated = {
      ...effectivePermissions,
      [module]: {
        ...currentModulePerm,
        [type]: newValue,
        // If enabling write, automatically enable read
        ...(type === 'write' && newValue ? { read: true } : {}),
      },
    };

    setEditingPermissions(updated);
  };

  const handleSavePermissions = () => {
    if (!canManageSecurity || !editingPermissions) return;

    StorageService.updateUserPermissions(selectedUserId, editingPermissions);
    setEditingPermissions(null);
    onRefreshData();
    alert(`مجوزهای دسترسی کاربر «${selectedUser.name}» با موفقیت در دیتابیس SQLite ذخیره شد.`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSecurity) {
      alert('شما مجوز ایجاد کاربر جدید را ندارید.');
      return;
    }

    const res = StorageService.createUser({
      name: newUserName,
      email: newUserEmail,
      department: newUserDept,
      roleId: newUserRole,
      avatar: newUserAvatar,
      isActive: true,
    });

    if (res.success && res.user) {
      setIsNewUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setSelectedUserId(res.user.id);
      onRefreshData();
      alert(`کاربر جدید «${res.user.name}» با موفقیت اضافه شد.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ماتریس کنترل دسترسی و امنیت (RBAC)
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                کنترل دقیق مجوزهای خواندن (Read) و نوشتن (Write) بر روی کلیه اندپوینت‌ها و ماژول‌های سامانه
              </p>
            </div>
          </div>

          {canManageSecurity && (
            <button
              onClick={() => setIsNewUserModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کاربر جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: User selection & Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User list */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            انتخاب کاربر جهت بررسی و تغییر مجوزها
          </h3>

          <div className="space-y-2">
            {users.map((u) => {
              const role = roles.find((r) => r.id === u.roleId);
              const isSelected = u.id === selectedUserId;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setEditingPermissions(null);
                  }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : isDark
                      ? 'bg-[#18181B] border-[#27272A] text-gray-300 hover:border-gray-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{u.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{u.name}</div>
                    <div className={`text-[11px] truncate ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                      {role?.titleFa} | {u.department}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${
          isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ماتریس دسترسی: {selectedUser?.name}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                نقش پایه: <span className="text-purple-400 font-bold">{selectedUserRole?.titleFa}</span>
              </p>
            </div>

            {editingPermissions && canManageSecurity && (
              <button
                onClick={handleSavePermissions}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره تغییرات در دیتابیس</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <th className="py-3 px-3 font-semibold">بخش / ماژول</th>
                  <th className="py-3 px-3 font-semibold text-center">مجوز خواندن (Read)</th>
                  <th className="py-3 px-3 font-semibold text-center">مجوز ویرایش (Write)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {(Object.keys(moduleLabels) as ModuleName[]).map((mod) => {
                  const perm = effectivePermissions[mod] || { read: false, write: false };
                  return (
                    <tr key={mod} className={isDark ? 'hover:bg-[#18181B]' : 'hover:bg-gray-50'}>
                      <td className="py-3 px-3">
                        <div className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {moduleLabels[mod].name}
                        </div>
                        <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {moduleLabels[mod].desc}
                        </div>
                      </td>

                      {/* Read Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleTogglePermission(mod, 'read')}
                          disabled={!canManageSecurity}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            perm.read
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {perm.read ? '✓ فعال (Read)' : '✕ مسدود'}
                        </button>
                      </td>

                      {/* Write Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleTogglePermission(mod, 'write')}
                          disabled={!canManageSecurity}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            perm.write
                              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {perm.write ? '✓ مجاز (Write)' : '✕ غیرمجاز'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`rounded-2xl border max-w-md w-full p-6 space-y-4 ${
            isDark ? 'bg-[#121214] border-[#27272A] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                تعریف کاربر جدید
              </h3>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">ایمیل سازمانی</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">نقش کاربری پیش‌فرض</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.titleFa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className={`px-4 py-2 text-xs rounded-xl border cursor-pointer ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-sm"
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
