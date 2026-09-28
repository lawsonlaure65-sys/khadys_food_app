import sharp from 'sharp';
import fs from 'fs';

const LOGO_URL = 'https://i.ibb.co/h1rgJJMb/1766933626062.jpg';

async function generate() {
  console.log('Downloading official Khady\'s Food logo from:', LOGO_URL);
  const response = await fetch(LOGO_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
  }
  const sourceBuffer = Buffer.from(await response.arrayBuffer());

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }

  // Helper to create standard square icon from the official logo
  async function makeSquarePng(size) {
    return sharp(sourceBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen()
      .png({ quality: 100 })
      .toBuffer();
  }

  async function makeSquareJpg(size) {
    return sharp(sourceBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen()
      .jpeg({ quality: 95 })
      .toBuffer();
  }

  // Helper to create maskable icon with safe-zone padding (76% inner logo on white background)
  async function makeMaskablePng(size) {
    const innerSize = Math.round(size * 0.76);
    const pad = Math.round((size - innerSize) / 2);
    const resizedInner = await sharp(sourceBuffer)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen()
      .toBuffer();

    return sharp(resizedInner)
      .extend({
        top: pad,
        bottom: size - innerSize - pad,
        left: pad,
        right: size - innerSize - pad,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png({ quality: 100 })
      .toBuffer();
  }

  const png32 = await makeSquarePng(32);
  const png64 = await makeSquarePng(64);
  const png180 = await makeSquarePng(180);
  const png192 = await makeSquarePng(192);
  const png512 = await makeSquarePng(512);
  const maskable192 = await makeMaskablePng(192);
  const maskable512 = await makeMaskablePng(512);

  const jpg180 = await makeSquareJpg(180);
  const jpg192 = await makeSquareJpg(192);
  const jpg512 = await makeSquareJpg(512);

  const filesToWrite = [
    ['public/favicon-32x32.png', png32],
    ['public/favicon.png', png64],
    ['public/favicon.ico', png32],
    ['public/apple-touch-icon.png', png180],
    ['public/icon-192.png', png192],
    ['public/icon-512.png', png512],
    ['public/icon-maskable-192.png', maskable192],
    ['public/icon-maskable-512.png', maskable512],
    ['public/logo.png', png512],
    ['public/apple-touch-icon.jpg', jpg180],
    ['public/icon-192.jpg', jpg192],
    ['public/icon-512.jpg', jpg512],
    ['public/logo.jpg', jpg512],
    // Root copies for direct fallback
    ['favicon-32x32.png', png32],
    ['favicon.png', png64],
    ['favicon.ico', png32],
    ['apple-touch-icon.png', png180],
    ['icon-192.png', png192],
    ['icon-512.png', png512],
    ['icon-maskable-192.png', maskable192],
    ['icon-maskable-512.png', maskable512],
    ['logo.png', png512],
    ['apple-touch-icon.jpg', jpg180],
    ['icon-192.jpg', jpg192],
    ['icon-512.jpg', jpg512],
    ['logo.jpg', jpg512],
  ];

  for (const [filePath, buf] of filesToWrite) {
    fs.writeFileSync(filePath, buf);
  }

  console.log('All official Khady\'s Food icons and favicons generated successfully!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
