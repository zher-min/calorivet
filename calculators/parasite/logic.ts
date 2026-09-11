import type { ParasiteKey, Product, Species } from './types.ts';
import { parasites } from './data/parasites.ts';

export const MAX_COMPARE = 5;
export type MatchGroup = 'full' | 'partial' | 'unverified' | 'none';
export function productsForSpecies(products: Product[], species: Species) {
  return products.filter(product => product.species.includes(species));
}
export function matchProduct(product: Product, selected: ParasiteKey[]) {
  const byStatus = (status: string) => selected.filter(key => product.coverage[key].status === status);
  const covered = byStatus('covered');
  const limited = byStatus('partial');
  const missing = byStatus('not_covered');
  const unverified = byStatus('unverified');
  const group: MatchGroup | null = !selected.length ? null
    : covered.length === selected.length ? 'full'
    : covered.length + limited.length > 0 ? 'partial'
    : unverified.length > 0 ? 'unverified' : 'none';
  return { group, covered, limited, missing, unverified };
}
export function comparisonColumns(products: Product[], all: boolean, differencesOnly: boolean) {
  return parasites.filter(parasite => (all || parasite.common) &&
    (!differencesOnly || products.length < 2 || new Set(products.map(p => p.coverage[parasite.key].status)).size > 1));
}
export function toggleComparison(selected: string[], id: string) {
  return selected.includes(id) ? selected.filter(item => item !== id)
    : selected.length < MAX_COMPARE ? [...selected, id] : selected;
}
