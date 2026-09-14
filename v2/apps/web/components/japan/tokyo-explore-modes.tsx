import { MarketLayerControl } from '../market-ui/market-shell';
import type { TokyoLocale } from './tokyo-copy';

export function TokyoExploreModes({ locale, active }: { locale: TokyoLocale; active: 'properties' | 'prices' }) {
  const labels = locale === 'ko' ? ['단지 찾기', '지역별 실거래'] : locale === 'zh-CN' ? ['查找住宅项目', '区域成交价格'] : ['Find a property', 'Area sale prices'];
  return <MarketLayerControl locale={locale} label={locale === 'ko' ? '도쿄 탐색' : locale === 'zh-CN' ? '探索东京' : 'Explore Tokyo'} items={[
    { id: 'properties', label: labels[0]!, href: '/jp/tokyo/explore/?view=properties', current: active === 'properties' },
    { id: 'prices', label: labels[1]!, href: '/jp/tokyo/explore/?view=prices', current: active === 'prices' },
  ]} />;
}
