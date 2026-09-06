import {expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ResultLinkCopy,copyCurrentResultLink,currentSameOriginResultUrl} from '../components/contract-check/result-link-copy';
it('copies a same-origin result without its fragment',async()=>{
 const writeText=vi.fn(async()=>{}); const location={origin:'https://www.signedprice.com',href:'https://www.signedprice.com/kr/seoul/check/?submitted=1#result'};
 expect(await copyCurrentResultLink({location,clipboard:{writeText}})).toEqual({status:'copied',url:'https://www.signedprice.com/kr/seoul/check/?submitted=1'});
 expect(writeText).toHaveBeenCalledOnce();
});
it('keeps a selectable link when clipboard access fails',async()=>{
 const location={origin:'https://www.signedprice.com',href:'https://www.signedprice.com/kr/seoul/check/?submitted=1'};
 expect((await copyCurrentResultLink({location})).status).toBe('manual');
 expect((await copyCurrentResultLink({location,clipboard:{writeText:async()=>{throw Error('denied');}}})).url).toBe(location.href);
 expect(currentSameOriginResultUrl({...location,href:'https://evil.test'})).toBeNull();
 expect(renderToStaticMarkup(<ResultLinkCopy locale="ko" tool="single-quote"/>)).toContain('aria-live="polite"');
});
