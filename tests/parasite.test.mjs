import test from 'node:test';
import assert from 'node:assert/strict';
import { parasiteProducts } from '../calculators/parasite/data/parasiteProducts.ts';
import { parasites } from '../calculators/parasite/data/parasites.ts';
import { comparisonColumns, matchProduct, productsForSpecies, toggleComparison } from '../calculators/parasite/logic.ts';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Synthetic fixtures exercise the engine, not medical product claims.
const fixture = overrides => ({ ...structuredClone(parasiteProducts[0]), name: 'Test fixture',
  coverage: { ...structuredClone(parasiteProducts[0].coverage), ...Object.fromEntries(Object.entries(overrides).map(([key, status]) => [key, { status }])) } });

test('clinic seed includes exactly seven products for each species without invented claims', () => {
  assert.equal(parasiteProducts.length, 14);
  assert.equal(new Set(parasiteProducts.map(p => p.id)).size, 14);
  for (const species of ['dog','cat']) {
    const products = productsForSpecies(parasiteProducts, species);
    assert.equal(products.length, 7);
    assert.equal(products.filter(p => p.name === 'Frontline Spray').length, 1);
    for (const p of products) {
      assert.deepEqual(Object.keys(p.coverage).sort(), parasites.map(p => p.key).sort());
      assert.ok(Object.values(p.coverage).every(value => value.status === 'unverified'));
      assert.equal(p.sources.length, 0);
      assert.equal(p.interval, undefined);
      assert.equal(p.minimumAge, undefined);
    }
  }
  assert.ok(!parasiteProducts.some(p => /Frontline Plus|Frontline Spot|Bravecto Plus/.test(p.name)));
  assert.notEqual(parasiteProducts[0].coverage, parasiteProducts[1].coverage);
});
test('unknown coverage is never labelled full, no match, or missing', () => {
  const result = matchProduct(parasiteProducts[0], ['flea','tick','heartworm']);
  assert.equal(result.group, 'unverified');
  assert.deepEqual(result.missing, []);
  assert.equal(result.unverified.length, 3);
  assert.equal(matchProduct(parasiteProducts[0], []).group, null);
});
test('matching engine separates full, partial, limited, missing and unverified coverage', () => {
  assert.equal(matchProduct(fixture({ flea:'covered', tick:'covered' }), ['flea','tick']).group, 'full');
  const mixed = matchProduct(fixture({ flea:'covered', tick:'partial', tapeworm:'not_covered' }), ['flea','tick','tapeworm','heartworm']);
  assert.equal(mixed.group, 'partial');
  assert.deepEqual(mixed.covered, ['flea']);
  assert.deepEqual(mixed.limited, ['tick']);
  assert.deepEqual(mixed.missing, ['tapeworm']);
  assert.deepEqual(mixed.unverified, ['heartworm']);
  assert.equal(matchProduct(fixture({ flea:'partial' }), ['flea']).group, 'partial');
  assert.equal(matchProduct(fixture({ flea:'not_covered' }), ['flea']).group, 'none');
  assert.equal(matchProduct(fixture({ flea:'not_covered' }), ['flea','tick']).group, 'unverified');
});
test('comparison common/all and differences-only compare exact statuses including unknown', () => {
  const a = fixture({ flea:'covered', tick:'not_covered', earMite:'covered' });
  const b = fixture({ flea:'covered', tick:'partial' });
  assert.equal(comparisonColumns([a,b], false, false).length, 6);
  assert.equal(comparisonColumns([a,b], true, false).length, 9);
  assert.deepEqual(comparisonColumns([a,b], false, true).map(p => p.key), ['tick']);
  assert.deepEqual(comparisonColumns([a,b], true, true).map(p => p.key), ['tick','earMite']);
  assert.equal(comparisonColumns([a,a], true, true).length, 0);
  assert.equal(comparisonColumns([a], true, true).length, 9);
});
test('comparison selection allows removal at limit and species filtering prevents stale rows', () => {
  let ids = [];
  for (const p of parasiteProducts.slice(0,6)) ids = toggleComparison(ids, p.id);
  assert.equal(ids.length, 5);
  ids = toggleComparison(ids, ids[0]);
  assert.equal(ids.length, 4);
  assert.equal(productsForSpecies(parasiteProducts,'cat').filter(p => ids.includes(p.id)).length, 0);
});
test('editing one dataset record updates matching and comparisons without UI product logic', () => {
  const updated = structuredClone(parasiteProducts);
  updated[0].coverage.flea = { status:'covered', notes:'Synthetic test only', sourceIds:['test'] };
  assert.equal(matchProduct(updated[0], ['flea']).group, 'full');
  assert.deepEqual(comparisonColumns(updated.slice(0,2), false, true).map(p => p.key), ['flea']);
  assert.equal(parasiteProducts[0].coverage.flea.status, 'unverified');
});
test('parasite direct route, dashboard navigation and prototype warning render', async () => {
  const {default:worker} = await import('../dist/server/index.js');
  for (const route of ['/', '/calculators/parasite']) {
    const response = await worker.fetch(new Request(`http://localhost${route}`), {ASSETS:{fetch:async()=>new Response('',{status:404})}}, {waitUntil(){},passThroughOnException(){}});
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /href="\/calculators\/parasite"/);
    assert.match(html, /Parasite Selector/);
    if (route !== '/') {
      assert.match(html, /Find Protection/); assert.match(html, /Compare Products/); assert.match(html, /Identify Parasite/);
      assert.match(html, /Client View/); assert.match(html, /Vet View/);
      assert.match(html, /Malaysian product-label information has not yet been verified/);
      assert.match(html, /🐕/); assert.match(html, /🐈/);
      assert.match(html, /Send feedback/);
    }
  }
});

test('matrix renders sticky-table structure, accessible statuses and product details buttons', async () => {
  // Compile the existing TSX in memory; no new runtime or test dependency.
  const moduleUrl = new URL('../calculators/parasite/ParasiteSelector.tsx', import.meta.url);
  const source = await readFile(moduleUrl, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
    .replace(/from "react\/jsx-runtime"/g, `from "${import.meta.resolve('react/jsx-runtime')}"`)
    .replace(/from 'react'/g, `from '${import.meta.resolve('react')}'`)
    .replace(/from '(\.\/[^']+)'/g, (_, path) => `from '${new URL(`${path}.ts`, moduleUrl).href}'`);
  const { ComparisonMatrix } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  const products = [fixture({ flea:'covered', tick:'not_covered' }), {...fixture({ flea:'partial' }), id:'second'}];
  const html = renderToStaticMarkup(createElement(ComparisonMatrix, {products,all:true,differences:false,onDetails(){}}));
  for (const label of ['Covered', 'Not covered', 'Partial / specific indication', 'Unverified']) assert.ok(html.includes(`aria-label="${label}"`));
  assert.match(html, /class="ps-table-scroll" tabindex="0" role="region"/);
  assert.equal((html.match(/scope="col"/g) || []).length,10);
  assert.equal((html.match(/scope="row"/g) || []).length,2);
  assert.equal((html.match(/View details/g) || []).length,2);
  const identical = renderToStaticMarkup(createElement(ComparisonMatrix, {products:[products[0],products[0]],all:true,differences:true,onDetails(){}}));
  assert.match(identical, /No coverage-status differences/);
  assert.doesNotMatch(identical, /<table/);
});
