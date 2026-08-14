import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { 
  CustomerOrder, 
  ProductionTask, 
  WarehouseProduct, 
  InventoryLog, 
  AppUser, 
  UserRole,
  ProductCategory,
  ProductionLine
} from '../src/types';
import { 
  INITIAL_ORDERS, 
  INITIAL_PRODUCTION_TASKS, 
  INITIAL_PRODUCTS, 
  INITIAL_INVENTORY_LOGS, 
  INITIAL_USERS, 
  INITIAL_ROLES 
} from '../src/data/initialData';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'factory.sqlite');

export const INITIAL_CATEGORIES: ProductCategory[] = [
  { id: 'cat_1', name: 'موتورهای الکتریکی', color: '#3B82F6', icon: '⚡', description: 'انواع الکتروموتورهای صنعتی سه‌فاز و تک‌فاز' },
  { id: 'cat_2', name: 'اتوماسیون صنعتی', color: '#10B981', icon: '🤖', description: 'کنترلرها، PLCها و تجهیزات درایو' },
  { id: 'cat_3', name: 'هیدرولیک و پنوماتیک', color: '#F59E0B', icon: '🔧', description: 'پمپ‌ها، شیرهای برقی و جک‌های صنعتی' },
  { id: 'cat_4', name: 'ابزار دقیق و سنسور', color: '#8B5CF6', icon: '📡', description: 'حسگرهای نوری، لرزش‌سنج و کالیبراسیون' },
  { id: 'cat_5', name: 'قطعات و یراق‌آلات مکانیک', color: '#EC4899', icon: '⚙️', description: 'تسمه، بلبرینگ و قطعات واسط مکانیکی' },
];

export const INITIAL_PRODUCTION_LINES: ProductionLine[] = [
  { id: 'line_1', name: 'خط سیم‌پیچی و تست موتور ۱', code: 'LINE-MTR-01', department: 'سالن موتور', description: 'سیم‌پیچی استاتور، روتور و آزمون عایقی', capacityPerDay: 15, status: 'active' },
  { id: 'line_2', name: 'خط CNC و ماشین‌کاری دقیق ۲', code: 'LINE-CNC-02', department: 'سالن تراشکاری', description: 'تراش، فرزکاری و بورینگ قطعات استیل و فولاد', capacityPerDay: 25, status: 'active' },
  { id: 'line_3', name: 'خط مونتاژ هیدرولیک سنگین', code: 'LINE-HYD-03', department: 'سالن هیدرولیک', description: 'مونتاژ پمپ‌های دوار و تست فشار ۲۰۰ بار', capacityPerDay: 10, status: 'active' },
  { id: 'line_4', name: 'خط مونتاژ قطعات الکترونیک SMD', code: 'LINE-SMD-04', department: 'کلین‌روم الکترونیک', description: 'مونتاژ بردهای هوشمند و پروگرامینگ چیپ‌ها', capacityPerDay: 60, status: 'active' },
  { id: 'line_5', name: 'خط مونتاژ درایو و قدرت', code: 'LINE-PWR-05', department: 'سالن الکتریک', description: 'تجهیزات اینورتر و تست زیر بار حرارتی', capacityPerDay: 12, status: 'active' },
  { id: 'line_6', name: 'خط بسته‌بندی و کنترل کیفیت نهایی', code: 'LINE-PKG-06', department: 'انبار و ارسال', description: 'پالت‌بندی چوبی، شیرینک و صدور تاییدیه QC', capacityPerDay: 100, status: 'active' },
];

let db: Database;

function saveDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export async function initDb() {
  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from disk.');
    } catch (e) {
      console.warn('Corrupted database file, initializing fresh SQLite database:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('Initialized fresh in-memory SQLite database.');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      description TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS production_lines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      department TEXT,
      description TEXT,
      capacityPerDay REAL,
      status TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      categoryId TEXT,
      productionLineId TEXT,
      productionLineName TEXT,
      unit TEXT,
      stockQuantity REAL,
      minAlertThreshold REAL,
      locationBin TEXT,
      unitCost REAL,
      unitSalePrice REAL,
      lastRestockedDate TEXT,
      description TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerCompany TEXT,
      customerPhone TEXT,
      customerEmail TEXT,
      customerAddress TEXT,
      itemsJson TEXT NOT NULL,
      totalAmount REAL,
      status TEXT,
      priority TEXT,
      orderDate TEXT,
      requiredDeliveryDate TEXT,
      dispatchedDate TEXT,
      trackingCode TEXT,
      notes TEXT,
      assignedProductionLineId TEXT
    );

    CREATE TABLE IF NOT EXISTS production_tasks (
      id TEXT PRIMARY KEY,
      taskCode TEXT NOT NULL,
      orderId TEXT,
      orderNumber TEXT,
      customerName TEXT,
      productId TEXT,
      productName TEXT,
      sku TEXT,
      quantity REAL,
      unit TEXT,
      stage TEXT,
      progressPercent REAL,
      priority TEXT,
      startDate TEXT,
      completedDate TEXT,
      estimatedHours REAL,
      productionLine TEXT,
      operatorName TEXT,
      notes TEXT,
      addedToWarehouse INTEGER
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      productId TEXT,
      productName TEXT,
      sku TEXT,
      type TEXT,
      quantityChange REAL,
      resultingQuantity REAL,
      referenceId TEXT,
      referenceText TEXT,
      timestamp TEXT,
      performedBy TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      roleId TEXT,
      department TEXT,
      isActive INTEGER,
      customPermissionsJson TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      titleFa TEXT,
      description TEXT,
      permissionsJson TEXT
    );
  `);

  // Seed default data if empty
  seedIfEmpty();
  saveDatabase();
}

function seedIfEmpty() {
  const catCount = db.exec('SELECT COUNT(*) as count FROM categories')[0]?.values[0][0] as number;
  if (!catCount || catCount === 0) {
    for (const c of INITIAL_CATEGORIES) {
      db.run(
        'INSERT INTO categories (id, name, color, icon, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [c.id, c.name, c.color || '#3B82F6', c.icon || '📦', c.description || '', new Date().toISOString()]
      );
    }
  }

  const lineCount = db.exec('SELECT COUNT(*) as count FROM production_lines')[0]?.values[0][0] as number;
  if (!lineCount || lineCount === 0) {
    for (const l of INITIAL_PRODUCTION_LINES) {
      db.run(
        'INSERT INTO production_lines (id, name, code, department, description, capacityPerDay, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [l.id, l.name, l.code, l.department || '', l.description || '', l.capacityPerDay || 20, l.status || 'active', new Date().toISOString()]
      );
    }
  }

  const prodCount = db.exec('SELECT COUNT(*) as count FROM products')[0]?.values[0][0] as number;
  if (!prodCount || prodCount === 0) {
    const defaultLineMap: Record<string, { id: string; name: string }> = {
      'prod_1': { id: 'line_1', name: 'خط سیم‌پیچی و تست موتور ۱' },
      'prod_2': { id: 'line_4', name: 'خط مونتاژ قطعات الکترونیک SMD' },
      'prod_3': { id: 'line_3', name: 'خط مونتاژ هیدرولیک سنگین' },
      'prod_4': { id: 'line_4', name: 'خط مونتاژ قطعات الکترونیک SMD' },
      'prod_5': { id: 'line_2', name: 'خط CNC و ماشین‌کاری دقیق ۲' },
      'prod_6': { id: 'line_5', name: 'خط مونتاژ درایو و قدرت' },
    };

    const defaultCatMap: Record<string, string> = {
      'موتورهای الکتریکی': 'cat_1',
      'اتوماسیون صنعتی': 'cat_2',
      'هیدرولیک و پنوماتیک': 'cat_3',
      'ابزار دقیق و سنسور': 'cat_4',
    };

    for (const p of INITIAL_PRODUCTS) {
      const line = defaultLineMap[p.id] || { id: 'line_1', name: 'خط سیم‌پیچی و تست موتور ۱' };
      const catId = defaultCatMap[p.category] || 'cat_1';
      db.run(
        `INSERT INTO products (
          id, sku, name, category, categoryId, productionLineId, productionLineName,
          unit, stockQuantity, minAlertThreshold, locationBin, unitCost, unitSalePrice,
          lastRestockedDate, description, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.sku, p.name, p.category, catId, line.id, line.name,
          p.unit, p.stockQuantity, p.minAlertThreshold, p.locationBin, p.unitCost, p.unitSalePrice,
          p.lastRestockedDate || new Date().toISOString(), p.description || '', new Date().toISOString()
        ]
      );
    }
  }

  const orderCount = db.exec('SELECT COUNT(*) as count FROM orders')[0]?.values[0][0] as number;
  if (!orderCount || orderCount === 0) {
    for (const o of INITIAL_ORDERS) {
      db.run(
        `INSERT INTO orders (
          id, orderNumber, customerName, customerCompany, customerPhone, customerEmail,
          customerAddress, itemsJson, totalAmount, status, priority, orderDate,
          requiredDeliveryDate, dispatchedDate, trackingCode, notes, assignedProductionLineId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          o.id, o.orderNumber, o.customerName, o.customerCompany || '', o.customerPhone, o.customerEmail || '',
          o.customerAddress, JSON.stringify(o.items), o.totalAmount, o.status, o.priority, o.orderDate,
          o.requiredDeliveryDate, o.dispatchedDate || '', o.trackingCode || '', o.notes || '', o.assignedProductionLineId || ''
        ]
      );
    }
  }

  const taskCount = db.exec('SELECT COUNT(*) as count FROM production_tasks')[0]?.values[0][0] as number;
  if (!taskCount || taskCount === 0) {
    for (const t of INITIAL_PRODUCTION_TASKS) {
      db.run(
        `INSERT INTO production_tasks (
          id, taskCode, orderId, orderNumber, customerName, productId, productName,
          sku, quantity, unit, stage, progressPercent, priority, startDate,
          completedDate, estimatedHours, productionLine, operatorName, notes, addedToWarehouse
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id, t.taskCode, t.orderId || '', t.orderNumber || '', t.customerName || '', t.productId, t.productName,
          t.sku, t.quantity, t.unit, t.stage, t.progressPercent, t.priority, t.startDate || '',
          t.completedDate || '', t.estimatedHours, t.productionLine, t.operatorName, t.notes || '', t.addedToWarehouse ? 1 : 0
        ]
      );
    }
  }

  const logCount = db.exec('SELECT COUNT(*) as count FROM inventory_logs')[0]?.values[0][0] as number;
  if (!logCount || logCount === 0) {
    for (const l of INITIAL_INVENTORY_LOGS) {
      db.run(
        `INSERT INTO inventory_logs (
          id, productId, productName, sku, type, quantityChange, resultingQuantity,
          referenceId, referenceText, timestamp, performedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          l.id, l.productId, l.productName, l.sku, l.type, l.quantityChange, l.resultingQuantity,
          l.referenceId || '', l.referenceText, l.timestamp, l.performedBy
        ]
      );
    }
  }

  const userCount = db.exec('SELECT COUNT(*) as count FROM users')[0]?.values[0][0] as number;
  if (!userCount || userCount === 0) {
    for (const u of INITIAL_USERS) {
      db.run(
        `INSERT INTO users (id, name, email, avatar, roleId, department, isActive, customPermissionsJson) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.email, u.avatar, u.roleId, u.department, u.isActive ? 1 : 0, u.customPermissions ? JSON.stringify(u.customPermissions) : '']
      );
    }
  }

  const roleCount = db.exec('SELECT COUNT(*) as count FROM roles')[0]?.values[0][0] as number;
  if (!roleCount || roleCount === 0) {
    for (const r of INITIAL_ROLES) {
      db.run(
        `INSERT INTO roles (id, name, titleFa, description, permissionsJson) VALUES (?, ?, ?, ?, ?)`,
        [r.id, r.name, r.titleFa, r.description, JSON.stringify(r.permissions)]
      );
    }
  }
}

