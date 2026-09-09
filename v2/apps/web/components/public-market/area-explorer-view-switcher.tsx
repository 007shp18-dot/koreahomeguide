import type { ExplorerView } from '../../lib/navigation/explorer-selection';
import { SegmentedControl } from '../evidence-ui/segmented-control';
import styles from './area-explorer-view-switcher.module.css';

export function AreaExplorerViewSwitcher({
  current,
  hrefFor,
  locale,
}: Readonly<{
  current: ExplorerView;
  hrefFor: (view: ExplorerView) => string;
  locale: 'en' | 'ko';
}>) {
  const labels = locale === 'ko'
    ? { list: '목록', table: '표', map: '지도', split: '분할' }
    : { list: 'List', table: 'Table', map: 'Map', split: 'Split' };

  return (
    <div className={styles.views}>
      <SegmentedControl
      label={locale === 'ko' ? '탐색 보기' : 'Explorer view'}
      value={current}
      items={(['list', 'map'] as const).map((view) => ({
        value: view,
        label: labels[view],
        href: hrefFor(view),
      }))}
      />
      <details className={styles.more} key={current}>
        <summary>{current === 'split' || current === 'table' ? labels[current] : locale === 'ko' ? '다른 보기' : 'More views'}</summary>
        <SegmentedControl
          label={locale === 'ko' ? '추가 탐색 보기' : 'Additional explorer views'}
          value={current}
          items={(['split', 'table'] as const).map((view) => ({ value: view, label: labels[view], href: hrefFor(view) }))}
        />
      </details>
    </div>
  );
}
