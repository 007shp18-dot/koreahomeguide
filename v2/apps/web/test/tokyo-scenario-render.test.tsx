import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {PropertyScenarioCalculator} from '../components/market-ui/property-scenario';
it('keeps Japanese cost assumptions manual and does not apply another country tax defaults',()=>{
 const html=renderToStaticMarkup(<PropertyScenarioCalculator currency="JPY" price={90000000}/>);
 expect(html).toContain('No tax rates or rent estimates are prefilled');
 expect(html).toContain('Purchase price (JPY)');
 expect(html).not.toContain('DLD');
 expect(html).not.toContain('Rules checked');
 expect(html).not.toContain('Calculated subtotal');
 expect(html).toContain('Complete every assumption');
});

it('renders the same scenario inputs in Chinese',()=>{ const html=renderToStaticMarkup(<PropertyScenarioCalculator locale="zh-CN" currency="JPY" price={90000000}/>); expect(html).toContain('购房价格 (JPY)'); expect(html).toContain('您的假设'); expect(html).toContain('系统不预填税率'); });
