import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders one continuous standard feeding workflow", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /CaloriVet Feeding Calculator/);
  assert.match(html, /What is this calculator for\?/);
  assert.match(html, /Estimates daily calorie needs and a starting feeding amount in g\/day/);
  assert.match(html, /AAFCO Modified Atwater formula/);
  assert.match(html, /https:\/\/www\.aafco\.org\/resources\/startups\/calorie-content\//);
  assert.match(html, /RER \(resting energy requirement\) = 70/);
  assert.match(html, /MER \(maintenance energy requirement\) = RER/);
  assert.match(html, /https:\/\/www\.aaha\.org\/resources\/2021-aaha-nutrition-and-weight-management-guidelines/);
  assert.match(html, /🐕/);
  assert.match(html, /🐈/);
  assert.doesNotMatch(html, /Veterinary nutrition workflow|From body weight to a practical feeding estimate/);
  assert.doesNotMatch(html, /workbook|spreadsheet|supplied|original .* formula/i);
  assert.match(html, /Patient information/);
  assert.match(html, /Estimated daily energy requirement/);
  assert.match(html, /Food energy information/);
  assert.match(html, /kcal\/100 g/);
  assert.match(html, /Guaranteed Analysis available/);
  assert.match(html, /Estimated feeding amount/);
  assert.doesNotMatch(html, /role="tablist"|tab-daily|tab-food/);
  assert.doesNotMatch(html, /cups?\/day|cans?\/day|scoops?\/day|packets?\/day/i);
});

test("does not server-render a stale feeding result or disclaimer without inputs", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /Enter a valid body weight and food-energy information/);
  assert.doesNotMatch(html, /Estimated feeding amount only\. Individual requirements/);
});
