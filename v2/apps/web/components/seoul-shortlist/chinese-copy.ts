const copy: Record<string,string> = {
 'Browser storage is blocked. Changes last only for this page session.':'浏览器存储被禁用，变更仅在本次页面会话有效。',
 'Check the budget and area range. Maximum area must be at least the minimum.':'请检查预算和面积范围，最大面积不得小于最小面积。',
 'Search conditions saved in this browser.':'筛选条件已保存在此浏览器。',
 'You can save up to 30 apartment groups.':'最多可以收藏30个住宅组。',
 'Apartment saved. Return here to check for updates.':'已收藏住宅，返回此处可检查更新。',
 'Removed from saved apartments.':'已取消收藏。', 'Updates marked as seen.':'更新已标为查看。',
 'Transaction records updated':'成交记录已更新', 'F':'层', 'Latest available record · all sizes':'最新公开成交 · 所有面积',
 'View evidence':'查看成交依据', 'Check an asking price':'核对报价', 'Saved':'已收藏', 'Save apartment':'收藏住宅', 'Mark as seen':'标为已查看', 'Last checked':'上次检查',
 'Seoul Explore':'探索首尔', 'SEOUL · APARTMENT SALES':'首尔 · 公寓成交',
 'Find your price. Follow the transactions.':'按预算寻找住宅，关注成交变化。',
 'Find apartment groups with recorded sales in your range, then save the ones you want to follow.':'查找预算及面积范围内有成交记录的住宅组，并收藏感兴趣的住宅。',
 'Apartment search conditions':'住宅筛选条件', 'Price ceiling · KRW 100m':'价格上限 · 亿韩元', 'District':'行政区', 'All Seoul':'首尔全市',
 'Minimum net area · m²':'最小套内面积 · ㎡', 'Maximum net area · m²':'最大套内面积 · ㎡', 'Find & save conditions':'查找并保存条件',
 'Recorded sales, not available listings. Purchase price only; taxes and financing are excluded. Search covers the last 3 months of the installed data, using up to 20 recent records per apartment group. It is not an exhaustive search of all transactions.':'结果来自已申报成交，并非在售房源。仅比较购房价格，不含税费与融资成本。搜索涵盖现有数据最近3个月，每组住宅最多使用20笔近期记录，并不覆盖全部成交。',
 'Saved apartments':'收藏住宅', 'Check for updates':'检查更新',
 'Saved in this browser only. Checked when you open this page or refresh; no email or background notifications. Newly observed records can include corrections. Clearing browser data removes your list.':'仅保存在此浏览器。打开此页面或刷新时检查更新，不发送邮件或后台通知。新增记录可能包含更正。清除浏览器数据会删除收藏。',
 'Save an apartment from the results below to start following its transactions.':'从下方结果收藏住宅，即可关注其成交变化。', 'Checking saved apartments…':'正在检查收藏住宅…',
 'Updates could not be checked. Your saved list is still here.':'未能检查更新，收藏列表仍保留。',
 'No published record is available in this release. This does not mean there were no transactions.':'本期资料没有可用的公开记录，不代表没有成交。',
 'Remove saved':'取消收藏', 'Matching apartment groups':'匹配的住宅组', '':'个', 'Finding recorded sales…':'正在查找成交记录…',
 'Verified sale data is temporarily unavailable. Try again shortly.':'已核验的成交资料暂不可用，请稍后重试。', 'Retry':'重试', 'Search period':'搜索期间', 'Dataset updated':'数据更新', 'Source: MOLIT reported sales':'来源：韩国国土交通部申报成交',
 'No matches in the published recent sample. Try a wider price or area range.':'近期公开样本中没有匹配结果，请扩大价格或面积范围。', 'Search pages':'搜索结果页', 'Previous':'上一页', 'Next':'下一页',
};
export function seoulShortlistChinese(text:string):string {
 return copy[text] ?? text.replace(/^(\d+) newly observed records$/, '新发现$1笔记录').replace(/^(\d+) matching records in the recent sample$/, '近期样本中有$1笔匹配记录');
}
export const seoulDistrictChinese:Record<string,string>={
 'jongno-gu':'钟路区','jung-gu':'中区','yongsan-gu':'龙山区','seongdong-gu':'城东区','gwangjin-gu':'广津区','dongdaemun-gu':'东大门区','jungnang-gu':'中浪区','seongbuk-gu':'城北区','gangbuk-gu':'江北区','dobong-gu':'道峰区','nowon-gu':'芦原区','eunpyeong-gu':'恩平区','seodaemun-gu':'西大门区','mapo-gu':'麻浦区','yangcheon-gu':'阳川区','gangseo-gu':'江西区','guro-gu':'九老区','geumcheon-gu':'衿川区','yeongdeungpo-gu':'永登浦区','dongjak-gu':'铜雀区','gwanak-gu':'冠岳区','seocho-gu':'瑞草区','gangnam-gu':'江南区','songpa-gu':'松坡区','gangdong-gu':'江东区',
};
