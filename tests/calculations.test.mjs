import assert from "node:assert/strict";
import test from "node:test";
import {
  activityFactors,
  calculateDailyEnergy,
  calculateFeedingAmount,
  calculateGuaranteedAnalysis,
  calculateLactationEnergy,
  normalizeManufacturerEnergy,
  selectFoodEnergy,
} from "../app/calculations.ts";

const completeAnalysis = { moisture: 8.5, protein: 34, fat: 16, fibre: 2.8, ash: 8 };
const validAnalysis = calculateGuaranteedAnalysis(completeAnalysis);

test("preserves dog and cat RER/MER logic", () => {
  const dog = calculateDailyEnergy(36.6, "Dog", "Weight loss");
  const cat = calculateDailyEnergy(4, "Cat", "Typical neutered pet");
  assert.ok(dog && cat);
  assert.equal(Math.round(dog.rer), 1042);
  assert.equal(Math.round(dog.mer), 1042);
  assert.equal(cat.factor, 1.2);
  assert.equal(Math.round(cat.mer), Math.round(70 * Math.pow(4, 0.75) * 1.2));
});

test("uses guideline-based growth factors", () => {
  assert.equal(activityFactors.Dog["Growing (<4 months)"], 3);
  assert.equal(activityFactors.Dog["Growing (>4 months)"], 2);
  assert.equal(activityFactors.Cat["Growing (<4 months)"], 2.5);
  assert.equal(activityFactors.Cat["Growing (>4 months)"], 2.5);
});

test("keeps lactation energy separate from the standard MER factor", () => {
  const dog = calculateLactationEnergy(20, "Dog", 5, 2);
  const cat = calculateLactationEnergy(4, "Cat", 3, 3);
  assert.ok(dog && cat);
  const dogRer = 70 * Math.pow(20, 0.75);
  assert.equal(dog.mer, (145 / 70) * dogRer + 108 * 20 * 0.95);
  assert.equal(cat.mer, 100 * Math.pow(4, 0.67) + 60 * 4 * 1.2);
});

test("handles very small and large patients without NaN or Infinity", () => {
  for (const weight of [0.2, 80]) {
    const result = calculateDailyEnergy(weight, "Dog", "Typical neutered pet");
    assert.ok(result);
    assert.ok([result.rer, result.mer, result.minimum, result.maximum].every(Number.isFinite));
  }
});

test("rejects zero, negative, non-numeric, and infinite body weights", () => {
  for (const weight of [0, -1, "nope", Infinity]) {
    assert.equal(calculateDailyEnergy(weight, "Dog", "Weight loss"), null);
  }
});

test("preserves the Guaranteed Analysis energy formula", () => {
  assert.equal(validAnalysis.valid, true);
  assert.ok(Math.abs(validAnalysis.carbohydrate - 30.7) < 1e-10);
  assert.ok(Math.abs(validAnalysis.kcalKg - 3624.5) < 1e-10);
  assert.ok(Math.abs(validAnalysis.proteinEnergy - 32.83211477445165) < 1e-10);
});

test("requires every Guaranteed Analysis field", () => {
  const incomplete = calculateGuaranteedAnalysis({ moisture: 8, protein: 30, fat: "", fibre: 3, ash: "" });
  assert.equal(incomplete.valid, false);
  assert.deepEqual(incomplete.missing, ["Crude fat", "Ash"]);
});

test("rejects invalid percentages and impossible totals", () => {
  const outOfRange = calculateGuaranteedAnalysis({ moisture: -1, protein: 101, fat: 10, fibre: 2, ash: 3 });
  const impossible = calculateGuaranteedAnalysis({ moisture: 80, protein: 30, fat: 10, fibre: 2, ash: 3 });
  assert.equal(outOfRange.valid, false);
  assert.equal(impossible.valid, false);
  assert.ok(outOfRange.errors.length >= 2);
  assert.match(impossible.errors[0], /above 100/);
});

test("uses manufacturer kcal/kg when it is the only source", () => {
  const source = selectFoodEnergy({ manufacturerEnabled: true, manufacturerKcalKg: 3800, guaranteedAnalysisEnabled: false, guaranteedAnalysis: validAnalysis });
  assert.deepEqual(source, { source: "manufacturer", kcalKg: 3800 });
});

