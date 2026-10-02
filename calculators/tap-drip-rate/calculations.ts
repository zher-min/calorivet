export const MAX_INTERVALS = 8;
export const MIN_INTERVAL_MS = 150;
export const MIN_ESTIMATE_INTERVALS = 3;
export const STABLE_INTERVALS = 5;

export type MeasurementStability = "measuring" | "settling" | "stable";

export type TapMeasurement = {
  intervalSeconds: number;
  dropsPerMinute: number;
  variation: number;
  intervalsUsed: number;
  stability: MeasurementStability;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function summarizeIntervals(intervalsMs: number[]): TapMeasurement | null {
  const recent = intervalsMs
    .filter(value => Number.isFinite(value) && value >= MIN_INTERVAL_MS)
    .slice(-MAX_INTERVALS);
  if (recent.length === 0) return null;

  const centre = median(recent);
  const filtered = recent.length >= 4
    ? recent.filter(value => value >= centre * 0.5 && value <= centre * 1.75)
    : recent;
  const usable = filtered.length > 0 ? filtered : recent;
  const typicalMs = median(usable);
  const deviations = usable.map(value => Math.abs(value - typicalMs));
  const variation = typicalMs > 0 ? median(deviations) / typicalMs : 0;

  return {
    intervalSeconds: typicalMs / 1000,
    dropsPerMinute: 60_000 / typicalMs,
    variation,
    intervalsUsed: usable.length,
    stability: recent.length < MIN_ESTIMATE_INTERVALS
      ? "measuring"
      : usable.length >= STABLE_INTERVALS && variation <= 0.12
        ? "stable"
        : "settling",
  };
}

export function calculateMeasuredRate(intervalsMs: number[], dropFactor: number) {
  if (!Number.isFinite(dropFactor) || dropFactor <= 0) return null;
  const measurement = summarizeIntervals(intervalsMs);
  if (!measurement || measurement.stability === "measuring") return null;
  return { ...measurement, mlPerHour: measurement.dropsPerMinute * 60 / dropFactor };
}

export function calculateTargetRate(targetMlPerHour: number, dropFactor: number) {
  if (!Number.isFinite(targetMlPerHour) || targetMlPerHour <= 0 || !Number.isFinite(dropFactor) || dropFactor <= 0) return null;
  return {
    dropsPerMinute: targetMlPerHour * dropFactor / 60,
    secondsPerDrop: 3600 / (targetMlPerHour * dropFactor),
  };
}
