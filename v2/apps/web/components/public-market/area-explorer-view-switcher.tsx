import type { ExplorerView } from '../../lib/navigation/explorer-selection';
import { SegmentedControl } from '../evidence-ui/segmented-control';

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
    <SegmentedControl
      label={locale === 'ko' ? '탐색 보기' : 'Explorer view'}
      value={current}
      items={(['split', 'list', 'table', 'map'] as const).map((view) => ({
        value: view,
        label: labels[view],
        href: hrefFor(view),
      }))}
    />
  );
}
