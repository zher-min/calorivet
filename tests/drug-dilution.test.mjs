import test from "node:test";
import assert from "node:assert/strict";
import {
  SMALL_VOLUME_WARNING_ML, calculateDilution, calculateDosePreparation,
  calculateExistingDilution, convertConcentration, mgPerMlToPercent, percentToMgPerMl,
} from "../calculators/drug-dilution/calculations.ts";

const concentration = (value, unit = "mg_per_ml") => ({ value, unit });

test("standard and small-volume dilutions", () => {
  for (const [stock, desired, final, stockVolume, diluent] of [[50, 5, 20, 2, 18], [10, 2, 5, 1, 4], [100, 10, 1, .1, .9], [50, 1, 1, .02, .98]]) {
    const result = calculateDilution(concentration(stock), concentration(desired), final);
    assert.ok(result);
    assert.ok(Math.abs(result.stockVolumeMl - stockVolume) < 1e-12);
    assert.ok(Math.abs(result.diluentVolumeMl - diluent) < 1e-12);
  }
  assert.equal(calculateDilution(concentration(50), concentration(1), 1).stockVolumeMl < SMALL_VOLUME_WARNING_ML, true);
});

test("all concentration units normalize through mg/mL", () => {
  assert.equal(convertConcentration(1, "mg_per_ml", "ug_per_ml"), 1000);
  assert.equal(convertConcentration(1, "mg_per_ml", "mg_per_l"), 1000);
  assert.equal(convertConcentration(1, "mg_per_ml", "ug_per_l"), 1_000_000);
  assert.equal(percentToMgPerMl(1), 10);
  assert.equal(percentToMgPerMl(.5), 5);
  assert.equal(percentToMgPerMl(2), 20);
  assert.equal(percentToMgPerMl(50), 500);
  assert.equal(mgPerMlToPercent(20), 2);
  assert.equal(mgPerMlToPercent(500), 50);
});

test("mixed-unit dilution compares concentrations after conversion", () => {
  const percentResult = calculateDilution(concentration(2, "percent_wv"), concentration(.5, "percent_wv"), 10);
  const mixedResult = calculateDilution(concentration(20), concentration(.5, "percent_wv"), 10);
  assert.equal(percentResult.stockVolumeMl, 2.5); assert.equal(percentResult.diluentVolumeMl, 7.5);
  assert.equal(mixedResult.stockVolumeMl, 2.5); assert.equal(mixedResult.diluentVolumeMl, 7.5);
  assert.equal(calculateDilution(concentration(1), concentration(.2, "percent_wv"), 10), null);
});

test("reverse dilution and specific dose preparation", () => {
  const reverse = calculateExistingDilution(concentration(50), 2, 18);
  assert.deepEqual(reverse, { finalVolumeMl: 20, totalDrugMg: 100, finalConcentrationMgPerMl: 5 });
  const dose = calculateDosePreparation(12, "mg", concentration(50), 5);
  assert.deepEqual(dose, { stockVolumeMl: .24, diluentVolumeMl: 4.76, finalVolumeMl: 5, finalConcentrationMgPerMl: 2.4 });
});

test("invalid inputs never produce a dilution", () => {
  assert.equal(calculateDilution(concentration(0), concentration(1), 10), null);
  assert.equal(calculateExistingDilution(concentration(10), 1, -1), null);
  assert.equal(calculateDosePreparation(100, "mg", concentration(1), 1), null);
});

test("drug dilution route and registry render the compact workflow", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const env = { ASSETS: { fetch: async () => new Response("", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const home = await worker.fetch(new Request("http://localhost/"), env, context);
  assert.match(await home.text(), /href="\/calculators\/drug-dilution"/);
  const response = await worker.fetch(new Request("http://localhost/calculators/drug-dilution"), env, context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Drug Dilution/);
  assert.match(html, /Verify existing dilution/);
  assert.match(html, /Prepare a specific dose/);
  assert.match(html, /Concentration Converter/);
  assert.doesNotMatch(html, /1:1000|mmol\/L|drug database/i);
});
