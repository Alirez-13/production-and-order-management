import { WarehouseProduct } from '../../../types';
import { Result, ok, err } from '../../../domain/common/Result';
import { 
  IProductRepository, 
  IUserRepository 
} from '../../../domain/repositories/Interfaces';
import { SecurityEntity } from '../../../domain/entities/SecurityEntity';
import { ProductEntity } from '../../../domain/entities/ProductEntity';

export class UpsertProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private userRepo: IUserRepository
  ) {}

  public execute(prodData: Partial<WarehouseProduct> & { id?: string }): Result<WarehouseProduct> {
    const currentUser = this.userRepo.getCurrentUser();
    const roles = this.userRepo.getRoles();

    if (!SecurityEntity.hasPermission(currentUser, roles, 'products', 'write')) {
      return err('خطای دسترسی: شما مجوز ایجاد یا ویرایش کالا را ندارید.');
    }

    const validation = ProductEntity.validateProductData(prodData);
    if (!validation.success) return err(validation.error);

    const isEdit = Boolean(prodData.id && this.productRepo.getById(prodData.id));

    if (isEdit && prodData.id) {
      const existing = this.productRepo.getById(prodData.id)!;
      const updated: WarehouseProduct = {
        ...existing,
        ...prodData,
        lastRestockedDate: new Date().toISOString(),
      };
      this.productRepo.save(updated);
      return ok(updated);
    } else {
      const newProduct: WarehouseProduct = {
        id: prodData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sku: prodData.sku!.trim().toUpperCase(),
        name: prodData.name!.trim(),
        category: prodData.category || 'عمومی',
        categoryId: prodData.categoryId,
        unit: prodData.unit || 'عدد',
        stockQuantity: prodData.stockQuantity ?? 0,
        minAlertThreshold: prodData.minAlertThreshold ?? 10,
        unitCost: prodData.unitCost ?? 0,
        unitSalePrice: prodData.unitSalePrice ?? 0,
        productionLineName: prodData.productionLineName || 'خط عمومی',
        productionLineId: prodData.productionLineId,
        locationBin: prodData.locationBin || 'A-01-01',
        description: prodData.description || '',
        specifications: prodData.specifications || '',
        status: prodData.status || 'active',
        lastRestockedDate: new Date().toISOString(),
      };
      this.productRepo.save(newProduct);
      return ok(newProduct);
    }
  }
}
