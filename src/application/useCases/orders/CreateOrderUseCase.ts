import { CustomerOrder, OrderItem, OrderPriority } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { OrderEntity } from '../../../domain/entities/OrderEntity';
import { IOrderRepository, IUserRepository } from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';

export interface CreateOrderCommand {
  customerName: string;
  customerCompany?: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  requiredDeliveryDate: string;
  priority?: OrderPriority;
  items: OrderItem[];
  notes?: string;
}

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(command: CreateOrderCommand): Result<CustomerOrder> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'orders', 'write')) {
      return err('خطای دسترسی: شما مجوز ثبت سفارش جدید را ندارید.');
    }

    const validation = OrderEntity.validateNewOrder({
      customerName: command.customerName,
      customerPhone: command.customerPhone,
      items: command.items,
      requiredDeliveryDate: command.requiredDeliveryDate,
    });

    if (!validation.success) {
      return err(validation.error);
    }

    const calculatedTotal = OrderEntity.calculateTotalAmount(command.items);
    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: CustomerOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      customerName: command.customerName.trim(),
      customerCompany: command.customerCompany?.trim() || 'شخصی / عمومی',
      customerPhone: command.customerPhone.trim(),
      customerEmail: command.customerEmail?.trim(),
      customerAddress: command.customerAddress?.trim(),
      status: 'unprocessed',
      priority: command.priority || 'medium',
      orderDate: new Date().toISOString(),
      requiredDeliveryDate: command.requiredDeliveryDate,
      items: command.items,
      totalAmount: calculatedTotal,
      notes: command.notes?.trim() || '',
    };

    this.orderRepo.save(newOrder);
    return ok(newOrder);
  }
}
