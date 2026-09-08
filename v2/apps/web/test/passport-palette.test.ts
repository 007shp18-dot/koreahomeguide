import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps Passport actions and focus states on the shared site palette', () => {
  const css = readFileSync(new URL('../components/passport/passport.module.css', import.meta.url), 'utf8');
  expect(css).not.toContain('#1557d5');
  expect(css).toContain('background:var(--accent)');
  expect(css).toContain('outline:2px solid var(--accent)');
});
