'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import { buildingDisplayName } from '@/lib/public-market/seoul-display-names';
import { newlyObservedCount, validFilters, type ShortlistItem, type ShortlistResult } from '@/lib/seoul-shortlist/model';
import { parseSavedSearch, readSavedSearch, subscribeSavedSearch, writeSavedSearch, type SavedSearch } from '@/lib/seoul-shortlist/storage';
import styles from './shortlist.module.css';
import { SavedCities, ShortlistCities } from '../global-shortlist/saved-cities';
const serverSnapshot = () => '';
export function SeoulShortlist({ locale = 'en' }: { locale?: 'en' | 'ko' }) {
  const ko = locale === 'ko';
  const t = (en: string, kr: string) => ko ? kr : en;
  const raw = useSyncExternalStore(subscribeSavedSearch, readSavedSearch, serverSnapshot);
  const stored = useMemo(() => parseSavedSearch(raw), [raw]);
  const filtersKey = JSON.stringify(stored.filters);
  const idsKey = stored.buildings.map(b => b.key).sort().join(',');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<{ key: string; data: ShortlistResult | null; error: boolean } | null>(null);
  const requestKey = `${filtersKey}:${idsKey}:${page}:${refresh}`;
  useEffect(() => {
    const controller = new AbortController();
    const values = JSON.parse(filtersKey) as Record<string, string | number>;
    const query = new URLSearchParams(Object.entries(values).map(([k, v]) => [k, String(v)]));
    query.set('page', String(page));
    if (idsKey) idsKey.split(',').forEach(id => query.append('saved', id));
    fetch(`/api/seoul/shortlist?${query}`, { signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error('unavailable'); return r.json() as Promise<ShortlistResult>; })
      .then(data => { if (!controller.signal.aborted) setResponse({ key: requestKey, data, error: false }); })
      .catch(() => { if (!controller.signal.aborted) setResponse({ key: requestKey, data: null, error: true }); });
    return () => controller.abort();
  }, [filtersKey, idsKey, page, refresh, requestKey]);
  const current = response?.key === requestKey ? response : null;
  const data = current?.data;
  const prefix = ko ? '/ko' : '';
  function persist(next: SavedSearch, success: string) {
    setMessage(writeSavedSearch(next) ? success : t('Browser storage is blocked. Changes last only for this page session.', '브라우저 저장이 차단되어 이번 페이지에서만 유지됩니다.'));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const filters = { budget: Math.round(Number(form.get('budget')) * 100_000_000), minArea: Number(form.get('minArea')), maxArea: Number(form.get('maxArea')), district: String(form.get('district')) };
    if (!validFilters(filters)) { setMessage(t('Check the budget and area range. Maximum area must be at least the minimum.', '예산과 면적 범위를 확인해 주세요. 최대 면적은 최소 면적 이상이어야 합니다.')); return; }
    setPage(1); persist({ ...stored, filters }, t('Search conditions saved in this browser.', '검색 조건을 이 브라우저에 저장했습니다.'));
  }
  function save(item: ShortlistItem) {
    if (stored.buildings.some(b => b.key === item.key)) return;
    if (stored.buildings.length >= 30) { setMessage(t('You can save up to 30 apartment groups.', '관심 단지는 최대 30개까지 저장할 수 있습니다.')); return; }
    persist({ ...stored, buildings: [...stored.buildings, { key: item.key, name: item.name, signatures: item.signatures, checkedAt: new Date().toISOString() }] }, t('Apartment saved. Return here to check for updates.', '관심 단지에 저장했습니다. 다음 방문에 거래 변화를 확인하세요.'));
  }
  function remove(key: string) { persist({ ...stored, buildings: stored.buildings.filter(b => b.key !== key) }, t('Removed from saved apartments.', '관심 단지에서 해제했습니다.')); }
  function markRead(item: ShortlistItem) { persist({ ...stored, buildings: stored.buildings.map(b => b.key === item.key ? { ...b, signatures: item.signatures, checkedAt: new Date().toISOString() } : b) }, t('Updates marked as seen.', '업데이트 확인을 완료했습니다.')); }
  function card(item: ShortlistItem, savedCard = false) {
    const baseline = stored.buildings.find(b => b.key === item.key);
    const added = baseline ? newlyObservedCount(baseline.signatures, item.signatures) : 0;
    const changed = baseline ? added > 0 || newlyObservedCount(item.signatures, baseline.signatures) > 0 : false;
    const district = SEOUL_RENT_CHECK_DISTRICTS.find(d => d.slug === item.district);
    const sale = item.latest;
    const price = ko ? `${(sale.priceWon / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 3 })}억 원` : `KRW ${sale.priceWon.toLocaleString('en-US')}`;
    return <article className={styles.card} key={item.key}>
      <p className={styles.meta}>{ko ? district?.nameKo : district?.nameEn} · {item.neighborhood}</p><h3>{buildingDisplayName(item.name, locale)}</h3>
      {savedCard && changed && <p className={styles.badge}>{added > 0 ? t(`${added} newly observed records`, `새로 확인된 기록 ${added}건`) : t('Transaction records updated', '거래 기록 갱신')}</p>}
      <p className={styles.price}>{price}</p><p>{sale.areaSqm}㎡ · {sale.filedMonth}{sale.floor !== undefined ? ` · ${sale.floor}${t('F', '층')}` : ''}</p>
      <p className={styles.meta}>{savedCard ? t('Latest available record · all sizes', '최신 공개 거래 · 전체 면적') : t(`${item.matchingCount} matching records in the recent sample`, `공개된 최근 표본 중 조건 일치 ${item.matchingCount}건`)}</p>
      <div className={styles.actions}><Link href={`${prefix}/kr/seoul/explore/${encodeURIComponent(item.district)}/${encodeURIComponent(item.buildingId)}/?transaction=sale&propertyType=apartment`}>{t('View evidence', '거래 근거 보기')}</Link><Link href={`${prefix}/kr/seoul/check/?${new URLSearchParams({ transaction: 'sale', housing: 'apartment', district: item.district, building: item.buildingId, area: String(sale.areaSqm) })}`}>{t('Check an asking price', '제안받은 가격 체크')}</Link>
        <button type="button" onClick={() => baseline ? remove(item.key) : save(item)}>{baseline ? t('Remove saved', '관심 해제') : t('Save apartment', '관심 단지 저장')}</button>
        {savedCard && changed && <button type="button" onClick={() => markRead(item)}>{t('Mark as seen', '확인 완료')}</button>}</div>
      {savedCard && baseline && <p className={styles.meta}>{t('Last checked', '마지막 확인')} · {baseline.checkedAt.slice(0, 10)}</p>}
    </article>;
  }
  return <main className={styles.page}>
    <header className={styles.heading}><Link href={`${prefix}/kr/seoul/explore/`}>{t('← Seoul Explore', '← 서울 탐색')}</Link><p className={styles.eyebrow}>{t('SEOUL · APARTMENT SALES', '서울 · 아파트 매매')}</p><h1>{t('Find your price. Follow the transactions.', '내 예산에 맞는 단지, 거래가 바뀌면 확인하세요.')}</h1><p>{t('Find apartment groups with recorded sales in your range, then save the ones you want to follow.', '예산과 면적에 맞는 실거래가 있었던 단지를 찾고, 관심 단지의 거래 변화를 확인하세요.')}</p></header>
    <ShortlistCities current="seoul" locale={locale} />
    <form className={styles.form} key={filtersKey} onSubmit={submit} aria-label={t('Apartment search conditions', '단지 검색 조건')}>
      <label>{t('Price ceiling · KRW 100m', '매매 예산 상한 · 억 원')}<input name="budget" type="number" min="0.1" max="1000" step="0.01" required defaultValue={stored.filters.budget / 100_000_000} /></label>
      <label>{t('District', '지역')}<select name="district" defaultValue={stored.filters.district}><option value="all">{t('All Seoul', '서울 전체')}</option>{SEOUL_RENT_CHECK_DISTRICTS.map(d => <option value={d.slug} key={d.slug}>{ko ? d.nameKo : d.nameEn}</option>)}</select></label>
      <label>{t('Minimum net area · m²', '최소 전용면적 · ㎡')}<input name="minArea" type="number" min="1" max="500" step="0.01" required defaultValue={stored.filters.minArea} /></label>
      <label>{t('Maximum net area · m²', '최대 전용면적 · ㎡')}<input name="maxArea" type="number" min="1" max="500" step="0.01" required defaultValue={stored.filters.maxArea} /></label>
      <button className={styles.primary} type="submit">{t('Find & save conditions', '조건 저장하고 찾기')}</button>
    </form>
    <p className={styles.notice}>{t('Recorded sales, not available listings. Purchase price only; taxes and financing are excluded. Search covers the last 3 months of the installed data, using up to 20 recent records per apartment group. It is not an exhaustive search of all transactions.', '현재 판매 중인 매물이 아닌 실거래 기준 후보입니다. 예산은 매매가만 비교하며 세금·대출 비용은 제외합니다. 데이터 기준 최근 3개월, 단지별 최대 20건의 공개 거래를 검색하므로 전체 거래를 빠짐없이 찾는 결과는 아닙니다.')}</p>
    <p role="status" className={styles.message}>{message}</p>
    <SavedCities locale={locale} />
    <section aria-labelledby="saved-title"><div className={styles.sectionHeading}><h2 id="saved-title">{t('Saved apartments', '관심 단지')} <span>{stored.buildings.length}/30</span></h2><button type="button" onClick={() => setRefresh(n => n + 1)}>{t('Check for updates', '거래 변화 확인')}</button></div>
      <p className={styles.meta}>{t('Saved in this browser only. Checked when you open this page or refresh; no email or background notifications. Newly observed records can include corrections. Clearing browser data removes your list.', '이 브라우저에만 저장됩니다. 페이지를 열거나 확인 버튼을 누르면 갱신된 데이터를 조회합니다. 이메일·백그라운드 알림은 없으며, 새로 확인된 기록에는 정정도 포함될 수 있습니다. 브라우저 데이터를 지우면 목록도 삭제됩니다.')}</p>
      {stored.buildings.length === 0 ? <p className={styles.empty}>{t('Save an apartment from the results below to start following its transactions.', '아래 검색 결과에서 관심 단지를 저장하면 거래 변화를 확인할 수 있어요.')}</p> : !current ? <p role="status">{t('Checking saved apartments…', '관심 단지 확인 중…')}</p> : current.error ? <p role="alert">{t('Updates could not be checked. Your saved list is still here.', '거래 변화를 확인하지 못했습니다. 저장한 목록은 유지됩니다.')}</p> : <div className={styles.grid}>{data?.saved.map(item => card(item, true))}{data?.missingSavedIds.map(key => <article className={styles.card} key={key}><h3>{stored.buildings.find(b => b.key === key)?.name}</h3><p>{t('No published record is available in this release. This does not mean there were no transactions.', '현재 공개 데이터에서 확인되지 않습니다. 거래가 없다는 의미는 아닙니다.')}</p><button type="button" onClick={() => remove(key)}>{t('Remove saved', '관심 해제')}</button></article>)}</div>}
    </section>
    <section aria-labelledby="results-title" aria-busy={!current}><div className={styles.sectionHeading}><h2 id="results-title">{t('Matching apartment groups', '조건에 맞는 단지')}{data && <span> {data.total.toLocaleString()}{t('', '개')}</span>}</h2></div>
      {!current ? <p role="status">{t('Finding recorded sales…', '실거래를 찾고 있습니다…')}</p> : current.error ? <div className={styles.empty} role="alert"><p>{t('Verified sale data is temporarily unavailable. Try again shortly.', '검증된 매매 데이터를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.')}</p><button type="button" onClick={() => setRefresh(n => n + 1)}>{t('Retry', '다시 시도')}</button></div> : data && <>
        <p className={styles.meta}>{t('Search period', '검색 기간')} · {data.since}–{data.period.split('/')[1]} · {t('Dataset updated', '데이터 갱신')} {data.generatedAt.slice(0, 10)} · {t('Source: MOLIT reported sales', '출처: 국토교통부 매매 신고 자료')}</p>
        {data.items.length ? <div className={styles.grid}>{data.items.map(item => card(item))}</div> : <p className={styles.empty}>{t('No matches in the published recent sample. Try a wider price or area range.', '공개된 최근 거래 표본에서 조건에 맞는 단지를 찾지 못했습니다. 예산이나 면적 범위를 넓혀보세요.')}</p>}
        {data.total > data.pageSize && <nav className={styles.pagination} aria-label={t('Search pages', '검색 결과 페이지')}><button type="button" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>{t('Previous', '이전')}</button><span>{data.page} / {Math.ceil(data.total / data.pageSize)}</span><button type="button" disabled={data.page * data.pageSize >= data.total} onClick={() => setPage(data.page + 1)}>{t('Next', '다음')}</button></nav>}
      </>}
    </section>
  </main>;
}
