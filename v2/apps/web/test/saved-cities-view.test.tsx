import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { SavedPlacesView } from '../components/global-shortlist/saved-cities';

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
