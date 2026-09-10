const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const body = css.replace(/:root\{[\s\S]*?\}/, '');

test('shared neutral colors use the root design tokens', () => {
  for (const color of ['#475569', '#64748b', '#94a3b8', '#fff', '#f8fafc']) {
    assert.doesNotMatch(body, new RegExp(`${color}(?![0-9a-f])`, 'i'), `${color} should use a design token`);
  }
});

test('component corner radii use the shared radius scale', () => {
  const declarations = [...body.matchAll(/border-radius:([^;}]+)/g)].map(([, value]) => value.trim());
  const allowedPart = /^(?:0|50%|999px|var\(--radius-(?:sm|md|lg|card|action)\))$/;

  for (const declaration of declarations) {
    for (const part of declaration.split(/\s+/)) {
      assert.match(part, allowedPart, `unsupported radius in "${declaration}"`);
    }
  }
});
