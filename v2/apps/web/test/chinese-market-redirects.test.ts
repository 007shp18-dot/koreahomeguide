import { expect, it } from 'vitest';
import config from '../next.config';
it('does not redirect published Chinese Seoul pages to English', async () => {
 const redirects=await config.redirects!();
 for(const path of ['/zh-cn/kr/seoul/explore/','/zh-cn/kr/seoul/check/']) expect(redirects.some(rule=>rule.source===path)).toBe(false);
});
