export type BsaSpecies = "dog" | "cat";

export const BSA_CONSTANTS: Record<BsaSpecies, number> = {
  dog: 0.101,
  cat: 0.1,
};

export function calculateBSA(
  weightKg: number,
  species: BsaSpecies,
): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return null;
  }

  return BSA_CONSTANTS[species] * Math.pow(weightKg, 2 / 3);
}
