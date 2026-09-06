import {expect,it} from 'vitest';
import {redactAnalyticsUrl} from '../lib/analytics/url-redaction';

it.each(['pageview','event'] as const)('removes entered terms and fragments from %s URLs',type=>{
 const input={type,url:'https://www.signedprice.com/tools/property-scenario/?price=2684000&entity=private-context&returnTo=%2Fsg%2F#result'};
 expect(redactAnalyticsUrl(input)).toEqual({type,url:'https://www.signedprice.com/tools/property-scenario/'});
 expect(input.url).toContain('price=');
});
it('drops malformed and non-HTTP event locations',()=>{
 for(const url of ['bad url','javascript:alert(1)']) expect(redactAnalyticsUrl({type:'event',url})).toBeNull();
});
