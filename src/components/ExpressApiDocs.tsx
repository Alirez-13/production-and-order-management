import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Play, 
  ShieldCheck, 
  FileCode, 
  Cpu, 
  ArrowRight,
  Send,
  Database,
  Server,
  Zap,
  Check,
  Globe,
  Sliders,
  Sparkles,
  ExternalLink,
  Table
} from 'lucide-react';
import { AppUser, ThemeMode } from '../types';
import { StorageService } from '../services/storageService';

interface ExpressApiDocsProps {
  currentUser: AppUser;
  theme?: ThemeMode;
}

export const ExpressApiDocs: React.FC<ExpressApiDocsProps> = ({ currentUser, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [activeCodeTab, setActiveCodeTab] = useState<'server' | 'routes' | 'rbac' | 'sqlite_schema' | 'curl'>('server');
  const [copied, setCopied] = useState(false);
  const [apiTestEndpoint, setApiTestEndpoint] = useState('/api/products');
  const [apiTestMethod, setApiTestMethod] = useState<'GET' | 'POST' | 'PATCH'>('GET');
  const [apiRequestBody, setApiRequestBody] = useState('{\n  "status": "in_production",\n  "progressPercent": 65\n}');
  const [apiTestResponse, setApiTestResponse] = useState<string | null>(null);
  const [apiTestStatus, setApiTestStatus] = useState<number | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const expressServerCode = `// server.ts - Core Express + SQLite REST Backend
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  initDb, 
  dbCategories, 
  dbProductionLines, 
  dbProducts, 
  dbOrders, 
  dbProductionTasks, 
  dbInventoryLogs, 
  dbUsers, 
  dbRoles,
  dbAdmin 
} from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser Middleware
  app.use(express.json());

  // Initialize SQLite In-Memory Database
  await initDb();
  console.log('✅ SQLite Database ready and seeded.');

  // --- HEALTH & STATUS ---
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      engine: 'Express 4.x + SQLite (sql.js)',
      activeUser: req.headers['x-user-id'] || 'system',
      timestamp: new Date().toISOString(),
    });
  });

  // --- PRODUCTS & INVENTORY ---
  app.get('/api/products', (req, res) => {
    const products = dbProducts.getAll();
    res.json({ success: true, data: products, count: products.length });
  });

  app.post('/api/products', (req, res) => {
    const newProduct = dbProducts.create(req.body);
    res.status(201).json({ success: true, data: newProduct });
  });

  // --- PRODUCTION STAGE TRANSITIONS & AUTOMATION ---
  app.patch('/api/production-tasks/:id/stage', (req, res) => {
    const { stage, progressPercent, performedBy } = req.body;
    const result = dbProductionTasks.updateStage(req.params.id, stage, progressPercent, performedBy);
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: 'مرحله ساخت با موفقیت به‌روزرسانی شد.' });
  });

  // --- ORDERS & DISPATCH LOGISTICS ---
  app.post('/api/orders/:id/dispatch', (req, res) => {
    const { trackingCode, performedBy } = req.body;
    const result = dbOrders.dispatch(req.params.id, trackingCode, performedBy);
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: 'کالا از انبار ترخیص و بارنامه صادر گردید.' });
  });

  // Start Express Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 Express MES Server running at http://0.0.0.0:\${PORT}\`);
  });
}

startServer();`;

  const expressRbacMiddlewareCode = `// server/middleware/rbac.ts - Role-Based Access Control in Express
import { Request, Response, NextFunction } from 'express';
import { dbUsers, dbRoles } from '../db';

export type ModuleName = 'products' | 'production' | 'orders' | 'warehouse' | 'reports' | 'users';
export type AccessType = 'read' | 'write';

/**
 * Express Middleware to enforce granular Read / Write permissions per module
 */
export function requirePermission(module: ModuleName, access: AccessType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.headers['x-user-id'] as string) || 'u_admin';
    const user = dbUsers.getById(userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Unauthorized: کاربر نامعتبر یا غیرفعال است.' });
    }

    const role = dbRoles.getById(user.roleId);
    const customPerm = user.customPermissions?.[module];
    const rolePerm = role?.permissions?.[module];

    const hasAccess = customPerm ? customPerm[access] : rolePerm ? rolePerm[access] : false;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: \`خطای دسترسی (403 Forbidden): شما مجوز \${access.toUpperCase()} بر روی ماژول \${module} را ندارید.\`,
        module,
        requiredAccess: access,
        user: user.name,
      });
    }

    // Attach user info to request context
    (req as any).currentUser = user;
    next();
  };
}`;

  const sqliteSchemaCode = `-- SQLite 3 DDL Schema Definitions

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  description TEXT
);

CREATE TABLE production_lines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  capacityPerDay INTEGER DEFAULT 20,
  status TEXT DEFAULT 'active'
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  categoryId TEXT,
  productionLineId TEXT,
  productionLineName TEXT,
  unit TEXT DEFAULT 'عدد',
  stockQuantity INTEGER DEFAULT 0,
  minAlertThreshold INTEGER DEFAULT 10,
  locationBin TEXT,
  unitCost REAL DEFAULT 0,
  unitSalePrice REAL DEFAULT 0,
  description TEXT
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  orderNumber TEXT UNIQUE NOT NULL,
  customerName TEXT NOT NULL,
  customerCompany TEXT,
  customerPhone TEXT,
  customerEmail TEXT,
  customerAddress TEXT,
  items JSON NOT NULL,
  totalAmount REAL NOT NULL,
  status TEXT NOT NULL, -- 'unprocessed' | 'in_production' | 'ready_to_dispatch' | 'dispatched'
  priority TEXT NOT NULL, -- 'low' | 'medium' | 'high' | 'urgent'
  orderDate TEXT NOT NULL,
  requiredDeliveryDate TEXT,
  dispatchedDate TEXT,
  trackingCode TEXT,
  notes TEXT
);

CREATE TABLE production_tasks (
  id TEXT PRIMARY KEY,
  taskCode TEXT UNIQUE NOT NULL,
  orderId TEXT,
  orderNumber TEXT,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  productSku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  stage TEXT NOT NULL, -- 'queued' | 'in_production' | 'completed'
  progressPercent INTEGER DEFAULT 0,
  productionLineId TEXT,
  productionLineName TEXT,
  priority TEXT NOT NULL,
  createdDate TEXT NOT NULL,
  completedDate TEXT,
  assignedTo TEXT,
  notes TEXT
);

CREATE TABLE inventory_logs (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  productSku TEXT NOT NULL,
  transactionType TEXT NOT NULL, -- 'production_deposit' | 'order_dispatch' | 'manual_adjustment'
  quantityChange INTEGER NOT NULL,
  resultingQuantity INTEGER NOT NULL,
  referenceId TEXT,
  referenceText TEXT,
  timestamp TEXT NOT NULL,
  performedBy TEXT NOT NULL
);`;

  const curlExamplesCode = `# 1. Health Check
curl -X GET http://localhost:3000/api/health

# 2. Get All Products (JSON response)
curl -X GET http://localhost:3000/api/products \\
  -H "Content-Type: application/json" \\
  -H "x-user-id: u_admin"

# 3. Create a New Production Task
curl -X POST http://localhost:3000/api/production-tasks \\
  -H "Content-Type: application/json" \\
  -H "x-user-id: u_prod" \\
  -d '{
    "productId": "p_1",
    "productName": "موتور الکتریکی سه فاز 7.5KW",
    "productSku": "IND-MOT-001",
    "quantity": 10,
    "stage": "queued",
    "priority": "high",
    "productionLineId": "line_1"
  }'

# 4. Transition Production Task Stage (Automates Warehouse Credit on 'completed')
curl -X PATCH http://localhost:3000/api/production-tasks/task_1/stage \\
  -H "Content-Type: application/json" \\
  -d '{
    "stage": "completed",
    "progressPercent": 100,
    "performedBy": "علی محمدی (سرپرست تولید)"
  }'

# 5. Dispatch Customer Order from Warehouse (Decreases Stock & Logs Inventory)
curl -X POST http://localhost:3000/api/orders/ord_1/dispatch \\
  -H "Content-Type: application/json" \\
  -d '{
    "trackingCode": "BAR-1403-9982",
    "performedBy": "حمید قاسمی (انباردار)"
  }'`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestApi = async () => {
    setIsLoading(true);
    const startTime = performance.now();
    try {
      let res: Response;
      if (apiTestMethod === 'GET') {
        res = await fetch(apiTestEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
        });
      } else {
        res = await fetch(apiTestEndpoint, {
          method: apiTestMethod,
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
          body: apiRequestBody,
        });
      }

      const latency = Math.round(performance.now() - startTime);
      setApiLatency(latency);
      setApiTestStatus(res.status);

      try {
        const json = await res.json();
        setApiTestResponse(JSON.stringify(json, null, 2));
      } catch {
        const text = await res.text();
        setApiTestResponse(text || `Status: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      setApiLatency(latency);
      setApiTestStatus(500);
      setApiTestResponse(JSON.stringify({
        error: true,
        message: err.message,
        clientFallback: 'درخواست توسط سرور محلی دریافت شد',
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const endpointList = [
    { method: 'GET', path: '/api/health', desc: 'بررسی سلامت سرور Express و وضعیت SQLite', auth: 'Public' },
    { method: 'GET', path: '/api/products', desc: 'لیست کامل محصولات موجود در انبار با موجودی و قیمت', auth: 'Read: Products' },
    { method: 'POST', path: '/api/products', desc: 'افزودن کالای جدید به کاتالوگ کارخانه', auth: 'Write: Products' },
    { method: 'GET', path: '/api/categories', desc: 'لیست دسته‌بندی‌های صنعتی کالاها', auth: 'Read: Products' },
    { method: 'GET', path: '/api/production-lines', desc: 'خطوط تولید کارخانه و ظرفیت روزانه', auth: 'Read: Production' },
    { method: 'GET', path: '/api/production-tasks', desc: 'دستورهای ساخت در صف، در حال تولید و تکمیل شده', auth: 'Read: Production' },
    { method: 'POST', path: '/api/production-tasks', desc: 'ثبت دستور ساخت جدید و تخصیص به خط تولید', auth: 'Write: Production' },
    { method: 'PATCH', path: '/api/production-tasks/:id/stage', desc: 'تغییر مرحله ساخت (انتقال به انبار در صورت تکمیل)', auth: 'Write: Production' },
    { method: 'GET', path: '/api/orders', desc: 'سفارش‌های مشتریان و وضعیت تحویل', auth: 'Read: Orders' },
    { method: 'POST', path: '/api/orders', desc: 'ثبت پیش‌فاکتور و سفارش جدید مشتری', auth: 'Write: Orders' },
    { method: 'POST', path: '/api/orders/:id/dispatch', desc: 'صدور بارنامه و کسر خودکار اقلام از انبار', auth: 'Write: Warehouse' },
    { method: 'GET', path: '/api/inventory-logs', desc: 'کاردکس و لاگ کلیه تراکنش‌های ورود/خروج انبار', auth: 'Read: Warehouse' },
    { method: 'POST', path: '/api/warehouse/adjust-stock', desc: 'تعدیل و انبارگردانی دستی موجودی', auth: 'Write: Warehouse' },
    { method: 'GET', path: '/api/users', desc: 'لیست پرسنل و کاربران سامانه با نقش‌ها', auth: 'Read: Users' },
    { method: 'PATCH', path: '/api/users/:id/permissions', desc: 'تنظیم ماتریس دسترسی سفارشی (RBAC)', auth: 'Write: Users' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  معماری بک‌اند Express.js + دیتابیس SQLite
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Node.js / Express REST Engine
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                مستندات فنی کامل کلیه اندپوینت‌ها، میدل‌ویرهای کنترل دسترسی (RBAC)، ساختار جداول SQLite و کنسول اجرای تست زنده
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              isDark ? 'bg-[#18181B] border-[#27272A] text-emerald-400' : 'bg-gray-100 border-gray-200 text-emerald-700'
            }`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Express Engine Active :3000</span>
            </div>
          </div>
        </div>

        {/* Code Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveCodeTab('server')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeCodeTab === 'server'
                ? 'bg-emerald-600 text-white shadow-md'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Express Server (server.ts)
          </button>
          <button
            onClick={() => setActiveCodeTab('rbac')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeCodeTab === 'rbac'
                ? 'bg-emerald-600 text-white shadow-md'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            RBAC Middleware
          </button>
          <button
            onClick={() => setActiveCodeTab('sqlite_schema')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeCodeTab === 'sqlite_schema'
                ? 'bg-emerald-600 text-white shadow-md'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            SQLite Database Schema
          </button>
          <button
            onClick={() => setActiveCodeTab('curl')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeCodeTab === 'curl'
                ? 'bg-emerald-600 text-white shadow-md'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            cURL / API Examples
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
          <span className="text-xs font-mono text-gray-400">
            {activeCodeTab === 'server'
              ? 'server.ts (Node.js & Express REST Application)'
              : activeCodeTab === 'rbac'
              ? 'server/middleware/rbac.ts (Permission Enforcement)'
              : activeCodeTab === 'sqlite_schema'
              ? 'server/schema.sql (SQLite 3 Table Definitions)'
              : 'scripts/api-client-examples.sh (cURL Commands)'}
          </span>
          <button
            onClick={() =>
              handleCopy(
                activeCodeTab === 'server'
                  ? expressServerCode
                  : activeCodeTab === 'rbac'
                  ? expressRbacMiddlewareCode
                  : activeCodeTab === 'sqlite_schema'
                  ? sqliteSchemaCode
                  : curlExamplesCode
              )
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer transition-all ${
              isDark ? 'bg-[#18181B] border-[#27272A] text-gray-300 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-700'
            }`}
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'کپی شد!' : 'کپی سورس کد'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#0A0A0B] text-emerald-400 font-mono text-xs overflow-x-auto border border-gray-800 leading-relaxed text-left max-h-96" dir="ltr">
          <code>
            {activeCodeTab === 'server'
              ? expressServerCode
              : activeCodeTab === 'rbac'
              ? expressRbacMiddlewareCode
              : activeCodeTab === 'sqlite_schema'
              ? sqliteSchemaCode
              : curlExamplesCode}
          </code>
        </pre>
      </div>

      {/* Interactive API Tester */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                کنسول تست و اجرای زنده اندپوینت‌های Express
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ارسال ریکوئست واقعی با هدر کاربری «{currentUser.name}» و مشاهده آنی نتیجه دیتابیس
              </p>
            </div>
          </div>

          {/* Quick presets */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => {
                setApiTestMethod('GET');
                setApiTestEndpoint('/api/products');
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 cursor-pointer"
            >
              GET /products
            </button>
            <button
              onClick={() => {
                setApiTestMethod('GET');
                setApiTestEndpoint('/api/production-tasks');
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 cursor-pointer"
            >
              GET /production-tasks
            </button>
            <button
              onClick={() => {
                setApiTestMethod('GET');
                setApiTestEndpoint('/api/orders');
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer"
            >
              GET /orders
            </button>
            <button
              onClick={() => {
                setApiTestMethod('GET');
                setApiTestEndpoint('/api/health');
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 cursor-pointer"
            >
              GET /health
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={apiTestMethod}
              onChange={(e: any) => setApiTestMethod(e.target.value)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border outline-none cursor-pointer ${
                apiTestMethod === 'GET'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : apiTestMethod === 'POST'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
            </select>

            <input
              type="text"
              value={apiTestEndpoint}
              onChange={(e) => setApiTestEndpoint(e.target.value)}
              className={`flex-1 w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />

            <button
              onClick={handleTestApi}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isLoading ? 'در حال ارسال...' : 'ارسال درخواست'}</span>
            </button>
          </div>

          {apiTestMethod !== 'GET' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">بدنه درخواست (JSON Request Body):</label>
              <textarea
                rows={3}
                value={apiRequestBody}
                onChange={(e) => setApiRequestBody(e.target.value)}
                className={`w-full p-2.5 text-xs font-mono rounded-xl border outline-none ${
                  isDark ? 'bg-[#18181B] border-[#27272A] text-teal-300' : 'bg-gray-50 border-gray-300 text-teal-900'
                }`}
                dir="ltr"
              />
            </div>
          )}

          {apiTestResponse && (
            <div className="mt-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">پاسخ سرور Express:</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                    apiTestStatus && apiTestStatus < 300 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    HTTP {apiTestStatus}
                  </span>
                </div>
                {apiLatency !== null && (
                  <span className="font-mono text-gray-400 text-[11px]">زمان پاسخ: {apiLatency} ms</span>
                )}
              </div>
              <pre className="p-4 rounded-xl bg-[#0A0A0B] text-emerald-400 font-mono text-xs overflow-x-auto border border-gray-800 leading-relaxed text-left max-h-72" dir="ltr">
                <code>{apiTestResponse}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* REST Endpoints Reference Table */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#121214] border-[#27272A]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Table className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              فهرست کامل اندپوینت‌های RESTful سرور Express
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              کلیه متدها با کنترل مجوز RBAC و ترنزکشن‌های پایگاه داده SQLite
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#27272A] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                <th className="py-2.5 px-3 font-semibold">متد</th>
                <th className="py-2.5 px-3 font-semibold font-mono text-left" dir="ltr">مسیر (Endpoint Path)</th>
                <th className="py-2.5 px-3 font-semibold">توضیحات و عملکرد</th>
                <th className="py-2.5 px-3 font-semibold text-center">مجوز مورد نیاز (RBAC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {endpointList.map((ep, i) => (
                <tr key={i} className={isDark ? 'hover:bg-[#18181B]' : 'hover:bg-gray-50'}>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      ep.method === 'GET'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : ep.method === 'POST'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-teal-400 text-left" dir="ltr">
                    {ep.path}
                  </td>
                  <td className={`py-2.5 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {ep.desc}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ep.auth === 'Public'
                        ? 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                        : isDark
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {ep.auth}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
