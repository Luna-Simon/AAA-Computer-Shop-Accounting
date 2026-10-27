import Decimal from "decimal.js";

type DecimalInstance = InstanceType<typeof Decimal>;

// Configure decimal.js for monetary precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

// Money is stored with 2 decimal places (PHP centavos)
export const MONEY_PRECISION = 2;

export function toDecimal(value: number | string | DecimalInstance): DecimalInstance {
  // Prisma returns Decimal fields as Decimal.js objects from a potentially
  // different module instance. Converting via string avoids instanceof issues
  // and the Decimal.js quirk where new Decimal(Decimal(0)).isPositive() === true.
  return new Decimal(value.toString ? value.toString() : String(value));
}

export function toMoney(value: number | string | DecimalInstance): string {
  const d = new Decimal(value.toString ? value.toString() : String(value));
  return d.toFixed(MONEY_PRECISION);
}

export function parseMoney(value: string | number): DecimalInstance {
  return new Decimal(value || 0);
}

export function isPositive(value: DecimalInstance): boolean {
  return value.greaterThan(0);
}

export function isNegative(value: DecimalInstance): boolean {
  return value.lessThan(0);
}

export function isZero(value: DecimalInstance): boolean {
  return value.isZero();
}

export function formatMoney(
  value: number | string | DecimalInstance,
  symbol = "₱"
): string {
  const d = new Decimal(value.toString ? value.toString() : String(value || 0));
  const abs = d.abs().toFixed(MONEY_PRECISION);
  const parts = abs.split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = `${intPart}.${parts[1]}`;
  return d.isNegative() ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}
