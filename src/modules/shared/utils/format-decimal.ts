import { Decimal } from '@prisma/client/runtime/library';

/**
 * Formats a decimal value to a fixed-precision string with 2 decimal places.
 * Used to standardize monetary field serialization across the API.
 *
 * @param value - A Prisma Decimal, number, or string representation of a number
 * @returns A string formatted to 2 decimal places (e.g., "500.00")
 */
export function formatDecimal(value: Decimal | number | string): string {
  return Number(value).toFixed(2);
}
