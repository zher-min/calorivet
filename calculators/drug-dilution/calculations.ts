export type ConcentrationUnit = "mg_per_ml" | "ug_per_ml" | "mg_per_l" | "ug_per_l" | "percent_wv";
export type DoseUnit = "mg" | "ug";

export const SMALL_VOLUME_WARNING_ML = 0.1;
export const CONCENTRATION_UNITS: Record<ConcentrationUnit, { label: string; mgPerMl: number }> = {
  mg_per_ml: { label: "mg/mL", mgPerMl: 1 },
  ug_per_ml: { label: "µg/mL", mgPerMl: 0.001 },
  mg_per_l: { label: "mg/L", mgPerMl: 0.001 },
  ug_per_l: { label: "µg/L", mgPerMl: 0.000001 },
  percent_wv: { label: "% w/v", mgPerMl: 10 },
};

export type Concentration = { value: number; unit: ConcentrationUnit };
export type DilutionResult = { stockVolumeMl: number; diluentVolumeMl: number; finalVolumeMl: number; finalConcentrationMgPerMl: number };

const validPositive = (value: number) => Number.isFinite(value) && value > 0;
export const percentToMgPerMl = (percent: number) => Number.isFinite(percent) ? percent * 10 : NaN;
export const mgPerMlToPercent = (value: number) => Number.isFinite(value) ? value / 10 : NaN;

export function convertConcentration(value: number, fromUnit: ConcentrationUnit, toUnit: ConcentrationUnit): number {
  if (!Number.isFinite(value)) return NaN;
  return value * CONCENTRATION_UNITS[fromUnit].mgPerMl / CONCENTRATION_UNITS[toUnit].mgPerMl;
}

export function calculateDilution(stock: Concentration, desired: Concentration, finalVolumeMl: number): DilutionResult | null {
  if (!validPositive(stock.value) || !validPositive(desired.value) || !validPositive(finalVolumeMl)) return null;
  const stockMgPerMl = convertConcentration(stock.value, stock.unit, "mg_per_ml");
  const desiredMgPerMl = convertConcentration(desired.value, desired.unit, "mg_per_ml");
  if (desiredMgPerMl > stockMgPerMl) return null;
  const stockVolumeMl = desiredMgPerMl * finalVolumeMl / stockMgPerMl;
  return { stockVolumeMl, diluentVolumeMl: finalVolumeMl - stockVolumeMl, finalVolumeMl, finalConcentrationMgPerMl: desiredMgPerMl };
}

export function calculateExistingDilution(stock: Concentration, stockVolumeMl: number, diluentVolumeMl: number) {
  if (!validPositive(stock.value) || !validPositive(stockVolumeMl) || !Number.isFinite(diluentVolumeMl) || diluentVolumeMl < 0) return null;
  const finalVolumeMl = stockVolumeMl + diluentVolumeMl;
  if (!validPositive(finalVolumeMl)) return null;
  const totalDrugMg = convertConcentration(stock.value, stock.unit, "mg_per_ml") * stockVolumeMl;
  return { finalVolumeMl, totalDrugMg, finalConcentrationMgPerMl: totalDrugMg / finalVolumeMl };
}

export function calculateDosePreparation(requiredDose: number, doseUnit: DoseUnit, stock: Concentration, finalVolumeMl: number): DilutionResult | null {
  if (!validPositive(requiredDose) || !validPositive(stock.value) || !validPositive(finalVolumeMl)) return null;
  const requiredDoseMg = doseUnit === "ug" ? requiredDose / 1000 : requiredDose;
  const stockMgPerMl = convertConcentration(stock.value, stock.unit, "mg_per_ml");
  const stockVolumeMl = requiredDoseMg / stockMgPerMl;
  if (stockVolumeMl > finalVolumeMl) return null;
  return { stockVolumeMl, diluentVolumeMl: finalVolumeMl - stockVolumeMl, finalVolumeMl, finalConcentrationMgPerMl: requiredDoseMg / finalVolumeMl };
}

const format = (value: number, digits: number) => value.toFixed(digits).replace(/\.?0+$/, "");
export function formatVolume(value: number): string {
  if (!Number.isFinite(value)) return "--";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1) return format(value, 2);
  if (Math.abs(value) >= 0.001) return format(value, 3);
  return format(value, 6);
}
export const formatConcentration = (value: number) => Number.isFinite(value) ? format(value, Math.abs(value) >= 1 ? 3 : 6) : "--";
