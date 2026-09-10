import { passportReturn } from '../tools/property-scenario-context';

const origin = 'https://signedprice.invalid';
export function retainPassportContext(href: string, source: string, includeDubaiFilters = false): string {
  if (!href.startsWith('/') || href.startsWith('//') || /[\\\u0000-\u001f]/.test(href)) return href;
  const current = new URL(source, origin);
  const target = new URL(href, origin);
  if (!/^\/(?:ko\/|zh-cn\/)?(?:kr\/seoul|sg\/singapore|ae\/dubai|jp\/tokyo|tools\/property-scenario)(?:\/|$)/.test(target.pathname)) return href;
  const passport = current.searchParams.getAll('passport').length === 1 ? passportReturn(current.searchParams.get('passport')) : undefined;
  if (!passport) return href;
  target.searchParams.set('passport', passport);
  if (includeDubaiFilters && /^\/(?:ko\/)?ae\/dubai\/explore\//.test(target.pathname)) {
    for (const [key, values] of [['housing', ['apartment', 'villa']], ['stage', ['ready', 'off-plan']]] as const) {
      const value = current.searchParams.get(key);
      if (!target.searchParams.has(key) && values.some(item => item === value)) target.searchParams.set(key, value!);
    }
    const budget = current.searchParams.get('budgetMax');
    if (!target.searchParams.has('budgetMax') && budget && /^\d+$/.test(budget) && Number(budget) >= 1 && Number(budget) <= 500000000) target.searchParams.set('budgetMax', budget);
  }
  return `${target.pathname}${target.search}${target.hash}`;
}

export function passportCandidateHref(href: string, passport: string): string {
  return retainPassportContext(href, `/?passport=${encodeURIComponent(passport)}`);
}
