import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPublicRouteRegistry,
  type PublicRouteDefinition,
  type PublicRouteReadiness,
} from '../lib/seo/public-route-registry.server';

const ready = () => true;
const areaReady = (state: PublicRouteReadiness) => state.areaReady;
const conversionReady = (state: PublicRouteReadiness) => state.conversionReady;

function route(
  overrides: Partial<PublicRouteDefinition> = {},
): PublicRouteDefinition {
  return {
    path: '/',
    locale: 'en',
    pageKind: 'home',
    cohort: 0,
    sitemap: true,
    isReady: ready,
    ...overrides,
  };
}

describe('SignedPrice public route registry', () => {
  it('keeps evidence-dependent destinations out until their readiness predicate passes', () => {
    const registry = createPublicRouteRegistry([
      route(),
      route({
        path: '/kr/seoul/check/',
        pageKind: 'check',
        isReady: conversionReady,
      }),
      route({
        path: '/kr/seoul/explore/',
        pageKind: 'explore',
        legacySourcePath: '/explore/',
        isReady: areaReady,
      }),
    ]);

    expect(registry.listSitemapPaths({
      areaReady: false,
      conversionReady: false,
    })).toEqual(['/']);
    expect(registry.listSitemapPaths({
      areaReady: true,
      conversionReady: true,
    })).toEqual([
      '/',
      '/kr/seoul/check/',
      '/kr/seoul/explore/',
    ]);
    expect(registry.listMigrationCandidates({ areaReady: true })).toEqual([
      {
        sourcePath: '/explore/',
        targetPath: '/kr/seoul/explore/',
        cohort: 0,
        locale: 'en',
      },
    ]);
  });

  it('rejects duplicate canonical paths and duplicate legacy source paths', () => {
    expect(() => createPublicRouteRegistry([
      route(),
      route({ path: '/', pageKind: 'utility' }),
    ])).toThrow('Duplicate SignedPrice canonical path: /');

    expect(() => createPublicRouteRegistry([
      route({ path: '/kr/seoul/check/', legacySourcePath: '/tools/seoul-rent-check/' }),
      route({
        path: '/kr/seoul/explore/',
        pageKind: 'explore',
        legacySourcePath: '/tools/seoul-rent-check/',
      }),
    ])).toThrow('Duplicate KoreaHomeGuide source path: /tools/seoul-rent-check/');
  });

  it('rejects malformed canonical and legacy paths before they reach a sitemap or redirect', () => {
    expect(() => createPublicRouteRegistry([
      route({ path: '/kr/seoul/check' as '/kr/seoul/check/' }),
    ])).toThrow('Invalid canonical path: /kr/seoul/check');

    expect(() => createPublicRouteRegistry([
      route({ legacySourcePath: 'https://koreahomeguide.com/explore/' as '/explore/' }),
    ])).toThrow('Invalid legacy source path: https://koreahomeguide.com/explore/');
  });
});
