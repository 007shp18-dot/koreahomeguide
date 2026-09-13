import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { buildSavedPlaces, SavedPlacesView } from '../components/global-shortlist/saved-cities';
import { defaults } from '../lib/global-shortlist/model';
import { DEFAULT_FILTERS } from '../lib/seoul-shortlist/model';

it('uses one saved-place view for every city and keeps the agreed order', () => {
  const html = renderToStaticMarkup(<SavedPlacesView locale="ko" city="all" onCityChange={() => {}} places={[
    { market:'tokyo', key:'tokyo-place', name:'Ebisu' }, { market:'seoul', key:'seoul-place', name:'서울 아파트' },
  ]} />);
  expect(html).toContain('서울 아파트'); expect(html).toContain('Ebisu');
  const nav = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
  const order = ['서울','싱가포르','두바이','도쿄'].map(name => nav.indexOf(name));
  expect(order.every(index => index >= 0)).toBe(true);
  expect(order).toEqual([...order].sort((a,b) => a-b));
  expect(html).toContain('/ko/jp/tokyo/shortlist');
});
it('offers a localized next step instead of a blank saved screen', () => {
  const html=renderToStaticMarkup(<SavedPlacesView locale="zh-CN" city="tokyo" onCityChange={() => {}} places={[]} />);
  expect(html).toContain('尚未收藏');
  expect(html).toContain('href="/zh-cn/jp/tokyo/shortlist');
});

it('keeps Chinese Seoul review links on the saved-management task', () => {
 const html=renderToStaticMarkup(<SavedPlacesView locale="zh-CN" city="seoul" onCityChange={() => {}} places={[{market:'seoul',key:'building',name:'Example'}]} />);
 expect(html).toMatch(/href="\/zh-cn\/kr\/seoul\/shortlist\/?#saved-title"/);
 expect(html).not.toContain('/kr/seoul/explore');
});

it('counts reviewed properties in the same city filters and opens their actual details', () => {
  const places = buildSavedPlaces({ globalRaw: '', seoulRaw: '', reviewRaw: JSON.stringify(['jp-park-city-toyosu', 'ae-valia']), locale: 'ko' });
  expect(places.map(place => place.market)).toEqual(['tokyo', 'dubai']);
  const html = renderToStaticMarkup(<SavedPlacesView locale="ko" city="all" onCityChange={() => {}} places={places} />);
  const nav = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
  expect(nav).toContain('전체 <span>2</span>');
  expect(nav).toContain('도쿄 <span>1</span>');
  expect(nav).toContain('두바이 <span>1</span>');
  expect(html).toMatch(/href="\/ko\/jp\/tokyo\/explore\/properties\/jp-park-city-toyosu\/?#property-review"/);
  expect(html).toMatch(/href="\/ko\/ae\/dubai\/explore\/projects\/ae-valia\/?#property-review"/);
  expect(html).not.toContain('관심 있는 곳부터 모아보세요');
  expect(html).toContain('aria-label="단지 저장 해제:');
  expect(html).toContain('data-research-note="tokyo:jp-park-city-toyosu"');
  const filtered = renderToStaticMarkup(<SavedPlacesView locale="ko" city="dubai" onCityChange={() => {}} places={places} />);
  expect(filtered).toContain('ae-valia');
  expect(filtered).not.toContain('jp-park-city-toyosu');
});

it('preserves saved budget candidates and Seoul note identities while adding review bookmarks', () => {
  const globalRaw = JSON.stringify({ version: 1, filters: { singapore: defaults('singapore'), dubai: defaults('dubai'), tokyo: defaults('tokyo') }, places: [{ market: 'tokyo', key: '13113/ebisu', name: 'Ebisu budget candidate', signature: 'a'.repeat(64), checkedAt: '2026-09-13T00:00:00Z' }] });
  const seoulRaw = JSON.stringify({ version: 1, filters: DEFAULT_FILTERS, buildings: [{ key: 'gangnam-gu/existing', name: 'Existing Seoul home', signatures: [], checkedAt: '2026-09-13T00:00:00Z' }] });
  const places = buildSavedPlaces({ globalRaw, seoulRaw, reviewRaw: JSON.stringify(['sg-marina-one-residences']), locale: 'en' });
  expect(places).toHaveLength(3);
  expect(places[0]).toMatchObject({ market: 'seoul', key: 'gangnam-gu/existing', name: 'Existing Seoul home' });
  expect(places[1]).toMatchObject({ market: 'tokyo', key: '13113/ebisu', name: 'Ebisu budget candidate' });
  const html = renderToStaticMarkup(<SavedPlacesView locale="en" city="all" onCityChange={() => {}} places={places} />);
  expect(html).toContain('data-research-note="seoul:gangnam-gu/existing"');
  expect(html).toContain('data-research-note="tokyo:13113/ebisu"');
  expect(html).toMatch(/href="\/jp\/tokyo\/shortlist\/?#saved-title"/);
  expect(html).toMatch(/href="\/sg\/singapore\/explore\/ccr\/[^"#]+\/?#property-review"/);
  expect(places[2]).not.toHaveProperty('checkedAt');
  expect(places[2]).not.toHaveProperty('signature');
});

it('retains a retired property bookmark for removal and accepts all 100 review IDs', () => {
  const ids = Array.from({ length: 100 }, (_, index) => `jp-retired-property-${index}`);
  const places = buildSavedPlaces({ globalRaw: '', seoulRaw: '', reviewRaw: JSON.stringify(ids), locale: 'zh-CN' });
  expect(places).toHaveLength(100);
  expect(places[0]).toMatchObject({ market: 'tokyo', reviewId: ids[0], name: '该住宅目前不可用' });
  const html = renderToStaticMarkup(<SavedPlacesView locale="zh-CN" city="tokyo" onCityChange={() => {}} places={places.slice(0, 1)} />);
  expect(html).toContain('取消住宅收藏');
  expect(html).not.toContain('尚未收藏');
});
