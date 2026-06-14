import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const logoSvgPath = join(root, 'tools', 'lupercus-library-sync', 'src', 'assets', 'lupercus-logo.svg');
const svg = readFileSync(logoSvgPath, 'utf8');
const assetRoot = join(root, 'electron-assets-lupercus');
const iconDir = join(assetRoot, 'icons');

mkdirSync(iconDir, { recursive: true });
writeFileSync(join(assetRoot, 'icon.svg'), svg);
writeFileSync(join(iconDir, 'icon.svg'), svg);
writeFileSync(join(iconDir, 'scalable.svg'), svg);
copyFileSync(logoSvgPath, join(iconDir, 'lupercus-library-sync.svg'));

console.log('Prepared Lupercus Linux app SVG icons in electron-assets-lupercus.');
