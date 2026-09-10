import type { Input } from "./types.ts";
import { TECHNICAL } from "./clinicalConstants.ts";
export function number(value: Input | undefined): number | null {
  if (value === undefined || (typeof value === "string" && !value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
export const positive = (value: Input | undefined) => { const n = number(value); return n !== null && n > 0 ? n : null; };
export const nonnegative = (value: Input | undefined) => { const n = number(value); return n !== null && n >= 0 ? n : null; };
export const pcv = (value: Input) => { const n = nonnegative(value); return n !== null && n <= TECHNICAL.pcvMax ? n : null; };
export const validEbv = (value: Input) => { const n = positive(value); return n !== null && n >= TECHNICAL.ebvMin && n <= TECHNICAL.ebvMax ? n : null; };
export const finitePositive = (...values: number[]) => values.every(value => Number.isFinite(value) && value > 0);
