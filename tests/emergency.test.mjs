import test from "node:test";
import assert from "node:assert/strict";
import { calculateDextroseDilution, calculateEmergencyDose, calculateLipidInfusion, concentrationToMgPerMl, formatEmergencyNumber } from "../calculators/emergency/calculations.ts";
import { concentrationDefinitions, defibrillationTreatments, emergencyCategories, recoverTreatments } from "../calculators/emergency/data.ts";

test("emergency mass, unit and percentage conversions retain full precision", () => {
  assert.equal(concentrationToMgPerMl(1, "mg/mL"), 1);
  assert.equal(concentrationToMgPerMl(50, "mcg/mL"), 0.05);
  assert.equal(concentrationToMgPerMl(0.1, "g/mL"), 100);
  assert.equal(concentrationToMgPerMl(20, "%"), 200);
  assert.equal(concentrationToMgPerMl(0, "%"), null);
});

test("epinephrine and atipamezole calculate amounts and volumes across mass units", () => {
  const epi = calculateEmergencyDose(4.2, recoverTreatments.find(item => item.id === "cpr-epinephrine").doseOptions[0], 1, "mg/mL");
  assert.equal(epi.amountMin, 0.042);
  assert.equal(epi.volumeMinMl, 0.042);
  const ati = calculateEmergencyDose(4.2, recoverTreatments.find(item => item.id === "cpr-atipamezole").doseOptions[0], 5, "mg/mL");
  assert.equal(ati.amountMin, 420);
  assert.ok(Math.abs(ati.volumeMinMl - 0.084) < 1e-12);
});

test("ranges and hourly infusions preserve the locked clinical dose", () => {
  const atropine = calculateEmergencyDose(10, recoverTreatments.find(item => item.id === "cpr-atropine").doseOptions[0], 0.5, "mg/mL");
  assert.equal(atropine.amountMin, 0.4);
  assert.equal(atropine.amountMax, 0.54);
  assert.equal(atropine.volumeMinMl, 0.8);
  assert.equal(atropine.volumeMaxMl, 1.08);
  const furosemide = emergencyCategories.find(item => item.id === "pulmonary-edema").treatments[0].doseOptions.find(item => item.id === "cat-cri");
  const cri = calculateEmergencyDose(4, furosemide, 10, "mg/mL");
  assert.equal(cri.amountMin, 1);
  assert.equal(cri.amountMax, 2.4);
  assert.equal(cri.volumeMinMl, 0.1);
  assert.equal(cri.volumeMaxMl, 0.24);
});

test("direct volume, percentage, shock and defibrillation treatments calculate correctly", () => {
  const calcium = emergencyCategories.find(item => item.id === "hyperkalemia").treatments[0].doseOptions[0];
  const calciumResult = calculateEmergencyDose(4, calcium, null);
  assert.equal(calciumResult.amountMin, 2);
  assert.equal(calciumResult.amountMax, 6);
  const dextrose = emergencyCategories.find(item => item.id === "hypoglycemia").treatments[0].doseOptions[0];
  const dextroseResult = calculateEmergencyDose(4, dextrose, 50, "%");
  assert.equal(dextroseResult.amountMin, 1);
  assert.equal(dextroseResult.amountMax, 2);
  assert.equal(dextroseResult.volumeMinMl, 2);
  assert.equal(dextroseResult.volumeMaxMl, 4);
  const shock = emergencyCategories.find(item => item.id === "shock").treatments[0];
  assert.equal(calculateEmergencyDose(10, shock.doseOptions.find(item => item.id === "dog"), null).amountMin, 150);
  assert.equal(calculateEmergencyDose(10, shock.doseOptions.find(item => item.id === "cat"), null).amountMin, 50);
  const joules = calculateEmergencyDose(5, defibrillationTreatments[0].doseOptions[0], null);
  assert.equal(joules.amountMin, 10);
  assert.equal(joules.amountMax, 20);
});

test("dextrose dilution and lipid infusion helpers reject invalid substitutions", () => {
  assert.deepEqual(calculateDextroseDilution(2, 50, 25), { finalVolumeMl: 4, diluentVolumeMl: 2 });
  assert.equal(calculateDextroseDilution(2, 12.5, 25), null);
  assert.deepEqual(calculateLipidInfusion(4), { rateMlMin: 1, rateMlHr: 60, totalMinMl: 30, totalMaxMl: 60 });
  assert.equal(calculateLipidInfusion(0), null);
});

test("emergency calculations reject invalid patient weights and preserve small-volume precision", () => {
  const option = recoverTreatments[0].doseOptions[0];
  for (const weight of [0, -1, NaN, Infinity]) assert.equal(calculateEmergencyDose(weight, option, 1, "mg/mL"), null);
  assert.equal(formatEmergencyNumber(0.042, "volume"), "0.042");
  assert.notEqual(formatEmergencyNumber(0.00001, "volume"), "0.000");
});

test("shared drugs use shared concentration keys and no high-dose epinephrine entry exists", () => {
  const allTreatments = [...recoverTreatments, ...emergencyCategories.flatMap(category => category.treatments)];
  const epinephrine = allTreatments.filter(item => item.drugName === "Epinephrine");
  assert.equal(new Set(epinephrine.map(item => item.concentrationKey)).size, 1);
  assert.equal(epinephrine[0].concentrationKey, "epinephrine");
  const naloxone = allTreatments.filter(item => item.drugName === "Naloxone");
  assert.equal(new Set(naloxone.map(item => item.concentrationKey)).size, 1);
  assert.ok(!recoverTreatments.some(item => item.drugName === "Epinephrine" && item.doseOptions.some(option => option.doseMin === 0.1)));
  assert.equal(concentrationDefinitions.find(item => item.key === "atropine").referenceValue, null);
});

test("species-specific emergency options never mix dog and cat doses", () => {
  const furosemide = emergencyCategories.find(item => item.id === "pulmonary-edema").treatments[0];
  assert.deepEqual(furosemide.doseOptions.filter(option => option.species.includes("dog")).map(option => option.id), ["dog-bolus", "dog-cri"]);
  assert.deepEqual(furosemide.doseOptions.filter(option => option.species.includes("cat")).map(option => option.id), ["cat-bolus", "cat-cri"]);
  assert.ok(recoverTreatments.find(item => item.id === "cpr-lidocaine").species.includes("dog"));
  assert.ok(!recoverTreatments.find(item => item.id === "cpr-lidocaine").species.includes("cat"));
});

test("Emergency route and navigation render RECOVER before collapsed treatment choices", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const env = { ASSETS: { fetch: async () => new Response("", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const home = await worker.fetch(new Request("http://localhost/"), env, context);
  assert.match(await home.text(), /href="\/calculators\/emergency"/);
  const response = await worker.fetch(new Request("http://localhost/calculators/emergency"), env, context);
  const html = await response.text();
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "";
  assert.equal(response.status, 200);
  assert.ok(main.indexOf("RECOVER CPR") < main.indexOf("Other Emergency Treatments"));
  for (const text of ["Emergency Drug Calculator", "Epinephrine", "Vasopressin", "Atropine", "Defibrillation", "Hyperkalemia", "Toxicology / Antidotes", "Clinical Decision Support Only"]) assert.ok(main.includes(text), text);
  assert.match(main, /🐕/); assert.match(main, /🐈/);
  assert.doesNotMatch(main, /Select your drug|drug database|high-dose epinephrine/i);
  assert.doesNotMatch(main, />Calculate<|type="submit"/);
});
