export type FetalSpecies = "dog" | "cat";
export type FetalMeasurement = "icc" | "bpd";
export type DogSize = "small" | "medium" | "large" | "giant";

const EQUATIONS = {
  dog: {
    small: { icc: [68.68, 1.53], bpd: [25.11, 0.61], iccRange: [21, 42], bpdRange: [1, 37] },
    medium: { icc: [82.13, 1.8], bpd: [29.18, 0.7], iccRange: [21, 42], bpdRange: [1, 37] },
    large: { icc: [105.1, 2.5], bpd: [30, 0.8], iccRange: [26, 42], bpdRange: [2, 30] },
    giant: { icc: [88.1, 1.9], bpd: [29, 0.7], iccRange: [25, 40], bpdRange: [1, 35] },
  },
  cat: { general: { icc: [62.03, 1.1], bpd: [23.39, 0.47], iccRange: [19, 37], bpdRange: [38, 65] } },
} as const;

export function dogSize(weightKg: number): DogSize | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (weightKg <= 10) return "small";
  if (weightKg <= 25) return "medium";
  if (weightKg <= 40) return "large";
  return "giant";
}

export function calculateDaysRemaining(species: FetalSpecies, measurement: FetalMeasurement, value: number, weightKg?: number) {
  if (!Number.isFinite(value) || value <= 0) return null;
  const equation = species === "cat" ? EQUATIONS.cat.general : EQUATIONS.dog[dogSize(weightKg ?? 0) ?? "medium"];
  const [constant, coefficient] = equation[measurement];
  return (constant - value) / coefficient;
}

export function validRange(species: FetalSpecies, measurement: FetalMeasurement, weightKg?: number): readonly [number, number] {
  if (species === "cat") return EQUATIONS.cat.general[`${measurement}Range`];
  return EQUATIONS.dog[dogSize(weightKg ?? 0) ?? "medium"][`${measurement}Range`];
}

export function formatDate(date: Date) { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date); }
export function addDays(date: Date, days: number) { const result = new Date(date); result.setDate(result.getDate() + Math.round(days)); return result; }
