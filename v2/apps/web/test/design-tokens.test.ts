import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

function readHexToken(name: string): string {
  const declaration = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!declaration?.[1]) {
    throw new Error(`Missing six-digit color token ${name}`);
  }

  return declaration[1];
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const normalTextPairs = [
  ['--ink', '--canvas'],
  ['--ink', '--surface'],
  ['--ink', '--surface-strong'],
  ['--muted', '--canvas'],
  ['--muted', '--surface'],
  ['--muted', '--surface-strong'],
  ['--accent', '--canvas'],
  ['--accent', '--surface'],
  ['--accent', '--surface-strong'],
  ['--available-ink', '--surface'],
  ['--blocked', '--canvas'],
  ['--blocked', '--surface'],
  ['--blocked', '--surface-strong'],
] as const;

const focusAdjacentBackgrounds = [
  '--canvas',
  '--surface',
  '--surface-strong',
] as const;

describe('signedprice normal-text design tokens', () => {
  for (const [foregroundName, backgroundName] of normalTextPairs) {
    it(`${foregroundName} meets WCAG AA on ${backgroundName}`, () => {
      const ratio = contrastRatio(
        readHexToken(foregroundName),
        readHexToken(backgroundName),
      );

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('signedprice focus indicator', () => {
  it('uses the contrast-tested opaque focus token for every authored outline', () => {
    const authoredOutlineColors = [...css.matchAll(/outline:\s*3px solid ([^;]+);/g)].map(
      (match) => match[1]?.trim(),
    );

    expect(authoredOutlineColors).not.toHaveLength(0);
    expect(authoredOutlineColors).toEqual(
      authoredOutlineColors.map(() => 'var(--focus-ring)'),
    );
  });

  for (const backgroundName of focusAdjacentBackgrounds) {
    it(`--focus-ring meets non-text contrast on ${backgroundName}`, () => {
      const ratio = contrastRatio(
        readHexToken('--focus-ring'),
        readHexToken(backgroundName),
      );

      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  }
});
