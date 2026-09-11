import { localizedMarketCopy } from '../../lib/locale/market-localization';
import { activeSingaporePublication } from '../../lib/singapore/publication.server';

export async function SingaporeRentalEvidence({ projectId, saleDigest, locale = 'en' }: { projectId: string; saleDigest: string; locale?: 'en' | 'ko' | 'zh-CN' }) {
  const publication = await activeSingaporePublication();
  if (!publication || publication.snapshot.digest !== saleDigest) return null;
  const rows = publication.rentals.filter(row => row.projectId === `sg-singapore:project:${projectId}`).sort((a,b) => b.month.localeCompare(a.month));
  const ko = locale === 'ko';
  return <section className="mx-auto max-w-7xl px-4 py-6" aria-label={localizedMarketCopy(locale, "Official rental evidence", "공식 임대 계약 근거")}>
    <h2 className="text-lg font-semibold">{localizedMarketCopy(locale, "Official rental contracts", "공식 임대 계약")}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{localizedMarketCopy(locale, "Median monthly rent · at least 5 contracts per group. Reported area bands are not exact floor areas or rental yields.", "월 임대료 중앙값 · 동일 조건 5건 이상. 면적은 공식 제공 범위이며 정확한 면적이나 임대수익률을 의미하지 않습니다.")}</p>
    {rows.length === 0 ? <p className="mt-3 text-sm">{localizedMarketCopy(locale, "Insufficient contracts with comparable conditions for publication.", "같은 조건으로 공개할 수 있는 계약 표본이 부족합니다.")}</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{(ko ? ['계약월','유형','침실','면적 범위 (㎡)','계약 수','월 임대료 (SGD)'] : locale === 'zh-CN' ? ['月份','类型','卧室','面积范围 (㎡)','合同数','月租 (SGD)'] : ['Month','Type','Bedrooms','Area band (㎡)','Contracts','Monthly rent (SGD)']).map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{rows.slice(0,24).map((row,index) => <tr key={index} className="border-t"><td className="p-2">{row.month}</td><td className="p-2">{row.propertyType}</td><td className="p-2">{row.bedrooms ?? '—'}</td><td className="p-2">{row.areaRange}</td><td className="p-2">{row.n}</td><td className="p-2">{row.medianMonthlySgd.toLocaleString('en-SG')}</td></tr>)}</tbody></table></div>}
    <p className="mt-3 text-xs text-muted-foreground">URA · {localizedMarketCopy(locale, "Published", "공개")} {publication.releasedAt.slice(0,10)}</p>
  </section>;
}
