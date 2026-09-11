type IconName = 'arrow-right' | 'arrow-left' | 'arrow-up-right' | 'chevron-down' | 'menu' | 'globe' | 'bookmark';

const paths: Record<IconName, string> = {
  'arrow-right': 'M5 12h14m-6-6 6 6-6 6',
  'arrow-left': 'M19 12H5m6-6-6 6 6 6',
  'arrow-up-right': 'M6 18 18 6M6 6h12v12',
  'chevron-down': 'm6 9 6 6 6-6',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c3 3 3 15 0 18-3-3-3-15 0-18',
  bookmark: 'M6 4h12v17l-6-4-6 4V4Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
};

/** Decorative icon: the adjacent label supplies the accessible name. */
export function UiIcon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" data-ui-icon={name} focusable="false" className={`ui-icon ${className}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
