import { WarehouseProduct, ProductSnapshot } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { 
  IProductRepository, 
  ISnapshotRepository,
  IUserRepository 
} from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';
import { ProductEntity } from '../../../domain/entities/ProductEntity';

export class ReactivateProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private snapshotRepo: ISnapshotRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(productId: string): Result<{ product: WarehouseProduct; snapshot: ProductSnapshot }> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'products', 'write') && 
        !SecurityEntity.hasPermission(currentUser, roles, 'warehouse', 'write')) {
      return err('خطای دسترسی: شما مجوز فعال‌سازی مجدد کالا را ندارید.');
    }

    const product = this.productRepo.getById(productId);
    if (!product) return err('محصول یافت نشد.');

    product.status = 'active';
    delete product.discontinuedAt;
    delete product.discontinuedReason;
    this.productRepo.save(product);

    const snapshot = ProductEntity.createSnapshot(
      product,
      'line_change',
      product.id,
      product.sku,
      currentUser.name,
      product.stockQuantity,
      'فعال‌سازی مجدد و بازگشت به چرخه تولید فعال کارخانه'
    );
    this.snapshotRepo.append(snapshot);

    return ok({ product, snapshot });
  }
}
