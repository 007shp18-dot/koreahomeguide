import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({query:vi.fn(),save:vi.fn(),revalidate:vi.fn(),parse:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidate,revalidateTag:vi.fn()}));
vi.mock('../lib/db/postgres.server',()=>({contentDatabase:()=>({query:mocks.query})}));
vi.mock('../lib/insights/content-article-store.server',()=>({saveEditorialArticle:mocks.save}));
vi.mock('../app/api/internal/content-articles/route',()=>({parseEditorialArticleInput:mocks.parse}));
import {publishDueEditorial,publicationPaths} from '../lib/operations/editorial-publication.server';
beforeEach(()=>{vi.resetAllMocks();mocks.query.mockResolvedValue([]);mocks.parse.mockReturnValue({slug:'new-story',locale:'en',contentType:'data-story'});});
describe('editorial publication worker',()=>{
 it('does no publication or cache writes when no articles are due',async()=>{expect(await publishDueEditorial()).toEqual([]);expect(mocks.save).not.toHaveBeenCalled();expect(mocks.revalidate).not.toHaveBeenCalled();});
 it('publishes then refreshes only article, list and editorial sitemap',async()=>{mocks.query.mockResolvedValueOnce([{id:'1',state:'publishing',payload:{}}]);await publishDueEditorial();expect(mocks.save).toHaveBeenCalledTimes(1);expect(mocks.revalidate.mock.calls.map(x=>x[0])).toEqual(['/news/','/news/new-story/','/editorial-sitemap.xml']);});
 it('recovers a cache refresh failure without saving the article twice',async()=>{mocks.query.mockResolvedValueOnce([{id:'1',state:'refreshing',payload:{}}]);await publishDueEditorial();expect(mocks.save).not.toHaveBeenCalled();expect(mocks.revalidate).toHaveBeenCalledTimes(3);});
 it('rejects an invalid queued payload without publishing',async()=>{mocks.query.mockResolvedValueOnce([{id:'1',state:'publishing',payload:{}}]);mocks.parse.mockReturnValue(null);await publishDueEditorial();expect(mocks.save).not.toHaveBeenCalled();expect(mocks.query.mock.calls[1]?.[0]).toContain("state='failed'");});
 it('isolates Korean cache paths',()=>{expect(publicationPaths({locale:'ko',slug:'new-story',contentType:'data-story'})).toEqual(['/ko/news/','/ko/news/new-story/','/editorial-sitemap.xml']);});
});
