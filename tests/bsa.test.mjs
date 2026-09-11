import test from "node:test";
import assert from "node:assert/strict";
import { BSA_CONSTANTS, calculateBSA } from "../calculators/bsa/calculateBSA.ts";

test("BSA constants use the supplied veterinary Meeh-type coefficients", () => {
  assert.deepEqual(BSA_CONSTANTS, { dog: 0.101, cat: 0.1 });
});

test("dog BSA verification cases round to three decimals", () => {
  const cases = [[0.5, "0.064"], [1, "0.101"], [5, "0.295"], [10, "0.469"], [20, "0.744"], [30, "0.975"], [50, "1.371"]];
  for (const [weight, expected] of cases) assert.equal(calculateBSA(Number(weight), "dog")?.toFixed(3), expected);
});

test("cat BSA verification cases round to three decimals", () => {
  const cases = [[0.5, "0.063"], [1, "0.100"], [2, "0.159"], [5, "0.292"], [10, "0.464"]];
  for (const [weight, expected] of cases) assert.equal(calculateBSA(Number(weight), "cat")?.toFixed(3), expected);
});

test("BSA rejects non-finite, zero and negative weights", () => {
  for (const weight of [0, -1, NaN, Infinity, -Infinity]) assert.equal(calculateBSA(weight, "dog"), null);
});

test("BSA route and navigation render the minimal client-side workflow", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const env = { ASSETS: { fetch: async () => new Response("", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const home = await worker.fetch(new Request("http://localhost/"), env, context);
  assert.match(await home.text(), /href="\/calculators\/bsa"/);

  const response = await worker.fetch(new Request("http://localhost/calculators/bsa"), env, context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Body Surface Area/);
  assert.match(html, /input[Mm]ode="decimal"/);
  assert.match(html, /aria-pressed="true"[^>]*class="active"/);
  assert.match(html, /🐕/);
  assert.match(html, /🐈/);
  assert.match(html, />--<\/strong>/);
  assert.match(html, /m<sup>2<\/sup>/);
  assert.doesNotMatch(html, />Calculate<|lookup table|mg\/m² drug|patient record/i);
});
