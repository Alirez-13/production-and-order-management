import {
  CustomerOrder,
  ProductionTask,
  WarehouseProduct,
  InventoryLog,
  AppUser,
  UserRole,
  ProductCategory,
  ProductionLine,
} from '../types';

export const ApiService = {
  // Categories
  async getCategories(): Promise<ProductCategory[]> {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success) return json.data;
      return [];
    } catch (e) {
      console.warn('API getCategories fallback:', e);
      return [];
    }
  },

  async createCategory(data: Omit<ProductCategory, 'id'>): Promise<{ success: boolean; data?: ProductCategory; error?: string }> {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateCategory(id: string, data: Partial<ProductCategory>): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Production Lines
  async getProductionLines(): Promise<ProductionLine[]> {
    try {
      const res = await fetch('/api/production-lines');
      const json = await res.json();
      if (json.success) return json.data;
      return [];
    } catch (e) {
      console.warn('API getProductionLines fallback:', e);
      return [];
    }
  },

  async createProductionLine(data: Omit<ProductionLine, 'id'>): Promise<{ success: boolean; data?: ProductionLine; error?: string }> {
    try {
      const res = await fetch('/api/production-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateProductionLine(id: string, data: Partial<ProductionLine>): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/production-lines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async deleteProductionLine(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/production-lines/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Products
  async getProducts(): Promise<WarehouseProduct[]> {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success) return json.data;
      return [];
    } catch (e) {
      console.warn('API getProducts fallback:', e);
      return [];
    }
  },

  async createProduct(data: Omit<WarehouseProduct, 'id'>): Promise<{ success: boolean; data?: WarehouseProduct; error?: string }> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateProduct(id: string, data: Partial<WarehouseProduct>): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Orders
  async getOrders(): Promise<CustomerOrder[]> {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.success) return json.data;
      return [];
    } catch (e) {
      console.warn('API getOrders fallback:', e);
      return [];
    }
  },

  async createOrder(data: any): Promise<{ success: boolean; data?: CustomerOrder; error?: string }> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateOrderStatus(id: string, status: CustomerOrder['status']): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async dispatchOrder(orderId: string, trackingCode: string, performedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/orders/${orderId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode, performedBy }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Production Tasks
  async getProductionTasks(): Promise<ProductionTask[]> {
    try {
      const res = await fetch('/api/production-tasks');
      const json = await res.json();
      if (json.success) return json.data;
      return [];
    } catch (e) {
      console.warn('API getProductionTasks fallback:', e);
      return [];
    }
  },

  async createProductionTask(data: Omit<ProductionTask, 'id' | 'taskCode' | 'addedToWarehouse'>): Promise<{ success: boolean; data?: ProductionTask; error?: string }> {
    try {
      const res = await fetch('/api/production-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateTaskStage(id: string, stage: ProductionTask['stage'], progressPercent?: number, performedBy?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/production-tasks/${id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, progressPercent, performedBy }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Inventory Logs & Adjust Stock
  async getInventoryLogs(): Promise<InventoryLog[]> {
    try {
      const res = await fetch('/api/inventory-logs');
      const json = await res.json();
      if (json.success) return json.data;
      return [];
    } catch (e) {
      console.warn('API getInventoryLogs fallback:', e);
      return [];
    }
  },

  async adjustStock(productId: string, newQuantity: number, reason: string, performedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/warehouse/adjust-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newQuantity, reason, performedBy }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Users & Roles
  async getUsers(): Promise<AppUser[]> {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) return json.data;
      return [];
    } catch (e) {
      console.warn('API getUsers fallback:', e);
      return [];
    }
  },

  async createUser(data: Omit<AppUser, 'id'>): Promise<{ success: boolean; data?: AppUser; error?: string }> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateUserRole(userId: string, roleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateUserPermissions(userId: string, permissions: any): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/users/${userId}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async getRoles(): Promise<UserRole[]> {
    try {
      const res = await fetch('/api/roles');
      const json = await res.json();
      if (json.success) return json.data;
      return [];
    } catch (e) {
      console.warn('API getRoles fallback:', e);
      return [];
    }
  },

  async resetDatabase(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/admin/reset-database', { method: 'POST' });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
};
