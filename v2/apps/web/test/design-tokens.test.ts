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

const modernistPalette = {
  '--ink': '#201e1d',
  '--canvas': '#f3f2f2',
  '--surface': '#eae9e9',
  '--accent': '#1d4ed8',
  '--divider': '#8c8a89',
} as const;

function declarationsFor(source: string, selector: string): Record<string, string> {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  if (!rule?.[1]) {
    throw new Error(`Missing CSS rule ${selector}`);
  }

  return Object.fromEntries(
    rule[1]
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(':');
        return [
          declaration.slice(0, separator).trim(),
          declaration.slice(separator + 1).trim(),
        ];
      }),
  );
}

describe('signedprice Modernist foundation', () => {
  it('uses the approved ink, ground, surface, cobalt and divider palette', () => {
    for (const [token, value] of Object.entries(modernistPalette)) {
      expect(readHexToken(token)).toBe(value);
    }
  });

  it('keeps geometry square and structural rules two pixels wide', () => {
    expect(css).toMatch(/--radius:\s*0px;/);
    expect(declarationsFor(css, '.site-header')).toMatchObject({
      'border-bottom': '2px solid var(--ink)',
      position: 'sticky',
      top: '0',
      'z-index': '30',
    });
    expect(declarationsFor(css, '.site-header__inner')).toMatchObject({
      padding: '15px 40px',
    });
    expect(declarationsFor(css, '.intent-tabs')).toMatchObject({
      border: '2px solid var(--ink)',
      'border-radius': 'var(--radius)',
    });
  });

  it('uses tabular numerals throughout the product surface', () => {
    expect(declarationsFor(css, 'body')).toMatchObject({
      'font-variant-numeric': 'tabular-nums',
    });
  });

  it('uses the bundled Archivo family without a runtime Google Fonts request', () => {
    expect(css).not.toMatch(/fonts\.googleapis\.com/i);
    expect(declarationsFor(css, 'body')['font-family']).toMatch(/^"Archivo"/);
  });
});

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
  it('uses a two-pixel opaque cobalt focus token for every authored outline', () => {
    const authoredOutlines = [
      ...css.matchAll(/outline:\s*(\d+)px solid ([^;]+);/g),
    ].map((match) => ({
      width: match[1]?.trim(),
      color: match[2]?.trim(),
    }));

    expect(authoredOutlines).not.toHaveLength(0);
    expect(authoredOutlines).toEqual(
      authoredOutlines.map(() => ({ width: '2', color: 'var(--focus-ring)' })),
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
