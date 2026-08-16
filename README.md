# 🏭 Production and Order Management System
> **An Industrial-Grade, Full-Stack Production Planning, Customer Orders, and Inventory Management Platform**

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com/)
[![Express + SQLite](https://img.shields.io/badge/Backend-Express.js%20%2B%20SQLite-lightgrey.svg)](https://expressjs.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Hexagonal-green.svg)](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20AAA%2FAA%20Compliant-orange.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![RTL](https://img.shields.io/badge/Localization-Persian%20%2F%20RTL%20Native-purple.svg)]()

---

## 📖 Overview & Purpose

The **Production and Order Management System** is a unified, end-to-end industrial web application designed for manufacturing facilities, assembly plants, and supply-chain operations.

It connects the entire manufacturing lifecycle into one streamlined workflow:
1. **Sales & Customer Orders:** Capturing customer orders with live pricing, urgency prioritization, and automatic stock reservation.
2. **Production Line Scheduling:** Routing order items into multi-stage production queues (*Queued* $\rightarrow$ *In Production* $\rightarrow$ *Completed*).
3. **Automated Warehouse & Logistics:** Automatic inventory replenishment upon production completion, stock adjustment logs, and order dispatching with courier tracking codes.
4. **Role-Based Access Control (RBAC):** Granular, real-time read/write permissions for plant managers, warehouse supervisors, production line operators, and sales specialists.
5. **Business Intelligence & Analytics:** Financial dashboards, inventory turnover metrics, production throughput graphs, and complete customer purchase histories.

Built with **Clean Hexagonal Architecture** on the backend and an **accessible, high-contrast, RTL-first Design System** on the frontend, this system is optimized for high-reliability shop-floor operations and outdoor sunlight visibility.

---

## 🌟 Key Features

### 1. 📊 Executive Dashboard & Real-Time Metrics
- **Live KPI Cards:** Dispatched order revenue, unprocessed new orders, active lines in production, and warehouse total valuation.
- **Revenue & Logistics Stream:** Interactive area chart displaying completed delivery revenues across timeframes (Today, Last 7 Days, Month, Year).
- **Order Lifecycle Breakdown:** Visual circular progress distribution across the 5 core order lifecycle states.
- **Customer Purchase History:** Searchable table with instant filtering by customer name, company, or tracking code with direct invoice modal view.

### 2. 📋 Customer Orders Management (`CustomerOrders.tsx`)
- **Direct Order Processing:** Add multi-item orders with dynamic line-item total calculation and custom notes.
- **Priority Matrix:** Set priority tiers (*Urgent*, *High*, *Medium*, *Low*) with unbreakable badge tags and bidirectional `<bdi>` isolation.
- **Lifecycle Actions:** Send directly to production queue, cancel orders, or dispatch ready products from stock.
- **Invoice & Delivery Modal:** Generate printable order vouchers and delivery notes.

### 3. 🏭 Production Lines & Work Orders (`ProductionManagement.tsx`)
- **Visual Kanban & Stage Pipeline:**
  - ⏳ **Queued (در صف تولید):** Orders awaiting material preparation or machine availability.
  - ⚙️ **In Production (در حال ساخت):** Active machining, cutting, assembly, and testing lines with real-time percentage progress sliders.
  - ✅ **Produced (تکمیل شده):** Final inspection passed; automatically deposits finished goods into warehouse inventory.
- **Automated Inventory Sync:** Completing a production run automatically increments product stock levels in the warehouse with a recorded audit log.
- **Line & Operator Allocation:** Assign specific workshop lines (Line A, Line B, Packaging) and operators to tasks.

### 4. 📦 Warehouse & Inventory Control (`WarehouseManagement.tsx`)
- **Real-Time Stock Matrix:** Live monitoring of current stock, reserved stock, safety thresholds, and unit values.
- **Safety Stock Warning Engine:** Automated alert badges for low-stock items requiring urgent production replenishment.
- **Manual Stock Adjustments:** Audit-logged stock adjustments (receipts, write-offs, physical inventory reconciliations).
- **Logistics Dispatch Module:** Fast-track order dispatch workflow with carrier tracking code assignment.

### 5. 🏷️ Product Catalog & Snapshot Engine (`ProductCatalog.tsx`)
- **Catalog Management:** Create and edit products with SKU, category, unit specifications, minimum reorder points, and unit pricing.
- **Immutable Product Snapshots:** Audit mechanism capturing exact point-in-time specifications, pricing, and BOM metadata.
- **Historical Snapshot Diff Modal:** View version histories and compare changes between catalog revisions.

### 6. 🔒 Enterprise Security & Granular RBAC (`SecurityRBAC.tsx`)
- **Role Profiles:**
  - 👑 **Plant General Manager (مدیر ارشد کارخانه):** Full Read/Write access to all modules and user administration.
  - 📦 **Warehouse Supervisor (سرپرست انبار):** Write access to warehouse stock and dispatch; read access to orders and production.
  - ⚙️ **Production Operator (اپراتور خط تولید):** Write access to production stages; read access to catalog and queue.
  - 💼 **Sales & Customer Specialist (کارشناس فروش):** Write access to customer orders; read access to catalog and inventory.
- **Instant Role Switcher:** Live simulation and testing of permission barriers in the top navigation bar without logging out.

### 7. 📈 Business Intelligence & Analytics (`AnalyticsReports.tsx`)
- **Top Selling Products:** Revenue and quantity rankings of best-selling catalog items.
- **Production Efficiency & Throughput:** Line utilization metrics and cycle-time tracking.
- **Comprehensive Audit Trail:** Filterable log of every single stock adjustment, order creation, and stage transition with timestamp and user attribution.

---

## 🏛️ System Architecture

The project is structured according to **Hexagonal / Clean Architecture** principles to separate core business logic from UI frameworks and storage mechanisms:

```text
src/
├── domain/                      # PURE DOMAIN LAYER (Zero Framework Dependencies)
│   ├── common/                  # Monadic Result<T, E> types & functional primitives
│   ├── entities/                # Domain Entities & Value Objects (Order, Product, Task)
│   └── repositories/            # Repository Interfaces (Ports)
│
├── application/                 # USE CASE ORCHESTRATION LAYER (CQRS Pattern)
│   └── useCases/
│       ├── inventory/           # AdjustStockUseCase, UpsertProductUseCase
│       ├── orders/              # CreateOrderUseCase, DispatchOrderUseCase, CancelOrderUseCase
│       └── production/          # CreateProductionTaskUseCase, AdvanceProductionStageUseCase
│
├── services/                    # ADAPTERS & INFRASTRUCTURE LAYER
│   ├── storageService.ts        # Storage orchestration, RBAC security checks & fallback engine
│   └── apiService.ts            # Client-side gateway to REST API endpoints
│
├── hooks/                       # REACT STATE CONTROLLERS
│   ├── useOrders.ts             # Customer order state management & use case bindings
│   ├── useProductionTasks.ts    # Production pipeline state & stage progression
│   ├── useWarehouse.ts          # Warehouse stock, adjustment & dispatch actions
│   └── useSecurity.ts           # Dynamic role permissions & RBAC enforcement
│
├── components/                  # PRESENTATIONAL & UI LAYER
│   ├── Dashboard.tsx            # KPI visualizer & customer history
│   ├── CustomerOrders.tsx       # Sales order management
│   ├── ProductionManagement.tsx # MES production lines & stage transitions
│   ├── WarehouseManagement.tsx  # Inventory management & logistics
│   ├── ProductCatalog.tsx       # Product specifications & snapshots
│   ├── SecurityRBAC.tsx         # User & role permission matrices
│   ├── AnalyticsReports.tsx     # BI charts & audit logs
│   ├── Header.tsx / Sidebar.tsx # Navigation & Role Switcher
│   └── ui/                      # Atomic design system tokens (StatusBadge, Toast, Modal)
│
├── types.ts                     # Shared TypeScript schemas & DTO contracts
├── index.css                    # High-contrast design tokens, WCAG AAA/AA & RTL rules
└── App.tsx                      # Root composition layout
```

---

## 🎨 Accessibility & UI/UX Design System

- **High-Contrast Outdoor Mode:** Calibrated slate neutrals (`#090D16`, `#1E293B`, `#334155`) with high contrast ratios ($>7:1$) to guarantee readability in high-glare warehouse and outdoor sunlight conditions.
- **RTL-Native Typography:** Styled using the Persian `Vazirmatn` font with custom line-height scaling ($1.6\text{–}1.8$) and zero Latin tracking to preserve cursive connections.
- **Bidirectional Isolation:** Status badges, order identifiers, and numeric tags use `<bdi>` elements and `inline-flex` whitespace constraints to prevent orphaned Persian punctuation and reverse bracket formatting.
- **Fluid Viewport Scaling:** Responsive layout bounded between compact mobile devices ($375\text{px}$) up to widescreen industrial monitors ($1600\text{px}$).
- **Touch-First Controls:** All interactive controls maintain minimum $44\text{px} \times 44\text{px}$ touch targets.

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/production-and-order-management.git
cd production-and-order-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

---

## 🛠️ Production Build & Deployment

### Build for Production
This compiles the React frontend with Vite into `dist/` and bundles the Express backend server into `dist/server.cjs`:
```bash
npm run build
```

### Launch Production Server
```bash
npm start
```

### 🐧 Running on an Ubuntu VPS (with PM2 & Nginx)
For deploying to a raw Linux VPS (even on 1 vCPU / 1GB RAM instances):

1. **Enable Swap Memory (Recommended for 1GB RAM):**
   ```bash
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   ```

2. **Start with PM2 Process Manager:**
   ```bash
   sudo npm install -g pm2
   NODE_ENV=production pm2 start dist/server.cjs --name "production-and-order-management"
   pm2 save && pm2 startup
   ```

3. **Nginx Reverse Proxy Configuration:**
   Forward incoming port 80 traffic to local port 3000:
   ```nginx
   server {
       listen 80;
       server_name _;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with live Vite middleware on port 3000 |
| `npm run build` | Builds client static assets and bundles `server.ts` into `dist/server.cjs` |
| `npm start` | Launches the compiled standalone server in production mode |
| `npm run lint` | Runs TypeScript static type checking (`tsc --noEmit`) |

---

## 📄 License
This project is licensed under the **MIT License**. Free for commercial and open-source industrial use.
