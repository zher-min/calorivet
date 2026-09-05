export type Species = "Dog" | "Cat";

export type GuaranteedAnalysisInput = {
  moisture: string | number;
  protein: string | number;
  fat: string | number;
  fibre: string | number;
  ash: string | number;
};

export const activityFactors: Record<Species, Record<string, number>> = {
  Dog: {
    "Typical intact pet": 1.8,
    "Typical neutered pet": 1.6,
    "Obese prone": 1.4,
    "Weight loss": 1,
    "Weight gain (intact)": 1.8,
    "Weight gain (neutered)": 1.6,
    "Working — light": 2,
    "Working — moderate": 3,
    "Working — heavy": 6,
    "Critical care": 1,
    "Growing (<4 months)": 3,
    "Growing (>4 months)": 2,
  },
  Cat: {
    "Typical intact pet": 1.4,
    "Typical neutered pet": 1.2,
    "Obese prone": 1,
    "Weight loss": 0.8,
    "Weight gain (intact)": 1.4,
    "Weight gain (neutered)": 1.2,
    "Active cat": 1.6,
    "Critical care": 1,
    "Growing (<4 months)": 2.5,
    "Growing (>4 months)": 2.5,
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

export function calculateDailyEnergy(weightInput: string | number, species: Species, condition: string) {
  const weight = parseFiniteNumber(weightInput);
  const factor = activityFactors[species]?.[condition];
  if (weight === null || weight <= 0 || !Number.isFinite(factor) || factor <= 0) return null;

  const rer = 70 * Math.pow(weight, 0.75);
  const mer = rer * factor;
  if (![rer, mer].every(Number.isFinite)) return null;

  return { rer, mer, minimum: mer * 0.5, maximum: mer * 1.5, factor };
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
  guaranteedAnalysisEnabled,
  guaranteedAnalysis,
}: {
  manufacturerEnabled: boolean;
  manufacturerKcalKg: string | number;
  guaranteedAnalysisEnabled: boolean;
  guaranteedAnalysis: ReturnType<typeof calculateGuaranteedAnalysis>;
}) {
  const manufacturer = parseFiniteNumber(manufacturerKcalKg);
  if (manufacturerEnabled && manufacturer !== null && manufacturer > 0) {
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

  return { rer, mer, minimum: mer * 0.5, maximum: mer * 1.5 };
}
