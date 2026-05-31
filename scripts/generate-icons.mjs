// Generates PWA icons from an inline SVG using sharp (bundled with Next.js)
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

// SVG: green soccer ball on dark background
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- background circle -->
  <circle cx="256" cy="256" r="256" fill="#0a1628"/>
  <!-- outer ball -->
  <circle cx="256" cy="256" r="170" fill="#f3f6fb" stroke="#e0e6ef" stroke-width="4"/>
  <!-- center pentagon -->
  <polygon points="256,148 313,190 291,256 221,256 199,190" fill="#1a2f4a"/>
  <!-- top-left patch -->
  <polygon points="162,178 199,190 191,148 152,158" fill="#1a2f4a"/>
  <!-- top-right patch -->
  <polygon points="350,178 313,190 321,148 360,158" fill="#1a2f4a"/>
  <!-- bottom-left patch -->
  <polygon points="176,330 221,256 176,240 148,285" fill="#1a2f4a"/>
  <!-- bottom-right patch -->
  <polygon points="336,330 291,256 336,240 364,285" fill="#1a2f4a"/>
  <!-- bottom patch -->
  <polygon points="256,364 221,256 291,256 256,364" fill="#1a2f4a"/>
  <!-- green ring -->
  <circle cx="256" cy="256" r="170" fill="none" stroke="#3CAC3B" stroke-width="10"/>
  <!-- Copa 2026 text -->
  <text x="256" y="430" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
        font-size="38" font-weight="900" fill="#3CAC3B" letter-spacing="1">COPA 2026</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(join(OUT, `icon-${size}x${size}.png`));
  console.log(`  ✓ icon-${size}x${size}.png`);
}

// Apple touch icon (180x180)
await sharp(Buffer.from(svg))
  .resize(180, 180)
  .png()
  .toFile(join(OUT, "apple-touch-icon.png"));
console.log("  ✓ apple-touch-icon.png");

// favicon (32x32) in public root
await sharp(Buffer.from(svg))
  .resize(32, 32)
  .png()
  .toFile(join(__dirname, "..", "public", "favicon-32.png"));
console.log("  ✓ favicon-32.png");

console.log("\nAll icons generated in public/icons/");
