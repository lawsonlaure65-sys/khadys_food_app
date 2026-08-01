import sharp from 'sharp';
import fs from 'fs';

const svgLogo = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" rx="64" fill="#FFFFFF" />
  
  <g transform="translate(10, 10)">
    <!-- Right side: Brown Circle with Fork and Spoon -->
    <g transform="translate(330, 246)">
      <!-- Circle background -->
      <circle cx="0" cy="0" r="115" fill="#3E2723" />
      
      <!-- Fork (Left inside circle) -->
      <g transform="translate(-42, -55) scale(1.4)">
        <!-- Tines -->
        <path d="M 8,0 L 8,24 C 8,32 14,38 22,38 L 22,70 C 22,73 24,75 27,75 C 30,75 32,73 32,70 L 32,38 C 40,38 46,32 46,24 L 46,0 L 38,0 L 38,20 L 31,0 L 23,0 L 16,20 L 16,0 Z" fill="#FFFFFF" />
      </g>
      
      <!-- Spoon (Right inside circle) -->
      <g transform="translate(12, -55) scale(1.4)">
        <!-- Bowl and handle -->
        <path d="M 18,0 C 6,0 0,14 0,28 C 0,38 8,43 14,45 L 14,70 C 14,73 16,75 19,75 C 22,75 24,73 24,70 L 24,45 C 30,43 38,38 38,28 C 38,14 30,0 18,0 Z" fill="#FFFFFF" />
      </g>
    </g>

    <!-- Left side: Khady's Food Typography -->
    <g transform="translate(50, 230)">
      <!-- Main "Khady's" Cursive Text -->
      <text x="0" y="20" font-family="'Caveat', 'Dancing Script', 'Brush Script MT', 'Pacifico', 'Comic Sans MS', cursive" font-size="115" font-weight="bold" fill="#3E2723" font-style="italic">Khady's</text>
      <!-- Subtext "Food" -->
      <text x="110" y="62" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#3E2723" letter-spacing="8">FOOD</text>
    </g>
  </g>
</svg>
`;

async function generate() {
  const buffer = Buffer.from(svgLogo);

  // 512x512 PNG
  await sharp(buffer)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');

  // 192x192 PNG
  await sharp(buffer)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');

  // Apple touch icon
  await sharp(buffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  // Logo PNG & JPG
  await sharp(buffer)
    .resize(512, 512)
    .png()
    .toFile('public/logo.png');

  await sharp(buffer)
    .resize(512, 512)
    .jpeg({ quality: 95 })
    .toFile('public/logo.jpg');

  await sharp(buffer)
    .resize(192, 192)
    .jpeg({ quality: 95 })
    .toFile('public/icon-192.jpg');

  await sharp(buffer)
    .resize(512, 512)
    .jpeg({ quality: 95 })
    .toFile('public/icon-512.jpg');

  await sharp(buffer)
    .resize(180, 180)
    .jpeg({ quality: 95 })
    .toFile('public/apple-touch-icon.jpg');

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
