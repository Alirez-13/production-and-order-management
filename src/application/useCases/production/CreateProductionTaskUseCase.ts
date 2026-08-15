import { ProductionTask, OrderPriority } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { ProductionTaskEntity } from '../../../domain/entities/ProductionTaskEntity';
import { 
  IProductionTaskRepository, 
  IProductRepository, 
  IOrderRepository,
  IUserRepository 
} from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';

export interface CreateTaskCommand {
  productId: string;
  targetQuantity: number;
  priority?: OrderPriority;
  productionLine: string;
  estimatedHours?: number;
  assignedOperator?: string;
  notes?: string;
  relatedOrderId?: string;
  relatedOrderNumber?: string;
}

export class CreateProductionTaskUseCase {
  constructor(
    private taskRepo: IProductionTaskRepository,
    private productRepo: IProductRepository,
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(command: CreateTaskCommand): Result<ProductionTask> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'production', 'write')) {
      return err('خطای دسترسی: شما مجوز ایجاد دستور ساخت جدید در خط تولید را ندارید.');
    }

    const product = this.productRepo.getById(command.productId);
    if (!product) return err('محصول انتخابی یافت نشد.');

    const validation = ProductionTaskEntity.validateNewTask({
      productName: product.name,
      targetQuantity: command.targetQuantity,
      productionLine: command.productionLine,
    });
    if (!validation.success) return err(validation.error);

    const taskCode = `TSK-${product.sku.substring(0, 7)}-${Math.floor(100 + Math.random() * 900)}`;

    const newTask: ProductionTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      taskCode,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      quantity: command.targetQuantity,
      unit: product.unit || 'عدد',
      stage: 'queued',
      progressPercent: 0,
      priority: command.priority || 'medium',
      productionLine: command.productionLine,
      estimatedHours: command.estimatedHours || 12,
      operatorName: command.assignedOperator || 'اپراتور خط تولید',
      startDate: new Date().toISOString(),
      orderId: command.relatedOrderId,
      orderNumber: command.relatedOrderNumber,
      notes: command.notes || '',
      addedToWarehouse: false,
    };

    this.taskRepo.save(newTask);

    // If linked to an unprocessed order, transition order to in_production
    if (command.relatedOrderId) {
      const order = this.orderRepo.getById(command.relatedOrderId);
      if (order && order.status === 'unprocessed') {
        order.status = 'in_production';
        this.orderRepo.save(order);
      }
    }

    return ok(newTask);
  }
}