test("normalizes manufacturer kcal per 100 g to kcal/kg", () => {
  assert.equal(normalizeManufacturerEnergy(380, "kcal/100g"), 3800);
  assert.equal(normalizeManufacturerEnergy(3800, "kcal/kg"), 3800);
  assert.equal(normalizeManufacturerEnergy(0, "kcal/100g"), null);
  const source = selectFoodEnergy({
    manufacturerEnabled: true,
    manufacturerKcalKg: 380,
    manufacturerUnit: "kcal/100g",
    guaranteedAnalysisEnabled: false,
    guaranteedAnalysis: validAnalysis,
  });
  assert.deepEqual(source, { source: "manufacturer", kcalKg: 3800 });
});

test("uses Guaranteed Analysis when it is the only valid source", () => {
  const source = selectFoodEnergy({ manufacturerEnabled: false, manufacturerKcalKg: "", guaranteedAnalysisEnabled: true, guaranteedAnalysis: validAnalysis });
  assert.equal(source?.source, "guaranteed-analysis");
  assert.ok(Math.abs(source.kcalKg - 3624.5) < 1e-10);
});

test("manufacturer value has priority when both sources are valid", () => {
  const source = selectFoodEnergy({ manufacturerEnabled: true, manufacturerKcalKg: 3800, guaranteedAnalysisEnabled: true, guaranteedAnalysis: validAnalysis });
  assert.deepEqual(source, { source: "manufacturer", kcalKg: 3800 });
});

test("removing manufacturer value falls back to valid Guaranteed Analysis", () => {
  const source = selectFoodEnergy({ manufacturerEnabled: true, manufacturerKcalKg: "", guaranteedAnalysisEnabled: true, guaranteedAnalysis: validAnalysis });
  assert.equal(source?.source, "guaranteed-analysis");
  assert.ok(Math.abs(source.kcalKg - 3624.5) < 1e-10);
});

test("neither source, incomplete analysis, or disabled analysis produces no food energy", () => {
  const incomplete = calculateGuaranteedAnalysis({ moisture: "", protein: "", fat: "", fibre: "", ash: "" });
  assert.equal(selectFoodEnergy({ manufacturerEnabled: false, manufacturerKcalKg: "", guaranteedAnalysisEnabled: false, guaranteedAnalysis: validAnalysis }), null);
  assert.equal(selectFoodEnergy({ manufacturerEnabled: false, manufacturerKcalKg: "", guaranteedAnalysisEnabled: true, guaranteedAnalysis: incomplete }), null);
  assert.equal(selectFoodEnergy({ manufacturerEnabled: false, manufacturerKcalKg: "", guaranteedAnalysisEnabled: false, guaranteedAnalysis: validAnalysis }), null);
});

test("converts the calorie range to the corresponding g/day range", () => {
  const energy = { minimum: 480, maximum: 550, mer: 515 };
  const result = calculateFeedingAmount(energy, 3800);
  assert.ok(result);
  assert.equal(Math.round(result.minimum), 126);
  assert.equal(Math.round(result.maximum), 145);
  assert.equal(Math.round(result.midpoint), 136);
});

test("changing weight or MER factor reactively changes energy and feeding", () => {
  const first = calculateDailyEnergy(10, "Dog", "Weight loss");
  const heavier = calculateDailyEnergy(20, "Dog", "Weight loss");
  const moreActive = calculateDailyEnergy(10, "Dog", "Working — moderate");
  assert.ok(first && heavier && moreActive);
  assert.notEqual(first.mer, heavier.mer);
  assert.notEqual(first.mer, moreActive.mer);
  assert.notEqual(calculateFeedingAmount(first, 3800)?.midpoint, calculateFeedingAmount(heavier, 3800)?.midpoint);
  assert.equal(moreActive.factor, activityFactors.Dog["Working — moderate"]);
});

test("invalid or removed inputs clear feeding results instead of leaving stale values", () => {
  const energy = calculateDailyEnergy(10, "Dog", "Weight loss");
  assert.ok(calculateFeedingAmount(energy, 3800));
  assert.equal(calculateFeedingAmount(null, 3800), null);
  assert.equal(calculateFeedingAmount(energy, null), null);
  assert.equal(calculateFeedingAmount(energy, 0), null);
  assert.equal(calculateFeedingAmount(energy, -100), null);
  assert.equal(calculateFeedingAmount(energy, Infinity), null);
});
