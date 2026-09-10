const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const files = ['styles.css', 'cold-start.css', 'experience-capture.css', 'move-commerce.css'];

function declarationValues(css) {
  const withoutRoot = css.replace(/:root\s*\{[^}]*\}/g, '');
  return [...withoutRoot.matchAll(/(?:^|[;{])\s*[-\w]+\s*:\s*([^;}]+)/gm)].map(match => match[1].trim());
}

test('site CSS keeps literal colors in the shared token definitions only', () => {
  const violations = [];
  for (const file of files) {
    for (const value of declarationValues(fs.readFileSync(file, 'utf8'))) {
      if (/#[0-9a-f]{3,8}\b|(?:rgb|hsl)a?\(/i.test(value)) violations.push(`${file}: ${value}`);
    }
  }
  assert.deepEqual(violations, []);
});

test('site CSS uses only the three radius tokens, zero, or a true circle', () => {
  const violations = [];
  const allowedPart = /^(?:0|50%|999px|var\(--radius-(?:sm|md|lg)\))$/;
  for (const file of files) {
    const css = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(css, /--radius-(?:card|action)\s*:/, file);
    for (const match of css.matchAll(/border-radius\s*:\s*([^;}]+)/g)) {
      const parts = match[1].trim().split(/\s+/);
      if (!parts.every(part => allowedPart.test(part))) violations.push(`${file}: ${match[1].trim()}`);
    }
  }
  assert.deepEqual(violations, []);
});
