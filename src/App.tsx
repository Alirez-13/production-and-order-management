import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Sidebar, ActiveTab } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ProductionManagement } from "./components/ProductionManagement";
import { CustomerOrders } from "./components/CustomerOrders";
import { WarehouseManagement } from "./components/WarehouseManagement";
import { ProductCatalog } from "./components/ProductCatalog";
import { AnalyticsReports } from "./components/AnalyticsReports";
import { SecurityRBAC } from "./components/SecurityRBAC";
import { ExpressApiDocs } from "./components/ExpressApiDocs";
import { PermissionGuard } from "./components/PermissionGuard";
import { StorageService } from "./services/storageService";
import {
  CustomerOrder,
  ProductionTask,
  WarehouseProduct,
  InventoryLog,
  AppUser,
  UserRole,
  TimeRangeFilter,
  ThemeMode,
  ProductCategory,
  ProductionLine,
} from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return (
      (localStorage.getItem("factory_mes_active_tab") as ActiveTab) ||
      "dashboard"
    );
  });
  const [timeFilter, setTimeFilter] = useState<TimeRangeFilter>("this_month");

  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("factory_mes_theme") as ThemeMode) || "dark";
  });

  useEffect(() => {
    localStorage.setItem("factory_mes_active_tab", activeTab);
  }, [activeTab]);

  const isDark = theme === "dark";
  // Synchronize <html> root class for light/dark theme styling
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Toggle Theme
  const handleThemeToggle = () => {
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("factory_mes_theme", nextTheme);
      return nextTheme;
    });
  };

  // App state
  const [currentUser, setCurrentUser] = useState<AppUser>(() =>
    StorageService.getCurrentUser(),
  );
  const [orders, setOrders] = useState<CustomerOrder[]>(() =>
    StorageService.getOrders(),
  );
  const [productionTasks, setProductionTasks] = useState<ProductionTask[]>(() =>
    StorageService.getProductionTasks(),
  );
  const [products, setProducts] = useState<WarehouseProduct[]>(() =>
    StorageService.getProducts(),
  );
  const [categories, setCategories] = useState<ProductCategory[]>(() =>
    StorageService.getCategories(),
  );
  const [productionLines, setProductionLines] = useState<ProductionLine[]>(() =>
    StorageService.getProductionLines(),
  );
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(() =>
    StorageService.getInventoryLogs(),
  );
  const [roles, setRoles] = useState<UserRole[]>(() =>
    StorageService.getRoles(),
  );

  // Refresh all state from StorageService
  const refreshData = useCallback(() => {
    setCurrentUser(StorageService.getCurrentUser());
    setOrders(StorageService.getOrders());
    setProductionTasks(StorageService.getProductionTasks());
    setProducts(StorageService.getProducts());
    setCategories(StorageService.getCategories());
    setProductionLines(StorageService.getProductionLines());
    setInventoryLogs(StorageService.getInventoryLogs());
    setRoles(StorageService.getRoles());
  }, []);

  // Initial synchronization with backend SQLite
  useEffect(() => {
    StorageService.syncFromBackend().then(() => {
      refreshData();
    });
  }, [refreshData]);

  const handleUserChange = (userId: string) => {
    StorageService.setCurrentUserId(userId);
    refreshData();
  };

  // Badge counts
  const unprocessedOrdersCount = orders.filter(
    (o) => o.status === "unprocessed",
  ).length;
  const activeProductionCount = productionTasks.filter(
    (t) => t.stage === "in_production" || t.stage === "queued",
  ).length;
  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= p.minAlertThreshold,
  ).length;
  const dispatchedOrdersCount = orders.filter(
    (o) => o.status === "dispatched",
  ).length;
  const urgentOrdersCount = orders.filter(
    (o) => o.priority === "urgent" && o.status !== "dispatched",
  ).length;

  return (
    <div
      className={`min-h-screen flex flex-col font-['Vazirmatn',system-ui,sans-serif] selection:bg-teal-500/30 selection:text-teal-200 transition-colors duration-200 ${
        isDark ? "bg-[#0A0A0B] text-gray-200" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        roles={roles}
        onUserChange={handleUserChange}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        onRefreshData={refreshData}
        lowStockCount={lowStockCount}
        urgentOrdersCount={urgentOrdersCount}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onToggleTheme={handleThemeToggle}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[100%] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUser}
          theme={theme}
          counts={{
            unprocessedOrders: unprocessedOrdersCount,
            activeProduction: activeProductionCount,
            lowStockItems: lowStockCount,
            dispatchedOrders: dispatchedOrdersCount,
            totalProducts: products.length,
          }}
        />

        {/* Content Area with RBAC Enforcement */}
        <main className="flex-1 min-w-0">
          {activeTab === "dashboard" && (
            <Dashboard
              orders={orders}
              productionTasks={productionTasks}
              products={products}
              timeFilter={timeFilter}
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              theme={theme}
            />
          )}

          {activeTab === "products" && (
            <PermissionGuard
              module="products"
              action="read"
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              theme={theme}
            >
              <ProductCatalog
                products={products}
                categories={categories}
                productionLines={productionLines}
                currentUser={currentUser}
                onRefreshData={refreshData}
                onNavigateTab={setActiveTab}
                theme={theme}
              />
            </PermissionGuard>
          )}

          {activeTab === "production" && (
            <PermissionGuard
              module="production"
              action="read"
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              theme={theme}
            >
              <ProductionManagement
                tasks={productionTasks}
                orders={orders}
                products={products}
                productionLines={productionLines}
                currentUser={currentUser}
                onRefreshData={refreshData}
                theme={theme}
              />
            </PermissionGuard>
          )}

          {activeTab === "orders" && (
            <PermissionGuard
              module="orders"
              action="read"
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              theme={theme}
            >
              <CustomerOrders
                orders={orders}
                products={products}
                currentUser={currentUser}
                onRefreshData={refreshData}
                onNavigateTab={setActiveTab}
                theme={theme}
              />
            </PermissionGuard>
          )}

          {activeTab === "warehouse" && (
            <PermissionGuard
              module="warehouse"
              action="read"
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              theme={theme}
            >
              <WarehouseManagement
                products={products}
                orders={orders}
                logs={inventoryLogs}
                currentUser={currentUser}
                onRefreshData={refreshData}
                onNavigateTab={setActiveTab}
                theme={theme}
              />
            </PermissionGuard>
          )}

          {activeTab === "reports" && (
            <PermissionGuard
              module="reports"
              action="read"
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              theme={theme}
            >
              <AnalyticsReports
                orders={orders}
                productionTasks={productionTasks}
                products={products}
                timeFilter={timeFilter}
                onTimeFilterChange={setTimeFilter}
                currentUser={currentUser}
                theme={theme}
              />
            </PermissionGuard>
          )}

          {activeTab === "security" && (
            <PermissionGuard
              module="users"
              action="read"
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              theme={theme}
            >
              <SecurityRBAC
                currentUser={currentUser}
                roles={roles}
                onRefreshData={refreshData}
                theme={theme}
              />
            </PermissionGuard>
          )}

          {activeTab === "api_docs" && (
            <ExpressApiDocs currentUser={currentUser} theme={theme} />
          )}
        </main>
      </div>
    </div>
  );
}
