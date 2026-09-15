import ko from '../../content/brief/copy/ko.json';
import en from '../../content/brief/copy/en.json';
import zh from '../../content/brief/copy/zh-CN.json';
import type { DecisionPriceContext } from '../research/property-decision-price';

export function panelCopy(price: DecisionPriceContext | undefined, locale: 'en' | 'ko' | 'zh-CN', money: (n: number) => string): string[] {
  if (!price || price.scope !== 'property' || price.amount === null || price.amount <= 0 || !price.count || price.count < 5) return [];
  const copy = { ko, en, 'zh-CN': zh }[locale];
  const fill = (text: string, slots: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, key: string) => slots[key] ?? '');
  const lines = [fill(copy.price, { count: String(price.count), median: money(price.amount) })];
  if (price.range && price.range.low > 0 && price.range.low <= price.amount && price.range.high >= price.amount) {
    lines.push(fill(copy.spread, { low: money(price.range.low), high: money(price.range.high), spreadPct: ((price.range.high - price.range.low) / price.amount * 100).toFixed(1) }));
    lines.push(copy.method);
  }
  return lines;
}