// Helper to convert query result to array of objects
function queryAll<T>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

// ----------------- CRUD DB METHODS -----------------

// Categories
export const dbCategories = {
  getAll: (): ProductCategory[] => {
    return queryAll<ProductCategory>('SELECT * FROM categories ORDER BY name ASC');
  },
  create: (data: Omit<ProductCategory, 'id'>): ProductCategory => {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    db.run(
      'INSERT INTO categories (id, name, color, icon, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.name, data.color || '#3B82F6', data.icon || '🏷️', data.description || '', new Date().toISOString()]
    );
    saveDatabase();
    return { id, ...data };
  },
  update: (id: string, data: Partial<ProductCategory>): boolean => {
    const existing = queryAll<ProductCategory>('SELECT * FROM categories WHERE id = ?', [id])[0];
    if (!existing) return false;
    const updated = { ...existing, ...data };
    db.run(
      'UPDATE categories SET name = ?, color = ?, icon = ?, description = ? WHERE id = ?',
      [updated.name, updated.color, updated.icon, updated.description, id]
    );
    saveDatabase();
    return true;
  },
  delete: (id: string): boolean => {
    db.run('DELETE FROM categories WHERE id = ?', [id]);
    saveDatabase();
    return true;
  }
};

// Production Lines
export const dbProductionLines = {
  getAll: (): ProductionLine[] => {
    return queryAll<ProductionLine>('SELECT * FROM production_lines ORDER BY name ASC');
  },
  create: (data: Omit<ProductionLine, 'id'>): ProductionLine => {
    const id = `line_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    db.run(
      'INSERT INTO production_lines (id, name, code, department, description, capacityPerDay, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.name, data.code || `LINE-${Math.floor(100 + Math.random()*900)}`, data.department || '', data.description || '', data.capacityPerDay || 20, data.status || 'active', new Date().toISOString()]
    );
    saveDatabase();
    return { id, ...data };
  },
  update: (id: string, data: Partial<ProductionLine>): boolean => {
    const existing = queryAll<ProductionLine>('SELECT * FROM production_lines WHERE id = ?', [id])[0];
    if (!existing) return false;
    const updated = { ...existing, ...data };
    db.run(
      'UPDATE production_lines SET name = ?, code = ?, department = ?, description = ?, capacityPerDay = ?, status = ? WHERE id = ?',
      [updated.name, updated.code, updated.department, updated.description, updated.capacityPerDay, updated.status, id]
    );
    saveDatabase();
    return true;
  },
  delete: (id: string): boolean => {
    db.run('DELETE FROM production_lines WHERE id = ?', [id]);
    saveDatabase();
    return true;
  }
};

// Products
export const dbProducts = {
  getAll: (): WarehouseProduct[] => {
    return queryAll<WarehouseProduct>('SELECT * FROM products ORDER BY name ASC');
  },
  getById: (id: string): WarehouseProduct | null => {
    const rows = queryAll<WarehouseProduct>('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] || null;
  },
  create: (data: Omit<WarehouseProduct, 'id'>): WarehouseProduct => {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    db.run(
      `INSERT INTO products (
        id, sku, name, category, categoryId, productionLineId, productionLineName,
        unit, stockQuantity, minAlertThreshold, locationBin, unitCost, unitSalePrice,
        lastRestockedDate, description, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.sku, data.name, data.category, data.categoryId || '', data.productionLineId || '', data.productionLineName || '',
        data.unit, data.stockQuantity || 0, data.minAlertThreshold || 10, data.locationBin || '',
        data.unitCost || 0, data.unitSalePrice || 0, data.lastRestockedDate || new Date().toISOString(),
        data.description || '', new Date().toISOString()
      ]
    );
    saveDatabase();
    return { id, ...data };
  },
  update: (id: string, data: Partial<WarehouseProduct>): boolean => {
    const existing = dbProducts.getById(id);
    if (!existing) return false;
    const updated = { ...existing, ...data };
    db.run(
      `UPDATE products SET 
        sku = ?, name = ?, category = ?, categoryId = ?, productionLineId = ?, productionLineName = ?,
        unit = ?, stockQuantity = ?, minAlertThreshold = ?, locationBin = ?, unitCost = ?, unitSalePrice = ?,
        lastRestockedDate = ?, description = ?
      WHERE id = ?`,
      [
        updated.sku, updated.name, updated.category, updated.categoryId || '', updated.productionLineId || '', updated.productionLineName || '',
        updated.unit, updated.stockQuantity, updated.minAlertThreshold, updated.locationBin, updated.unitCost, updated.unitSalePrice,
        updated.lastRestockedDate || new Date().toISOString(), updated.description || '', id
      ]
    );
    saveDatabase();
    return true;
  },
  delete: (id: string): boolean => {
    db.run('DELETE FROM products WHERE id = ?', [id]);
    saveDatabase();
    return true;
  }
};

