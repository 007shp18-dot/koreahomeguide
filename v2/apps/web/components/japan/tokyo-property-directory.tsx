import Link from 'next/link';
import { RecentPlaces } from '../discovery/recent-places';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { MarketExploreShell } from '../market-ui/market-shell';
import { homepageCopy } from '../../lib/site-copy';
import { actualDetailHref, allReviewLocations } from '../../lib/research/property-review-locations';
import { propertyOverview } from '../../lib/research/property-overview';
import { TOKYO_WARDS } from '../../lib/japan/query';
import { tokyoHref, tokyoText, type TokyoLocale } from './tokyo-copy';
import { TokyoExploreModes } from './tokyo-explore-modes';
import styles from './tokyo-property-directory.module.css';

const normalized = (value: string) => value.normalize('NFKC').replace(/[\s\p{P}]+/gu, '').toLocaleLowerCase('en');

export function TokyoPropertyDirectory({ locale, query = '', city = '' }: { locale: TokyoLocale; query?: string; city?: string }) {
  const t = (ko: string, en: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
  const properties = allReviewLocations().filter(row => row.wardCode && row.name && row.reviewId.startsWith('jp-'));
  const term = normalized(query);
  const matches = properties.filter(row => (!city || row.wardCode === city) && (!term || normalized(`${row.name!.ko} ${row.name!.en} ${row.area?.ko ?? ''} ${row.area?.en ?? ''}`).includes(term)));
  const language = locale === 'ko' ? 'ko' : 'en';
  const href = tokyoHref(locale, '/jp/tokyo/explore/');
  return <>
    <SiteHeader copy={{ ...homepageCopy.header, homeHref: tokyoHref(locale, '/'), languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', marketLabel: tokyoText(locale, 'Tokyo'), links: [{ label: tokyoText(locale, 'Explore'), href, isCurrent: true }] }} />
    <main className={styles.page} data-tokyo-property-directory="true">
      <MarketExploreShell locale={locale} eyebrow={tokyoText(locale, 'Tokyo')} title={t('단지 찾기', 'Find a property', '查找住宅项目')}
        period={t(`${properties.length}개 단지 · 교통·학교·생활 환경`, `${properties.length} properties · transport, schools and daily life`, `${properties.length}个项目 · 交通、学校与生活`)}
        layers={<>
          <TokyoExploreModes locale={locale} active="properties" />
          <form className={styles.filters} action={href} method="get" aria-label={t('도쿄 단지 검색', 'Find Tokyo properties', '搜索东京住宅')}>
            <input type="hidden" name="view" value="properties" />
            <label>{t('단지명·지역', 'Property or area', '项目或区域')}<input type="search" name="q" defaultValue={query} maxLength={100} placeholder={t('파크시티 도요스, 시바우라…', 'Park City Toyosu, Shibaura…', 'Park City Toyosu、Shibaura…')} /></label>
            <label>{tokyoText(locale, 'Ward')}<select name="city" defaultValue={city}>
              <option value="">{t('전체 지역', 'All areas', '全部区域')}</option>
              {TOKYO_WARDS.filter(([code]) => properties.some(row => row.wardCode === code)).map(([code, name]) => <option key={code} value={code}>{tokyoText(locale, name)}</option>)}
            </select></label>
            <button type="submit">{t('단지 검색', 'Find properties', '搜索住宅')}</button>
            {(query || city) && <Link href={href}>{t('초기화', 'Reset', '重置')}</Link>}
          </form>
        </>}
        history={<RecentPlaces market="tokyo" locale={locale} />}
        discovery={<>
          <p className={styles.count}>{t(`${matches.length}개 단지`, `${matches.length} ${matches.length === 1 ? 'property' : 'properties'}`, `${matches.length}个项目`)}</p>
          <ul className={styles.list}>{matches.map(property => {
            const overview = propertyOverview(property.reviewId, locale);
            return <li key={property.reviewId}><Link href={actualDetailHref(locale, property.reviewId)!}>
              <p className={styles.area}>{property.area?.[language] ?? tokyoText(locale, TOKYO_WARDS.find(([code]) => code === property.wardCode)?.[1] ?? 'Tokyo')}</p>
              <h2>{property.name![language]}</h2>
              {overview && <p className={styles.impression}>{overview.impression}</p>}
              <span className={styles.open}>{t('상세 보기', 'View property', '查看详情')} <span aria-hidden="true">→</span></span>
            </Link></li>;
          })}</ul>
          {!matches.length && <p>{t('검색 결과가 없습니다. 단지명이나 지역을 바꿔 보세요.', 'No properties match. Try another name or area.', '未找到匹配项目，请尝试其他名称或区域。')}</p>}
        </>} />
    </main>
    <SiteFooter locale={locale} copy={homepageCopy.footer} />
  </>;
}
