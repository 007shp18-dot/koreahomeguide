import Link from 'next/link';

import type { ChineseEditorialArticle } from '../../lib/insights/chinese-korea-articles';
import { EditorialMarkdown } from './editorial-markdown';
import styles from './insights.module.css';

const date = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
});

function ChineseArticleCard({ article, index, lead = false }: Readonly<{
  article: ChineseEditorialArticle;
  index: number;
  lead?: boolean;
}>) {
  const href = `/zh-cn/kr/seoul/insights/${article.slug}/`;
  return (
    <article className={lead ? styles.leadCard : styles.articleCard}>
      <div className={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</div>
      <div className={styles.articleMeta}>
        <span>首尔</span><span>原创指南</span>
        <time dateTime={article.publishedAt}>{date.format(new Date(article.publishedAt))}</time>
        <span>约 {article.readMinutes} 分钟</span>
      </div>
      <h2><Link href={href}>{article.title}</Link></h2>
      <p>{article.summary}</p>
      <Link className={styles.readLink} href={href}>阅读文章 →</Link>
    </article>
  );
}

export function ChineseInsightsIndex({ articles }: Readonly<{
  articles: readonly ChineseEditorialArticle[];
}>) {
  const [lead, ...rest] = articles;
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div><p>SignedPrice · 中文原创</p><h1>理解韩国房产，再做决定。</h1></div>
        <p>面向跨境租客与买家的原创报道和实用指南。每篇文章标明官方资料与核对日期，并直接连接首尔成交数据和价格查询。</p>
      </header>
      <nav className={styles.deskNav} aria-label="中文房地产导航">
        <Link aria-current="page" href="/zh-cn/kr/seoul/insights/">全部文章</Link>
        <Link href="/kr/seoul/explore/">首尔成交数据</Link>
        <Link href="/kr/seoul/check/">价格查询</Link>
        <Link href="/kr/seoul/guide/">韩国指南</Link>
        <Link href="/markets/">首尔 · 新加坡 · 迪拜</Link>
      </nav>
      {lead === undefined ? null : (
        <>
          <section className={styles.leadSection} aria-label="推荐文章">
            <ChineseArticleCard article={lead} index={0} lead />
          </section>
          <section className={styles.reportSection} aria-labelledby="chinese-articles-heading">
            <div className={styles.sectionHeading}><p>实用内容</p><h2 id="chinese-articles-heading">全部原创文章</h2></div>
            <div className={styles.articleGrid}>
              {rest.map((article, index) => <ChineseArticleCard article={article} index={index + 1} key={article.slug} />)}
            </div>
          </section>
        </>
      )}
      <aside className={styles.editorialBoundary}>
        <strong>信息边界</strong>
        <p>SignedPrice区分官方成交记录、实用说明和个案判断。缺失资料不会被推测为事实；法律、税务、贷款与保证资格请按个人情况向主管机关或合格专业人士确认。</p>
      </aside>
    </main>
  );
}

export function ChineseInsightsArticle({ article }: Readonly<{
  article: ChineseEditorialArticle;
}>) {
  return (
    <main className={styles.main}>
      <nav className={styles.breadcrumb} aria-label="面包屑导航">
        <Link href="/zh-cn/kr/seoul/insights/">中文专栏</Link><span aria-hidden="true">/</span><span>首尔</span>
      </nav>
      <article className={styles.document}>
        <header className={styles.documentHero}>
          <div className={styles.articleMeta}><span>首尔</span><span>原创指南</span><span>约 {article.readMinutes} 分钟</span></div>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
          <div className={styles.byline}><strong>SignedPrice 发布</strong><time dateTime={article.publishedAt}>{date.format(new Date(article.publishedAt))}</time></div>
        </header>
        <div className={styles.documentLayout}>
          <div>
            <EditorialMarkdown source={article.bodyMarkdown} />
            <section className={styles.sources} aria-labelledby="chinese-article-sources">
              <h2 id="chinese-article-sources">资料来源与核对日期</h2>
              <ul>
                {article.sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} rel="noreferrer">{source.publisher} · {source.label}</a>
                    <span>核对于 {source.checkedAt}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className={styles.documentRail}>
            <p>阅读方法</p><strong>先看证据边界，再看结论。</strong>
            <p>将市场、期间、房型和样本量保持一致，再把地区数据用于具体房屋。</p>
            <Link href="/trust/">查看数据方法 →</Link>
          </aside>
        </div>
      </article>
      <nav className={styles.articleActions} aria-label="下一步">
        <Link href="/kr/seoul/explore/">查看首尔成交数据</Link>
        <Link href="/kr/seoul/check/">查询价格</Link>
        <Link href={`/news/${article.relatedEnglishSlug}/`}>Read related English report</Link>
        <Link href="/zh-cn/kr/seoul/insights/">全部中文文章</Link>
      </nav>
    </main>
  );
}