// Orders
export const dbOrders = {
  getAll: (): CustomerOrder[] => {
    const rows = queryAll<any>('SELECT * FROM orders ORDER BY orderDate DESC');
    return rows.map((r) => ({
      ...r,
      items: JSON.parse(r.itemsJson || '[]'),
    }));
  },
  getById: (id: string): CustomerOrder | null => {
    const rows = queryAll<any>('SELECT * FROM orders WHERE id = ?', [id]);
    if (!rows[0]) return null;
    return {
      ...rows[0],
      items: JSON.parse(rows[0].itemsJson || '[]'),
    };
  },
  create: (data: Omit<CustomerOrder, 'id' | 'orderNumber' | 'orderDate' | 'status'>): CustomerOrder => {
    const id = `ord_${Date.now()}`;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `ORD-1403-${randomSuffix}`;
    const orderDate = new Date().toISOString();
    const status = 'unprocessed';

    db.run(
      `INSERT INTO orders (
        id, orderNumber, customerName, customerCompany, customerPhone, customerEmail,
        customerAddress, itemsJson, totalAmount, status, priority, orderDate,
        requiredDeliveryDate, dispatchedDate, trackingCode, notes, assignedProductionLineId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, orderNumber, data.customerName, data.customerCompany || '', data.customerPhone, data.customerEmail || '',
        data.customerAddress, JSON.stringify(data.items || []), data.totalAmount, status, data.priority, orderDate,
        data.requiredDeliveryDate, data.dispatchedDate || '', data.trackingCode || '', data.notes || '', data.assignedProductionLineId || ''
      ]
    );
    saveDatabase();
    return {
      ...data,
      id,
      orderNumber,
      orderDate,
      status,
    };
  },
  updateStatus: (id: string, status: CustomerOrder['status']): boolean => {
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    saveDatabase();
    return true;
  },
  dispatch: (orderId: string, trackingCode: string, performedBy: string): { success: boolean; error?: string } => {
    const order = dbOrders.getById(orderId);
    if (!order) return { success: false, error: 'سفارش یافت نشد.' };
    if (order.status === 'dispatched') return { success: false, error: 'این سفارش قبلاً ارسال شده است.' };

    const products = dbProducts.getAll();
    // Validate stock
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
      if (!prod || prod.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `موجودی ناکافی برای کالای «${item.productName}». موجودی: ${prod ? prod.stockQuantity : 0} ${item.unit}، نیاز: ${item.quantity} ${item.unit}`
        };
      }
    }

    // Deduct stock & create log
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId || p.sku === item.sku)!;
      const newStock = prod.stockQuantity - item.quantity;
      db.run('UPDATE products SET stockQuantity = ? WHERE id = ?', [newStock, prod.id]);
      
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      db.run(
        `INSERT INTO inventory_logs (
          id, productId, productName, sku, type, quantityChange, resultingQuantity,
          referenceId, referenceText, timestamp, performedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logId, prod.id, prod.name, prod.sku, 'out_to_customer', -item.quantity, newStock,
          order.id, `خروج و ارسال کالا به مشتری ${order.customerCompany || order.customerName} (${order.orderNumber})`,
          new Date().toISOString(), performedBy || 'سرپرست انبار'
        ]
      );
    }

    const code = trackingCode || `TRK-EXP-${Math.floor(1000000 + Math.random() * 9000000)}`;
    db.run('UPDATE orders SET status = ?, dispatchedDate = ?, trackingCode = ? WHERE id = ?', [
      'dispatched', new Date().toISOString(), code, orderId
    ]);
    saveDatabase();
    return { success: true };
  }
};

