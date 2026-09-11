import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('home-screen manifest launches VetCalc standalone at the dashboard', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.id, '/');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.short_name, 'VetCalc');
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(manifest.icons.map(i => i.sizes), ['192x192','512x512','512x512']);
  for (const icon of manifest.icons) {
    const png = await readFile(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(png.subarray(1,4).toString(),'PNG');
    const size = Number(icon.sizes.split('x')[0]);
    assert.equal(png.readUInt32BE(16),size);
    assert.equal(png.readUInt32BE(20),size);
  }
  const apple = await readFile(new URL('../public/icons/apple-touch-icon.png', import.meta.url));
  assert.equal(apple.readUInt32BE(16),180);
  assert.equal(apple.readUInt32BE(20),180);
});

test('both calculator pages expose manifest and Apple installation metadata', async () => {
  const {default:worker} = await import('../dist/server/index.js');
  for (const route of ['/', '/calculators/calorie', '/calculators/transfusion']) {
    const response = await worker.fetch(new Request(`http://localhost${route}`), {ASSETS:{fetch:async()=>new Response('',{status:404})}}, {waitUntil(){},passThroughOnException(){}});
    const html = await response.text();
    assert.equal(response.status,200);
    assert.match(html,/rel="manifest"[^>]*href="\/manifest.webmanifest"|href="\/manifest.webmanifest"[^>]*rel="manifest"/);
    assert.match(html,/apple-mobile-web-app-capable/);
    assert.match(html,/\/icons\/apple-touch-icon.png/);
    assert.match(html,/Add to Home Screen/);
    assert.match(html,/theme-color/);
    assert.doesNotMatch(html,/Opening install…/);
  }
});
