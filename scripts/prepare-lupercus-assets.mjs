import { copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const logoSvgPath = join(root, 'tools', 'lupercus-library-sync', 'src', 'assets', 'lupercus-logo.svg');
const assetRoot = join(root, 'electron-assets-lupercus');
const iconDir = join(assetRoot, 'icons');

mkdirSync(iconDir, { recursive: true });

try {
  execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' });
} catch {
  console.error('Missing rsvg-convert. Install it with: sudo apt install -y librsvg2-bin');
  process.exit(1);
}

copyFileSync(logoSvgPath, join(assetRoot, 'icon.svg'));
copyFileSync(logoSvgPath, join(iconDir, 'icon.svg'));

for (const size of [16, 32, 48, 64, 128, 256, 512]) {
  execFileSync('rsvg-convert', [
    '-w', String(size),
    '-h', String(size),
    logoSvgPath,
    '-o', join(iconDir, `${size}x${size}.png`),
  ]);
}

execFileSync('rsvg-convert', [
  '-w', '512',
  '-h', '512',
  logoSvgPath,
  '-o', join(assetRoot, 'icon.png'),
]);

console.log('Prepared Lupercus Linux PNG icons in electron-assets-lupercus.');
