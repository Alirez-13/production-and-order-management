import { 
  CustomerOrder, 
  ProductionTask, 
  WarehouseProduct, 
  InventoryLog, 
  ProductSnapshot, 
  AppUser, 
  UserRole, 
  ProductCategory, 
  ProductionLine 
} from '../../types';

export interface IOrderRepository {
  getAll(): CustomerOrder[];
  getById(id: string): CustomerOrder | undefined;
  save(order: CustomerOrder): void;
  saveAll(orders: CustomerOrder[]): void;
  delete(id: string): void;
}

export interface IProductRepository {
  getAll(): WarehouseProduct[];
  getById(id: string): WarehouseProduct | undefined;
  save(product: WarehouseProduct): void;
  saveAll(products: WarehouseProduct[]): void;
  delete(id: string): void;
}

export interface IProductionTaskRepository {
  getAll(): ProductionTask[];
  getById(id: string): ProductionTask | undefined;
  save(task: ProductionTask): void;
  saveAll(tasks: ProductionTask[]): void;
  delete(id: string): void;
}

export interface IInventoryLogRepository {
  getAll(): InventoryLog[];
  append(log: InventoryLog): void;
  saveAll(logs: InventoryLog[]): void;
}

export interface ISnapshotRepository {
  getAll(): ProductSnapshot[];
  getByProductId(productId: string): ProductSnapshot[];
  append(snapshot: ProductSnapshot): void;
  saveAll(snapshots: ProductSnapshot[]): void;
}

export interface ICategoryRepository {
  getAll(): ProductCategory[];
  getById(id: string): ProductCategory | undefined;
  save(category: ProductCategory): void;
  saveAll(categories: ProductCategory[]): void;
  delete(id: string): void;
}

export interface IProductionLineRepository {
  getAll(): ProductionLine[];
  getById(id: string): ProductionLine | undefined;
  save(line: ProductionLine): void;
  saveAll(lines: ProductionLine[]): void;
  delete(id: string): void;
}

export interface IUserRepository {
  getUsers(): AppUser[];
  getUserById(id: string): AppUser | undefined;
  getCurrentUser(): AppUser;
  setCurrentUserId(id: string): void;
  getRoles(): UserRole[];
  saveRoles(roles: UserRole[]): void;
  updateUser(user: AppUser): void;
}
