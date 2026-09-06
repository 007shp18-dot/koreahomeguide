import {expect,it} from 'vitest';
import {createEntityCheckHref,parseEntityCheckContext} from '../lib/navigation/explorer-selection';
it.each(['en','ko'] as const)('preserves the matching locale and rejects cross-locale return links: %s',locale=>{
 const prefix=locale==='ko'?'/ko':'';
 const href=createEntityCheckHref(`${prefix}/kr/seoul/check/`,{market:'kr-seoul',entity:'tower-1',returnTo:`${prefix}/kr/seoul/explore/gangnam-gu/tower-1/`,locale,selection:{market:'kr',transaction:'sale'}});
 const query=Object.fromEntries(new URL(href,'https://signedprice.test').searchParams);
 expect(parseEntityCheckContext(query,{market:'kr-seoul',entityIds:['tower-1'],locale})?.returnTo).toBe(`${prefix}/kr/seoul/explore/gangnam-gu/tower-1/`);
 expect(parseEntityCheckContext(query,{market:'kr-seoul',entityIds:['tower-1'],locale:locale==='ko'?'en':'ko'})).toBeNull();
 expect(parseEntityCheckContext(query,{market:'kr-seoul',entityIds:['unknown'],locale})).toBeNull();
});
