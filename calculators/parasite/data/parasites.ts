import type { ParasiteKey } from '../types.ts';

// Translation-ready names; keys are internal categories, not species-level claims.
export const parasites: { key: ParasiteKey; group: 'ecto' | 'endo'; common: boolean; label: string; short: string }[] = [
  { key: 'flea', group: 'ecto', common: true, label: 'Flea', short: 'Flea' },
  { key: 'tick', group: 'ecto', common: true, label: 'Tick', short: 'Tick' },
  { key: 'earMite', group: 'ecto', common: false, label: 'Ear mite', short: 'Ear' },
  { key: 'mangeMite', group: 'ecto', common: false, label: 'Mange / skin mites', short: 'Skin' },
  { key: 'heartworm', group: 'endo', common: true, label: 'Heartworm', short: 'HW' },
  { key: 'roundworm', group: 'endo', common: true, label: 'Roundworm', short: 'Round' },
  { key: 'hookworm', group: 'endo', common: true, label: 'Hookworm', short: 'Hook' },
  { key: 'whipworm', group: 'endo', common: false, label: 'Whipworm', short: 'Whip' },
  { key: 'tapeworm', group: 'endo', common: true, label: 'Tapeworm', short: 'Tape' },
];
