import { ProductionTask, ProductionStage } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { ProductionTaskEntity } from '../../../domain/entities/ProductionTaskEntity';
import { ProductEntity } from '../../../domain/entities/ProductEntity';
import { 
  IProductionTaskRepository, 
  IProductRepository, 
  IOrderRepository,
  IInventoryLogRepository,
  ISnapshotRepository,
  IUserRepository 
} from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';

export interface UpdateStageCommand {
  taskId: string;
  targetStage: ProductionStage;
  explicitProgress?: number;
}

export class UpdateTaskStageUseCase {
  constructor(
    private taskRepo: IProductionTaskRepository,
    private productRepo: IProductRepository,
    private orderRepo: IOrderRepository,
    private inventoryLogRepo: IInventoryLogRepository,
    private snapshotRepo: ISnapshotRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(command: UpdateStageCommand): Result<ProductionTask> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'production', 'write')) {
      return err('خطای دسترسی: شما مجوز تغییر وضعیت دستورات خط تولید را ندارید.');
    }

    const task = this.taskRepo.getById(command.taskId);
    if (!task) return err('دستور تولید یافت نشد.');

    const oldStage = task.stage;
    task.stage = command.targetStage;
    task.progressPercent = ProductionTaskEntity.calculateProgress(command.targetStage, command.explicitProgress);

    // If transitioned to completed:
    if (command.targetStage === 'completed' && oldStage !== 'completed') {
      task.completedDate = new Date().toISOString();
      task.progressPercent = 100;
      task.addedToWarehouse = true;

      // Increment warehouse stock automatically
      const product = this.productRepo.getById(task.productId);
      if (product) {
        const prevStock = product.stockQuantity;
        const newStock = prevStock + task.quantity;
        product.stockQuantity = newStock;
        this.productRepo.save(product);

        // Record Inventory Log
        this.inventoryLogRepo.append({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          type: 'in_from_production',
          quantityChange: task.quantity,
          resultingQuantity: newStock,
          timestamp: new Date().toISOString(),
          performedBy: currentUser.name,
          referenceId: task.id,
          referenceText: `تکمیل دستور ساخت ${task.taskCode} در خط ${task.productionLine}`,
        });

        // Record Completed Production Snapshot
        const snapshot = ProductEntity.createSnapshot(
          product,
          'production_completed',
          task.id,
          task.taskCode,
          task.operatorName || currentUser.name,
          task.quantity,
          `اتمام موفق فرآیند ساخت در خط ${task.productionLine} - افزوده شده به موجودی آزاد انبار`
        );
        this.snapshotRepo.append(snapshot);
      }

      // If linked to an order, update order status to produced (ready for dispatch)
      if (task.orderId) {
        const order = this.orderRepo.getById(task.orderId);
        if (order && (order.status === 'unprocessed' || order.status === 'in_production')) {
          order.status = 'produced';
          this.orderRepo.save(order);
        }
      }
    }

    this.taskRepo.save(task);
    return ok(task);
  }
}
