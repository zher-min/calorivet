import assert from "node:assert/strict";
import test from "node:test";
import { calculateDaysRemaining, dogSize } from "../calculators/fetal-age/calculations.ts";

test("fetal age uses normalized positive days-remaining equations", () => {
  assert.ok(Math.abs(calculateDaysRemaining("dog", "icc", 30, 10.1) - 28.96) < 0.01);
  assert.ok(Math.abs(calculateDaysRemaining("dog", "bpd", 15, 30) - 18.75) < 0.01);
  assert.ok(Math.abs(calculateDaysRemaining("cat", "bpd", 15) - 17.85) < 0.01);
});

test("canine maternal size boundaries are explicit", () => {
  assert.equal(dogSize(10), "small");
  assert.equal(dogSize(10.1), "medium");
  assert.equal(dogSize(25), "medium");
  assert.equal(dogSize(25.1), "large");
  assert.equal(dogSize(40), "large");
  assert.equal(dogSize(40.1), "giant");
});
