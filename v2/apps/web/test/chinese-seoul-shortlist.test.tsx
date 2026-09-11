import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import Page from '../app/(zh-cn)/zh-cn/kr/seoul/shortlist/page';
import { languageDestinations } from '../lib/navigation/site-navigation';
it('provides Chinese budget search and saved management on the same shared page',()=>{
 const html=renderToStaticMarkup(<Page/>);
 expect(html).toContain('住宅筛选条件'); expect(html).toContain('收藏住宅');
 expect(html).toContain('从下方结果收藏住宅'); expect(html).toContain('江南区');
 expect(html).toContain('name="budget"'); expect(html).toContain('name="minArea"');
 expect(html).toContain('id="saved-title"');
 expect(languageDestinations('/kr/seoul/shortlist/')['zh-CN']).toBe('/zh-cn/kr/seoul/shortlist/');
});
