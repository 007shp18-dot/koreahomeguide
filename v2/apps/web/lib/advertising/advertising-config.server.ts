import 'server-only';

import { operatorProfileFromEnvironment } from '../operator/operator-profile.server';

export type AdvertisingConfig = Readonly<{
  status: 'disabled';
}> | Readonly<{
  status: 'ready';
  publisherId: string;
}>;

const PUBLISHER_ID = /^pub-[0-9]{16}$/;

export function advertisingConfigFromEnvironment(): AdvertisingConfig {
  if (process.env.SIGNEDPRICE_ADSENSE_ENABLED?.trim().toLowerCase() !== 'true') {
    return Object.freeze({ status: 'disabled' });
  }
  const publisherId = process.env.SIGNEDPRICE_ADSENSE_PUBLISHER_ID?.trim() ?? '';
  if (!PUBLISHER_ID.test(publisherId)) {
    return Object.freeze({ status: 'disabled' });
  }
  if (operatorProfileFromEnvironment().status !== 'ready') {
    return Object.freeze({ status: 'disabled' });
  }
  return Object.freeze({ status: 'ready', publisherId });
}
