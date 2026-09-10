import { describe, expect, it } from 'vitest';

import { hasComputedVisibleFocus } from './e2e/focus-contract';

describe('computed visible focus contract', () => {
  it('requires visible computed outline or shadow paint', () => {
    expect(hasComputedVisibleFocus({
      boxShadow: 'none',
      outlineColor: 'rgb(26, 82, 204)',
      outlineStyle: 'solid',
      outlineWidth: '2px',
    })).toBe(true);
    expect(hasComputedVisibleFocus({
      boxShadow: 'none',
      outlineColor: 'rgba(0, 0, 0, 0)',
      outlineStyle: 'none',
      outlineWidth: '0px',
    })).toBe(false);
  });
});
