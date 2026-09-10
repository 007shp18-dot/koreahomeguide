import type { PolicyEvent } from '../../lib/policy/policy-types';
import styles from './newsroom.module.css';

export function PolicyTimeline({ events }: Readonly<{ events: readonly PolicyEvent[] }>) {
  return <ol className={styles.timeline} aria-label="Policy lifecycle">
    {events.map((event) => <li key={`${event.type}:${event.date}`}>
      <time dateTime={event.date}>{event.date}</time>
      <strong>{event.label}</strong>
      {event.note === undefined ? null : <p>{event.note}</p>}
    </li>)}
  </ol>;
}
