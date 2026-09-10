export type Species = "Dog" | "Cat";
export type ManufacturerEnergyUnit = "kcal/kg" | "kcal/100g";

export type GuaranteedAnalysisInput = {
  moisture: string | number;
  protein: string | number;
  fat: string | number;
  fibre: string | number;
  ash: string | number;
};

export type EnergyFactor = {
  minimum: number;
  maximum: number;
};

const factor = (minimum: number, maximum = minimum): EnergyFactor => ({ minimum, maximum });

// Routine adult and growth starting factors from the 2021 AAHA Nutrition and
// Weight Management Guidelines. Keeping these as explicit ranges makes it
// possible to add alternative FEDIAF growth models later without changing the
// downstream energy-to-food calculation.
export const activityFactors: Record<Species, Record<string, EnergyFactor>> = {
  Dog: {
    "Intact adult": factor(1.6, 1.8),
    "Neutered adult": factor(1.4, 1.6),
    "Inactive / obesity-prone": factor(1, 1.2),
    "Weight loss": factor(1),
    "Puppy <4 months": factor(3),
    "Puppy ≥4 months": factor(2),
    "Working — light": factor(1.6, 2),
    "Working — moderate": factor(2, 5),
    "Working — heavy": factor(5, 11),
  },
  Cat: {
    "Intact adult": factor(1.4, 1.6),
    "Neutered adult": factor(1.2, 1.4),
    "Inactive / obesity-prone": factor(1),
    "Weight loss": factor(0.8),
    "Kitten": factor(2.5),
  },
};

export const offspringEnergy: Record<Species, number[]> = {
  Dog: [24, 48, 72, 96, 108, 120, 132, 144],
  Cat: [18, 18, 60, 60, 70, 70, 70, 70],
};

export const lactationWeekFactor: Record<Species, number[]> = {
  Dog: [0.75, 0.95, 1.1, 1.2],
  Cat: [0.9, 0.9, 1.2, 1.2, 1.1, 1, 0.8],
};

export function parseFiniteNumber(value: string | number): number | null {
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeManufacturerEnergy(
  value: string | number,
  unit: ManufacturerEnergyUnit = "kcal/kg",
): number | null {
  const parsed = parseFiniteNumber(value);
  if (parsed === null || parsed <= 0) return null;
  const kcalKg = unit === "kcal/100g" ? parsed * 10 : parsed;
  return Number.isFinite(kcalKg) && kcalKg > 0 ? kcalKg : null;
}

export function estimateTargetWeightFromBcs(
  currentWeightInput: string | number,
  bcsInput: string | number,
): number | null {
  const currentWeight = parseFiniteNumber(currentWeightInput);
  const bcs = parseFiniteNumber(bcsInput);
  if (
    currentWeight === null
    || currentWeight <= 0
    || bcs === null
    || !Number.isInteger(bcs)
    || bcs < 6
    || bcs > 9
  ) return null;

  const estimatedTargetWeight = currentWeight / (1 + 0.1 * (bcs - 5));
  return Number.isFinite(estimatedTargetWeight) && estimatedTargetWeight > 0
    ? estimatedTargetWeight
    : null;
}

export function calculateDailyEnergy(weightInput: string | number, species: Species, condition: string) {
  const weight = parseFiniteNumber(weightInput);
  const selectedFactor = activityFactors[species]?.[condition];
  if (
    weight === null
    || weight <= 0
    || !selectedFactor
    || !Number.isFinite(selectedFactor.minimum)
    || !Number.isFinite(selectedFactor.maximum)
    || selectedFactor.minimum <= 0
    || selectedFactor.maximum < selectedFactor.minimum
  ) return null;

  const rer = 70 * Math.pow(weight, 0.75);
  const minimum = rer * selectedFactor.minimum;
  const maximum = rer * selectedFactor.maximum;
  const mer = (minimum + maximum) / 2;
  if (![rer, minimum, maximum, mer].every(Number.isFinite)) return null;

  return {
    rer,
    mer,
    minimum,
    maximum,
    factorMinimum: selectedFactor.minimum,
    factorMaximum: selectedFactor.maximum,
    calculation: "factor" as const,
  };
}

export function calculateGuaranteedAnalysis(input: GuaranteedAnalysisInput) {
  const labels: Record<keyof GuaranteedAnalysisInput, string> = {
    moisture: "Moisture",
    protein: "Crude protein",
    fat: "Crude fat",
    fibre: "Crude fibre",
    ash: "Ash",
  };
  const parsed = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, parseFiniteNumber(value)]),
  ) as Record<keyof GuaranteedAnalysisInput, number | null>;
  const missing = (Object.keys(parsed) as (keyof GuaranteedAnalysisInput)[])
    .filter((key) => parsed[key] === null)
    .map((key) => labels[key]);
  const errors: string[] = [];

  for (const key of Object.keys(parsed) as (keyof GuaranteedAnalysisInput)[]) {
    const value = parsed[key];
    if (value !== null && (value < 0 || value > 100)) {
      errors.push(`${labels[key]} must be between 0% and 100%.`);
    }
  }

  if (missing.length || errors.length) return { valid: false as const, missing, errors };

  const values = parsed as Record<keyof GuaranteedAnalysisInput, number>;
  const enteredTotal = values.moisture + values.protein + values.fat + values.fibre + values.ash;
  if (enteredTotal > 100) {
    errors.push(`Entered nutrients total ${enteredTotal.toFixed(1)}%, which is above 100%.`);
    return { valid: false as const, missing, errors };
  }
  if (values.moisture >= 100) {
    errors.push("Moisture must be below 100% to calculate dry matter.");
    return { valid: false as const, missing, errors };
  }

  const carbohydrate = 100 - enteredTotal;
  const kcal100g = values.protein * 3.5 + values.fat * 8.5 + carbohydrate * 3.5;
  const kcalKg = kcal100g * 10;
  const dryMatter = 100 - values.moisture;
  if (kcalKg <= 0 || !Number.isFinite(kcalKg) || dryMatter <= 0) {
    errors.push("These values do not produce a valid food-energy estimate.");
    return { valid: false as const, missing, errors };
  }

  return {
    valid: true as const,
    missing,
    errors,
    carbohydrate,
    kcal100g,
    kcalKg,
    proteinEnergy: (values.protein * 3.5 * 100) / kcal100g,
    fatEnergy: (values.fat * 8.5 * 100) / kcal100g,
    carbohydrateEnergy: (carbohydrate * 3.5 * 100) / kcal100g,
    dryMatter: {
      protein: (values.protein * 100) / dryMatter,
      fat: (values.fat * 100) / dryMatter,
      fibre: (values.fibre * 100) / dryMatter,
      ash: (values.ash * 100) / dryMatter,
      carbohydrate: (carbohydrate * 100) / dryMatter,
    },
  };
}

