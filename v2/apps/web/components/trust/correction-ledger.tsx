import type { Correction } from '@signedprice/market-core';

import styles from './trust.module.css';

function statusLabel(status: Correction['status']): string {
  return status === 'FIXED' ? 'Fixed' : 'Upheld';
}

export function CorrectionLedger({
  corrections,
  locale = 'en',
}: Readonly<{ locale?: 'en' | 'ko' | 'zh-CN'; corrections: readonly Correction[] }>) {
  if (corrections.length === 0) {
    return (
      <section className={styles.emptyLedger} aria-label={locale === 'ko' ? '수정 이력' : locale === 'zh-CN' ? '更正记录' : 'Correction history'}>
        <h2>{locale === 'ko' ? '공개된 수정 이력이 없습니다' : locale === 'zh-CN' ? '暂无已公布的更正' : 'No published corrections'}</h2>
        <p>{locale === 'ko' ? '공개 자료와 설명의 수정 사항을 날짜·적용 범위와 함께 안내합니다.' : locale === 'zh-CN' ? '公开数据及说明的更正将注明日期和适用范围。' : 'Updates to published data and explanations will appear here with their dates and scope.'}</p>
      </section>
    );
  }

  return (
    <section className={styles.ledger} aria-labelledby="correction-ledger-heading">
      <h2 id="correction-ledger-heading">{locale === 'ko' ? '공개 수정 이력' : locale === 'zh-CN' ? '已公布的更正' : 'Published corrections'}</h2>
      <ol>
        {corrections.map((correction) => (
          <li key={correction.id}>
            <article>
              <header>
                <strong>{locale === 'ko' ? (correction.status === 'FIXED' ? '수정 완료' : '기존 내용 유지') : locale === 'zh-CN' ? (correction.status === 'FIXED' ? '已更正' : '维持原内容') : statusLabel(correction.status)}</strong>
                <time dateTime={correction.date}>{correction.date}</time>
              </header>
              <p>{correction.summary}</p>
              <small>{correction.scope} · {locale === 'ko' ? (correction.raisedBy === 'USER' ? '이용자 제보' : '내부 검토') : locale === 'zh-CN' ? (correction.raisedBy === 'USER' ? '用户报告' : '内部审核') : correction.raisedBy.toLowerCase()}</small>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
