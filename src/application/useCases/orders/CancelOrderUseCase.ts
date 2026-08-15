import { CustomerOrder } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { IOrderRepository, IUserRepository } from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';

export class CancelOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(orderId: string, reason?: string): Result<CustomerOrder> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'orders', 'write')) {
      return err('خطای دسترسی: شما مجوز لغو سفارش را ندارید.');
    }

    const order = this.orderRepo.getById(orderId);
    if (!order) return err('سفارش یافت نشد.');

    if (order.status === 'dispatched') {
      return err('امکان لغو سفارشی که برای مشتری ارسال و تحویل باربری شده وجود ندارد.');
    }

    order.status = 'cancelled';
    if (reason) {
      order.notes = order.notes ? `${order.notes}\n[دلیل لغو]: ${reason}` : `دلیل لغو: ${reason}`;
    }

    this.orderRepo.save(order);
    return ok(order);
  }
}