export function selectFoodEnergy({
  manufacturerEnabled,
  manufacturerKcalKg,
  manufacturerUnit = "kcal/kg",
  guaranteedAnalysisEnabled,
  guaranteedAnalysis,
}: {
  manufacturerEnabled: boolean;
  manufacturerKcalKg: string | number;
  manufacturerUnit?: ManufacturerEnergyUnit;
  guaranteedAnalysisEnabled: boolean;
  guaranteedAnalysis: ReturnType<typeof calculateGuaranteedAnalysis>;
}) {
  const manufacturer = normalizeManufacturerEnergy(manufacturerKcalKg, manufacturerUnit);
  if (manufacturerEnabled && manufacturer !== null) {
    return { source: "manufacturer" as const, kcalKg: manufacturer };
  }
  if (guaranteedAnalysisEnabled && guaranteedAnalysis.valid) {
    return { source: "guaranteed-analysis" as const, kcalKg: guaranteedAnalysis.kcalKg };
  }
  return null;
}

export function calculateFeedingAmount(
  energy: { minimum: number; maximum: number; mer: number } | null,
  foodKcalKg: number | null,
) {
  if (!energy || foodKcalKg === null || foodKcalKg <= 0 || !Number.isFinite(foodKcalKg)) return null;
  const minimum = (energy.minimum / foodKcalKg) * 1000;
  const maximum = (energy.maximum / foodKcalKg) * 1000;
  const midpoint = (energy.mer / foodKcalKg) * 1000;
  if (![minimum, maximum, midpoint].every(Number.isFinite)) return null;
  return { minimum, maximum, midpoint };
}

export function calculateLactationEnergy(
  weightInput: string | number,
  species: Species,
  offspring: number,
  week: number,
) {
  const weight = parseFiniteNumber(weightInput);
  const litterFactor = offspringEnergy[species]?.[offspring - 1];
  const weekFactor = lactationWeekFactor[species]?.[week - 1];
  if (weight === null || weight <= 0 || !Number.isFinite(litterFactor) || !Number.isFinite(weekFactor)) return null;

  const rer = 70 * Math.pow(weight, 0.75);
  const mer = species === "Dog"
    ? (145 / 70) * rer + litterFactor * weight * weekFactor
    : 100 * Math.pow(weight, 0.67) + litterFactor * weight * weekFactor;
  if (![rer, mer].every(Number.isFinite)) return null;

  return {
    rer,
    mer,
    minimum: mer,
    maximum: mer,
    factorMinimum: null,
    factorMaximum: null,
    calculation: "lactation" as const,
  };
}
