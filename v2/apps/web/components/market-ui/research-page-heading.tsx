import type { ReactNode } from 'react';
import styles from './research-page-heading.module.css';

/** Shared index-page rhythm; city and article names stay out of navigation labels. */
export function ResearchPageHeading({ title, description, actions }: Readonly<{
  title: string; description: ReactNode; actions?: ReactNode;
}>) {
  return <header className={styles.heading} data-research-page-heading="true">
    <h1>{title}</h1><p>{description}</p>{actions ? <div className={styles.actions}>{actions}</div> : null}
  </header>;
}
