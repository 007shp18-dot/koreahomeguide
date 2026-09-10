import Link from 'next/link';

export type DataState =
  | 'loading'
  | 'empty'
  | 'insufficient'
  | 'stale'
  | 'rights-blocked'
  | 'error';

const stateCopy = Object.freeze({
  loading: {
    heading: 'Loading verified evidence',
    cause: 'The latest published evidence is being prepared for this view.',
    action: 'Review coverage',
    href: '/trust/',
  },
  empty: {
    heading: 'No matching evidence',
    cause: 'The current filters do not match a published record.',
    action: 'Clear filters',
    href: '?',
  },
  insufficient: {
    heading: 'Not enough evidence',
    cause: 'The available sample is below the public reporting minimum.',
    action: 'Explore a wider area',
    href: '/prices/',
  },
  stale: {
    heading: 'Update pending',
    cause: 'This view is older than the latest completed release period.',
    action: 'Read the release policy',
    href: '/trust/',
  },
  'rights-blocked': {
    heading: 'Public display unavailable',
    cause: 'The evidence is outside the currently approved publication rights.',
    action: 'View available markets',
    href: '/markets/',
  },
  error: {
    heading: 'Evidence is temporarily unavailable',
    cause: 'This view could not load its published evidence.',
    action: 'Return to prices',
    href: '/prices/',
  },
} as const satisfies Record<DataState, {
  heading: string;
  cause: string;
  action: string;
  href: string;
}>);

export function DataStateNotice({
  state,
  heading,
  cause,
  actionLabel,
  actionHref,
}: Readonly<{
  state: DataState;
  heading?: string;
  cause?: string;
  actionLabel?: string;
  actionHref?: string;
}>) {
  const copy = stateCopy[state];

  return (
    <section className="data-state-notice" data-state={state} aria-live={state === 'loading' ? 'polite' : undefined}>
      <div>
        <p className="data-state-notice__eyebrow">Evidence status</p>
        <h2>{heading ?? copy.heading}</h2>
        <p data-state-cause="true">{cause ?? copy.cause}</p>
      </div>
      <Link data-state-action="true" href={actionHref ?? copy.href}>
        {actionLabel ?? copy.action}
      </Link>
    </section>
  );
}
