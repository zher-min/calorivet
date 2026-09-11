// Development-only asset generator; PNG files are committed, no runtime dependency.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../public/icons/vettools-logo.jpg', import.meta.url));
// Preserve the supplied artwork; add safe-zone padding for Android maskable icons.
for (const [name, size] of [['vettools-192',192],['vettools-512',512],['vettools-maskable-512',512],['vettools-apple-touch-icon',180]]) {
  const inset = name.includes('maskable') ? 76 : 0;
  await sharp(source).resize(size - inset * 2, size - inset * 2, { fit: 'contain', background: '#ffffff' })
    .extend({ top: inset, bottom: inset, left: inset, right: inset, background: '#ffffff' })
    .png().toFile(fileURLToPath(new URL(`../public/icons/${name}.png`, import.meta.url)));
}
