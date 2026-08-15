import { CustomerOrder } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { 
  IOrderRepository, 
  IProductRepository, 
  IInventoryLogRepository, 
  ISnapshotRepository,
  IUserRepository 
} from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';
import { ProductEntity } from '../../../domain/entities/ProductEntity';

export interface DispatchOrderCommand {
  orderId: string;
  trackingCode?: string;
  logisticsNotes?: string;
}

export class DispatchOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private inventoryLogRepo: IInventoryLogRepository,
    private snapshotRepo: ISnapshotRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(command: DispatchOrderCommand): Result<CustomerOrder> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'warehouse', 'write')) {
      return err('خطای دسترسی: شما مجوز خروج و ارسال بار از انبار را ندارید.');
    }

    const order = this.orderRepo.getById(command.orderId);
    if (!order) {
      return err('سفارش مورد نظر یافت نشد.');
    }

    if (order.status !== 'produced') {
      return err('تنها سفارش‌های در وضعیت «تولید شده و آماده در انبار» قابل ارسال هستند.');
    }

    const products = this.productRepo.getAll();

    // Deduct stock for all order items & record inventory logs + snapshots
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId || p.sku === item.sku);
      if (product) {
        const prevQty = product.stockQuantity;
        const newQty = Math.max(0, prevQty - item.quantity);
        product.stockQuantity = newQty;
        this.productRepo.save(product);

        // Record Inventory Log
        this.inventoryLogRepo.append({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          type: 'out_to_customer',
          quantityChange: -item.quantity,
          resultingQuantity: newQty,
          timestamp: new Date().toISOString(),
          performedBy: currentUser.name,
          referenceId: order.id,
          referenceText: `ارسال سفارش مشتری ${order.orderNumber} به مقصد ${order.customerCompany || 'خریدار'}`,
        });

        // Record Outbound Dispatch Snapshot
        const snapshot = ProductEntity.createSnapshot(
          product,
          'order_dispatched',
          order.id,
          order.orderNumber,
          currentUser.name,
          item.quantity,
          `ارسال قطعی برای خریدار ${order.customerName} - بارنامه: ${command.trackingCode || 'ارسال اختصاصی'}`
        );
        this.snapshotRepo.append(snapshot);
      }
    }

    // Update order status
    order.status = 'dispatched';
    order.dispatchedDate = new Date().toISOString();
    order.trackingCode = command.trackingCode || `TRK-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
    order.notes = order.notes 
      ? `${order.notes}\n[لجستیک]: ${command.logisticsNotes || 'ارسال تکمیل شد'}` 
      : (command.logisticsNotes || '');

    this.orderRepo.save(order);
    return ok(order);
  }
}
