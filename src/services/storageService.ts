import {
  CustomerOrder,
  ProductionTask,
  WarehouseProduct,
  InventoryLog,
  AppUser,
  UserRole,
  ModuleName,
  ProductionStage,
  TimeRangeFilter,
  ProductCategory,
  ProductionLine,
  ThemeMode,
} from '../types';
import {
  INITIAL_ORDERS,
  INITIAL_PRODUCTION_TASKS,
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY_LOGS,
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTION_LINES,
} from '../data/initialData';
import { ApiService } from './apiService';

const STORAGE_KEYS = {
  ORDERS: 'mes_orders_v1',
  PRODUCTION_TASKS: 'mes_production_tasks_v1',
  PRODUCTS: 'mes_products_v1',
  INVENTORY_LOGS: 'mes_inventory_logs_v1',
  USERS: 'mes_users_v1',
  ROLES: 'mes_roles_v1',
  CURRENT_USER_ID: 'mes_current_user_id_v1',
  CATEGORIES: 'mes_categories_v1',
  PRODUCTION_LINES: 'mes_production_lines_v1',
  THEME: 'mes_theme_mode_v1',
};

// Safe LocalStorage helpers
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error loading key ${key} from storage:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key} to storage:`, e);
  }
}

export class StorageService {
  // --- THEME MODE ---
  static getTheme(): ThemeMode {
    return loadFromStorage<ThemeMode>(STORAGE_KEYS.THEME, 'dark');
  }

  static setTheme(theme: ThemeMode): void {
    saveToStorage(STORAGE_KEYS.THEME, theme);
  }

  // --- GETTERS ---
  static getOrders(): CustomerOrder[] {
    return loadFromStorage<CustomerOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  static getProductionTasks(): ProductionTask[] {
    return loadFromStorage<ProductionTask[]>(STORAGE_KEYS.PRODUCTION_TASKS, INITIAL_PRODUCTION_TASKS);
  }

  static getProducts(): WarehouseProduct[] {
    return loadFromStorage<WarehouseProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  static getInventoryLogs(): InventoryLog[] {
    return loadFromStorage<InventoryLog[]>(STORAGE_KEYS.INVENTORY_LOGS, INITIAL_INVENTORY_LOGS);
  }

  static getUsers(): AppUser[] {
    return loadFromStorage<AppUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static getRoles(): UserRole[] {
    return loadFromStorage<UserRole[]>(STORAGE_KEYS.ROLES, INITIAL_ROLES);
  }

  static getCategories(): ProductCategory[] {
    return loadFromStorage<ProductCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  static getProductionLines(): ProductionLine[] {
    return loadFromStorage<ProductionLine[]>(STORAGE_KEYS.PRODUCTION_LINES, INITIAL_PRODUCTION_LINES);
  }

  static getCurrentUserId(): string {
    return loadFromStorage<string>(STORAGE_KEYS.CURRENT_USER_ID, 'usr_1'); // Default to Super Admin
  }

  static setCurrentUserId(userId: string): void {
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  static getCurrentUser(): AppUser {
    const users = this.getUsers();
    const currentId = this.getCurrentUserId();
    return users.find((u) => u.id === currentId) || users[0];
  }

  // Sync from backend SQLite to local state
  static async syncFromBackend(): Promise<void> {
    try {
      const [cats, lines, prods, ords, tasks, logs, users, roles] = await Promise.all([
        ApiService.getCategories(),
        ApiService.getProductionLines(),
        ApiService.getProducts(),
        ApiService.getOrders(),
        ApiService.getProductionTasks(),
        ApiService.getInventoryLogs(),
        ApiService.getUsers(),
        ApiService.getRoles(),
      ]);

      if (cats && cats.length > 0) saveToStorage(STORAGE_KEYS.CATEGORIES, cats);
      if (lines && lines.length > 0) saveToStorage(STORAGE_KEYS.PRODUCTION_LINES, lines);
      if (prods && prods.length > 0) saveToStorage(STORAGE_KEYS.PRODUCTS, prods);
      if (ords && ords.length > 0) saveToStorage(STORAGE_KEYS.ORDERS, ords);
      if (tasks && tasks.length > 0) saveToStorage(STORAGE_KEYS.PRODUCTION_TASKS, tasks);
      if (logs && logs.length > 0) saveToStorage(STORAGE_KEYS.INVENTORY_LOGS, logs);
      if (users && users.length > 0) saveToStorage(STORAGE_KEYS.USERS, users);
      if (roles && roles.length > 0) saveToStorage(STORAGE_KEYS.ROLES, roles);
    } catch (e) {
      console.warn('Backend sync failed, using localStorage cache:', e);
    }
  }

  // RBAC Permission Check
  static checkPermission(module: ModuleName, type: 'read' | 'write', user?: AppUser): boolean {
    const activeUser = user || this.getCurrentUser();
    if (!activeUser || !activeUser.isActive) return false;

    // Check custom override if present
    if (activeUser.customPermissions && activeUser.customPermissions[module]) {
      return activeUser.customPermissions[module][type];
    }

    // Otherwise check role
    const roles = this.getRoles();
    const userRole = roles.find((r) => r.id === activeUser.roleId);
    if (!userRole) return false;

    return userRole.permissions[module]?.[type] ?? false;
  }

  // --- CATEGORIES OPERATIONS ---
  static createCategory(data: Omit<ProductCategory, 'id'>): { success: boolean; category?: ProductCategory; error?: string } {
    if (!this.checkPermission('products', 'write') && !this.checkPermission('warehouse', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز ایجاد دسته‌بندی جدید را ندارید.' };
    }

    const categories = this.getCategories();
    const newCategory: ProductCategory = {
      ...data,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
    };

    categories.push(newCategory);
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);

    // Sync to SQLite backend
    ApiService.createCategory(data).catch((e) => console.warn('SQLite sync cat error:', e));

    return { success: true, category: newCategory };
  }

  static updateCategory(id: string, data: Partial<ProductCategory>): { success: boolean; error?: string } {
    if (!this.checkPermission('products', 'write') && !this.checkPermission('warehouse', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز ویرایش دسته‌بندی را ندارید.' };
    }

    const categories = this.getCategories();
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false, error: 'دسته‌بندی یافت نشد.' };

    categories[idx] = { ...categories[idx], ...data };
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);

    ApiService.updateCategory(id, data).catch((e) => console.warn('SQLite sync cat error:', e));
    return { success: true };
  }

  static deleteCategory(id: string): { success: boolean; error?: string } {
    if (!this.checkPermission('products', 'write') && !this.checkPermission('warehouse', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز حذف دسته‌بندی را ندارید.' };
    }

    let categories = this.getCategories();
    categories = categories.filter((c) => c.id !== id);
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);

    ApiService.deleteCategory(id).catch((e) => console.warn('SQLite delete cat error:', e));
    return { success: true };
  }

  // --- PRODUCTION LINES OPERATIONS ---
  static createProductionLine(data: Omit<ProductionLine, 'id'>): { success: boolean; line?: ProductionLine; error?: string } {
    if (!this.checkPermission('production', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز تعریف خط تولید جدید را ندارید.' };
    }

    const lines = this.getProductionLines();
    const newLine: ProductionLine = {
      ...data,
      id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
    };

    lines.push(newLine);
    saveToStorage(STORAGE_KEYS.PRODUCTION_LINES, lines);

    ApiService.createProductionLine(data).catch((e) => console.warn('SQLite sync line error:', e));
    return { success: true, line: newLine };
  }

  static updateProductionLine(id: string, data: Partial<ProductionLine>): { success: boolean; error?: string } {
    if (!this.checkPermission('production', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز ویرایش خط تولید را ندارید.' };
    }

    const lines = this.getProductionLines();
    const idx = lines.findIndex((l) => l.id === id);
    if (idx === -1) return { success: false, error: 'خط تولید یافت نشد.' };

    lines[idx] = { ...lines[idx], ...data };
    saveToStorage(STORAGE_KEYS.PRODUCTION_LINES, lines);

    ApiService.updateProductionLine(id, data).catch((e) => console.warn('SQLite sync line error:', e));
    return { success: true };
  }

  static deleteProductionLine(id: string): { success: boolean; error?: string } {
    if (!this.checkPermission('production', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز حذف خط تولید را ندارید.' };
    }

    let lines = this.getProductionLines();
    lines = lines.filter((l) => l.id !== id);
    saveToStorage(STORAGE_KEYS.PRODUCTION_LINES, lines);

    ApiService.deleteProductionLine(id).catch((e) => console.warn('SQLite delete line error:', e));
    return { success: true };
  }

  // --- PRODUCTS OPERATIONS ---
  static addProduct(
    productData: Omit<WarehouseProduct, 'id'>
  ): { success: boolean; product?: WarehouseProduct; error?: string } {
    if (!this.checkPermission('warehouse', 'write') && !this.checkPermission('products', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز تعریف کالای جدید را ندارید.' };
    }

    const products = this.getProducts();
    const newProduct: WarehouseProduct = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      lastRestockedDate: new Date().toISOString(),
    };

    products.push(newProduct);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    // Sync to SQLite backend
    ApiService.createProduct(productData).catch((e) => console.warn('SQLite create product error:', e));

    return { success: true, product: newProduct };
  }

  static updateProduct(
    id: string,
    data: Partial<WarehouseProduct>
  ): { success: boolean; error?: string } {
    if (!this.checkPermission('warehouse', 'write') && !this.checkPermission('products', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز ویرایش کالا را ندارید.' };
    }

    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: 'محصول یافت نشد.' };

    products[idx] = { ...products[idx], ...data };
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    ApiService.updateProduct(id, data).catch((e) => console.warn('SQLite update product error:', e));
    return { success: true };
  }

  static deleteProduct(id: string): { success: boolean; error?: string } {
    if (!this.checkPermission('warehouse', 'write') && !this.checkPermission('products', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز حذف کالا را ندارید.' };
    }

    let products = this.getProducts();
    products = products.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    ApiService.deleteProduct(id).catch((e) => console.warn('SQLite delete product error:', e));
    return { success: true };
  }

  // --- ORDER OPERATIONS ---
  static createOrder(
    newOrderData: Partial<CustomerOrder> & {
      customerName: string;
      items: any[];
      totalAmount: number;
    },
    performedBy: string = 'کاربر سیستم'
  ): { success: boolean; order?: CustomerOrder; error?: string } {
    if (!this.checkPermission('orders', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز ثبت سفارش (Write: Orders) ندارید.' };
    }

    const orders = this.getOrders();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = newOrderData.orderNumber || `ORD-1403-${randomSuffix}`;
    const newOrder: CustomerOrder = {
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      priority: 'medium',
      ...newOrderData,
      id: `ord_${Date.now()}`,
      orderNumber,
      orderDate: newOrderData.orderDate || new Date().toISOString(),
      status: newOrderData.status || 'unprocessed',
    };

    orders.unshift(newOrder);
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    ApiService.createOrder(newOrderData).catch((e) => console.warn('SQLite create order error:', e));

    return { success: true, order: newOrder };
  }

  static updateOrderStatus(orderId: string, status: CustomerOrder['status']): boolean {
    if (!this.checkPermission('orders', 'write')) return false;

    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return false;

    orders[index].status = status;
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    ApiService.updateOrderStatus(orderId, status).catch((e) => console.warn('SQLite update order status error:', e));
    return true;
  }

  // Send unprocessed order to production queue
  static sendOrderToProduction(
    orderId: string,
    productionLine: string,
    estimatedHours: number,
    operatorName: string
  ): { success: boolean; task?: ProductionTask; error?: string } {
    if (!this.checkPermission('production', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز ایجاد وظیفه تولید (Write: Production) ندارید.' };
    }

    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'سفارش یافت نشد.' };

    const tasks = this.getProductionTasks();
    const taskCode = `PRD-TSK-${Math.floor(800 + Math.random() * 199)}`;

    // Pick main item or aggregate
    const mainItem = order.items[0] || {
      productId: 'prod_1',
      productName: 'محصول سفارشی',
      sku: 'PRD-CUST',
      quantity: 1,
      unit: 'عدد',
    };

    const newTask: ProductionTask = {
      id: `prod_task_${Date.now()}`,
      taskCode,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerCompany || order.customerName,
      productId: mainItem.productId,
      productName: mainItem.productName,
      sku: mainItem.sku,
      quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
      unit: mainItem.unit,
      stage: 'queued',
      progressPercent: 0,
      priority: order.priority,
      startDate: new Date().toISOString(),
      estimatedHours: estimatedHours || 12,
      productionLine: productionLine || 'خط مونتاژ عمومی',
      operatorName: operatorName || 'اپراتور شیفت ۱',
      notes: `ایجاد شده از سفارش ${order.orderNumber} - ${order.notes || ''}`,
      addedToWarehouse: false,
    };

    tasks.unshift(newTask);
    saveToStorage(STORAGE_KEYS.PRODUCTION_TASKS, tasks);

    // Update order status
    order.status = 'queued';
    order.assignedProductionLineId = newTask.id;
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    ApiService.createProductionTask(newTask).catch((e) => console.warn('SQLite create task error:', e));
    ApiService.updateOrderStatus(order.id, 'queued').catch((e) => console.warn('SQLite order status error:', e));

    return { success: true, task: newTask };
  }

  // --- PRODUCTION TASK OPERATIONS ---
  static createManualProductionTask(
    taskData: Omit<ProductionTask, 'id' | 'taskCode' | 'addedToWarehouse'>
  ): { success: boolean; task?: ProductionTask; error?: string } {
    if (!this.checkPermission('production', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز ثبت دستور تولید ندارید.' };
    }

    const tasks = this.getProductionTasks();
    const taskCode = `PRD-TSK-${Math.floor(800 + Math.random() * 199)}`;
    const newTask: ProductionTask = {
      ...taskData,
      id: `prod_task_${Date.now()}`,
      taskCode,
      addedToWarehouse: false,
    };

    tasks.unshift(newTask);
    saveToStorage(STORAGE_KEYS.PRODUCTION_TASKS, tasks);

    ApiService.createProductionTask(taskData).catch((e) => console.warn('SQLite create manual task error:', e));
    return { success: true, task: newTask };
  }

  static updateTaskStage(
    taskId: string,
    newStage: ProductionStage,
    progressPercent?: number,
    performedBy?: string
  ): { success: boolean; error?: string } {
    if (!this.checkPermission('production', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز تغییر وضعیت خط تولید را ندارید.' };
    }

    const tasks = this.getProductionTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'دستور تولید یافت نشد.' };

    task.stage = newStage;
    if (progressPercent !== undefined) {
      task.progressPercent = progressPercent;
    } else {
      if (newStage === 'queued') task.progressPercent = 0;
      if (newStage === 'in_production' && task.progressPercent === 0) task.progressPercent = 35;
      if (newStage === 'completed') task.progressPercent = 100;
    }

    // Sync corresponding order status
    if (task.orderId) {
      const orders = this.getOrders();
      const order = orders.find((o) => o.id === task.orderId);
      if (order) {
        if (newStage === 'queued') order.status = 'queued';
        if (newStage === 'in_production') order.status = 'in_production';
        if (newStage === 'completed') order.status = 'produced'; // Ready in warehouse
        saveToStorage(STORAGE_KEYS.ORDERS, orders);
      }
    }

    // CRITICAL REQUIREMENT:
    // When task is completed, automatically add quantity to warehouse stock and create log
    if (newStage === 'completed' && !task.addedToWarehouse) {
      task.completedDate = new Date().toISOString();
      task.addedToWarehouse = true;

      // Add to warehouse inventory
      const products = this.getProducts();
      const product = products.find((p) => p.id === task.productId || p.sku === task.sku);

      if (product) {
        product.stockQuantity += task.quantity;
        product.lastRestockedDate = new Date().toISOString();
        saveToStorage(STORAGE_KEYS.PRODUCTS, products);

        // Add inventory log
        const logs = this.getInventoryLogs();
        const newLog: InventoryLog = {
          id: `log_${Date.now()}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'in_from_production',
          quantityChange: task.quantity,
          resultingQuantity: product.stockQuantity,
          referenceId: task.id,
          referenceText: `ورود خودکار از خط تولید (دستور ${task.taskCode}${
            task.orderNumber ? ` مربوط به سفارش ${task.orderNumber}` : ''
          })`,
          timestamp: new Date().toISOString(),
          performedBy: performedBy || 'سیستم خودکار کنترل تولید (MES)',
        };
        logs.unshift(newLog);
        saveToStorage(STORAGE_KEYS.INVENTORY_LOGS, logs);
      }
    }

    saveToStorage(STORAGE_KEYS.PRODUCTION_TASKS, tasks);

    ApiService.updateTaskStage(taskId, newStage, progressPercent, performedBy).catch((e) =>
      console.warn('SQLite update stage error:', e)
    );

    return { success: true };
  }

  // --- WAREHOUSE & DISPATCH OPERATIONS ---
  static dispatchOrderToCustomer(
    orderId: string,
    trackingCode?: string,
    performedBy?: string,
    notes?: string
  ): { success: boolean; error?: string } {
    if (!this.checkPermission('warehouse', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز ترخیص و ارسال کالا از انبار (Write: Warehouse) ندارید.' };
    }

    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'سفارش یافت نشد.' };

    if (order.status === 'dispatched') {
      return { success: false, error: 'این سفارش قبلاً ارسال شده است.' };
    }

    const products = this.getProducts();
    const logs = this.getInventoryLogs();

    // Check inventory availability
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
      if (!prod || prod.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `موجودی ناکافی در انبار برای کالای «${item.productName}». موجودی فعلی: ${
            prod ? prod.stockQuantity : 0
          } ${item.unit}، نیاز سفارش: ${item.quantity} ${item.unit}`,
        };
      }
    }

    // Deduct inventory & create logs
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId || p.sku === item.sku)!;
      prod.stockQuantity -= item.quantity;

      const newLog: InventoryLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'out_to_customer',
        quantityChange: -item.quantity,
        resultingQuantity: prod.stockQuantity,
        referenceId: order.id,
        referenceText: `خروج و ارسال کالا به مشتری ${order.customerCompany || order.customerName} (${order.orderNumber})${notes ? ` - ${notes}` : ''}`,
        timestamp: new Date().toISOString(),
        performedBy: performedBy || 'سرپرست انبار',
      };
      logs.unshift(newLog);
    }

    // Update order to dispatched
    order.status = 'dispatched';
    order.dispatchedDate = new Date().toISOString();
    order.trackingCode = trackingCode || `TRK-EXP-${Math.floor(1000000 + Math.random() * 9000000)}`;

    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    saveToStorage(STORAGE_KEYS.INVENTORY_LOGS, logs);
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    ApiService.dispatchOrder(orderId, order.trackingCode, performedBy).catch((e) =>
      console.warn('SQLite dispatch order error:', e)
    );

    return { success: true };
  }

  static adjustStockManually(
    productId: string,
    newQuantity: number,
    reason: string,
    performedBy: string
  ): { success: boolean; error?: string } {
    if (!this.checkPermission('warehouse', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز تغییر موجودی انبار ندارید.' };
    }

    const products = this.getProducts();
    const prod = products.find((p) => p.id === productId);
    if (!prod) return { success: false, error: 'محصول یافت نشد.' };

    const diff = newQuantity - prod.stockQuantity;
    prod.stockQuantity = newQuantity;
    prod.lastRestockedDate = new Date().toISOString();

    const logs = this.getInventoryLogs();
    const newLog: InventoryLog = {
      id: `log_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: 'manual_adjustment',
      quantityChange: diff,
      resultingQuantity: newQuantity,
      referenceText: `تعدیل دستی انبار: ${reason || 'شمارش ادواری'}`,
      timestamp: new Date().toISOString(),
      performedBy: performedBy || 'سرپرست انبار',
    };
    logs.unshift(newLog);

    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    saveToStorage(STORAGE_KEYS.INVENTORY_LOGS, logs);

    ApiService.adjustStock(productId, newQuantity, reason, performedBy).catch((e) =>
      console.warn('SQLite adjust stock error:', e)
    );

    return { success: true };
  }

  // --- USER & RBAC MANAGEMENT ---
  static updateUserRole(userId: string, roleId: string): boolean {
    if (!this.checkPermission('users', 'write')) return false;

    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.roleId = roleId;
    user.customPermissions = undefined; // reset custom override
    saveToStorage(STORAGE_KEYS.USERS, users);

    ApiService.updateUserRole(userId, roleId).catch((e) => console.warn('SQLite update user role error:', e));
    return true;
  }

  static updateUserPermissions(
    userId: string,
    permissions: Record<ModuleName, { read: boolean; write: boolean }>
  ): boolean {
    return this.updateUserCustomPermissions(userId, permissions);
  }

  static createCustomerOrder(
    newOrderData: Omit<CustomerOrder, 'id' | 'orderNumber' | 'orderDate' | 'status'>,
    performedBy: string = 'کاربر سیستم'
  ) {
    return this.createOrder(newOrderData, performedBy);
  }

  static dispatchOrderFromWarehouse(
    orderId: string,
    trackingCode: string = '',
    notes: string = '',
    performedBy: string = 'سرپرست انبار'
  ) {
    return this.dispatchOrderToCustomer(orderId, trackingCode, performedBy, notes);
  }

  static updateUserCustomPermissions(
    userId: string,
    permissions: Record<ModuleName, { read: boolean; write: boolean }>
  ): boolean {
    if (!this.checkPermission('users', 'write')) return false;

    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.customPermissions = permissions;
    saveToStorage(STORAGE_KEYS.USERS, users);

    ApiService.updateUserPermissions(userId, permissions).catch((e) =>
      console.warn('SQLite update permissions error:', e)
    );
    return true;
  }

  static createUser(userData: Omit<AppUser, 'id'>): { success: boolean; user?: AppUser; error?: string } {
    if (!this.checkPermission('users', 'write')) {
      return { success: false, error: 'خطای دسترسی: شما مجوز تعریف کاربر جدید را ندارید.' };
    }

    const users = this.getUsers();
    const newUser: AppUser = {
      ...userData,
      id: `usr_${Date.now()}`,
    };

    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);

    ApiService.createUser(userData).catch((e) => console.warn('SQLite create user error:', e));
    return { success: true, user: newUser };
  }

  // Reset to sample data
  static async resetAllData(): Promise<void> {
    saveToStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    saveToStorage(STORAGE_KEYS.PRODUCTION_TASKS, INITIAL_PRODUCTION_TASKS);
    saveToStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    saveToStorage(STORAGE_KEYS.INVENTORY_LOGS, INITIAL_INVENTORY_LOGS);
    saveToStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    saveToStorage(STORAGE_KEYS.ROLES, INITIAL_ROLES);
    saveToStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    saveToStorage(STORAGE_KEYS.PRODUCTION_LINES, INITIAL_PRODUCTION_LINES);
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, 'usr_1');

    await ApiService.resetDatabase();
  }

  // Date filtering helper
  static isDateInFilter(dateString: string | undefined, filter: TimeRangeFilter): boolean {
    if (!dateString) return false;
    if (filter === 'all') return true;

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    switch (filter) {
      case 'today':
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      case 'last_7_days':
        return diffDays <= 7 && diffDays >= 0;
      case 'this_month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case 'last_30_days':
        return diffDays <= 30 && diffDays >= 0;
      case 'this_quarter':
        return diffDays <= 90 && diffDays >= 0;
      case 'this_year':
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  }
}
