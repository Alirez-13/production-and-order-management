export type ModuleName = 'production' | 'orders' | 'warehouse' | 'reports' | 'users' | 'products';

export type ThemeMode = 'dark' | 'light';

export interface PermissionSet {
  read: boolean;
  write: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  titleFa: string;
  description: string;
  permissions: Record<ModuleName, PermissionSet>;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roleId: string;
  department: string;
  isActive: boolean;
  customPermissions?: Record<ModuleName, PermissionSet>;
}

export type OrderStatus = 
  | 'unprocessed'    // پردازش نشده / جدید
  | 'queued'         // در صف تولید
  | 'in_production'  // در حال ساخت در خط تولید
  | 'produced'       // تولید شده / آماده در انبار
  | 'dispatched'     // ارسال شده برای مشتری
  | 'cancelled';     // لغو شده

export type ProductionStage = 'queued' | 'in_production' | 'completed';

export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProductCategory {
  id: string;
  name: string;
  color?: string; // hex or tailwind badge color
  icon?: string;
  description?: string;
  createdAt?: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  code: string;
  department?: string;
  description?: string;
  capacityPerDay?: number;
  activeTasksCount?: number;
  status?: 'active' | 'maintenance' | 'idle';
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  priority: OrderPriority;
  orderDate: string; // ISO format
  requiredDeliveryDate?: string;
  dispatchedDate?: string;
  trackingCode?: string;
  notes?: string;
  assignedProductionLineId?: string;
  createdBy?: string;
}

export interface ProductionTask {
  id: string;
  taskCode: string;
  orderId?: string; // اگر به سفارش مشتری متصل باشد
  orderNumber?: string;
  customerName?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  stage: ProductionStage;
  progressPercent: number;
  priority: OrderPriority;
  startDate?: string;
  completedDate?: string;
  estimatedHours: number;
  productionLine: string; // e.g. "خط مونتاژ A", "خط تراشکاری", "خط بسته‌بندی"
  operatorName: string;
  notes?: string;
  addedToWarehouse: boolean; // آیا به انبار افزوده شده
}

export interface WarehouseProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryId?: string;
  productionLineId?: string;
  productionLineName?: string;
  unit: string;
  stockQuantity: number;
  minAlertThreshold: number;
  locationBin: string; // e.g. "قفسه B-12"
  unitCost: number;
  unitSalePrice: number;
  lastRestockedDate?: string;
  description?: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'in_from_production' | 'out_to_customer' | 'manual_adjustment' | 'initial';
  quantityChange: number; // مثبت برای ورود، منفی برای خروج
  resultingQuantity: number;
  referenceId?: string; // orderId or productionTaskId
  referenceText: string;
  timestamp: string;
  performedBy: string;
}

export type TimeRangeFilter = 'today' | 'last_7_days' | 'this_month' | 'last_30_days' | 'this_quarter' | 'this_year' | 'all';

export interface SalesAnalyticsSummary {
  totalRevenue: number;
  totalOrdersCount: number;
  completedProductionCount: number;
  dispatchedOrdersCount: number;
  totalWarehouseValue: number;
  lowStockItemsCount: number;
  unprocessedOrdersCount: number;
}
