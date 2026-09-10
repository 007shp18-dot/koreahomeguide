import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {articleFromRow} from '../lib/content/content-repository.server';
describe('published database timestamps',()=>{
 it('accepts Neon Date values and preserves the publication gate',()=>{
  const row={slug:'new-story',title:'A new story',summary:'A summary',body_markdown:'Article body',locale:'en',content_type:'data-story',market_id:null,published_at:new Date('2026-09-10T00:00:00Z'),updated_at:new Date('2026-09-10T00:00:00Z'),reviewed_at:new Date('2026-09-09T00:00:00Z'),reviewed_by:'editor',evidence_state:'not-applicable',sources:[]};
  expect(articleFromRow(row)?.publishedAt).toBe('2026-09-10T00:00:00.000Z');
  expect(articleFromRow({...row,reviewed_by:null})).toBeNull();
  expect(articleFromRow({...row,evidence_state:'withdrawn'})).toBeNull();
 });
});
