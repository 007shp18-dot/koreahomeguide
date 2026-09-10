import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('../lib/content/content-repository.server',()=>({getPublishedContent:async()=>null,listPublishedContent:async()=>[]}));
import {listPortfolioRecords} from '../content/portfolio-manifest';
import {getNewsroomArticle} from '../lib/content/newsroom-content.server';
describe('existing Korean policy routes',()=>{
 it('keeps every compiled Korean policy reachable through the newsroom lookup',async()=>{
  const articles=listPortfolioRecords('ko').filter(a=>a.type==='policy-update');expect(articles.length).toBeGreaterThan(0);
  for(const article of articles)expect((await getNewsroomArticle(article.slug,'ko'))?.canonicalHref).toBe(article.canonicalHref);
 });
});
