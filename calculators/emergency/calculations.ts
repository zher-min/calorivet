import type { ConcentrationUnit, DoseOption } from "./types";

export type EmergencyDoseResult = {
  amountMin: number;
  amountMax: number;
  amountUnit: "mg" | "mcg" | "g" | "U" | "mL" | "mL/min" | "J";
  volumeMinMl: number | null;
  volumeMaxMl: number | null;
  volumePerHourMin: number | null;
  volumePerHourMax: number | null;
};

const positive = (value: number) => Number.isFinite(value) && value > 0;

export function concentrationToMgPerMl(value: number, unit: ConcentrationUnit): number | null {
  if (!positive(value)) return null;
  if (unit === "mg/mL") return value;
  if (unit === "mcg/mL") return value / 1000;
  if (unit === "g/mL") return value * 1000;
  if (unit === "%") return value * 10;
  return null;
}

export function calculateEmergencyDose(weightKg: number, option: DoseOption, concentration: number | null, concentrationUnit?: ConcentrationUnit): EmergencyDoseResult | null {
  if (!positive(weightKg)) return null;
  const doseMax = option.doseMax ?? option.doseMin;
  if (!positive(option.doseMin) || !positive(doseMax)) return null;
  const amountMin = option.doseMin * weightKg;
  const amountMax = doseMax * weightKg;

  if (option.doseUnit === "mL/kg" || option.doseUnit === "mL/kg/min") {
    const perMinute = option.doseUnit === "mL/kg/min";
    return {
      amountMin, amountMax, amountUnit: perMinute ? "mL/min" : "mL",
      volumeMinMl: perMinute ? null : amountMin, volumeMaxMl: perMinute ? null : amountMax,
      volumePerHourMin: perMinute ? amountMin * 60 : null, volumePerHourMax: perMinute ? amountMax * 60 : null,
    };
  }
  if (option.doseUnit === "J/kg") {
    return { amountMin, amountMax, amountUnit: "J", volumeMinMl: null, volumeMaxMl: null, volumePerHourMin: null, volumePerHourMax: null };
  }

  const unit = option.doseUnit.startsWith("mcg") ? "mcg" : option.doseUnit.startsWith("mg") ? "mg" : option.doseUnit.startsWith("g/") ? "g" : "U";
  const perHour = option.doseUnit.endsWith("/hr");
  let volumeMinMl: number | null = null;
  let volumeMaxMl: number | null = null;
  if (concentration !== null && concentrationUnit) {
    if (unit === "U" && concentrationUnit === "U/mL" && positive(concentration)) {
      volumeMinMl = amountMin / concentration;
      volumeMaxMl = amountMax / concentration;
    } else if (unit !== "U") {
      const concentrationMgMl = concentrationToMgPerMl(concentration, concentrationUnit);
      if (concentrationMgMl !== null) {
        const toMg = unit === "mcg" ? 0.001 : unit === "g" ? 1000 : 1;
        volumeMinMl = (amountMin * toMg) / concentrationMgMl;
        volumeMaxMl = (amountMax * toMg) / concentrationMgMl;
      }
    }
  }
  return {
    amountMin, amountMax, amountUnit: unit,
    volumeMinMl, volumeMaxMl,
    volumePerHourMin: perHour ? volumeMinMl : null,
    volumePerHourMax: perHour ? volumeMaxMl : null,
  };
}

export function calculateDextroseDilution(stockVolumeMl: number, stockPercent: number, targetPercent: number) {
  if (![stockVolumeMl, stockPercent, targetPercent].every(positive) || stockPercent <= targetPercent) return null;
  const finalVolumeMl = stockVolumeMl * stockPercent / targetPercent;
  return { finalVolumeMl, diluentVolumeMl: finalVolumeMl - stockVolumeMl };
}

export function calculateLipidInfusion(weightKg: number, rateMlKgMin = 0.25, durationMinutes: [number, number] = [30, 60]) {
  if (![weightKg, rateMlKgMin, ...durationMinutes].every(positive)) return null;
  const rateMlMin = weightKg * rateMlKgMin;
  return { rateMlMin, rateMlHr: rateMlMin * 60, totalMinMl: rateMlMin * durationMinutes[0], totalMaxMl: rateMlMin * durationMinutes[1] };
}

export function formatEmergencyNumber(value: number, kind: "volume" | "amount" = "amount") {
  if (!Number.isFinite(value)) return "--";
  if (value === 0) return "0";
  if (kind === "volume") {
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.1) return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    const standard = value.toFixed(3);
    if (Number(standard) !== 0) return standard;
    const digits = Math.min(8, Math.max(4, Math.ceil(-Math.log10(value)) + 1));
    return value.toFixed(digits);
  }
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatRange(min: number, max: number, kind: "volume" | "amount" = "amount") {
  const first = formatEmergencyNumber(min, kind);
  const second = formatEmergencyNumber(max, kind);
  return first === second ? first : `${first}–${second}`;
}
