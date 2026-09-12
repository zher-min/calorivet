import test from "node:test";
import assert from "node:assert/strict";
import { calculateUrineOutput } from "../calculators/urine-output/calculateUrineOutput.ts";

test("urine output verification cases and exact status boundaries", () => {
  const cases = [
    [10, 30, 2, "1.50", "NORMAL", "green"],
    [10, 14, 2, "0.70", "REDUCED", "amber"],
    [10, 6, 2, "0.30", "OLIGURIA", "red"],
    [10, 60, 2, "3.00", "INCREASED", "amber"],
    [10, 20, 2, "1.00", "NORMAL", "green"],
    [10, 40, 2, "2.00", "NORMAL", "green"],
    [10, 10, 2, "0.50", "REDUCED", "amber"],
    [10, 0, 2, "0.00", "NO URINE / ANURIA", "red"],
  ];
  for (const [weight, volume, time, value, label, severity] of cases) {
    const result = calculateUrineOutput(Number(weight), Number(volume), Number(time));
    assert.equal(result?.value.toFixed(2), value);
    assert.equal(result?.label, label);
    assert.equal(result?.severity, severity);
  }
});

test("urine output rejects invalid values without producing non-finite results", () => {
  for (const args of [[0, 30, 2], [-1, 30, 2], [10, -1, 2], [10, 30, 0], [NaN, 30, 2], [10, Infinity, 2]]) {
    assert.equal(calculateUrineOutput(...args), null);
  }
});

test("urine output route and navigation render the minimal workflow", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const env = { ASSETS: { fetch: async () => new Response("", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const home = await worker.fetch(new Request("http://localhost/"), env, context);
  assert.match(await home.text(), /href="\/calculators\/urine-output"/);
  const response = await worker.fetch(new Request("http://localhost/calculators/urine-output"), env, context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Urine Output Calculator/);
  assert.match(html, /Body Weight/);
  assert.match(html, /Urine Volume/);
  assert.match(html, /Collection Time/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Enter weight, urine volume and time/);
  const calculatorMarkup = html.match(/<main class="toolkit-workspace uo-page">([\s\S]*?)<\/main>/)?.[1] ?? "";
  assert.doesNotMatch(calculatorMarkup, /Species|>Calculate<|fluid balance|daily urine output/i);
});
