import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('tap-rate component retains recent-interval mean and nearest-whole-rate logic', async () => {
  const source = await readFile(new URL('../calculators/tap-rate/TapRate.tsx', import.meta.url), 'utf8');
  assert.match(source, /MAX_INTERVALS = 5/);
  assert.match(source, /MIN_INTERVAL_MS = 150/);
  assert.match(source, /AUTO_RESET_MS = 10_000/);
  assert.match(source, /slice\(-MAX_INTERVALS\)/);
  assert.match(source, /interval < MIN_INTERVAL_MS/);
  assert.match(source, /60_000 \/ meanInterval/);
  assert.match(source, /Math\.round/);
  assert.match(source, /navigator\.vibrate\(10\)/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.doesNotMatch(source, /tap count|elapsed time|heart rate|respiratory rate/i);
});

test('tap-rate route and dashboard entry render the minimal interface', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const env = { ASSETS: { fetch: async () => new Response('', { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const home = await worker.fetch(new Request('http://localhost/'), env, context);
  const homeHtml = await home.text();
  assert.match(homeHtml, /href="\/calculators\/tap-rate"/);
  assert.match(homeHtml, /Tap Rate/);

  const response = await worker.fetch(new Request('http://localhost/calculators/tap-rate'), env, context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<h1>Tap Rate<\/h1>/);
  assert.match(html, /aria-label="Tap to calculate rate"/);
  assert.match(html, />TAP<\/button>/);
  assert.match(html, />Reset<\/button>/);
  assert.match(html, />--<\/div>/);
  assert.match(html, />\/min<\/div>/);
  assert.doesNotMatch(html, /Species|Reference range|Elapsed|Tap count|Tap again/);
});
