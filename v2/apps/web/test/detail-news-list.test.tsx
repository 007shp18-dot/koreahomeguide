import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DetailNewsList } from '../components/news/detail-news-list';

describe('detail news locale', () => {
  it('uses the published Korean Seoul index without inventing a translated legacy article', () => {
    const html = renderToStaticMarkup(<DetailNewsList locale="ko" news={[{
      id: 'source-note', title: 'Source article title', summary: 'Original source summary',
      href: '/kr/seoul/news/source-note/', publishedAt: '2026-08-31T00:00:00.000Z',
      evidenceStatus: 'not-applicable', evidenceLine: 'Original evidence disclaimer',
    }]} />);
    expect(html).toContain('href="/ko/news?market=seoul"');
    expect(html).toContain('서울 소식 모두 보기');
    expect(html).toContain('href="/kr/seoul/news/source-note"');
    for (const label of ['Source article title', 'Original source summary', 'Original evidence disclaimer', '영문']) expect(html).toContain(label);
    expect(html).not.toContain('/ko/kr/seoul/news');
    expect(html).not.toContain('Our data:');
  });

  it('keeps English as the default and localizes the empty state without substituting stories', () => {
    const english = renderToStaticMarkup(<DetailNewsList news={[]} />);
    const korean = renderToStaticMarkup(<DetailNewsList locale="ko" news={[]} />);
    expect(english).toContain('href="/kr/seoul/news"');
    expect(korean).toContain('이 조건에 맞는 검증된 소식이 없습니다. 확인되지 않은 수치를 대신 표시하지 않습니다.');
    expect(korean).not.toContain('No evidence-ready brief');
  });
});
