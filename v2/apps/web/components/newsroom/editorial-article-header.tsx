import type { ReactNode } from 'react';
import styles from './journey-article.module.css';

/** One reading rhythm for photo essays, neighbourhood guides and market analysis. */
export function EditorialArticleHeader({ topic, title, deck, children }: Readonly<{
  topic: string; title: string; deck: string; children: ReactNode;
}>) {
  return <header className={styles.header} data-editorial-article-header>
    <p className={styles.eyebrow}>{topic}</p>
    <h1>{title}</h1>
    <p className={styles.deck}>{deck}</p>
    <div className={styles.meta}>{children}</div>
  </header>;
}
