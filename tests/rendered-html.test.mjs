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
  assert.match(html, /Routine MER estimates apply the selected species and life-stage factor/);
  assert.match(html, /https:\/\/www\.aaha\.org\/resources\/2021-aaha-nutrition-and-weight-management-guidelines/);
  assert.match(html, /FEDIAF Nutritional Guidelines 2025/);
  assert.match(html, /Merck Veterinary Manual/);
  assert.match(html, /WSAVA Global Nutrition Guidelines/);
  assert.match(html, /approximately ±30% in dogs and ±50% in cats/);
  assert.match(html, /🐕/);
  assert.match(html, /🐈/);
  assert.doesNotMatch(html, /Veterinary nutrition workflow|From body weight to a practical feeding estimate/);
  assert.doesNotMatch(html, /workbook|spreadsheet|supplied|original .* formula/i);
  assert.match(html, /Patient information/);
  assert.match(html, /Pet name/);
  assert.match(html, /Start new patient/);
  assert.match(html, /Send feedback/);
  assert.match(html, /Help improve the calculator/);
  assert.doesNotMatch(html, /tan\.zhermin@gmail\.com/i);
  assert.match(html, /Lactating patient/);
  assert.match(html, /Estimated daily energy requirement/);
  assert.match(html, /Neutered adult/);
  assert.match(html, /Puppy ≥4 months/);
  assert.doesNotMatch(html, /Senior/);
  assert.match(html, /Food energy information/);
  assert.match(html, /kcal\/100 g/);
  assert.match(html, /Guaranteed Analysis available/);
  assert.match(html, /Estimated feeding amount/);
  assert.doesNotMatch(html, /role="tablist"|tab-daily|tab-food/);
  assert.doesNotMatch(html, />Standard feeding<|>Lactation<\/button>/);
  assert.doesNotMatch(html, /cups?\/day|cans?\/day|scoops?\/day|packets?\/day/i);
});

test("does not server-render a stale feeding result or disclaimer without inputs", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /Enter a valid body weight and food-energy information/);
  assert.doesNotMatch(html, /Estimated feeding amount only\. Individual requirements/);
});
