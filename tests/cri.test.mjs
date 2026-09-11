import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAdditiveCRI,
  calculateReplacementCRI,
  calculateSyringeCRI,
  calculateTargetConcentration,
  convertDoseToMgPerKgPerHour,
  convertMassToMg,
  formatVolumeMl,
} from "../calculators/cri/calculations.ts";

const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("CRI mass and dose-time conversions normalize to mg and hours", () => {
  assert.equal(convertMassToMg(1, "ug"), 0.001);
  assert.equal(convertMassToMg(1, "mg"), 1);
  assert.equal(convertMassToMg(1, "g"), 1000);
  assert.equal(convertDoseToMgPerKgPerHour(10, "ug", "hr"), 0.01);
  assert.equal(convertDoseToMgPerKgPerHour(2, "mg", "min"), 120);
  assert.equal(convertMassToMg(Infinity, "mg"), null);
});

test("verification case calculates 0.009722 mL drug and 13.9 hours", () => {
  const result = calculateReplacementCRI({ weightKg: 1.4, rateMlHr: 18, finalVolumeMl: 250, drugs: [{ doseMgPerKgHr: 0.01, stockMgPerMl: 20 }] });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  near(result.drugs[0].patientDoseMgHr, 0.014);
  near(result.drugs[0].targetConcentrationMgMl, 0.014 / 18);
  near(result.drugs[0].drugAmountMg, 0.19444444444444445);
  near(result.drugs[0].drugVolumeMl, 0.009722222222222222);
  near(result.fluidToRemoveMl, result.drugs[0].drugVolumeMl);
  near(result.finalVolumeMl, 250);
  near(result.durationHr, 250 / 18);
  assert.equal(formatVolumeMl(result.drugs[0].drugVolumeMl), "0.010");
  assert.equal(result.durationHr.toFixed(1), "13.9");
});

test("target concentration rejects invalid values", () => {
  assert.equal(calculateTargetConcentration(0, 1, 1), null);
  assert.equal(calculateTargetConcentration(1, -1, 1), null);
  assert.equal(calculateTargetConcentration(1, 1, Infinity), null);
  assert.equal(calculateTargetConcentration(10, 2, 5), 4);
});

test("add-to-volume includes added stock volume for one and multiple drugs", () => {
  const single = calculateAdditiveCRI({ weightKg: 10, rateMlHr: 10, bagVolumeMl: 100, drugs: [{ doseMgPerKgHr: 1, stockMgPerMl: 20 }] });
  assert.equal(single.ok, true);
  if (single.ok) { near(single.finalVolumeMl, 100 / 0.95); near(single.drugs[0].drugVolumeMl, single.finalVolumeMl - 100); near(single.durationHr, single.finalVolumeMl / 10); }

  const multiple = calculateAdditiveCRI({ weightKg: 10, rateMlHr: 10, bagVolumeMl: 100, drugs: [
    { doseMgPerKgHr: 0.2, stockMgPerMl: 10 },
    { doseMgPerKgHr: 0.3, stockMgPerMl: 10 },
  ] });
  assert.equal(multiple.ok, true);
  if (multiple.ok) {
    near(multiple.finalVolumeMl, 100 / 0.95);
    near(multiple.drugs.reduce((sum, drug) => sum + drug.drugVolumeMl, 0), multiple.finalVolumeMl - 100);
  }
});

test("add-to-volume rejects impossible concentration and combined fractions", () => {
  assert.deepEqual(calculateAdditiveCRI({ weightKg: 10, rateMlHr: 10, bagVolumeMl: 100, drugs: [{ doseMgPerKgHr: 1, stockMgPerMl: 1 }] }), { ok: false, code: "stock_not_greater_than_target" });
  assert.deepEqual(calculateAdditiveCRI({ weightKg: 10, rateMlHr: 10, bagVolumeMl: 100, drugs: [
    { doseMgPerKgHr: 0.6, stockMgPerMl: 1 }, { doseMgPerKgHr: 0.5, stockMgPerMl: 1 },
  ] }), { ok: false, code: "additive_fraction_too_high" });
});

test("syringe mode calculates diluent and rejects stock volume above final volume", () => {
  const result = calculateSyringeCRI({ weightKg: 5, rateMlHr: 2, finalVolumeMl: 20, drugs: [{ doseMgPerKgHr: 0.1, stockMgPerMl: 10 }] });
  assert.equal(result.ok, true);
  if (result.ok) { near(result.drugs[0].drugVolumeMl, 0.5); near(result.diluentVolumeMl, 19.5); near(result.durationHr, 10); }
  assert.deepEqual(calculateSyringeCRI({ weightKg: 10, rateMlHr: 1, finalVolumeMl: 5, drugs: [{ doseMgPerKgHr: 10, stockMgPerMl: 1 }] }), { ok: false, code: "drug_volume_exceeds_final" });
});

test("all CRI engines reject blank-equivalent, zero, negative and non-finite values", () => {
  for (const weightKg of [0, -1, NaN, Infinity]) {
    assert.deepEqual(calculateReplacementCRI({ weightKg, rateMlHr: 1, finalVolumeMl: 10, drugs: [{ doseMgPerKgHr: 1, stockMgPerMl: 1 }] }), { ok: false, code: "invalid_input" });
  }
  assert.deepEqual(calculateReplacementCRI({ weightKg: 1, rateMlHr: 0, finalVolumeMl: 10, drugs: [{ doseMgPerKgHr: 1, stockMgPerMl: 1 }] }), { ok: false, code: "invalid_input" });
  assert.deepEqual(calculateReplacementCRI({ weightKg: 1, rateMlHr: 1, finalVolumeMl: 0, drugs: [{ doseMgPerKgHr: 1, stockMgPerMl: 1 }] }), { ok: false, code: "invalid_input" });
});

test("volume formatting never rounds a non-zero micro-volume to zero", () => {
  assert.equal(formatVolumeMl(12.34), "12.3");
  assert.equal(formatVolumeMl(1.234), "1.23");
  assert.equal(formatVolumeMl(0.1234), "0.12");
  assert.equal(formatVolumeMl(0.009722), "0.010");
  assert.notEqual(formatVolumeMl(0.00001), "0.000");
});

test("CRI route and navigation render without species or drug presets", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const env = { ASSETS: { fetch: async () => new Response("", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const home = await worker.fetch(new Request("http://localhost/"), env, context);
  assert.match(await home.text(), /href="\/calculators\/cri"/);
  const response = await worker.fetch(new Request("http://localhost/calculators/cri"), env, context);
  const html = await response.text();
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] || "";
  assert.equal(response.status, 200);
  for (const text of ["Constant Rate Infusion", "Body weight", "Single drug", "Multiple drugs", "Fluid bag", "Syringe pump", "Infusion dose rate", "Stock concentration", "Preparation"]) assert.ok(html.includes(text), text);
  assert.doesNotMatch(main, /Dog|Cat|Species|Select your drug|drug preset|recommended dose/i);
  assert.doesNotMatch(main, />Calculate<|type="submit"/);
});
