/** Named facilities reported by K-apt; these are not measured nearest places. */
export type ReportedNearbyPlace = Readonly<{
  kind: 'station' | 'school';
  sourceId: string;
  name: string;
  lines: readonly string[];
  walkingMinutesUpperBound: number | null;
  source: 'https://www.k-apt.go.kr/';
}>;
