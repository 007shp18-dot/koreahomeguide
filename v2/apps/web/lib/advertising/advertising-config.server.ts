import 'server-only';

import { operatorProfileFromEnvironment } from '../operator/operator-profile.server';
import { SIGNEDPRICE_ADSENSE_PUBLISHER_ID } from './adsense-publisher';

export type AdvertisingConfig = Readonly<{
  status: 'disabled';
}> | Readonly<{
  status: 'ready';
  publisherId: string;
}>;

export function advertisingConfigFromEnvironment(): AdvertisingConfig {
  if (process.env.SIGNEDPRICE_ADSENSE_ENABLED?.trim().toLowerCase() !== 'true') {
    return Object.freeze({ status: 'disabled' });
  }
  if (operatorProfileFromEnvironment().status !== 'ready') {
    return Object.freeze({ status: 'disabled' });
  }
  return Object.freeze({
    status: 'ready',
    publisherId: SIGNEDPRICE_ADSENSE_PUBLISHER_ID,
  });
}
