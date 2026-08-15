import { WarehouseProduct } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { 
  IProductRepository, 
  IInventoryLogRepository,
  IUserRepository 
} from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';

export interface AdjustStockCommand {
  productId: string;
  newQuantity: number;
  reason?: string;
}

export class AdjustStockUseCase {
  constructor(
    private productRepo: IProductRepository,
    private inventoryLogRepo: IInventoryLogRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(command: AdjustStockCommand): Result<WarehouseProduct> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'warehouse', 'write')) {
      return err('خطای دسترسی: شما مجوز تعدیل و اصلاح موجودی انبار را ندارید.');
    }

    if (command.newQuantity < 0) {
      return err('موجودی انبار نمی‌تواند منفی باشد.');
    }

    const product = this.productRepo.getById(command.productId);
    if (!product) return err('کالای مورد نظر در انبار یافت نشد.');

    const previousStock = product.stockQuantity;
    const diff = command.newQuantity - previousStock;

    product.stockQuantity = command.newQuantity;
    product.lastRestockedDate = new Date().toISOString();
    this.productRepo.save(product);

    this.inventoryLogRepo.append({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      type: 'manual_adjustment',
      quantityChange: diff,
      resultingQuantity: command.newQuantity,
      timestamp: new Date().toISOString(),
      performedBy: currentUser.name,
      referenceText: command.reason || 'تعدیل دستی و انبارگردانی دوره‌ای',
    });

    return ok(product);
  }
}
