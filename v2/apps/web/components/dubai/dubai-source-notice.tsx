import type { MarketLocale } from '../../lib/locale/market-localization';

export function DubaiSourceNotice({ locale = 'en', sourceUrl, licenseUrl, period }: {
  locale?: MarketLocale; sourceUrl: string; licenseUrl: string; period: string;
}) {
  const source = locale === 'ko' ? '자료 출처: '
    : locale === 'zh-CN' ? '数据来源：' : 'Data source: ';
  const notice = locale === 'ko'
    ? 'SignedPrice는 DLD 또는 두바이 정부와 제휴 관계가 없습니다. 데이터 재사용 및 라이선스 상태는 검토 중입니다.'
    : locale === 'zh-CN'
      ? 'SignedPrice 与 DLD 或迪拜政府没有隶属或合作关系。数据再利用及许可状态仍在审查中。'
      : 'SignedPrice is not affiliated with DLD or the Government of Dubai. Data reuse and licensing status remain under review.';
  return <div data-dubai-source-notice="full">
    <p>{source}<a href={sourceUrl}>Dubai Land Department</a> · {period} · <a href={licenseUrl}>{locale === 'ko' ? '이용 조건' : locale === 'zh-CN' ? '使用条款' : 'Terms of use'}</a></p>
    <p>{notice}</p>
  </div>;
}
