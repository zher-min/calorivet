import { EVIDENCE as E, TECHNICAL } from "./clinicalConstants.ts";
import { positive, nonnegative, pcv, validEbv, finitePositive } from "./validation.ts";
import type { Input, RbcInput, Species } from "./types.ts";
export function estimatedBloodVolume(species: Species, override?: Input) {
  return override === undefined || override === "" ? E.ebv[species].value : validEbv(override);
}
export function recipientRequirement(input: RbcInput) {
  const errors: string[] = [];
  const weight = positive(input.weight), current = pcv(input.current), target = pcv(input.target), productPcv = pcv(input.productPcv);
  const ebv = estimatedBloodVolume(input.species, input.ebvOverride);
  if (weight === null) errors.push("Enter a body weight greater than zero.");
  if (current === null) errors.push("Enter current PCV from 0–100%.");
  if (target === null) errors.push("Enter target PCV from 0–100%.");
  if (current !== null && target !== null && target <= current) errors.push("Target PCV must be greater than current PCV.");
  if (ebv === null) errors.push(`EBV override must be ${TECHNICAL.ebvMin}–${TECHNICAL.ebvMax} mL/kg (technical bounds).`);
  const empiricalOnly = input.species === "cat" && input.product === "wholeBlood" && typeof input.productPcv === "string" && !input.productPcv.trim();
  if (!empiricalOnly && (productPcv === null || productPcv <= 0)) errors.push("Enter measured/product-labelled PCV greater than 0 and at most 100%.");
  if (errors.length || weight === null || current === null || target === null || ebv === null) return { errors, result: null };
  const empiricalMl = input.species === "cat" && input.product === "wholeBlood" ? (target - current) * E.empirical.value * weight : null;
  const volumeMl = empiricalOnly ? empiricalMl! : ((target - current) / productPcv!) * ebv * weight;
  const doseMlKg = volumeMl / weight;
  if (!finitePositive(volumeMl, doseMlKg) || (empiricalMl !== null && !finitePositive(empiricalMl))) return { errors: ["Values exceed the numeric calculation range."], result: null };
  return { errors, result: { volumeMl, doseMlKg, empiricalMl, empiricalOnly, weight, current, target, productPcv: empiricalOnly ? null : productPcv, ebv } };
}
export function reversePcv(weightInput: Input, currentInput: Input, productInput: Input, volumeInput: Input, ebvInput: Input) {
  const weight = positive(weightInput), current = pcv(currentInput), product = pcv(productInput), volume = positive(volumeInput), ebv = validEbv(ebvInput);
  if (weight === null || current === null || product === null || product <= 0 || volume === null || ebv === null) return null;
  const post = current + volume * product / (ebv * weight);
  return Number.isFinite(post) && post <= TECHNICAL.pcvMax ? post : null;
}
export function plasmaRequirement(weightInput: Input, doseInput: Input) {
  const weight = positive(weightInput), dose = positive(doseInput);
  if (weight === null || dose === null || !finitePositive(weight * dose)) return null;
  return { volumeMl: weight * dose, doseMlKg: dose };
}
export function donorCollection(species: Species, weightInput: Input, plannedInput: Input) {
  const weight = positive(weightInput), planned = positive(plannedInput), profile = E.donor[species];
  if (weight === null || planned === null) return null;
  const maxCollectionMl = weight * profile.ceiling.value;
  const minimumWeightKg = Math.max(profile.floor.value, planned / profile.ceiling.value);
  if (!finitePositive(maxCollectionMl, minimumWeightKg)) return null;
  return { maxCollectionMl, minimumWeightKg, criteriaMet: weight >= profile.floor.value && planned <= maxCollectionMl,
    alternativeMl: species === "cat" ? Math.min(weight * E.donor.cat.alternativeRate.value, E.donor.cat.alternativeCap.value) : null };
}
export function anticoagulant(plannedInput: Input, system: string, within24h = false) {
  const planned = positive(plannedInput);
  const ratio = ["ACD-A", "CPD", "CPDA-1"].includes(system) ? E.anticoagulant.standard.value : system === "Sodium citrate" && within24h ? E.anticoagulant.citrate.value : null;
  if (planned === null || ratio === null) return null;
  const anticoagulantMl = planned / ratio, totalMl = planned + anticoagulantMl;
  return finitePositive(totalMl, anticoagulantMl) ? { anticoagulantMl, totalMl, ratio } : null;
}
export function planningRate(volumeInput: Input, durationInput: Input, weightInput: Input) {
  const volume = positive(volumeInput), hours = positive(durationInput), weight = positive(weightInput);
  if (volume === null || hours === null || weight === null) return null;
  const mlHour = volume / hours, mlKgHour = mlHour / weight;
  return finitePositive(mlHour, mlKgHour) ? { mlHour, mlKgHour } : null;
}
export function massiveTransfusion(weightInput: Input, ebvInput: Input, last3h: Input, last24h: Input) {
  const weight = positive(weightInput), ebv = validEbv(ebvInput), volume3 = nonnegative(last3h), volume24 = nonnegative(last24h);
  if (weight === null || ebv === null || !finitePositive(weight * ebv)) return null;
  if ((last3h !== "" && volume3 === null) || (last24h !== "" && volume24 === null)) return null;
  if (volume3 !== null && volume24 !== null && volume24 < volume3) return null;
  const bloodVolumeMl = weight * ebv, threshold3h = bloodVolumeMl * E.massive.fraction3h.value, threshold24h = bloodVolumeMl * E.massive.fraction24h.value;
  return { bloodVolumeMl, threshold3h, threshold24h, triggered: (volume3 !== null && volume3 > threshold3h) || (volume24 !== null && volume24 > threshold24h) };
}
