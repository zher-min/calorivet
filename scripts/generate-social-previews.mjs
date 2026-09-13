import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const width = 1200;
const height = 630;

async function makePreview({ logo, background, text, output }) {
  const logoBuffer = await sharp(path.join(root, "public", "brand", logo))
    .trim()
    .resize({ width: 850 })
    .png()
    .toBuffer();
  const logoMetadata = await sharp(logoBuffer).metadata();
  const logoLeft = Math.round((width - logoMetadata.width) / 2);

  const tagline = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="600" y="505" text-anchor="middle" fill="${text}" font-family="Manrope, Segoe UI, Arial, sans-serif" font-size="38" font-weight="650" letter-spacing="-0.5">Clinical support, made simple</text>
  </svg>`);

  await sharp({ create: { width, height, channels: 4, background } })
    .composite([
      { input: logoBuffer, left: logoLeft, top: 140 },
      { input: tagline, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, "public", output));
}

async function main() {
  await makePreview({ logo: "vetslate-logo.svg", background: "#f4f0e7", text: "#344e69", output: "og-light.png" });
  await makePreview({ logo: "vetslate-logo-dark.svg", background: "#0f1c28", text: "#c9d8d6", output: "og-dark.png" });
  await fs.copyFile(path.join(root, "public", "og-light.png"), path.join(root, "public", "og.png"));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
