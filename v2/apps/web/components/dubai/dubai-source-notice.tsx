import type { MarketLocale } from '../../lib/locale/market-localization';

export function DubaiSourceNotice({ locale = 'en', compact = false }: {
  locale?: MarketLocale; compact?: boolean;
}) {
  const source = locale === 'ko' ? '자료 출처: Dubai Land Department.'
    : locale === 'zh-CN' ? '数据来源：Dubai Land Department。' : 'Data source: Dubai Land Department.';
  const notice = locale === 'ko'
    ? 'SignedPrice는 DLD 또는 두바이 정부와 제휴 관계가 없습니다. 데이터 재사용 및 라이선스 상태는 검토 중입니다.'
    : locale === 'zh-CN'
      ? 'SignedPrice 与 DLD 或迪拜政府没有隶属或合作关系。数据再利用及许可状态仍在审查中。'
      : 'SignedPrice is not affiliated with DLD or the Government of Dubai. Data reuse and licensing status remain under review.';
  return <p data-dubai-source-notice={compact ? 'compact' : 'full'}>{source}{compact ? null : <> {notice}</>}</p>;
}
