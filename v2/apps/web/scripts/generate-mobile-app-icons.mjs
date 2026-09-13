import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';

// Use Next's existing image dependency; no additional application dependency.
const require = createRequire(import.meta.url);
const fromNext = createRequire(require.resolve('next/package.json'));
const sharp = fromNext('sharp');
const directory = new URL('../public/app-icons/', import.meta.url);
await mkdir(directory, { recursive: true });
// Geometry from components/brand-mark.tsx, using the current semantic colors.
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 48 48"><rect width="48" height="48" fill="#ffffff"/><g transform="translate(8 8)" fill="none" stroke-linecap="square"><path d="M4 9 L28 23" stroke="#111827" stroke-width="5.5"/><path d="M4 23 L28 9" stroke="#ffffff" stroke-width="10"/><path d="M4 23 L28 9" stroke="#2563d8" stroke-width="5.5"/></g></svg>';
for (const size of [180, 192, 512]) {
  const filename = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  await writeFile(new URL(filename, directory), await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer());
}
