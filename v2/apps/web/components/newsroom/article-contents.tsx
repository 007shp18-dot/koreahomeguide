import styles from './article-contents.module.css';

export function ArticleContents({ items, locale = 'en' }: Readonly<{
  items: readonly Readonly<{ id: string; title: string; label?: string }>[];
  locale?: string;
}>) {
  if (items.length < 3) return null;
  const label = locale === 'ko' ? '목차' : locale === 'zh-CN' ? '目录' : 'Contents';
  return <details className={styles.contents} data-article-contents>
    <summary>{label}<span>{locale === 'ko' ? `${items.length}개 주제` : `${items.length} sections`}</span></summary>
    <nav aria-label={label}><ol>{items.map(item => <li key={item.id}><a href={`#${item.id}`}>{item.label ? <span className={styles.stage}>{item.label}</span> : null}<span>{item.title.replace(/^\d+\s*[·.\-]\s*/u, '')}</span></a></li>)}</ol></nav>
  </details>;
}
