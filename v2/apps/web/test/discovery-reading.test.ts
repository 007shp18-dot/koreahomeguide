import { expect, it } from 'vitest';
import { discoveryReading, storyExploreLink } from '../lib/discovery/reading';
import { NEIGHBOURHOOD_STORIES } from '../content/neighbourhood-stories';

it('connects actual existing neighbourhood articles and city guides without loading a remote feed', () => {
  for (const market of ['seoul', 'singapore', 'dubai', 'tokyo'] as const) {
    const links = discoveryReading(market, 'ko');
    expect(links).toHaveLength(2);
    const slug = links[0]!.href.split('/').filter(Boolean).at(-1);
    expect(NEIGHBOURHOOD_STORIES.some(story => story.slug === slug && story.city === market)).toBe(true);
    expect(links[1]!.href).toBe(`/ko/news/city-stories/${market}/where/`);
  }
});
it('keeps Chinese navigation on existing Chinese pages, not untranslated article routes', () => {
  const links = discoveryReading('dubai', 'zh-CN');
  expect(links.map(link => link.href)).toEqual(['/zh-cn/news/?market=dubai', '/zh-cn/ae/dubai/shortlist/']);
});
it('uses explicit article scopes and labels the broader coverage where no exact publication exists', () => {
  expect(storyExploreLink('seochon', 'seoul', 'ko')).toEqual({ href: '/ko/kr/seoul/explore/?district=jongno-gu', label: '종로구 실거래 살펴보기' });
  expect(storyExploreLink('yanaka', 'tokyo', 'en').href).toContain('city=13106&neighbourhood=%E8%B0%B7%E4%B8%AD');
  expect(storyExploreLink('kichijoji', 'tokyo', 'ko')).toEqual({ href: '/ko/jp/tokyo/explore/', label: '도쿄 23구의 공개 실거래 살펴보기' });
  expect(storyExploreLink('unknown', 'dubai', 'ko').href).toBe('/ko/ae/dubai/explore/');
});
