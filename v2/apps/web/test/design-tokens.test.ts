import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const webRoot = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const componentsRoot = join(webRoot, 'components');
const appRoot = join(webRoot, 'app');

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
  '--canvas': '#f5f8fc',
  '--surface': '#edf3f9',
  '--surface-strong': '#ffffff',
  '--ink': '#111827',
  '--petrol': '#16243a',
  '--muted': '#5f6d84',
  '--divider': '#cbd5e1',
  '--line': '#e2e8f0',
  '--brand-orange': '#2563d8',
  '--accent': '#2563d8',
  '--accent-soft': '#eaf2ff',
  '--focus-ring': '#2563d8',
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
  it('uses the approved white, navy and accessible blue data-product palette', () => {
    for (const [token, value] of Object.entries(signedPricePalette)) {
      expect(readHexToken(token)).toBe(value);
    }
  });

  it('does not retain the superseded warm-paper palette in first-party CSS', () => {
    const legacyPalette = /#(?:f4f2ec|eae5da|fffdf8|15201f|1c4048|5f625b|98978d|dbd5c6|e05024|b73512|ffe0d4)\b/i;
    const remaining = cssFilesUnder(webRoot).flatMap((file) => {
      const matches = readFileSync(file, 'utf8').match(legacyPalette);
      return matches === null ? [] : [`${file}: ${matches[0]}`];
    });

    expect(remaining).toEqual([]);
  });

  it('keeps the homepage foundation on shared colour and shadow tokens', () => {
    const home = readFileSync(join(componentsRoot, 'home-editorial.module.css'), 'utf8');

    expect(home).toContain('border: 1px solid var(--line)');
    expect(home).toContain('background: var(--surface-strong)');
    expect(home).toContain('box-shadow: var(--shadow-sm)');
  });

  it('keeps brand orange decorative-only in the shared mark', () => {
    const consumers = cssFilesUnder(webRoot).flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return [...source.matchAll(/([^{}]+)\{[^{}]*var\(--brand-orange\)[^{}]*\}/g)].map(
        (match) => `${relative(webRoot, file).replaceAll('\\', '/')}:${match[1]?.trim()}`,
      );
    });

    expect(consumers).toEqual(['app/globals.css:.brand-mark__orange']);
  });

  it('uses soft geometry and quiet structural rules', () => {
    expect(css).toMatch(/--radius:\s*12px;/);
    expect(css).toMatch(/--reading-frame:\s*760px;/);
    expect(css).toMatch(/--content-frame:\s*1120px;/);
    expect(css).toMatch(/--workspace-frame:\s*1320px;/);
    expect(css).toMatch(/--page-gutter:\s*32px;/);
    expect(css).toMatch(/--rule-strong:\s*1px solid var\(--line\);/);
    expect(css).toMatch(/--rule-default:\s*1px solid var\(--line\);/);
    expect(css).toMatch(/--rule-subtle:\s*1px solid var\(--line\);/);
    expect(declarationsFor(css, '.site-header')).toMatchObject({
      'border-bottom': '1px solid var(--line)',
      position: 'sticky',
      top: '0',
      'z-index': '30',
    });
    expect(declarationsFor(css, '.site-header__inner')).toMatchObject({
      width: '100%',
      'min-height': '64px',
      padding: '0 22px',
    });
    expect(declarationsFor(css, '.site-header__product-link')).toMatchObject({
      'min-height': 'var(--control-min)',
    });
    expect(declarationsFor(css, '.intent-tabs')).toMatchObject({
      border: '1px solid var(--line)',
      'border-radius': '12px',
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

  it('uses restrained elevation tokens for interactive and data surfaces', () => {
    expect(css).toMatch(/--shadow-sm:\s*0 2px 8px/);
    expect(css).toMatch(/--shadow-md:\s*0 14px 38px/);
    expect(css).toContain('box-shadow: var(--shadow-sm)');
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
    expect(declarationsFor(css, 'body')['font-family']).toMatch(/^"Archivo", var\(--font-noto-sans-kr\), "Noto Sans KR"/);
    expect(declarationsFor(css, '.brand-wordmark')['font-family']).toBe('"Archivo", sans-serif');
  });

  it('caps product display tracking and keeps body copy readable', () => {
    expect(declarationsFor(css, 'body')).toMatchObject({
      'letter-spacing': 'normal',
      'line-height': '1.65',
    });
    expect(css).toMatch(/--tracking-display:\s*-0\.03em;/);
  });

  it('defines readable semantic type and control tokens', () => {
    expect(css).toMatch(/--evidence-type-body:\s*1rem;/);
    expect(css).toMatch(/--evidence-type-ui:\s*0\.875rem;/);
    expect(css).toMatch(/--text-meta:\s*0\.75rem;/);
    expect(css).toMatch(/--text-control:\s*0\.875rem;/);
    expect(css).toMatch(/--text-ui:\s*1rem;/);
    expect(css).toMatch(/--control-min:\s*44px;/);
  });

  it('keeps newsroom type in the product family and removes decorative blue bars', () => {
    const news = readFileSync(join(componentsRoot, 'newsroom/newsroom.module.css'), 'utf8');
    expect(news).not.toContain("font-family: Georgia");
    expect(news).not.toMatch(/border-left:\s*[45]px solid var\(--review-accent\)/);
    expect(news).toContain('line-height: 1.2;');
  });

  it('keeps public authored font sizes at twelve CSS pixels or larger', () => {
    const violations = [...cssFilesUnder(appRoot), ...cssFilesUnder(componentsRoot)]
      .flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/font-size:\s*([0-9]*\.?[0-9]+)(px|rem)\b/g)]
        .flatMap((match) => {
          const numeric = Number(match[1]);
          const pixels = match[2] === 'rem' ? numeric * 16 : numeric;
          return pixels < 12
            ? [`${relative(webRoot, file)}: ${match[0]}`]
            : [];
        }));

    expect(violations).toEqual([]);
  });

  it('limits authored surface radii to the approved geometry', () => {
    const violations = [...cssFilesUnder(appRoot), ...cssFilesUnder(componentsRoot)]
      .flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/border-radius:\s*([0-9]+)px\b/g)]
        .flatMap((match) => ['0', '8', '12', '999'].includes(match[1] ?? '')
          ? []
          : [`${relative(webRoot, file)}: ${match[0]}`]));

    expect(violations).toEqual([]);
  });

  it('sets a shared 44px minimum block size for interactive controls', () => {
    expect(css).toMatch(/button,\s*input:not\(\[type="hidden"\]\),\s*select,\s*textarea,\s*\[role="button"\]\s*{[\s\S]*?min-block-size:\s*var\(--control-min\);/);
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