// Production Tasks
export const dbProductionTasks = {
  getAll: (): ProductionTask[] => {
    const rows = queryAll<any>('SELECT * FROM production_tasks ORDER BY startDate DESC');
    return rows.map((r) => ({
      ...r,
      addedToWarehouse: Boolean(r.addedToWarehouse),
    }));
  },
  getById: (id: string): ProductionTask | null => {
    const rows = queryAll<any>('SELECT * FROM production_tasks WHERE id = ?', [id]);
    if (!rows[0]) return null;
    return {
      ...rows[0],
      addedToWarehouse: Boolean(rows[0].addedToWarehouse),
    };
  },
  create: (data: Omit<ProductionTask, 'id' | 'taskCode' | 'addedToWarehouse'>): ProductionTask => {
    const id = `prod_task_${Date.now()}`;
    const taskCode = `PRD-TSK-${Math.floor(800 + Math.random() * 199)}`;
    db.run(
      `INSERT INTO production_tasks (
        id, taskCode, orderId, orderNumber, customerName, productId, productName,
        sku, quantity, unit, stage, progressPercent, priority, startDate,
        completedDate, estimatedHours, productionLine, operatorName, notes, addedToWarehouse
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, taskCode, data.orderId || '', data.orderNumber || '', data.customerName || '', data.productId, data.productName,
        data.sku, data.quantity, data.unit, data.stage, data.progressPercent, data.priority, data.startDate || new Date().toISOString(),
        data.completedDate || '', data.estimatedHours, data.productionLine, data.operatorName, data.notes || '', 0
      ]
    );
    saveDatabase();
    return {
      ...data,
      id,
      taskCode,
      addedToWarehouse: false,
    };
  },
  updateStage: (
    taskId: string,
    newStage: ProductionTask['stage'],
    progressPercent?: number,
    performedBy?: string
  ): { success: boolean; error?: string } => {
    const task = dbProductionTasks.getById(taskId);
    if (!task) return { success: false, error: 'دستور تولید یافت نشد.' };

    let prog = progressPercent;
    if (prog === undefined) {
      if (newStage === 'queued') prog = 0;
      else if (newStage === 'in_production' && task.progressPercent === 0) prog = 40;
      else if (newStage === 'completed') prog = 100;
      else prog = task.progressPercent;
    }

    let completedDate = task.completedDate;
    let addedToWarehouse = task.addedToWarehouse;

    // When completed, automatically add to warehouse stock
    if (newStage === 'completed' && !task.addedToWarehouse) {
      completedDate = new Date().toISOString();
      addedToWarehouse = true;

      const product = dbProducts.getAll().find((p) => p.id === task.productId || p.sku === task.sku);
      if (product) {
        const newStock = product.stockQuantity + task.quantity;
        db.run('UPDATE products SET stockQuantity = ?, lastRestockedDate = ? WHERE id = ?', [
          newStock, new Date().toISOString(), product.id
        ]);

        const logId = `log_${Date.now()}`;
        db.run(
          `INSERT INTO inventory_logs (
            id, productId, productName, sku, type, quantityChange, resultingQuantity,
            referenceId, referenceText, timestamp, performedBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            logId, product.id, product.name, product.sku, 'in_from_production', task.quantity, newStock,
            task.id, `ورود خودکار از خط تولید (دستور ${task.taskCode}${task.orderNumber ? ` سفارش ${task.orderNumber}` : ''})`,
            new Date().toISOString(), performedBy || 'سیستم خودکار کنترل تولید (MES)'
          ]
        );
      }
    }

    db.run(
      'UPDATE production_tasks SET stage = ?, progressPercent = ?, completedDate = ?, addedToWarehouse = ? WHERE id = ?',
      [newStage, prog, completedDate || '', addedToWarehouse ? 1 : 0, taskId]
    );

    // Sync order if linked
    if (task.orderId) {
      let orderStatus = 'queued';
      if (newStage === 'in_production') orderStatus = 'in_production';
      if (newStage === 'completed') orderStatus = 'produced';
      db.run('UPDATE orders SET status = ? WHERE id = ?', [orderStatus, task.orderId]);
    }

    saveDatabase();
    return { success: true };
  }
};

