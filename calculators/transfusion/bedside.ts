import { BEDSIDE, EVIDENCE, TECHNICAL } from "./clinicalConstants.ts";
import { positive } from "./validation.ts";
import type { Input, Species } from "./types.ts";

export type BedsideInputs = { species: string; weight: Input; unit: string; current: Input; target: Input; productPcv: Input; product: string };
export type FieldErrors = Partial<Record<keyof BedsideInputs, string>>;
export function weightInKg(value: Input, unit: string) {
  const weight = positive(value);
  if (weight === null || !["kg", "lb"].includes(unit)) return null;
  const kg = unit === "lb" ? weight / BEDSIDE.poundsPerKg : weight;
  return Number.isFinite(kg) && kg > 0 ? kg : null;
}
export function validateTransfusionInputs(input: BedsideInputs): FieldErrors {
  const errors: FieldErrors = {};
  if (!["dog", "cat"].includes(input.species)) errors.species = "Select Dog or Cat.";
  if (weightInKg(input.weight, input.unit) === null) errors.weight = "Enter a positive patient weight.";
  if (!["wholeBlood", "pRbc"].includes(input.product)) errors.product = "Select a blood product.";
  for (const [key, label] of [["current", "Current PCV/HCT"], ["target", "Target PCV/HCT"], ["productPcv", "Blood product PCV/HCT"]] as const) {
    const value = positive(input[key]);
    if (value === null || value > TECHNICAL.pcvMax) errors[key] = `Enter ${label.toLowerCase()} greater than 0 and no more than ${TECHNICAL.pcvMax}%.`;
  }
  if (!errors.current && !errors.target && Number(input.target) <= Number(input.current)) errors.target = "Target PCV must be higher than the current PCV.";
  return errors;
}
export function calculateTransfusionVolume(input: BedsideInputs) {
  const errors = validateTransfusionInputs(input);
  if (Object.keys(errors).length) return { errors, result: null };
  const species = input.species as Species;
  const weightKg = weightInKg(input.weight, input.unit)!;
  const volumeMl = weightKg * EVIDENCE.ebv[species].value * ((Number(input.target) - Number(input.current)) / Number(input.productPcv));
  const volumeMlKg = volumeMl / weightKg;
  if (![volumeMl, volumeMlKg].every(n => Number.isFinite(n) && n > 0)) return { errors: { weight: "Values exceed the calculation range." }, result: null };
  return { errors, result: { volumeMl, volumeMlKg, weightKg } };
}
export function calculateMinimumDonorWeight(species: Species, requiredVolumeMl: Input, product = "wholeBlood") {
  const required = positive(requiredVolumeMl);
  if (!BEDSIDE.donor[species] || required === null || product !== "wholeBlood") return null;
  const profile = BEDSIDE.donor[species];
  const minimumWeightKg = required / profile.ceiling.value;
  const roundedWeightKg = Math.ceil(minimumWeightKg / profile.displayIncrementKg) * profile.displayIncrementKg;
  return Number.isFinite(roundedWeightKg) ? { minimumWeightKg, roundedWeightKg } : null;
}
export function calculateDonorCapacity(species: Species, donorWeightKg: Input, requiredVolumeMl?: Input, product = "wholeBlood") {
  const weight = positive(donorWeightKg);
  if (!BEDSIDE.donor[species] || weight === null) return null;
  const maximumCollectionMl = weight * BEDSIDE.donor[species].ceiling.value;
  if (!Number.isFinite(maximumCollectionMl)) return null;
  const required = product === "wholeBlood" ? positive(requiredVolumeMl) : null;
  return { maximumCollectionMl, isMaximumVolumeSufficient: required === null ? null : maximumCollectionMl >= required,
    shortfallMl: required === null ? null : Math.max(0, required - maximumCollectionMl),
    belowScreeningFloor: weight < EVIDENCE.donor[species].floor.value };
}
export function largeVolumeWarning(product: string, dose: number) {
  if (product !== "wholeBlood" && product !== "pRbc") return false;
  return Number.isFinite(dose) && dose > BEDSIDE.warningThresholds[product].value[1];
}
export const roundedVolume = (volume: number) => Math.round(volume);
export const roundedDose = (dose: number) => Math.round(dose * 10) / 10;
