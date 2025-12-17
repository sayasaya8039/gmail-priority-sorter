/**
 * アイコン生成スクリプト
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'icons');

// アイコンのSVGテンプレート
const createIconSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38BDF8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7DD3FC;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
  <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.5}" fill="white">📧</text>
</svg>
`;

// 絵文字を使わないシンプルなバージョン
const createSimpleIconSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38BDF8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7DD3FC;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
  <!-- メールアイコン -->
  <g transform="translate(${size * 0.15}, ${size * 0.25})">
    <rect x="0" y="0" width="${size * 0.7}" height="${size * 0.5}" rx="${size * 0.05}" fill="white"/>
    <path d="M0,${size * 0.05} L${size * 0.35},${size * 0.25} L${size * 0.7},${size * 0.05}"
          stroke="#38BDF8" stroke-width="${size * 0.04}" fill="none"/>
  </g>
  <!-- 優先度バッジ -->
  <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.15}" fill="#EF4444"/>
  <text x="${size * 0.78}" y="${size * 0.27}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white">!</text>
</svg>
`;

async function generateIcons() {
  try {
    await mkdir(iconsDir, { recursive: true });

    const sizes = [16, 48, 128];

    for (const size of sizes) {
      const svg = createSimpleIconSvg(size);
      const outputPath = join(iconsDir, `icon${size}.png`);

      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

      console.log(`Generated: icon${size}.png`);
    }

    console.log('アイコン生成完了！');
  } catch (error) {
    console.error('アイコン生成エラー:', error);
    process.exit(1);
  }
}

generateIcons();
