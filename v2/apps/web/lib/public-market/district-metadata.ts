import type { Metadata } from 'next';

import type { PublicDistrictModel } from './area-route-types';
import { indexableMetadata, publicCanonical } from '../public-metadata';

export function buildDistrictMetadata(
  model: PublicDistrictModel,
  options: Readonly<{ indexPublished?: boolean; evidence?: 'sale' | 'jeonse' }> = {},
): Metadata {
  const sale = options.evidence === 'sale';
  const description = sale
    ? `Reported sale-price distribution, building evidence and source coverage for ${model.identity.nameEn}.`
    : model.status === 'published'
      ? `${model.display.medianLabel} median from ${model.display.sampleLabel} for 45–55㎡ refundable jeonse deposits.`
    : model.status === 'withheld'
      ? `${model.display.sampleLabel} met the fixed filter; monetary evidence is not published.`
      : 'Verified district summary unavailable; no city figure is substituted.';
  const title = `${model.identity.nameEn} ${sale ? 'sale' : 'jeonse'} evidence | signedprice`;
  if (model.status === 'published' && options.indexPublished === true) {
    return indexableMetadata({
      path: `/kr/seoul/explore/${model.identity.slug}/`,
      title,
      description,
    });
  }
  const metadata: Metadata = {
    title,
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
