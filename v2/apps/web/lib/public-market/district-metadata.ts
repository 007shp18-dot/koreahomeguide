import type { Metadata } from 'next';

import type { PublicDistrictModel } from './area-route-types';
import { indexableMetadata, publicCanonical } from '../public-metadata';

export function buildDistrictMetadata(
  model: PublicDistrictModel,
  options: Readonly<{ indexPublished?: boolean }> = {},
): Metadata {
  const description = model.status === 'published'
    ? `${model.display.medianLabel} median from ${model.display.sampleLabel} for 45–55㎡ refundable jeonse deposits.`
    : model.status === 'withheld'
      ? `${model.display.sampleLabel} met the fixed filter; monetary evidence is not published.`
      : 'Verified district summary unavailable; no city figure is substituted.';
  if (model.status === 'published' && options.indexPublished === true) {
    return indexableMetadata({
      path: `/kr/seoul/explore/${model.identity.slug}/`,
      title: `${model.identity.nameEn} jeonse evidence | signedprice`,
      description,
    });
  }
  const metadata: Metadata = {
    title: `${model.identity.nameEn} jeonse evidence | signedprice`,
    description,
    robots: {
      index: false,
      follow: true,
    },
  };
  if (model.status === 'published') {
    metadata.alternates = {
      canonical: publicCanonical(`/kr/seoul/explore/${model.identity.slug}/`),
    };
  }
  return metadata;
}
