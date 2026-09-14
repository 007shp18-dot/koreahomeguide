import { tokyoText, tokyoHref, type TokyoLocale } from './tokyo-copy';
import Link from 'next/link';

export function TokyoNavigation({ current, locale = 'en' }: { locale?: TokyoLocale; current: 'overview' | 'explore' }) {
  return <nav className="tokyo-navigation" aria-label="Tokyo market navigation">
    <Link href={tokyoHref(locale, "/jp/tokyo/")} prefetch={false} aria-current={current === 'overview' ? 'page' : undefined}>{tokyoText(locale, 'Overview')}</Link>
    <Link href={tokyoHref(locale, "/jp/tokyo/explore/")} prefetch={false} aria-current={current === 'explore' ? 'page' : undefined}>{tokyoText(locale, 'Explore')}</Link>
    <a href="https://www.reinfolib.mlit.go.jp/" rel="noreferrer">{tokyoText(locale, 'Data source')}</a>
  </nav>;
}
