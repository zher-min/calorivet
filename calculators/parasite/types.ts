export type Species = 'dog' | 'cat';
export type CoverageStatus = 'covered' | 'partial' | 'not_covered' | 'unverified';
export type ParasiteKey = 'flea' | 'tick' | 'earMite' | 'mangeMite' | 'heartworm' | 'roundworm' | 'hookworm' | 'whipworm' | 'tapeworm';
export interface ParasiteCoverage {
  status: CoverageStatus;
  indicationType?: 'treat' | 'prevent' | 'control' | 'treat_and_prevent';
  notes?: string;
  sourceIds?: string[];
}
export interface ProductSource {
  id: string;
  jurisdiction: string;
  title: string;
  url?: string;
  verifiedDate?: string;
}
export interface Product {
  id: string;
  name: string;
  species: Species[];
  activeIngredients?: string[];
  formulation?: string;
  route?: string;
  interval?: string;
  minimumAge?: string;
  minimumWeight?: string;
  pregnancyLactation?: string;
  notes?: string;
  coverage: Record<ParasiteKey, ParasiteCoverage>;
  warnings?: { title: string; description: string; severity: 'info' | 'caution' | 'important' }[];
  sources: ProductSource[];
}
