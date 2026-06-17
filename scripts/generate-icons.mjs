/**
 * Generates all PWA icon sizes from public/icon.svg using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const svgPath = join(PUBLIC, "icon.svg");
const svgBuffer = readFileSync(svgPath);

// All sizes needed for a complete PWA + Apple icon set
const SIZES = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

// Maskable icon: add ~20% padding so the icon graphic sits in the safe zone
// Android uses this for adaptive icons (may clip to circle/squircle)
const MASKABLE_SIZES = [192, 512];
const MASKABLE_PADDING_RATIO = 0.12; // 12% padding on each side

async function generateIcon(size, outputPath) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  console.log(`  ✓ ${outputPath.replace(ROOT, "")}`);
}

async function generateMaskableIcon(size, outputPath) {
  const padding = Math.round(size * MASKABLE_PADDING_RATIO);
  const innerSize = size - padding * 2;

  // Render inner icon at the target inner size
  const inner = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  // Compose onto a solid indigo square background with padding
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 99, g: 102, b: 241, alpha: 1 }, // #6366f1
    },
  })
    .composite([{ input: inner, top: padding, left: padding }])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`  ✓ ${outputPath.replace(ROOT, "")} (maskable)`);
}

async function run() {
  console.log("Generating BalanceBuddy PWA icons...\n");

  // Standard icons
  for (const size of SIZES) {
    await generateIcon(size, join(PUBLIC, `icon-${size}x${size}.png`));
  }

  // Overwrite the legacy file names the manifest currently references
  await generateIcon(192, join(PUBLIC, "icon-192x192.png"));
  await generateIcon(512, join(PUBLIC, "icon-512x512.png"));

  // Maskable icons (for Android adaptive icon)
  for (const size of MASKABLE_SIZES) {
    await generateMaskableIcon(
      size,
      join(PUBLIC, `icon-${size}x${size}-maskable.png`)
    );
  }

  // Apple touch icon (180px, no alpha – Apple ignores transparency)
  await sharp(svgBuffer)
    .resize(180, 180)
    .flatten({ background: { r: 99, g: 102, b: 241 } }) // fill transparent with brand color
    .png({ compressionLevel: 9 })
    .toFile(join(PUBLIC, "apple-touch-icon.png"));
  console.log("  ✓ /apple-touch-icon.png");

  // Favicon (ICO-compatible 32×32 PNG at minimum)
  await generateIcon(32, join(PUBLIC, "favicon-32x32.png"));
  await generateIcon(16, join(PUBLIC, "favicon-16x16.png"));

  console.log("\nAll icons generated successfully.");
}

run().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
