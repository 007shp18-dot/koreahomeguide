export type Finding = { id: string; priority: 'fix' | 'review'; title: string; evidence: string; action: string; href: string };
export type PageCheck = { href: string; status: number | null; milliseconds: number; title: string; problem: string | null };
export type BriefItem = { title: string; href: string; date: string; label: string };
export type MorningBrief = {
  date: string; checkedAt: string; commit: string | null; pages: PageCheck[]; findings: Finding[];
  newFindingIds: string[]; continuingFindingIds: string[]; absentFindingIds: string[];
  content: BriefItem[]; issues: Record<string, BriefItem[]>; unavailable: string[];
};
export function koreaDate(now = new Date()): string { return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10); }
export function safeHttps(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
export function issueAction(title: string): string {
  if (/tax|stamp|absd|세금|취득세|税/u.test(title.toLowerCase())) return '원문에서 시행일·적용 대상·예외를 확인하고 취득비용 가이드와 계산기 조건 검토';
  if (/rate|mortgage|loan|금리|대출|金利/u.test(title.toLowerCase())) return '대출 조건과 발표 시점을 확인하고 예산·현금흐름 가이드의 가정 검토';
  return '원문·공식 통계에서 지역·기간·표본을 확인한 뒤 관련 도시 기사 반영 여부 결정';
}
export function compareFindings(current: Finding[], previous: Finding[]) {
  const before = new Set(previous.map(item => item.id)); const after = new Set(current.map(item => item.id));
  return { newFindingIds: [...after].filter(id => !before.has(id)), continuingFindingIds: [...after].filter(id => before.has(id)), absentFindingIds: [...before].filter(id => !after.has(id)) };
}
export function briefText(report: MorningBrief): string {
  const lines = [`SignedPrice 아침 브리핑 · ${report.date}`, `확인: ${report.checkedAt}`, '', '오늘 수정·검토할 일'];
  for (const item of report.findings) lines.push(`[${item.priority === 'fix' ? '수정' : '검토'}] ${item.title}`, `근거: ${item.evidence}`, `다음 행동: ${item.action}`, item.href, '');
  if (!report.findings.length) lines.push('검사 범위에서 발견된 항목 없음. 사이트 전체 정상 판정은 아님.');
  lines.push('', '최근 24시간 콘텐츠 · 언어별 페이지 단위, 원고 편수 아님');
  for (const item of report.content) lines.push(`${item.label} · ${item.title} · ${item.date}`, item.href);
  if (!report.content.length) lines.push('조회 범위에서 새 콘텐츠 없음. 아래 수집 실패 여부도 확인.');
  lines.push('', '최근 7일 주요 이슈 후보 · 최신순 최대 3건/도시, 제목 기반 검토 목록');
  for (const [city, items] of Object.entries(report.issues)) {
    lines.push('', city);
    if (!items.length) lines.push('확인된 최신 항목 없음. 시장에 이슈가 없다는 의미가 아님.');
    for (const item of items) lines.push(`${item.title} — ${item.label} · ${item.date}`, item.href, `반영 검토: ${issueAction(item.title)}`);
  }
  lines.push('', '진척', `새 항목 ${report.newFindingIds.length} · 계속 관찰 ${report.continuingFindingIds.length} · 이번에 미관측 ${report.absentFindingIds.length} (해결 확정 아님)`, '', '사이트 검사');
  for (const page of report.pages) lines.push(`${page.status ?? '연결 실패'} · ${page.milliseconds}ms · ${page.title || page.href}`, page.href);
  lines.push('', '확인 한계', '고정 주요 경로의 서버 HTML 검사이며 실제 사용자 속도·모바일 레이아웃·계산 정확성 전수 검사가 아닙니다. 뉴스 원문을 해석한 정책 자문이 아닙니다.');
  if (report.unavailable.length) lines.push(`확인 불가: ${report.unavailable.join(', ')}`);
  return lines.join('\n');
}
