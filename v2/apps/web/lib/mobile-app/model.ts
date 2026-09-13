import type { Metadata, MetadataRoute, Viewport } from 'next';
import type { SiteLocale } from '../navigation/site-navigation';

const prefixFor = (locale: SiteLocale) => locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';

export const mobileAppCopy = {
  en: {
    description: 'Explore property prices and return to your saved places across four cities.',
    navigation: 'App navigation', tabs: ['Explore', 'Saved', 'Insights', 'Tools'],
    installTitle: 'Keep your places close', install: 'Add to home screen',
    installDescription: 'Open SignedPrice from your home screen and return to your shortlist.',
    instructions: 'How to install',
    iphone: 'iPhone or iPad: open this page in Safari, tap Share, then Add to Home Screen.',
    browser: 'Android or desktop: open your browser menu and choose Install app or Add to Home Screen, if available.',
    note: 'Internet is required. Saved places stay in this browser; syncing across devices is not available yet.',
    fallback: 'You can still add SignedPrice from your browser menu.',
    installing: 'Opening install options…', accepted: 'Installation requested. Follow your browser’s instructions.',
  },
  ko: {
    description: '네 도시의 부동산 가격을 살펴보고 관심 지역을 다시 확인하세요.',
    navigation: '앱 탐색', tabs: ['둘러보기', '관심 목록', '인사이트', '도구'],
    installTitle: '관심 있는 곳을 더 가까이', install: '홈 화면에 추가',
    installDescription: '홈 화면에서 SignedPrice를 열고 관심 목록을 다시 살펴보세요.',
    instructions: '설치 방법',
    iphone: '아이폰·아이패드: Safari에서 이 페이지를 열고 공유 → 홈 화면에 추가를 선택하세요.',
    browser: '안드로이드·컴퓨터: 브라우저 메뉴에 앱 설치 또는 홈 화면에 추가가 있으면 선택하세요.',
    note: '인터넷 연결이 필요합니다. 관심 목록은 이 브라우저에 저장되며, 기기 간 동기화는 아직 지원하지 않습니다.',
    fallback: '브라우저 메뉴에서도 홈 화면에 추가할 수 있어요.',
    installing: '설치 옵션 여는 중…', accepted: '설치를 요청했어요. 브라우저 안내를 따라주세요.',
  },
  'zh-CN': {
    description: '探索四座城市的房产价格，随时回到已收藏的地区。',
    navigation: '应用导航', tabs: ['探索', '收藏', '洞察', '工具'],
    installTitle: '更方便地查看收藏', install: '添加到主屏幕',
    installDescription: '从主屏幕打开 SignedPrice，继续查看收藏。',
    instructions: '安装方法',
    iphone: 'iPhone 或 iPad：在 Safari 中打开此页，点击分享，再选择添加到主屏幕。',
    browser: '安卓或电脑：如果浏览器菜单中有安装应用或添加到主屏幕，请选择该选项。',
    note: '需要联网。收藏保存在此浏览器中，暂不支持跨设备同步。',
    fallback: '您仍可通过浏览器菜单添加到主屏幕。',
    installing: '正在打开安装选项…', accepted: '已请求安装，请按照浏览器提示操作。',
  },
} as const;

export function mobileAppManifest(locale: SiteLocale): MetadataRoute.Manifest {
  const prefix = prefixFor(locale);
  const copy = mobileAppCopy[locale];
  return {
    id: '/', name: 'SignedPrice', short_name: 'SignedPrice', lang: locale,
    description: copy.description, start_url: `${prefix}/prices/`, scope: '/',
    display: 'standalone', background_color: '#f7f8fa', theme_color: '#ffffff',
    icons: [192, 512].map(size => ({ src: `/app-icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' as const })),
    shortcuts: [
      { name: copy.tabs[0], url: `${prefix}/prices/` },
      { name: copy.tabs[1], url: `${prefix}/saved/` },
    ],
  };
}

export function mobileAppMetadata(locale: SiteLocale): Metadata {
  return {
    applicationName: 'SignedPrice', manifest: `/app-manifest/${locale}/`,
    appleWebApp: { capable: true, title: 'SignedPrice', statusBarStyle: 'default' },
    icons: { apple: [{ url: '/app-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] },
  };
}

export const mobileAppViewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#ffffff' };

export function mobileAppNavigation(pathname: string, locale: SiteLocale) {
  const prefix = prefixFor(locale);
  const path = pathname.replace(/^\/(?:ko|zh-cn)(?=\/)/, '');
  const city = /^\/sg\/?$/.test(path) ? 'sg/singapore' : path.match(/^\/(kr\/seoul|sg\/singapore|ae\/dubai|jp\/tokyo)(?:\/|$)/)?.[1];
  const saved = /\/(saved|shortlist)(?:\/|$)/.test(path);
  const tools = !saved && /\/(tools|check|passport)(?:\/|$)/.test(path);
  const insights = /\/(news|insights|guides)(?:\/|$)/.test(path);
  const explore = /\/(explore|prices|rankings)(?:\/|$)/.test(path);
  return [
    { key: 'explore', href: city ? `${prefix}/${city}/explore/` : `${prefix}/prices/`, current: explore },
    { key: 'saved', href: `${prefix}/saved/`, current: saved },
    { key: 'insights', href: `${prefix}/news/`, current: insights },
    { key: 'tools', href: `${prefix}/tools/`, current: tools },
  ].map((item, index) => ({ ...item, label: mobileAppCopy[locale].tabs[index] }));
}
