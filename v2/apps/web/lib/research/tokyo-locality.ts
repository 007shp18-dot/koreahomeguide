/** Known locality aliases used by the verified property catalogue, not a general geocoder. */
const localities = [
  ['Toyosu', '豊洲'], ['Ariake', '有明'], ['Kami-Osaki', '上大崎'], ['Shibaura', '芝浦'],
  ['Harumi', '晴海'], ['Kachidoki', '勝どき'], ['Kitashinagawa', '北品川'],
  ['Hamamatsucho', '浜松町'], ['Udagawacho', '宇田川町'], ['Shirokane', '白金'],
  ['Tomihisacho', '富久町'], ['Konan', '港南'],
] as const;

export const normalizeTokyoLocality = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[\s\-_,.·]/g, '');

export function tokyoLocalityForAddress(address: string): readonly string[] | undefined {
  // Localities occur in the street part. A ward name in the rest of the address
  // must not turn a different neighbourhood's building into a matching example.
  const street = normalizeTokyoLocality(address.split(',')[0] ?? '');
  return localities.find(aliases => aliases.some(alias => street.includes(normalizeTokyoLocality(alias))));
}

export function matchesTokyoLocality(address: string, neighbourhood: string): boolean {
  const requested = normalizeTokyoLocality(neighbourhood);
  if (!requested) return false;
  return tokyoLocalityForAddress(address)?.some(alias => normalizeTokyoLocality(alias) === requested) ?? false;
}
