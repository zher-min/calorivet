export type MassUnit = "ug" | "mg" | "g";
export type DoseTimeUnit = "min" | "hr";

export type NormalizedDrug = {
  doseMgPerKgHr: number;
  stockMgPerMl: number;
};

export type PreparedDrug = NormalizedDrug & {
  patientDoseMgHr: number;
  targetConcentrationMgMl: number;
  drugAmountMg: number;
  drugVolumeMl: number;
};

export type CriResult = {
  ok: true;
  drugs: PreparedDrug[];
  originalVolumeMl: number;
  finalVolumeMl: number;
  rateMlHr: number;
  durationHr: number;
  totalDrugVolumeMl: number;
  fluidToRemoveMl?: number;
  diluentVolumeMl?: number;
};

export type CriError = {
  ok: false;
  code: "invalid_input" | "stock_not_greater_than_target" | "additive_fraction_too_high" | "drug_volume_exceeds_final";
};

type CriInputs = {
  weightKg: number;
  rateMlHr: number;
  drugs: NormalizedDrug[];
};

const validPositive = (value: number) => Number.isFinite(value) && value > 0;
const validInputs = ({ weightKg, rateMlHr, drugs }: CriInputs) =>
  validPositive(weightKg) && validPositive(rateMlHr) && drugs.length > 0 &&
  drugs.every(drug => validPositive(drug.doseMgPerKgHr) && validPositive(drug.stockMgPerMl));

export function convertMassToMg(value: number, unit: MassUnit): number | null {
  if (!Number.isFinite(value)) return null;
  const factors: Record<MassUnit, number> = { ug: 0.001, mg: 1, g: 1000 };
  return value * factors[unit];
}

export function convertDoseToMgPerKgPerHour(value: number, massUnit: MassUnit, timeUnit: DoseTimeUnit): number | null {
  const doseMg = convertMassToMg(value, massUnit);
  if (doseMg === null) return null;
  return doseMg * (timeUnit === "min" ? 60 : 1);
}

export const normalizeDoseRate = convertDoseToMgPerKgPerHour;

export function calculateTargetConcentration(weightKg: number, doseMgPerKgHr: number, rateMlHr: number): number | null {
  if (![weightKg, doseMgPerKgHr, rateMlHr].every(validPositive)) return null;
  return (doseMgPerKgHr * weightKg) / rateMlHr;
}

function targetDrugs(inputs: CriInputs) {
  return inputs.drugs.map(drug => {
    const patientDoseMgHr = drug.doseMgPerKgHr * inputs.weightKg;
    return { ...drug, patientDoseMgHr, targetConcentrationMgMl: patientDoseMgHr / inputs.rateMlHr };
  });
}

export function calculateReplacementCRI(inputs: CriInputs & { finalVolumeMl: number }): CriResult | CriError {
  if (!validInputs(inputs) || !validPositive(inputs.finalVolumeMl)) return { ok: false, code: "invalid_input" };
  const drugs = targetDrugs(inputs).map(drug => {
    const drugAmountMg = drug.targetConcentrationMgMl * inputs.finalVolumeMl;
    return { ...drug, drugAmountMg, drugVolumeMl: drugAmountMg / drug.stockMgPerMl };
  });
  const totalDrugVolumeMl = drugs.reduce((sum, drug) => sum + drug.drugVolumeMl, 0);
  return {
    ok: true, drugs, originalVolumeMl: inputs.finalVolumeMl, finalVolumeMl: inputs.finalVolumeMl,
    rateMlHr: inputs.rateMlHr, durationHr: inputs.finalVolumeMl / inputs.rateMlHr,
    totalDrugVolumeMl, fluidToRemoveMl: totalDrugVolumeMl,
  };
}

export function calculateAdditiveCRI(inputs: CriInputs & { bagVolumeMl: number }): CriResult | CriError {
  if (!validInputs(inputs) || !validPositive(inputs.bagVolumeMl)) return { ok: false, code: "invalid_input" };
  const targets = targetDrugs(inputs);
  if (targets.some(drug => drug.stockMgPerMl <= drug.targetConcentrationMgMl)) {
    return { ok: false, code: "stock_not_greater_than_target" };
  }
  const fractionSum = targets.reduce((sum, drug) => sum + drug.targetConcentrationMgMl / drug.stockMgPerMl, 0);
  if (fractionSum >= 1) return { ok: false, code: "additive_fraction_too_high" };
  const finalVolumeMl = inputs.bagVolumeMl / (1 - fractionSum);
  const drugs = targets.map(drug => {
    const drugAmountMg = drug.targetConcentrationMgMl * finalVolumeMl;
    return { ...drug, drugAmountMg, drugVolumeMl: drugAmountMg / drug.stockMgPerMl };
  });
  const totalDrugVolumeMl = drugs.reduce((sum, drug) => sum + drug.drugVolumeMl, 0);
  return {
    ok: true, drugs, originalVolumeMl: inputs.bagVolumeMl, finalVolumeMl, rateMlHr: inputs.rateMlHr,
    durationHr: finalVolumeMl / inputs.rateMlHr, totalDrugVolumeMl,
  };
}

export function calculateSyringeCRI(inputs: CriInputs & { finalVolumeMl: number }): CriResult | CriError {
  const replacement = calculateReplacementCRI(inputs);
  if (!replacement.ok) return replacement;
  if (replacement.totalDrugVolumeMl > inputs.finalVolumeMl) return { ok: false, code: "drug_volume_exceeds_final" };
  return { ...replacement, diluentVolumeMl: inputs.finalVolumeMl - replacement.totalDrugVolumeMl, fluidToRemoveMl: undefined };
}

export function formatVolumeMl(value: number): string {
  if (!Number.isFinite(value)) return "--";
  if (value === 0) return "0";
  if (value >= 10) return value.toFixed(1);
  if (value >= 0.1) return value.toFixed(2);
  const standard = value.toFixed(3);
  if (Number(standard) !== 0) return standard;
  const digits = Math.min(8, Math.max(4, Math.ceil(-Math.log10(value)) + 1));
  return value.toFixed(digits);
}
