import { WarehouseProduct, ProductSnapshot } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { 
  IProductRepository, 
  ISnapshotRepository,
  IUserRepository 
} from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';
import { ProductEntity } from '../../../domain/entities/ProductEntity';

export class DiscontinueProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private snapshotRepo: ISnapshotRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(productId: string, reason: string = 'توقف تولید و پایان چرخه عمر کالا'): Result<{ product: WarehouseProduct; snapshot: ProductSnapshot }> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'products', 'write') && 
        !SecurityEntity.hasPermission(currentUser, roles, 'warehouse', 'write')) {
      return err('خطای دسترسی: شما مجوز توقف تولید یا آرشیو کالا را ندارید.');
    }

    const product = this.productRepo.getById(productId);
    if (!product) return err('محصول یافت نشد.');

    product.status = 'discontinued';
    product.discontinuedAt = new Date().toISOString();
    product.discontinuedReason = reason;
    this.productRepo.save(product);

    const snapshot = ProductEntity.createSnapshot(
      product,
      'discontinued',
      product.id,
      product.sku,
      currentUser.name,
      product.stockQuantity,
      `بایگانی و توقف رسمی خط تولید کالا: ${reason}`
    );
    this.snapshotRepo.append(snapshot);

    return ok({ product, snapshot });
  }
}
