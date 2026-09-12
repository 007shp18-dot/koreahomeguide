import type { MarketLocale } from '../locale/market-localization';
const en = {
  title: 'Compare areas', add: 'Add to comparison', remove: 'Remove from comparison',
  hint: 'Choose 2–3 areas to compare on the same terms.', open: 'Compare', close: 'Back to Explore',
  saved: 'Saved comparisons', save: 'Save comparison', share: 'Copy share link', delete: 'Delete',
  local: 'Saved in this browser only. Reopening shows the current published data. Up to 10 comparisons; oldest replaced when full.',
  success: 'Comparison saved in this browser.', failure: 'Browser storage is unavailable. This comparison has not been saved.',
  copied: 'Share link copied.', copyHelp: 'Copy this link to share:', loading: 'Opening comparison…',
  conditions: 'Same home type, sale stage and published period for every area.',
  disclaimer: 'Registered area aggregates, not asking prices. Home sizes and transaction mix differ between areas.',
  updated: 'The published period has changed since this comparison was saved or shared. Current data is shown below.',
  apartment: 'Apartment', villa: 'Villa', ready: 'Ready · sale', 'off-plan': 'Off-plan · sale',
  price: 'Median sale price', sqm: 'Median sale price / m²', count: 'Registered sales',
  rent: 'Median annual rent', rents: 'Registered rental contracts', year: '/year',
  missing: 'Not published', gone: 'Area no longer published', details: 'Full area analysis',
  source: 'Source: Dubai Land Department', period: 'Published period', empty: 'No saved comparisons yet.',
  selected: 'Selected', clear: 'Clear selection',
};
type Copy = { [K in keyof typeof en]: string };
const ko: Copy = {
  title: '지역 비교', add: '비교에 추가', remove: '비교에서 제외', hint: '지역 2~3곳을 골라 같은 조건으로 비교하세요.',
  open: '비교하기', close: 'Explore로 돌아가기', saved: '저장한 비교', save: '비교 저장', share: '공유 링크 복사', delete: '삭제',
  local: '이 브라우저에만 저장됩니다. 다시 열면 현재 공개 자료로 표시합니다. 최대 10개이며 가득 차면 가장 오래된 비교를 대체합니다.',
  success: '이 브라우저에 비교를 저장했습니다.', failure: '브라우저 저장 공간을 사용할 수 없어 저장하지 못했습니다.',
  copied: '공유 링크를 복사했습니다.', copyHelp: '이 링크를 복사해 공유하세요:', loading: '비교 여는 중…',
  conditions: '모든 지역에 같은 주택 유형·거래 단계·공개 기간을 적용합니다.',
  disclaimer: '호가가 아닌 지역별 등록 거래 집계입니다. 지역마다 주택 면적과 거래 구성은 다를 수 있습니다.',
  updated: '저장·공유 당시와 공개 기간이 달라졌습니다. 아래에는 현재 공개 자료를 표시합니다.',
  apartment: '아파트', villa: '빌라', ready: '준공 · 매매', 'off-plan': '분양 · 매매',
  price: '매매가 중앙값', sqm: 'm²당 매매가 중앙값', count: '등록 매매 건수', rent: '연간 임대료 중앙값', rents: '등록 임대 계약 수', year: '/년',
  missing: '미공개', gone: '현재 미공개 지역', details: '지역 분석 전체 보기', source: '출처: Dubai Land Department', period: '공개 기간', empty: '아직 저장한 비교가 없습니다.', selected: '선택', clear: '선택 비우기',
};
const zh: Copy = {
  title: '区域对比', add: '加入对比', remove: '移出对比', hint: '选择 2–3 个区域，在相同条件下对比。',
  open: '对比', close: '返回 Explore', saved: '已保存的对比', save: '保存对比', share: '复制分享链接', delete: '删除',
  local: '仅保存在此浏览器。重新打开时显示当前公开数据。最多 10 组，满额后替换最早保存的对比。',
  success: '已在此浏览器保存对比。', failure: '浏览器存储不可用，未能保存。', copied: '已复制分享链接。', copyHelp: '复制此链接分享：', loading: '正在打开对比…',
  conditions: '所有区域采用相同的住宅类型、交易阶段和公开期间。', disclaimer: '区域登记交易汇总，并非挂牌价。各区域的住宅面积和交易构成可能不同。',
  updated: '公开期间与保存或分享时不同。下方显示当前公开数据。', apartment: '公寓', villa: '别墅', ready: '现房 · 买卖', 'off-plan': '期房 · 买卖',
  price: '成交价中位数', sqm: '每平方米成交价中位数', count: '登记成交数量', rent: '年租金中位数', rents: '登记租赁合同数量', year: '/年',
  missing: '未公开', gone: '区域目前未公开', details: '完整区域分析', source: '来源：Dubai Land Department', period: '公开期间', empty: '尚无保存的对比。', selected: '已选', clear: '清空选择',
};
export const comparisonCopy = (locale: MarketLocale): Copy => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
