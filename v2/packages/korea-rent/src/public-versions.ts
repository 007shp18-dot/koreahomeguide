/** Public provenance identifiers used to validate the published Rent Check envelope. */
export const MOLIT_ENDPOINT_VERSION = 'v1' as const;
export const MOLIT_PARSER_VERSION = 'kr-molit-rent-parser-v2' as const;
export const MOLIT_RIGHTS_POLICY_ID = 'kr-molit-rent-v1' as const;

/** Sale data is independently versioned so rental cache entries can never satisfy a sale read. */
export const MOLIT_SALE_ENDPOINT_VERSION = 'v1' as const;
export const MOLIT_SALE_PARSER_VERSION = 'kr-molit-sale-parser-v1' as const;
export const MOLIT_SALE_RIGHTS_POLICY_ID = 'kr-molit-sale-v1' as const;

export const RENT_CHECK_METHODOLOGY_POLICY_ID =
  'kr-rent-check-quote-normalization' as const;
export const RENT_CHECK_METHODOLOGY_VERSION = 1 as const;
export const RENT_CHECK_ANNUAL_DEPOSIT_RATE = 0.05 as const;
