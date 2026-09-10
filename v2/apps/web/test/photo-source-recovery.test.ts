import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {commonsFileTitle,parseRecoveredSource,recoverPhotoSources} from '../lib/photos/photo-source-recovery.server';
const asset='https://upload.wikimedia.org/wikipedia/commons/a/ab/Building.jpg';
const page=(license='https://creativecommons.org/licenses/by-sa/4.0/')=>({title:'File:Building.jpg',imageinfo:[{url:asset,descriptionurl:'https://commons.wikimedia.org/wiki/File:Building.jpg',width:1200,height:800,extmetadata:{Artist:{value:'Photographer'},LicenseUrl:{value:license},ImageDescription:{value:'Building exterior'}}}]});
it('resolves only Wikimedia Commons file paths, never arbitrary CDN filenames',()=>{
 expect(commonsFileTitle(asset)).toBe('File:Building.jpg');
 expect(commonsFileTitle('https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Building.jpg/960px-Building.jpg')).toBe('File:Building.jpg');
 expect(commonsFileTitle('https://upload.wikimedia.org/wikipedia/en/a/ab/Building.jpg')).toBeNull();
 expect(commonsFileTitle('https://example.com/Building.jpg')).toBeNull();
});
it('requires the exact asset identity and separates restricted licences',()=>{
 expect(parseRecoveredSource(asset,page())).toMatchObject({reusable:true,author:'Photographer'});
 expect(parseRecoveredSource(asset,page('https://creativecommons.org/licenses/by-nc/4.0/'))).toMatchObject({reusable:false});
 expect(parseRecoveredSource(asset.replace('Building','Other'),page())).toBeNull();
});
it('recovers source metadata while preserving pending visual review',async()=>{
 const query=vi.fn(async(s:string)=>s.startsWith('SELECT asset_url')?[{asset_url:asset}]:[{enriched:4}]);
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({query:{pages:{1:page()}}})));
 expect(await recoverPhotoSources({query},fetcher)).toEqual({checked:1,recovered:1,enriched:4});
 const statement=query.mock.calls.find(([s])=>s.includes('WITH recovered'))?.[0]??'';
 expect(statement).toContain("p.status IN ('candidate','review_required')");expect(statement).not.toContain("status='approved'");
});
it('records retry instead of treating provider failures as missing sources',async()=>{
 const query=vi.fn(async(s:string)=>s.startsWith('SELECT asset_url')?[{asset_url:asset}]:[]);
 expect(await recoverPhotoSources({query},vi.fn().mockRejectedValue(new Error('offline')))).toMatchObject({checked:1,recovered:0});
 expect(query.mock.calls.some(([s])=>s.includes("state='retry'"))).toBe(true);
});
