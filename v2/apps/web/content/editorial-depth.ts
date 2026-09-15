import type { EditorialPortfolioRecord } from './portfolio-types';
import guide0 from './editions/guide-depth/seoul.json';
import guide1 from './editions/guide-depth/singapore.json';
import guide2 from './editions/guide-depth/dubai.json';
import guide3 from './editions/guide-depth/tokyo.json';
import insight0 from './editions/insight-depth/dubai-rental-yield-after-costs.json';
import insight1 from './editions/insight-depth/korea-foreon-neighbour-price-gap.json';
import insight2 from './editions/insight-depth/seoul-monthly-2026-09.json';
import insight3 from './editions/insight-depth/seoul-same-complex-price-gap.json';
import insight4 from './editions/insight-depth/singapore-lentor-launch-resale-divergence.json';
import insight5 from './editions/insight-depth/singapore-monthly-2026-09.json';
import insight6 from './editions/insight-depth/tokyo-cheaper-rent-longer-commute.json';
export const DEPTH_REVISED_AT = '2026-09-15T20:00:00Z';
export const EDITORIAL_DEPTH: Readonly<Record<string,Readonly<Record<'en'|'ko',string>>>> = {
  'seoul-apartment-buying-budget-guide': guide0,
  'singapore-condo-buying-budget-guide': guide1,
  'dubai-ready-apartment-buying-budget-guide': guide2,
  'tokyo-apartment-buying-budget-guide': guide3,
  'dubai-rental-yield-after-costs': insight0,
  'korea-foreon-neighbour-price-gap': insight1,
  'seoul-monthly-2026-09': insight2,
  'seoul-same-complex-price-gap': insight3,
  'singapore-lentor-launch-resale-divergence': insight4,
  'singapore-monthly-2026-09': insight5,
  'tokyo-cheaper-rent-longer-commute': insight6,
};
export function deepenEditorial(article: EditorialPortfolioRecord): EditorialPortfolioRecord {
 if(article.locale==='zh-CN' || !EDITORIAL_DEPTH[article.slug])return article;
 const addition=EDITORIAL_DEPTH[article.slug]![article.locale];
 const method=article.bodyMarkdown.search(/^## (Sources and production|자료와 제작)/m);
 const body=method<0?article.bodyMarkdown+'\n\n'+addition:article.bodyMarkdown.slice(0,method)+addition+'\n\n'+article.bodyMarkdown.slice(method);
 return {...article,bodyMarkdown:body.replace(/\*\*/g,''),updatedAt:DEPTH_REVISED_AT,reviewedAt:DEPTH_REVISED_AT,revisionNote:article.revisionNote+' Expanded decision explanation; original source dates and quantitative evidence preserved.'};
}
