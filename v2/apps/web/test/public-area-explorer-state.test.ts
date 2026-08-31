import { describe, expect, it } from 'vitest';

import {
  areaExplorerReducer,
  type AreaExplorerState,
} from '../lib/public-market/area-explorer-state';

const districtSlugs = ['jongno-gu', 'gangnam-gu', 'mapo-gu'] as const;

function state(): AreaExplorerState {
  return Object.freeze({
    selectedSlug: 'jongno-gu',
    districtSlugs: Object.freeze([...districtSlugs]),
  });
}

describe('public area Explorer selection state', () => {
  it('uses one selection action for map and row controls', () => {
    const initial = state();
    const fromMap = areaExplorerReducer(initial, {
      type: 'select', slug: 'gangnam-gu',
    });
    const fromRow = areaExplorerReducer(initial, {
      type: 'select', slug: 'gangnam-gu',
    });

    expect(fromMap).toEqual(fromRow);
    expect(fromMap.selectedSlug).toBe('gangnam-gu');
    expect(fromMap.districtSlugs).toBe(initial.districtSlugs);
    expect(Object.isFrozen(fromMap)).toBe(true);
  });

  it('preserves identity for repeat or unknown selection', () => {
    const initial = state();
    expect(areaExplorerReducer(initial, {
      type: 'select', slug: 'jongno-gu',
    })).toBe(initial);
    expect(areaExplorerReducer(initial, {
      type: 'select', slug: 'unknown-gu',
    })).toBe(initial);
  });
});
