import test from "node:test";
import assert from "node:assert/strict";
import { recipientRequirement, reversePcv, donorCollection, anticoagulant, planningRate, massiveTransfusion, plasmaRequirement } from "../calculators/transfusion/calculations.ts";
import { compatibility, crossmatchAlert, doseWarning, ongoingWarning, overloadWarning } from "../calculators/transfusion/warnings.ts";
const dog = { species: "dog", product: "wholeBlood", weight: 20, current: 12, target: 22, productPcv: 40 };
const cat = { species: "cat", product: "wholeBlood", weight: 4, current: 10, target: 20, productPcv: 35 };
test("canine RBC requirement is 425 mL and 21.25 mL/kg without capping", () => {
  const { result } = recipientRequirement(dog);
  assert.equal(result.volumeMl, 425); assert.equal(result.doseMlKg, 21.25); assert.equal(result.ebv, 85);
  assert.equal(doseWarning("wholeBlood", result.doseMlKg).severity, "caution");
  assert.match(doseWarning("wholeBlood", result.doseMlKg).message, /above.*12–20/);
});
test("feline mass-balance and empirical estimates remain distinct", () => {
  const { result } = recipientRequirement(cat);
  assert.ok(Math.abs(result.volumeMl - 62.857142857) < 1e-8); assert.equal(result.empiricalMl, 80); assert.equal(result.ebv, 55);
});
test("reverse PCV round trip for both species", () => {
  for (const input of [dog, cat]) { const r = recipientRequirement(input).result; assert.ok(Math.abs(reversePcv(input.weight, input.current, input.productPcv, r.volumeMl, r.ebv) - input.target) < 1e-10); }
});
test("dog donor weight/volume profile is dynamic", () => {
  assert.deepEqual(donorCollection("dog", 25, 450), { maxCollectionMl: 450, minimumWeightKg: 25, criteriaMet: true, alternativeMl: null });
  assert.equal(donorCollection("dog", 20, 450).maxCollectionMl, 360); assert.equal(donorCollection("dog", 20, 450).criteriaMet, false);
  assert.equal(donorCollection("dog", 19, 100).criteriaMet, false);
});
test("cat uses lean-weight conservative profile and separate alternative", () => {
  const r = donorCollection("cat", 5, 60); assert.equal(r.maxCollectionMl, 60); assert.equal(r.minimumWeightKg, 5); assert.equal(r.criteriaMet, true); assert.equal(r.alternativeMl, 70);
  assert.equal(donorCollection("cat", 4.4, 40).criteriaMet, false);
});
test("anticoagulant ratios and commercial exclusions", () => {
  for (const system of ["ACD-A", "CPD", "CPDA-1"]) assert.deepEqual(anticoagulant(42, system), { anticoagulantMl: 6, totalMl: 48, ratio: 7 });
  assert.equal(anticoagulant(42, "Commercial prefilled collection system"), null);
  assert.equal(anticoagulant(42, "Heparin"), null); assert.equal(anticoagulant(45, "Sodium citrate"), null);
  assert.equal(anticoagulant(45, "Sodium citrate", true).anticoagulantMl, 5);
});
test("species/history dependent crossmatching including exact conservative boundaries", () => {
  for (const [species, days] of [["dog", 5], ["cat", 3], ["dog", 4], ["cat", 2]]) assert.match(crossmatchAlert(species, "yes", days).message, /strongly recommended/);
  assert.match(crossmatchAlert("cat", "none", "").message, /suggested/);
  assert.match(crossmatchAlert("dog", "none", "").message, /case-dependent/);
  for (const species of ["dog", "cat"]) { assert.equal(crossmatchAlert(species, "unknown", "").severity, "caution"); assert.match(crossmatchAlert(species, "yes", -1).message, /uncertain/); }
});
test("massive transfusion strict greater-than boundaries and inconsistent inputs", () => {
  const r = massiveTransfusion(10, 85, 425, 850); assert.equal(r.bloodVolumeMl, 850); assert.equal(r.threshold3h, 425); assert.equal(r.threshold24h, 850); assert.equal(r.triggered, false);
  assert.equal(massiveTransfusion(10, 85, 426, "").triggered, true); assert.equal(massiveTransfusion(10, 85, "", 851).triggered, true);
  assert.equal(massiveTransfusion(10, 85, 100, 50), null); assert.equal(massiveTransfusion(10, 85, -1, ""), null);
});
test("empirical fallback only for missing feline whole-blood PCV", () => {
  assert.equal(recipientRequirement({ ...cat, productPcv: "" }).result.volumeMl, 80);
  assert.equal(recipientRequirement({ ...cat, productPcv: "" }).result.empiricalOnly, true);
  for (const productPcv of [0, -1, 101, "bad", Infinity]) assert.equal(recipientRequirement({ ...cat, productPcv }).result, null);
  assert.equal(recipientRequirement({ ...cat, product: "pRbc", productPcv: "" }).result, null);
  assert.equal(recipientRequirement({ ...dog, productPcv: "" }).result, null);
});
test("invalid, missing and extreme inputs never leave numeric results", () => {
  for (const value of ["", 0, -1, "bad", Infinity, NaN]) {
    assert.equal(recipientRequirement({ ...dog, weight: value }).result, null);
    assert.equal(donorCollection("dog", value, 450), null); assert.equal(plasmaRequirement(20, value), null);
    assert.equal(planningRate(100, value, 20), null);
  }
  for (const target of ["", 0, 12, -1, 101, "bad"]) assert.equal(recipientRequirement({ ...dog, target }).result, null);
  for (const ebvOverride of [0, 19, 151, "bad"]) assert.equal(recipientRequirement({ ...dog, ebvOverride }).result, null);
  assert.equal(recipientRequirement({ ...dog, ebvOverride: 80 }).result.volumeMl, 400);
  assert.equal(recipientRequirement({ ...dog, weight: 1e308 }).result, null);
  assert.equal(reversePcv(20, 99, 100, 1000, 85), null);
});
test("plasma and planner equations are independent of PCV", () => {
  assert.deepEqual(plasmaRequirement(20, 15), { volumeMl: 300, doseMlKg: 15 });
  assert.deepEqual(planningRate(300, 3, 20), { mlHour: 100, mlKgHour: 5 });
});
test("compatibility rules are product-specific and never infer full suitability", () => {
  assert.equal(compatibility("dog", "pRbc", "Negative", "Positive").severity, "error");
  assert.equal(compatibility("dog", "wholeBlood", "Positive", "Negative").severity, "info");
  assert.equal(compatibility("cat", "wholeBlood", "A", "B").severity, "error");
  assert.equal(compatibility("cat", "pRbc", "AB", "A").severity, "caution");
  assert.equal(compatibility("cat", "wholeBlood", "AB", "A").severity, "error");
  assert.equal(compatibility("cat", "plasma", "A", "B").severity, "info");
  assert.equal(compatibility("dog", "pRbc", "Unknown", "Positive").severity, "caution");
});
test("clinical cautions are pure and responsive", () => {
  assert.equal(ongoingWarning(false), null); assert.equal(ongoingWarning(true).severity, "caution");
  assert.equal(overloadWarning(false, false, false), null); assert.equal(overloadWarning(false, true, false).severity, "caution");
  assert.equal(doseWarning("wholeBlood", 15), null); assert.match(doseWarning("pRbc", 5).message, /below/);
});
