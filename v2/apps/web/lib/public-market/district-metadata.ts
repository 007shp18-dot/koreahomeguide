import type { Metadata } from 'next';

import type { PublicDistrictModel } from './area-route-types';

export function buildDistrictMetadata(model: PublicDistrictModel): Metadata {
  const description = model.status === 'published'
    ? `${model.display.medianLabel} median from ${model.display.sampleLabel} for 45–55㎡ refundable jeonse deposits.`
    : model.status === 'withheld'
      ? `${model.display.sampleLabel} met the fixed filter; monetary evidence is not published.`
      : 'Verified district summary unavailable; no city figure is substituted.';
  return {
    title: `${model.identity.nameEn} jeonse evidence | signedprice`,
    description,
    robots: { index: false, follow: true },
  };
}
