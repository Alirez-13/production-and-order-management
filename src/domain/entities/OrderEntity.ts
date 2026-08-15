import { CustomerOrder, OrderItem, OrderStatus, OrderPriority } from '../../types';
import { Result, ok, err } from '../common/Result';

export class OrderEntity {
  public static validateNewOrder(data: {
    customerName: string;
    customerPhone: string;
    items: OrderItem[];
    requiredDeliveryDate: string;
  }): Result<boolean> {
    if (!data.customerName || data.customerName.trim().length < 2) {
      return err('نام خریدار یا سازمان الزامی بوده و باید حداقل ۲ کاراکتر باشد.');
    }
    if (!data.customerPhone || data.customerPhone.trim().length < 8) {
      return err('شماره تماس معتبر خریدار الزامی است.');
    }
    if (!data.items || data.items.length === 0) {
      return err('حداقل یک ردیف محصول باید در سفارش درج شود.');
    }
    for (const item of data.items) {
      if (!item.quantity || item.quantity <= 0) {
        return err(`تعداد برای کالای «${item.productName}» باید بزرگتر از صفر باشد.`);
      }
    }
    if (!data.requiredDeliveryDate) {
      return err('تاریخ تحویل مورد نیاز الزامی است.');
    }
    return ok(true);
  }

  public static calculateTotalAmount(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice), 0);
  }

  public static canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      unprocessed: ['queued', 'in_production', 'cancelled'],
      queued: ['in_production', 'cancelled'],
      in_production: ['produced', 'cancelled'],
      produced: ['dispatched', 'cancelled'],
      dispatched: [],
      cancelled: [],
    };
    return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
  }
}
