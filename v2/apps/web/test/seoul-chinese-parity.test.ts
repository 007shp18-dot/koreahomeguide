import { describe, expect, it } from 'vitest';
import { CONTRACT_CHECK_COPY, PUBLIC_MARKET_COPY, localizedSeoulHref, localizeContractText } from '../lib/locale/product-copy';
import { createEntityCheckHref, parseEntityCheckContext } from '../lib/navigation/explorer-selection';
import { buildSeoulExploreMetadata } from '../lib/public-market/seoul-explore-metadata';

function paths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => paths(entry, `${prefix}.${key}`));
}

describe('Chinese Seoul product parity', () => {
  it('has every English product and contract copy field', () => {
    expect(paths(PUBLIC_MARKET_COPY['zh-CN'])).toEqual(paths(PUBLIC_MARKET_COPY.en));
    expect(paths(CONTRACT_CHECK_COPY['zh-CN'])).toEqual(paths(CONTRACT_CHECK_COPY.en));
    expect(PUBLIC_MARKET_COPY['zh-CN'].area.heroHeading).toContain('保证金');
    expect(localizeContractText('Enter a deposit.', 'zh-CN')).toBe('请输入保证金。');
  });

  it('retains the Chinese building return route through a check handoff', () => {
    const returnTo = '/zh-cn/kr/seoul/explore/gangnam-gu/building-1/?view=split';
    const href = createEntityCheckHref('/zh-cn/kr/seoul/check/', {
      market: 'kr-seoul', entity: 'building-1', returnTo, locale: 'zh-CN',
      selection: { market: 'kr', transaction: 'sale', district: 'gangnam-gu' },
    });
    const query = Object.fromEntries(new URL(href, 'https://signedprice.test').searchParams);
    expect(parseEntityCheckContext(query, { market: 'kr-seoul', entityIds: ['building-1'], locale: 'zh-CN' })?.returnTo).toBe(returnTo);
    expect(parseEntityCheckContext({ ...query, returnTo: '//outside.test/' }, { market: 'kr-seoul', entityIds: ['building-1'], locale: 'zh-CN' })).toBeNull();
    expect(localizedSeoulHref('/kr/seoul/explore/gangnam-gu/building-1/?view=split', 'zh-CN')).toBe(returnTo);
  });

  it('keeps Chinese canonical metadata and the same filter indexing policy', () => {
    const metadata = buildSeoulExploreMetadata('zh-CN', {});
    expect(String(metadata.alternates?.canonical)).toContain('/zh-cn/kr/seoul/explore/');
    expect(metadata.alternates?.languages).toHaveProperty('zh-Hans');
    expect(buildSeoulExploreMetadata('zh-CN', { district: 'gangnam-gu' }).robots).toEqual({ index: false, follow: true });
  });
});
