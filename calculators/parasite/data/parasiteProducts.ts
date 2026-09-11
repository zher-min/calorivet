import type { Product, ParasiteCoverage, ParasiteKey, Species } from '../types.ts';
import { parasites } from './parasites.ts';

// Clinic inventory only, not evidence of Malaysian registration or indications.
// Edit these records to add verified Malaysian label data. Do not infer claims
// from another country, similarly named product, species, or ingredient alone.
// Add sources with jurisdiction, URL and verifiedDate; link each coverage entry
// via sourceIds. Optional product details must be verified before populating.
const unknownCoverage = (): Record<ParasiteKey, ParasiteCoverage> => Object.fromEntries(
  parasites.map(({ key }) => [key, { status: 'unverified' }]),
) as Record<ParasiteKey, ParasiteCoverage>;
const seed = (id: string, name: string, species: Species): Product => ({
  id, name, species: [species], coverage: unknownCoverage(), sources: [],
});

export const parasiteProducts: Product[] = [
  seed('dog-nexgard', 'NexGard', 'dog'),
  seed('dog-nexgard-spectra', 'NexGard Spectra', 'dog'),
  seed('dog-heartgard-plus', 'HeartGard Plus', 'dog'),
  seed('dog-advocate', 'Advocate', 'dog'),
  seed('dog-frontline-spray', 'Frontline Spray', 'dog'),
  seed('dog-prazitel-plus', 'Prazitel Plus', 'dog'),
  seed('dog-drontal-plus', 'Drontal Plus', 'dog'),
  seed('cat-advocate', 'Advocate', 'cat'),
  seed('cat-nexgard-combo', 'NexGard Combo', 'cat'),
  seed('cat-revolution-plus', 'Revolution Plus', 'cat'),
  seed('cat-bravecto', 'Bravecto Spot-On for Cats', 'cat'),
  seed('cat-advantage', 'Advantage', 'cat'),
  seed('cat-frontline-spray', 'Frontline Spray', 'cat'),
  seed('cat-drontal', 'Drontal Cat', 'cat'),
];
