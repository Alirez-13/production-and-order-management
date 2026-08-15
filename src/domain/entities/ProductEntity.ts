import { WarehouseProduct, ProductSnapshot } from '../../types';
import { Result, ok, err } from '../common/Result';

export class ProductEntity {
  public static validateProductData(prod: Partial<WarehouseProduct>): Result<boolean> {
    if (!prod.name || prod.name.trim().length < 2) {
      return err('نام کالا الزامی است.');
    }
    if (!prod.sku || prod.sku.trim().length < 2) {
      return err('کد کالا (SKU) الزامی است.');
    }
    if (prod.unitCost !== undefined && prod.unitCost < 0) {
      return err('بهای تمام‌شده نمی‌تواند منفی باشد.');
    }
    if (prod.unitSalePrice !== undefined && prod.unitSalePrice < 0) {
      return err('قیمت فروش نمی‌تواند منفی باشد.');
    }
    if (prod.stockQuantity !== undefined && prod.stockQuantity < 0) {
      return err('موجودی انبار نمی‌تواند منفی باشد.');
    }
    return ok(true);
  }

  public static isLowStock(product: WarehouseProduct): boolean {
    return product.stockQuantity <= product.minAlertThreshold;
  }

  public static createSnapshot(
    product: WarehouseProduct,
    context: 'production_completed' | 'order_dispatched' | 'manual_archive' | 'line_change' | 'discontinued',
    referenceId?: string,
    referenceCode?: string,
    operatorOrUser: string = 'مدیر سیستم',
    producedQuantity?: number,
    notes?: string
  ): ProductSnapshot {
    const timestamp = new Date().toISOString();
    return {
      id: `snp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      unitCost: product.unitCost,
      unitSalePrice: product.unitSalePrice,
      productionLineName: product.productionLineName,
      locationBin: product.locationBin,
      description: product.description,
      specifications: product.specifications,
      snapshotTakenAt: timestamp,
      timestamp: timestamp,
      capturedAt: timestamp,
      context,
      snapshotReason: context,
      referenceId,
      referenceCode,
      operatorOrUser,
      capturedBy: operatorOrUser,
      producedQuantity: producedQuantity ?? product.stockQuantity,
      quantity: producedQuantity ?? product.stockQuantity,
      notes,
    };
  }
}
