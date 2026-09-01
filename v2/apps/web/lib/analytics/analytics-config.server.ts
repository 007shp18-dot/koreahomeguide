import 'server-only';

const SIGNEDPRICE_GA4_MEASUREMENT_ID = 'G-KWHQXKY40N';

export type AnalyticsConfig =
  | Readonly<{ status: 'disabled' }>
  | Readonly<{ status: 'ready'; measurementId: string }>;

export function analyticsConfigFromEnvironment(): AnalyticsConfig {
  if (process.env.SIGNEDPRICE_GA4_ENABLED?.trim().toLowerCase() === 'false') {
    return { status: 'disabled' };
  }

  const measurementId =
    process.env.SIGNEDPRICE_GA4_MEASUREMENT_ID?.trim() || SIGNEDPRICE_GA4_MEASUREMENT_ID;
  if (!measurementId || !/^G-[A-Z0-9]{6,20}$/.test(measurementId)) {
    return { status: 'disabled' };
  }

  return { status: 'ready', measurementId };
}
