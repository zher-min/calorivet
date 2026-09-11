import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTransfusionVolume as calculate, calculateMinimumDonorWeight as minimum, calculateDonorCapacity as capacity, weightInKg, roundedVolume, roundedDose, largeVolumeWarning, validateTransfusionInputs } from '../calculators/transfusion/bedside.ts';
import { BEDSIDE, EVIDENCE } from '../calculators/transfusion/clinicalConstants.ts';
const dog = { species: 'dog', weight: '15', unit: 'kg', current: '10', target: '20', productPcv: '40', product: 'wholeBlood' };
const near = (a,b) => assert.ok(Math.abs(a-b) < 1e-9, `${a} != ${b}`);
test('bedside dog example preserves configured EBV and rounds only display', () => {
  const result = calculate(dog).result;
  near(result.volumeMl, 318.75);
  near(result.volumeMl, 15 * EVIDENCE.ebv.dog.value * 10 / 40);
  near(result.volumeMlKg, 21.25);
  assert.equal(roundedVolume(result.volumeMl),319);
  assert.equal(roundedDose(result.volumeMlKg),21.3);
  assert.ok(largeVolumeWarning('wholeBlood',result.volumeMlKg));
});
test('bedside cat mass balance requires measured product PCV', () => {
  near(calculate({...dog,species:'cat',weight:'4',productPcv:'35'}).result.volumeMl,62.85714285714286);
  assert.equal(calculate({...dog,species:'cat',productPcv:''}).result,null);
});
test('kg and lb inputs produce equivalent volumes', () => {
  near(weightInKg(15 * BEDSIDE.poundsPerKg,'lb'),15);
  near(calculate({...dog,weight:15 * BEDSIDE.poundsPerKg,unit:'lb'}).result.volumeMl,calculate(dog).result.volumeMl);
  assert.equal(weightInKg(15,'oz'),null);
});
test('changing current, target, product PCV or species recomputes the result', () => {
  near(calculate({...dog,current:'5'}).result.volumeMl,478.125);
  near(calculate({...dog,target:'25'}).result.volumeMl,478.125);
  near(calculate({...dog,productPcv:'80',product:'pRbc'}).result.volumeMl,159.375);
  near(calculate({...dog,species:'cat'}).result.volumeMl,206.25);
});
test('minimum donor is volume-only and always rounded upwards', () => {
  assert.equal(minimum('dog',450).roundedWeightKg,25);
  assert.equal(minimum('dog',24.1 * 18).roundedWeightKg,25);
  assert.equal(minimum('dog',318.75).roundedWeightKg,18);
  near(minimum('cat',60.1).roundedWeightKg,5.1);
  for (const species of ['dog','cat']) for (const volume of [0.1,1,60,60.1,318.75,450,1000]) assert.ok(minimum(species,volume).roundedWeightKg >= minimum(species,volume).minimumWeightKg);
  assert.equal(minimum('dog',450,'pRbc'),null);
});
test('donor capacity and shortfall are independent of screening eligibility', () => {
  assert.equal(capacity('dog',20,450).maximumCollectionMl,360);
  assert.equal(capacity('dog',20,450).shortfallMl,90);
  assert.equal(capacity('dog',25,450).isMaximumVolumeSufficient,true);
  assert.equal(capacity('cat',5,60).maximumCollectionMl,60);
  assert.equal(capacity('dog',18,318.75).belowScreeningFloor,true);
  assert.equal(capacity('dog',30,150,'pRbc').isMaximumVolumeSufficient,null);
  assert.equal(capacity('dog',30).isMaximumVolumeSufficient,null);
});
test('invalid, absent and cleared inputs always suppress results', () => {
  for (const key of ['weight','current','target','productPcv']) for (const value of ['',0,-1,'invalid',Infinity,NaN]) assert.equal(calculate({...dog,[key]:value}).result,null,`${key}=${value}`);
  for (const key of ['current','target','productPcv']) assert.equal(calculate({...dog,[key]:101}).result,null);
  assert.equal(calculate({...dog,target:10}).result,null);
  assert.equal(calculate({...dog,target:9}).result,null);
  assert.equal(calculate({...dog,species:'bird'}).result,null);
  assert.equal(calculate({...dog,product:'plasma'}).result,null);
  assert.ok(validateTransfusionInputs({...dog,target:10}).target);
  assert.equal(calculate({...dog,weight:1e308}).result,null);
});
test('valid small patients and higher targets are not artificially capped', () => {
  assert.ok(calculate({...dog,weight:0.1}).result.volumeMl > 0);
  assert.ok(calculate({...dog,target:70}).result.volumeMl > 1000);
  assert.equal(roundedVolume(337.5),338);
  assert.equal(largeVolumeWarning('wholeBlood',20),false);
  assert.equal(largeVolumeWarning('pRbc',10.1),true);
});
