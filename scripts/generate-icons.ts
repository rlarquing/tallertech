/**
 * Generate PWA icons using sharp
 * Run: bun run scripts/generate-icons.ts
 */
import sharp from 'sharp';

const SIZE_192 = 192;
const SIZE_512 = 512;

async function generateIcon(size: number, outputPath: string) {
  // Create a simple wrench + phone icon in emerald green
  const padding = Math.round(size * 0.1);
  const innerSize = size - padding * 2;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#059669"/>
    <g transform="translate(${padding}, ${padding}) scale(${innerSize / 100})" fill="white">
      <!-- Wrench icon -->
      <path d="M20 6c0-3.3-2.7-6-6-6-1.8 0-3.4.8-4.5 2L42.5 29c1.1-1.2 2.7-2 4.5-2 3.3 0 6 2.7 6 6 0 1.8-.8 3.4-2 4.5L18.5 72c-1.1 1.2-2.7 2-4.5 2-3.3 0-6-2.7-6-6 0-1.8.8-3.4 2-4.5L40 29.5C38.8 28.3 38 26.7 38 25c0-1.8.8-3.4 2-4.5L72 44.5c1.2 1.2 2 2.8 2 4.5 0 3.3-2.7 6-6 6-1.8 0-3.4-.8-4.5-2L29.5 21c1.2-1.1 2-2.7 2-4.5 0-1.8-.8-3.4-2-4.5z" opacity="0"/>
      <!-- Phone outline -->
      <rect x="28" y="5" width="44" height="90" rx="8" fill="none" stroke="white" stroke-width="4"/>
      <circle cx="50" cy="84" r="4" fill="white"/>
      <rect x="36" y="14" width="28" height="4" rx="2" fill="white" opacity="0.6"/>
      <!-- Wrench overlay -->
      <path d="M65 25 L75 15 C78 12 78 7 75 4 L73 2 C70 -1 65 -1 62 2 L52 12 L56 16 L52 20 L56 24 L60 20 L65 25Z" fill="white" opacity="0.9"/>
      <path d="M12 52 L8 56 C5 59 5 64 8 67 L10 69 C13 72 18 72 21 69 L25 65 L21 61 L25 57 L21 53 L17 57 L12 52Z" fill="white" opacity="0.9"/>
      <!-- Gear accent -->
      <circle cx="50" cy="52" r="12" fill="none" stroke="white" stroke-width="3" opacity="0.8"/>
      <circle cx="50" cy="52" r="5" fill="white" opacity="0.8"/>
    </g>
  </svg>`;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath} (${size}x${size})`);
}

async function main() {
  try {
    await generateIcon(SIZE_192, 'public/icon-192.png');
    await generateIcon(SIZE_512, 'public/icon-512.png');
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
