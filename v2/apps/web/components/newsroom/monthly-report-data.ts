export const reports = [
  { city: 'seoul', label: 'Seoul', slug: 'seoul-monthly-2026-09', period: 'July vs June 2026', months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], series: [{ label: 'Brokered apartment sales', values: [5626, 5301, 8339, 8293, 5096, 5321] }] },
  { city: 'singapore', label: 'Singapore', slug: 'singapore-monthly-2026-09', period: 'July vs June 2026', months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], series: [{ label: 'Selected condominium resales', values: [594, 605, 665, 627, 639, 630] }] },
  { city: 'dubai', label: 'Dubai', slug: 'dubai-monthly-2026-09', period: 'August vs July 2026', months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], series: [{ label: 'Off-plan apartment entries', values: [8100, 8708, 6302, 8655, 8629, 7142] }, { label: 'Ready apartment entries', values: [2043, 1877, 1531, 1980, 2417, 2079] }] },
] as const;

export const chineseCityLabels = { seoul: '首尔', singapore: '新加坡', dubai: '迪拜' } as const;
export const chineseSeriesLabels: Readonly<Record<string, string>> = { 'Brokered apartment sales': '中介促成的公寓成交', 'Selected condominium resales': '所选公寓转售', 'Off-plan apartment entries': '期房公寓记录', 'Ready apartment entries': '现房公寓记录' };
export const cityLabels = { seoul: '서울', singapore: '싱가포르', dubai: '두바이' } as const;
export const monthLabels: Readonly<Record<string, string>> = { Feb: '2월', Mar: '3월', Apr: '4월', May: '5월', Jun: '6월', Jul: '7월', Aug: '8월' };
export const seriesLabels: Readonly<Record<string, string>> = { 'Brokered apartment sales': '아파트 중개 매매', 'Selected condominium resales': '선정 콘도 재판매', 'Off-plan apartment entries': '미준공(Off-Plan) 아파트 기록', 'Ready apartment entries': '준공(Ready) 아파트 기록' };
