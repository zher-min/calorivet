// Development-only asset generator; PNG files are committed, no runtime dependency.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../public/icons/vetcalc.svg', import.meta.url));
for (const [name, size] of [['vetcalc-192',192],['vetcalc-512',512],['vetcalc-maskable-512',512],['apple-touch-icon',180]]) {
  await sharp(source).resize(size,size).png().toFile(fileURLToPath(new URL(`../public/icons/${name}.png`, import.meta.url)));
}
