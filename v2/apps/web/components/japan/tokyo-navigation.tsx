import Link from 'next/link';

export function TokyoNavigation({ current }: { current: 'overview' | 'explore' }) {
  return <nav className="tokyo-navigation" aria-label="Tokyo market navigation">
    <Link href="/jp/tokyo/" aria-current={current === 'overview' ? 'page' : undefined}>Overview</Link>
    <Link href="/jp/tokyo/explore/" aria-current={current === 'explore' ? 'page' : undefined}>Explore</Link>
    <a href="https://www.reinfolib.mlit.go.jp/" rel="noreferrer">Data source</a>
  </nav>;
}
