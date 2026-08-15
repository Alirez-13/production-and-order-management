import { ProductionTask, ProductionStage } from '../../types';
import { Result, ok, err } from '../common/Result';

export class ProductionTaskEntity {
  public static validateNewTask(data: {
    productName: string;
    targetQuantity: number;
    productionLine: string;
  }): Result<boolean> {
    if (!data.productName) {
      return err('انتخاب محصول الزامی است.');
    }
    if (!data.targetQuantity || data.targetQuantity <= 0) {
      return err('تیراژ تولید باید حداقل ۱ واحد باشد.');
    }
    if (!data.productionLine) {
      return err('انتخاب خط تولید الزامی است.');
    }
    return ok(true);
  }

  public static calculateProgress(stage: ProductionStage, explicitPercent?: number): number {
    if (explicitPercent !== undefined) {
      return Math.min(100, Math.max(0, Math.round(explicitPercent)));
    }
    switch (stage) {
      case 'queued':
        return 0;
      case 'in_production':
        return 45;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  }

  public static canTransition(currentStage: ProductionStage, targetStage: ProductionStage): boolean {
    if (currentStage === targetStage) return true;
    if (currentStage === 'queued' && (targetStage === 'in_production' || targetStage === 'completed')) return true;
    if (currentStage === 'in_production' && targetStage === 'completed') return true;
    return false;
  }
}
