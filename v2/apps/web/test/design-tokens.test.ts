import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const webRoot = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const componentsRoot = join(webRoot, 'components');

function cssFilesUnder(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return cssFilesUnder(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

function readHexToken(name: string, seen = new Set<string>()): string {
  if (seen.has(name)) throw new Error(`Circular color token ${name}`);
  seen.add(name);

  const declaration = css.match(
    new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6}|var\\((--[a-z-]+)\\))`),
  );
  if (!declaration?.[1]) {
    throw new Error(`Missing color token ${name}`);
  }

  return declaration[2] === undefined
    ? declaration[1]
    : readHexToken(declaration[2], seen);
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

const signedPricePalette = {
  '--canvas': '#f4f2ec',
  '--surface': '#eae5da',
  '--surface-strong': '#fffdf8',
  '--ink': '#15201f',
  '--petrol': '#1c4048',
  '--muted': '#5f625b',
  '--divider': '#98978d',
  '--line': '#dbd5c6',
  '--brand-orange': '#e05024',
  '--accent': '#b73512',
  '--accent-soft': '#ffe0d4',
  '--focus-ring': '#b73512',
} as const;

const componentHexLiteralAllowList = {
  'contract-check/contract-check.module.css': ['#b42318', '#b42318'],
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

describe('signedprice brand foundation', () => {
  it('uses the approved warm-paper, deep-green and accessible accent palette', () => {
    for (const [token, value] of Object.entries(signedPricePalette)) {
      expect(readHexToken(token)).toBe(value);
    }
  });

  it('does not retain the superseded gray and cobalt site palette in first-party CSS', () => {
    const legacyPalette = /#(?:f3f2f2|201e1d|1f1e1d|5d5958|8c8a89|1d4ed8|dbe4ff|fff(?:fff)?)\b/i;
    const remaining = cssFilesUnder(webRoot).flatMap((file) => {
      const matches = readFileSync(file, 'utf8').match(legacyPalette);
      return matches === null ? [] : [`${file}: ${matches[0]}`];
    });

    expect(remaining).toEqual([]);
  });

  it('allows raw component hex only for the error state', () => {
    const authoredLiterals = Object.fromEntries(
      cssFilesUnder(componentsRoot).flatMap((file) => {
        const literals = readFileSync(file, 'utf8').match(/#[0-9a-fA-F]{3,8}\b/g);
        return literals === null ? [] : [[relative(componentsRoot, file), literals]];
      }),
    );

    expect(authoredLiterals).toEqual(componentHexLiteralAllowList);
  });

  it('keeps brand orange decorative-only in the shared mark', () => {
    const consumers = cssFilesUnder(webRoot).flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return [...source.matchAll(/([^{}]+)\{[^{}]*var\(--brand-orange\)[^{}]*\}/g)].map(
        (match) => `${relative(webRoot, file)}:${match[1]?.trim()}`,
      );
    });

    expect(consumers).toEqual(['app/globals.css:.brand-mark__orange']);
  });

  it('keeps geometry square and structural rules two pixels wide', () => {
    expect(css).toMatch(/--radius:\s*0px;/);
    expect(css).toMatch(/--reading-frame:\s*760px;/);
    expect(css).toMatch(/--content-frame:\s*1120px;/);
    expect(css).toMatch(/--workspace-frame:\s*1320px;/);
    expect(css).toMatch(/--page-gutter:\s*32px;/);
    expect(css).toMatch(/--rule-strong:\s*2px solid var\(--ink\);/);
    expect(css).toMatch(/--rule-default:\s*1px solid var\(--divider\);/);
    expect(css).toMatch(/--rule-subtle:\s*1px solid var\(--line\);/);
    expect(declarationsFor(css, '.site-header')).toMatchObject({
      'border-bottom': 'var(--rule-strong)',
      position: 'sticky',
      top: '0',
      'z-index': '30',
    });
    expect(declarationsFor(css, '.site-header__inner')).toMatchObject({
      width: 'min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))',
      padding: '0',
    });
    expect(declarationsFor(css, '.site-header__market-link')).toMatchObject({
      'min-height': '44px',
    });
    expect(declarationsFor(css, '.site-header__product-link')).toMatchObject({
      'min-height': '56px',
    });
    expect(declarationsFor(css, '.intent-tabs')).toMatchObject({
      border: '2px solid var(--ink)',
      'border-radius': 'var(--radius)',
    });
  });

  it('provides explicit reading, standard, and workspace frames', () => {
    expect(declarationsFor(css, '.reading-shell')).toMatchObject({
      width: 'min(calc(100% - (2 * var(--page-gutter))), var(--reading-frame))',
      'margin-inline': 'auto',
    });
    expect(declarationsFor(css, '.site-shell')).toMatchObject({
      width: 'min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))',
      'margin-inline': 'auto',
    });
    expect(declarationsFor(css, '.workspace-shell')).toMatchObject({
      width: 'min(calc(100% - (2 * var(--page-gutter))), var(--workspace-frame))',
      'margin-inline': 'auto',
    });
  });

  it('keeps authored shadows structural instead of decorative', () => {
    const authoredShadows = cssFilesUnder(webRoot).flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return [...source.matchAll(/box-shadow:\s*([^;]+);/g)].map((match) => ({
        file: relative(webRoot, file),
        value: match[1]?.trim(),
      }));
    });

    expect(authoredShadows.every(({ value }) => (
      value === 'none' || value?.startsWith('inset ')
    ))).toBe(true);
  });

  it('uses tabular numerals throughout the product surface', () => {
    expect(declarationsFor(css, 'body')).toMatchObject({
      'font-variant-numeric': 'tabular-nums',
    });
  });

  it('uses bundled Archivo consistently for Latin UI and the wordmark', () => {
    expect(css).not.toMatch(/fonts\.googleapis\.com/i);
    expect(css).toMatch(/@font-face\s*{[\s\S]*?font-family:\s*"Archivo"/);
    expect(css).toContain('/fonts/archivo-latin-wght-normal.woff2');
    expect(declarationsFor(css, 'body')['font-family']).toMatch(/^"Archivo", "Pretendard"/);
    expect(declarationsFor(css, '.brand-wordmark')['font-family']).toBe('"Archivo", sans-serif');
  });

  it('caps product display tracking and keeps body copy readable', () => {
    expect(declarationsFor(css, 'body')).toMatchObject({
      'letter-spacing': 'normal',
      'line-height': '1.6',
    });
    expect(css).toMatch(/--tracking-display:\s*-0\.03em;/);
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
  it('keeps every authored outline two pixels while permitting audited local contrast', () => {
    const authoredOutlines = [
      ...css.matchAll(/outline:\s*(\d+)px solid ([^;]+);/g),
    ].map((match) => ({
      width: match[1]?.trim(),
      color: match[2]?.trim(),
    }));

    expect(authoredOutlines).not.toHaveLength(0);
    expect(authoredOutlines.every((outline) => outline.width === '2')).toBe(true);
    expect(authoredOutlines.map((outline) => outline.color)).toEqual(
      expect.arrayContaining(['var(--focus-ring)', 'var(--ink)']),
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
