// Generates PWA icons from an inline SVG using sharp (bundled with Next.js)
// Design: LampMark — navy background, gold border, green top stripe, "BL" monogram
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#16294a"/>
      <stop offset="100%" stop-color="#0a1628"/>
    </linearGradient>
    <linearGradient id="stripe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#3CAC3B" stop-opacity="0.9"/>
      <stop offset="60%"  stop-color="#3CAC3B" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#3CAC3B" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="clip">
      <rect width="512" height="512" rx="100" ry="100"/>
    </clipPath>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>

  <!-- Gold border -->
  <rect x="9" y="9" width="494" height="494" rx="94"
        fill="none" stroke="#C9A84C" stroke-width="12"/>

  <!-- Green top stripe (clipped to rounded rect) -->
  <rect x="0" y="0" width="512" height="108"
        fill="url(#stripe)" clip-path="url(#clip)"/>

  <!-- BL monogram — Impact-style heavy condensed -->
  <text x="256" y="355"
        text-anchor="middle"
        dominant-baseline="auto"
        font-family="Impact, 'Arial Narrow', 'Arial Black', Arial, sans-serif"
        font-size="292"
        font-weight="900"
        fill="#C9A84C"
        letter-spacing="-6">BL</text>

  <!-- Text shadow effect (subtle dark layer offset) -->
  <text x="258" y="357"
        text-anchor="middle"
        font-family="Impact, 'Arial Narrow', 'Arial Black', Arial, sans-serif"
        font-size="292"
        font-weight="900"
        fill="#0a1628"
        letter-spacing="-6"
        opacity="0.3"
        style="mix-blend-mode:multiply">BL</text>

  <!-- Bottom gold accent bar -->
  <rect x="178" y="438" width="156" height="10"
        rx="5" fill="#C9A84C" opacity="0.75"/>
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

// favicon (32x32)
await sharp(Buffer.from(svg))
  .resize(32, 32)
  .png()
  .toFile(join(OUT, "..", "favicon-32.png"));
console.log("  ✓ favicon-32.png");

console.log("\nAll icons generated.");
