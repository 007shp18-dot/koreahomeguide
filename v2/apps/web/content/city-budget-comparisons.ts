import { BUYING_GUIDES } from './en/buying-guides';
import { TOKYO_BUYING_GUIDES } from './tokyo-buying-guide';
import { BUYING_GUIDE_DATA } from './en/buying-guide-data';
import { KOREAN_BUYING_GUIDE_DATA } from './ko/buying-guides';
import { CITY_BUYING, cityText, cityPrefix, comparisonSlug, consultationHref } from './city-buying-content';
import { tokyoBudgetBands } from './tokyo-budget-comparison';
import { TOKYO_BUDGET_METHOD } from './tokyo-budget-method';
import snapshot from './tokyo-budget-comparison-data.json';
import type { EditorialPortfolioRecord } from './portfolio-types';
import type { BuyingCity } from '../lib/home/buying-journey';
import { buyingMoney } from '../lib/home/buying-journey';

export const CITY_BUDGET_COMPARISONS: readonly EditorialPortfolioRecord[] = (Object.keys(CITY_BUYING) as BuyingCity[]).flatMap(city => (['en','ko','zh-CN'] as const).map(locale=>{
  const model=CITY_BUYING[city], prefix=cityPrefix(locale), t=(v:readonly string[])=>cityText(v,locale);
  const origin=city==='tokyo'?TOKYO_BUYING_GUIDES.find(x=>x.locale===locale)!:BUYING_GUIDES.find(x=>x.marketId===model.market)!;
  const guide=(locale==='ko'?KOREAN_BUYING_GUIDE_DATA:BUYING_GUIDE_DATA).find(x=>x.slug.startsWith(`${city}-`));
  const examples=city==='tokyo'?tokyoBudgetBands(locale)[1]!.examples:guide!.bands[1]!.examples.map(e=>({name:e.name,region:e.region,detail:e.detail,area:e.area,price:e.price,count:e.n,evidenceHref:`${locale==='zh-CN'?'':prefix}${origin.canonicalHref}?budget=${model.cap}#buying-examples`}));
  const range=(a:readonly number[])=>a[0]===a[1]?String(a[0]):`${a[0]}–${a[1]}`;
  const table=`| ${t(['Place / project','지역 / 단지','地区 / 项目'])} | m² | ${model.currency} | ${t(['Records','거래 건수','成交笔数'])} |\n| --- | ---: | ---: | ---: |\n`+examples.map(e=>`| [${e.name}](${e.evidenceHref}) · ${e.region} | ${range(e.area)} | ${e.price.map(p=>p.toLocaleString('en-US')).join('–')} | ${e.count} |`).join('\n');
  const extraTokyo=city==='tokyo'?tokyoBudgetBands(locale).filter(b=>b.cap!==model.cap).map(b=>`### ${buyingMoney(b.cap,'JPY',locale)}\n\n| ${t(['Ward','구','区'])} | m² | JPY | ${t(['Records','거래 건수','笔数'])} |\n| --- | ---: | ---: | ---: |\n`+b.examples.map(e=>`| [${e.name}](${e.evidenceHref}) | ${range(e.area)} | ${e.price.map(p=>p.toLocaleString('en-US')).join('–')} | ${e.count} |`).join('\n')).join('\n\n'):'';
  const detail=examples.map(e=>`- **${e.name}**: ${e.detail}.`).join('\n');
  const method=city==='tokyo'?t(TOKYO_BUDGET_METHOD):t([
    'Selected groups from the linked buying guide: 80–100% of the budget, at least three qualifying records and at least half of period records in that range. Ordered by qualifying count, then project name and area band; three distinct projects. Not a demand ranking or all affordable homes.',
    '연결된 구매 가이드의 선정 그룹입니다. 예산의 80~100% 가격대에 최소 3건, 해당 기간 그룹 거래의 절반 이상이 이 가격대에 속해야 합니다. 해당 건수·단지명·면적 구간순으로 서로 다른 단지 3곳을 선정했습니다. 인기 순위나 예산 내 전체 주택 목록은 아닙니다.',
    '沿用购房指南筛选：预算的80–100%，至少3笔且占该组期间成交至少一半。按符合条件笔数、项目名和面积段排序，选3个不同项目，并非需求排名或全部可负担住宅。']);
  const title=t(model.question), slug=comparisonSlug(city);
  const period=city==='tokyo'?'2026 Q1':guide!.period;
  const body=[
    `## ${t(['One budget, different choices','같은 예산, 다른 선택','同一预算，不同选择'])}\n\n${t(model.lens)}\n\n${t(['Price ceiling','집값 상한','房价上限'])}: **${buyingMoney(model.cap,model.currency,locale)}** · ${period}. ${t(['Historical transactions, not available listings.','과거 거래이며 현재 매물이 아닙니다.','历史成交，并非在售房源。'])}`,
    `## ${t(['Compare the recorded examples','실제 거래 사례 비교','比较成交样本'])}\n\n${table}\n\n${detail}\n\n${extraTokyo}`,
    `## ${t(['What the difference does—and does not—tell you','차이에서 읽을 수 있는 것','这些差异说明什么'])}\n\n${t(model.tradeoff)}\n\n${t(['The ranges combine different homes. Their minimum price and maximum area may belong to different records. Do not read the endpoints as a single home, or infer appreciation or liquidity from the counts.','범위에는 서로 다른 집이 섞여 있습니다. 최저 가격과 최대 면적은 서로 다른 거래일 수 있으므로 하나의 집 조건으로 읽으면 안 됩니다. 건수만으로 상승 가능성이나 매도 용이성을 판단할 수 없습니다.','区间包含不同住宅，最低价格与最大面积可能来自不同成交，不能组合成一套房，也不能由笔数推断升值或流动性。'])}`,
    `## ${t(['Costs and the next check','비용과 다음 확인사항','费用与下一步核查'])}\n\n${t(model.costs)}\n\n[${t(['Open cost scenario','비용 계산기 열기','打开费用计算器'])}](${prefix}/tools/property-scenario/?market=${model.market}&currency=${model.currency}&price=${model.cap})\n\n${t(['Choose two candidates. Note the actual address, size, age, condition, purchase purpose and costs still unverified before requesting help.','후보 두 곳을 고르고 실제 주소·면적·연식·상태·구매 목적과 아직 확인하지 못한 비용을 정리해 문의하세요.','选两处候选，整理实际地址、面积、楼龄、房况、购买目的与未核实费用后再咨询。'])}\n\n[${t(['Prepare a purchase enquiry','구매상담 문의 준비하기','准备购房咨询'])}](${consultationHref(city,locale,model.cap)}) · [${t(['City overview','도시 한눈에','城市概览'])}](${prefix}${model.base}/)`,
    `## ${t(['Sources and selection','출처와 선정 기준','来源与筛选标准'])}\n\n${method}\n\n${t(['Explore links retain the source scope; Tokyo links show the ward and area band, so apply the price interval shown above when reading the records. Building identities and station access are not inferred.','탐색 링크는 출처 범위를 유지합니다. 도쿄 링크는 해당 구·면적 구간을 열므로 위 가격 범위를 적용해 거래를 읽어주세요. 건물명이나 역 접근성을 추정하지 않았습니다.','探索链接保留来源范围；东京链接显示区与面积段，阅读时请应用上表价格区间。未推断楼名或车站距离。'])}\n\n[${t(['Original buying guide','기존 예산별 구매 가이드','原购房预算指南'])}](${city==='tokyo'?origin.canonicalHref:locale==='zh-CN'?origin.canonicalHref:prefix+origin.canonicalHref}) · [${t(['Official source','공식 출처','官方来源'])}](${model.source})`,
  ].join('\n\n');
  return {...origin,id:`${locale}:${slug}`,slug,locale,marketId:model.market,type:'guide',title,deck:t(model.lens),readerQuestion:title,bodyMarkdown:body,canonicalHref:`${prefix}/guides/${slug}/`,translationGroupId:slug,publishedAt:'2026-09-15T12:00:00Z',updatedAt:'2026-09-15T12:00:00Z',reviewedAt:'2026-09-15T12:00:00Z',revisionNote:'Budget comparison using reviewed source groups, with explicit limitations and enquiry handoff.',relatedHref:`${prefix}${model.base}/explore/`,evidenceReleaseIds:city==='tokyo'?[...new Set(snapshot.rows.map(r=>r.release_id))]:origin.evidenceReleaseIds,infographic:null} as EditorialPortfolioRecord;
}));
