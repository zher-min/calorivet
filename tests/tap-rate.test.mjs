import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculateMeasuredRate, calculateTargetRate, MAX_INTERVALS, summarizeIntervals } from "../calculators/tap-drip-rate/calculations.ts";

test("Quick BPM remains available as an independent mode", async () => {
  const source = await readFile(new URL("../calculators/tap-rate/QuickBpm.tsx", import.meta.url), "utf8");
  assert.match(source, /MAX_INTERVALS = 5/);
  assert.match(source, /MIN_INTERVAL_MS = 150/);
  assert.match(source, /AUTO_RESET_MS = 10_000/);
  assert.match(source, /60_000 \/ meanInterval/);
  assert.match(source, /navigator\.vibrate\(10\)/);
});

test("20 and 60 drops/mL measurements use the robust typical interval", () => {
  const intervals = [2070, 2070, 2070, 2070, 2070, 2070];
  const macro = calculateMeasuredRate(intervals, 20);
  const micro = calculateMeasuredRate(intervals, 60);
  assert.ok(macro);
  assert.ok(micro);
  assert.equal(macro.dropsPerMinute.toFixed(2), "28.99");
  assert.equal(macro.mlPerHour.toFixed(2), "86.96");
  assert.equal(micro.mlPerHour.toFixed(2), "28.99");
  assert.equal(macro.intervalSeconds.toFixed(2), "2.07");
  assert.equal(macro.stability, "stable");
});

test("irregular timing settles without a single missed or rapid tap distorting the estimate", () => {
  const irregular = summarizeIntervals([2000, 2050, 1980, 2100, 2000, 2020]);
  const withRapidTap = calculateMeasuredRate([2000, 2050, 80, 1980, 2100, 2000, 2020], 20);
  const withMissedDrop = calculateMeasuredRate([2000, 2050, 4000, 1980, 2100, 2000, 2020], 20);
  assert.ok(irregular);
  assert.equal(irregular.stability, "stable");
  assert.ok(withRapidTap);
  assert.ok(withMissedDrop);
  assert.ok(Math.abs(withRapidTap.mlPerHour - 90) < 3);
  assert.ok(Math.abs(withMissedDrop.mlPerHour - 90) < 3);
});

test("measurement waits for three intervals and only uses the latest rolling window", () => {
  assert.equal(calculateMeasuredRate([2000, 2000], 20), null);
  const result = calculateMeasuredRate([900, 900, 900, ...Array(MAX_INTERVALS).fill(2000)], 20);
  assert.ok(result);
  assert.equal(result.intervalSeconds, 2);
  assert.equal(result.mlPerHour, 90);
});

test("target-rate calculations match clinical examples", () => {
  assert.deepEqual(calculateTargetRate(120, 20), { dropsPerMinute: 40, secondsPerDrop: 1.5 });
  assert.deepEqual(calculateTargetRate(120, 60), { dropsPerMinute: 120, secondsPerDrop: 0.5 });
  assert.equal(calculateTargetRate(0, 20), null);
  assert.equal(calculateTargetRate(120, 0), null);
});

test("drip mode contains explicit factor selection, reset and one-handed tap safeguards", async () => {
  const source = await readFile(new URL("../calculators/tap-drip-rate/TapDripRate.tsx", import.meta.url), "utf8");
  assert.match(source, /20 drops\/mL — macrodrip/);
  assert.match(source, /60 drops\/mL — microdrip/);
  assert.match(source, /10 drops\/mL/);
  assert.match(source, /15 drops\/mL/);
  assert.match(source, /Custom drop factor/);
  assert.match(source, /useState<FactorChoice \| null>\(null\)/);
  assert.match(source, /disabled={!validDropFactor}/);
  assert.match(source, /setIntervals\(\[\]\)/);
  assert.match(source, /setDropCount\(0\)/);
  assert.match(source, /lastTapRef\.current = null/);
  assert.match(source, /Rapid tap ignored/);
  assert.match(source, /navigator\.vibrate\(10\)/);
  assert.match(source, /event\.preventDefault\(\)/);
});

test("mobile styling retains a large touch target and single-column target results", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.drip-rate__tap \{[^}]*touch-action: manipulation/s);
  assert.match(css, /\.drip-rate__tap \{[^}]*user-select: none/s);
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*\.drip-rate__tap \{ min-height: clamp\(210px, 37dvh, 320px\)/);
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*\.drip-rate__target-result \{ grid-template-columns: 1fr; \}/);
});

test("combined route and Toolbox entry expose BPM and Drip Rate modes", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const env = { ASSETS: { fetch: async () => new Response("", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const home = await worker.fetch(new Request("http://localhost/"), env, context);
  const homeHtml = await home.text();
  assert.match(homeHtml, /href="\/calculators\/tap-rate"/);
  assert.match(homeHtml, /BPM \/ Drip Rate/);

  const response = await worker.fetch(new Request("http://localhost/calculators/tap-rate"), env, context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<h1>BPM \/ Drip Rate<\/h1>/);
  assert.match(html, /aria-label="Tap calculator mode"/);
  assert.match(html, />BPM<\/button>/);
  assert.match(html, />Drip Rate<\/button>/);
  assert.match(html, /aria-label="Tap to calculate rate"/);
});
