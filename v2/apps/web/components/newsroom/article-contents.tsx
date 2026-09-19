import styles from './article-contents.module.css';

export function ArticleContents({ items, locale = 'en', sidebar = false }: Readonly<{
  items: readonly Readonly<{ id: string; title: string; label?: string }>[];
  locale?: string;
  sidebar?: boolean;
}>) {
  if (items.length < 3) return null;
  const label = locale === 'ko' ? '목차' : locale === 'zh-CN' ? '目录' : 'Contents';
  const count = locale === 'ko' ? `${items.length}개 주제` : locale === 'zh-CN' ? `${items.length}节` : `${items.length} sections`;
  const links = <nav aria-label={label}><ol>{items.map(item => <li key={item.id}><a href={`#${item.id}`}>{item.label ? <span className={styles.stage}>{item.label}</span> : null}<span>{item.title.replace(/^\d+\s*[·.\-]\s*/u, '')}</span></a></li>)}</ol></nav>;
  return <>
    {sidebar && <div className={`${styles.contents} ${styles.sidebar}`} data-article-contents><p className={styles.sidebarLabel}>{label}<span>{count}</span></p>{links}</div>}
    <details className={`${styles.contents} ${sidebar ? styles.mobileContents : ''}`} data-article-contents>
      <summary>{label}<span>{count}</span></summary>
      {links}
    </details>
  </>;
}
