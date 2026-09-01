export {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  RENT_CHECK_ANNUAL_DEPOSIT_RATE,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
} from './public-versions';

export const RENT_CHECK_METHODOLOGY_CACHE_VERSION = 2 as const;

export const RENT_CHECK_COVERAGE_NAMESPACE_VERSION =
  'kr-seoul-rent-coverage-v2' as const;
export const SOURCE_PAGE_CACHE_KIND = 'kr-molit-rent-source-page-v2' as const;
export const SOURCE_MANIFEST_CACHE_KIND = 'kr-molit-rent-source-manifest-v2' as const;
export const DERIVED_RENT_CHECK_CACHE_KIND = 'kr-seoul-rent-check-derived-v2' as const;
