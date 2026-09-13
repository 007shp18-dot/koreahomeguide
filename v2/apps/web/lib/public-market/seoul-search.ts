/** Search-only normalization. Never change source names or building identities. */
export function normalizeSeoulSearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[\s\p{P}]+/gu, '');
}

export function seoulSearchQuery(value: string): string {
  const query = normalizeSeoulSearch(value);
  // Retained MOLIT names: 마포래미안푸르지오1단지 … 4단지, Mapo-gu/Ahyeon-dong.
  // Expand only the complete nickname, optionally followed by a numbered complex.
  return /^마래푸(?:[1-4](?:단지)?)?$/.test(query)
    ? query.replace(/^마래푸/, '마포래미안푸르지오') : query;
}

export function matchesSeoulSearch(values: readonly string[], query: string): boolean {
  const term = seoulSearchQuery(query);
  return term.length > 0 && values.some(value => normalizeSeoulSearch(value).includes(term));
}
