import 'server-only';

import { listPublicPropertyTypeRouteParams } from '../public-market/property-type-route-model.server';

export type PublicRouteLocale = 'en' | 'ko';
export type PublicRoutePageKind =
  | 'home'
  | 'utility'
  | 'market'
  | 'check'
  | 'explore'
  | 'rankings'
  | 'news'
  | 'guide';
export type PublicRouteCohort = 0 | 1 | 2;

export type PublicRouteReadiness = Readonly<{
  summaryReady?: boolean;
  areaReady?: boolean;
  newsReady?: boolean;
}>;

export type PublicRouteDefinition = Readonly<{
  path: string;
  locale: PublicRouteLocale;
  pageKind: PublicRoutePageKind;
  cohort: PublicRouteCohort;
  sitemap: boolean;
  isReady: (readiness: PublicRouteReadiness) => boolean | undefined;
  legacySourcePath?: string;
}>;

export type PublicRouteMigrationCandidate = Readonly<{
  sourcePath: string;
  targetPath: string;
  cohort: PublicRouteCohort;
  locale: PublicRouteLocale;
}>;

export type PublicRouteRegistry = Readonly<{
  listReady(readiness: PublicRouteReadiness): readonly PublicRouteDefinition[];
  listSitemapPaths(readiness: PublicRouteReadiness): readonly string[];
  listMigrationCandidates(
    readiness: PublicRouteReadiness,
  ): readonly PublicRouteMigrationCandidate[];
}>;

const canonicalPathPattern = /^\/(?:$|[a-z0-9][a-z0-9\-/]*\/)$/;

function assertPath(path: string, label: string): void {
  if (!canonicalPathPattern.test(path) || path.includes('//')) {
    throw new TypeError(`Invalid ${label}: ${path}`);
  }
}

export function createPublicRouteRegistry(
  definitions: readonly PublicRouteDefinition[],
): PublicRouteRegistry {
  const canonicalPaths = new Set<string>();
  const legacySourcePaths = new Set<string>();
  const routes = definitions.map((definition) => {
    assertPath(definition.path, 'canonical path');
    if (canonicalPaths.has(definition.path)) {
      throw new TypeError(`Duplicate SignedPrice canonical path: ${definition.path}`);
    }
    canonicalPaths.add(definition.path);
    if (definition.legacySourcePath !== undefined) {
      assertPath(definition.legacySourcePath, 'legacy source path');
      if (legacySourcePaths.has(definition.legacySourcePath)) {
        throw new TypeError(
          `Duplicate KoreaHomeGuide source path: ${definition.legacySourcePath}`,
        );
      }
      legacySourcePaths.add(definition.legacySourcePath);
    }
    return Object.freeze({ ...definition });
  });

  return Object.freeze({
    listReady(readiness: PublicRouteReadiness): readonly PublicRouteDefinition[] {
      return Object.freeze(routes.filter(({ isReady }) => isReady(readiness) === true));
    },
    listSitemapPaths(readiness: PublicRouteReadiness): readonly string[] {
      return Object.freeze(routes
        .filter(({ sitemap, isReady }) => sitemap && isReady(readiness) === true)
        .map(({ path }) => path));
    },
    listMigrationCandidates(
      readiness: PublicRouteReadiness,
    ): readonly PublicRouteMigrationCandidate[] {
      return Object.freeze(routes.flatMap((definition) => (
        definition.isReady(readiness) === true && definition.legacySourcePath !== undefined
          ? [Object.freeze({
              sourcePath: definition.legacySourcePath,
              targetPath: definition.path,
              cohort: definition.cohort,
              locale: definition.locale,
            })]
          : []
      )));
    },
  });
}

const alwaysReady = () => true;
const summaryReady = (readiness: PublicRouteReadiness) => readiness.summaryReady;
const areaReady = (readiness: PublicRouteReadiness) => readiness.areaReady;
const newsReady = (readiness: PublicRouteReadiness) => readiness.newsReady;

export const signedPricePublicRouteRegistry = createPublicRouteRegistry([
  {
    path: '/', locale: 'en', pageKind: 'home', cohort: 0,
    sitemap: true, isReady: alwaysReady,
  },
  {
    path: '/compare/', locale: 'en', pageKind: 'utility', cohort: 0,
    sitemap: true, isReady: alwaysReady,
  },
  {
    path: '/trust/', locale: 'en', pageKind: 'utility', cohort: 0,
    sitemap: true, isReady: alwaysReady,
  },
  {
    path: '/kr/seoul/check/', locale: 'en', pageKind: 'check', cohort: 1,
    sitemap: true, isReady: alwaysReady,
    legacySourcePath: '/tools/seoul-rent-check/',
  },
  {
    path: '/kr/seoul/', locale: 'en', pageKind: 'market', cohort: 0,
    sitemap: true, isReady: summaryReady,
  },
  {
    path: '/kr/check/seoul/', locale: 'en', pageKind: 'check', cohort: 0,
    sitemap: true, isReady: summaryReady,
  },
  {
    path: '/kr/seoul/explore/', locale: 'en', pageKind: 'explore', cohort: 1,
    sitemap: true, isReady: areaReady, legacySourcePath: '/explore/',
  },
  {
    path: '/kr/seoul/rankings/', locale: 'en', pageKind: 'rankings', cohort: 0,
    sitemap: true, isReady: areaReady,
  },
  {
    path: '/ko/kr/seoul/explore/', locale: 'ko', pageKind: 'explore', cohort: 0,
    sitemap: true, isReady: areaReady,
  },
  {
    path: '/ko/kr/seoul/rankings/', locale: 'ko', pageKind: 'rankings', cohort: 0,
    sitemap: true, isReady: areaReady,
  },
  {
    path: '/kr/seoul/news/', locale: 'en', pageKind: 'news', cohort: 0,
    sitemap: true, isReady: newsReady,
  },
  {
    path: '/kr/seoul/guide/', locale: 'en', pageKind: 'guide', cohort: 1,
    sitemap: true, isReady: alwaysReady, legacySourcePath: '/guides/',
  },
  {
    path: '/ko/kr/seoul/', locale: 'ko', pageKind: 'market', cohort: 0,
    sitemap: true, isReady: alwaysReady,
  },
  {
    path: '/ko/kr/seoul/check/', locale: 'ko', pageKind: 'check', cohort: 0,
    sitemap: true, isReady: alwaysReady,
  },
]);

export function listSignedPricePropertyTypeRoutes(): readonly PublicRouteDefinition[] {
  const registry = createPublicRouteRegistry(listPublicPropertyTypeRouteParams().map((route) => ({
    path: `/kr/seoul/explore/${route.district}/${route.propertyType}/`,
    locale: 'en',
    pageKind: 'explore',
    cohort: 2,
    sitemap: true,
    isReady: alwaysReady,
    legacySourcePath: `/rent/${route.district}/${route.propertyType}/`,
  })));
  return registry.listReady({});
}
