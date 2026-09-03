import styles from './evidence-ui.module.css';

export function EvidenceSectionHeading({
  eyebrow,
  title,
  source,
  id,
}: Readonly<{
  eyebrow: string;
  title: string;
  source?: string;
  id?: string;
}>) {
  return (
    <header className={styles.sectionHeading}>
      <p>{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {source === undefined ? null : <small>{source}</small>}
    </header>
  );
}
