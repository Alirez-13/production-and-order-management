import { Result, ok, err } from './Result';

/**
 * Value Object: Money (Price in Iranian Tomans)
 */
export class Money {
  private constructor(public readonly amount: number) {}

  public static create(amount: number): Result<Money> {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return err('مقدار مبلغ نامعتبر است.');
    }
    if (amount < 0) {
      return err('مبلغ نمی‌تواند منفی باشد.');
    }
    return ok(new Money(Math.round(amount)));
  }

  public add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  public multiply(factor: number): Money {
    return new Money(Math.round(this.amount * Math.max(0, factor)));
  }

  public toFormatted(): string {
    return `${this.amount.toLocaleString('fa-IR')} تومان`;
  }
}

/**
 * Value Object: Positive Quantity
 */
export class Quantity {
  private constructor(public readonly value: number) {}

  public static create(value: number, allowZero: boolean = true): Result<Quantity> {
    if (value === undefined || value === null || isNaN(value)) {
      return err('مقدار تعداد نامعتبر است.');
    }
    if (!allowZero && value <= 0) {
      return err('تعداد باید عددی بزرگتر از صفر باشد.');
    }
    if (value < 0) {
      return err('تعداد نمی‌تواند منفی باشد.');
    }
    return ok(new Quantity(value));
  }

  public add(other: Quantity | number): Quantity {
    const val = typeof other === 'number' ? other : other.value;
    return new Quantity(Math.max(0, this.value + val));
  }

  public subtract(other: Quantity | number): Result<Quantity> {
    const val = typeof other === 'number' ? other : other.value;
    if (this.value < val) {
      return err(`کسری موجودی: موجودی فعلی (${this.value}) کمتر از مقدار درخواستی (${val}) است.`);
    }
    return ok(new Quantity(this.value - val));
  }
}

/**
 * Value Object: Stock Keeping Unit (SKU)
 */
export class Sku {
  private constructor(public readonly value: string) {}

  public static create(rawSku: string): Result<Sku> {
    const trimmed = (rawSku || '').trim().toUpperCase();
    if (!trimmed || trimmed.length < 3) {
      return err('شناسه کالا (SKU) باید حداقل ۳ کاراکتر باشد.');
    }
    return ok(new Sku(trimmed));
  }
}

/**
 * Value Object: Progress Percentage (0 - 100)
 */
export class ProgressPercentage {
  private constructor(public readonly value: number) {}

  public static create(val: number): Result<ProgressPercentage> {
    if (isNaN(val)) return err('درصد پیشرفت نامعتبر است.');
    const clamped = Math.min(100, Math.max(0, Math.round(val)));
    return ok(new ProgressPercentage(clamped));
  }
}
