export type UrineOutputStatus =
  | "normal"
  | "reduced"
  | "oliguria"
  | "anuria"
  | "increased";

export type UrineOutputSeverity = "green" | "amber" | "red";

export type UrineOutputResult = {
  value: number;
  status: UrineOutputStatus;
  label: "NORMAL" | "REDUCED" | "OLIGURIA" | "NO URINE / ANURIA" | "INCREASED";
  severity: UrineOutputSeverity;
};

export function calculateUrineOutput(
  weightKg: number,
  urineVolumeMl: number,
  collectionTimeHours: number,
): UrineOutputResult | null {
  if (
    !Number.isFinite(weightKg) || weightKg <= 0 ||
    !Number.isFinite(urineVolumeMl) || urineVolumeMl < 0 ||
    !Number.isFinite(collectionTimeHours) || collectionTimeHours <= 0
  ) return null;

  const value = urineVolumeMl / weightKg / collectionTimeHours;
  if (value === 0) return { value, status: "anuria", label: "NO URINE / ANURIA", severity: "red" };
  if (value < 0.5) return { value, status: "oliguria", label: "OLIGURIA", severity: "red" };
  if (value < 1) return { value, status: "reduced", label: "REDUCED", severity: "amber" };
  if (value <= 2) return { value, status: "normal", label: "NORMAL", severity: "green" };
  return { value, status: "increased", label: "INCREASED", severity: "amber" };
}