// Inventory Logs
export const dbInventoryLogs = {
  getAll: (): InventoryLog[] => {
    return queryAll<InventoryLog>('SELECT * FROM inventory_logs ORDER BY timestamp DESC');
  },
  adjustStock: (
    productId: string,
    newQuantity: number,
    reason: string,
    performedBy: string
  ): { success: boolean; error?: string } => {
    const prod = dbProducts.getById(productId);
    if (!prod) return { success: false, error: 'محصول یافت نشد.' };

    const diff = newQuantity - prod.stockQuantity;
    db.run('UPDATE products SET stockQuantity = ?, lastRestockedDate = ? WHERE id = ?', [
      newQuantity, new Date().toISOString(), productId
    ]);

    const logId = `log_${Date.now()}`;
    db.run(
      `INSERT INTO inventory_logs (
        id, productId, productName, sku, type, quantityChange, resultingQuantity,
        referenceId, referenceText, timestamp, performedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId, prod.id, prod.name, prod.sku, 'manual_adjustment', diff, newQuantity,
        '', `تعدیل دستی انبار: ${reason || 'انبارگردانی ادواری'}`,
        new Date().toISOString(), performedBy || 'سرپرست انبار'
      ]
    );
    saveDatabase();
    return { success: true };
  }
};

// Users & Roles
export const dbUsers = {
  getAll: (): AppUser[] => {
    const rows = queryAll<any>('SELECT * FROM users');
    return rows.map((r) => ({
      ...r,
      isActive: Boolean(r.isActive),
      customPermissions: r.customPermissionsJson ? JSON.parse(r.customPermissionsJson) : undefined,
    }));
  },
  create: (data: Omit<AppUser, 'id'>): AppUser => {
    const id = `usr_${Date.now()}`;
    db.run(
      `INSERT INTO users (id, name, email, avatar, roleId, department, isActive, customPermissionsJson) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.email, data.avatar, data.roleId, data.department, data.isActive ? 1 : 0, data.customPermissions ? JSON.stringify(data.customPermissions) : '']
    );
    saveDatabase();
    return { id, ...data };
  },
  updateRole: (userId: string, roleId: string): boolean => {
    db.run('UPDATE users SET roleId = ?, customPermissionsJson = ? WHERE id = ?', [roleId, '', userId]);
    saveDatabase();
    return true;
  },
  updateCustomPermissions: (userId: string, permissions: any): boolean => {
    db.run('UPDATE users SET customPermissionsJson = ? WHERE id = ?', [JSON.stringify(permissions), userId]);
    saveDatabase();
    return true;
  }
};

export const dbRoles = {
  getAll: (): UserRole[] => {
    const rows = queryAll<any>('SELECT * FROM roles');
    return rows.map((r) => ({
      ...r,
      permissions: JSON.parse(r.permissionsJson || '{}'),
    }));
  }
};

export const dbAdmin = {
  resetData: () => {
    db.run('DROP TABLE IF EXISTS categories');
    db.run('DROP TABLE IF EXISTS production_lines');
    db.run('DROP TABLE IF EXISTS products');
    db.run('DROP TABLE IF EXISTS orders');
    db.run('DROP TABLE IF EXISTS production_tasks');
    db.run('DROP TABLE IF EXISTS inventory_logs');
    db.run('DROP TABLE IF EXISTS users');
    db.run('DROP TABLE IF EXISTS roles');
    
    initDb();
  }
};
