import { expect, type Locator, type Page } from '@playwright/test';

async function openDetails(details: Locator) {
  await expect(details).toHaveCount(1);
  await expect(async () => {
    if (await details.getAttribute('open') === null) {
      await details.locator(':scope > summary').click();
    }
    expect(await details.getAttribute('open')).toBe('');
  }).toPass();
}

async function openVisibleMobileMenu(page: Page): Promise<Locator | null> {
  await expect(page.locator('header.site-header:visible')).toBeVisible();
  const mobile = page.locator('.site-header__mobile-menu').filter({ visible: true });
  if (await mobile.count() === 0) return null;

  await openDetails(mobile);
  return mobile;
}

async function openVisibleContextMenu(page: Page, className: string): Promise<Locator> {
  const menu = page.locator(`header.site-header .${className}`).filter({ visible: true });
  await openDetails(menu);
  return menu;
}

export async function visibleProductNavigation(page: Page): Promise<Locator> {
  const mobile = await openVisibleMobileMenu(page);
  const isKorean = await page.locator('html').getAttribute('lang') === 'ko';
  const navigation = mobile
    ? mobile.getByRole('navigation', { name: isKorean ? '전체 메뉴' : 'Site menu', exact: true })
    : page.getByRole('navigation', { name: 'Primary navigation', exact: true });
  return navigation.filter({ visible: true });
}

export async function visibleMarketNavigation(page: Page, market?: string): Promise<Locator> {
  const mobile = await openVisibleMobileMenu(page);
  const isKorean = await page.locator('html').getAttribute('lang') === 'ko';
  const scope = mobile ?? await openVisibleContextMenu(page, 'site-header__context-menu--market');
  const name = market
    ? mobile ? `${market} pages` : isKorean ? `${market} 시장 메뉴` : `${market} market navigation`
    : mobile ? isKorean ? '도시 선택' : 'Choose a city' : 'Market navigation';
  return scope
    .getByRole('navigation', { name, exact: true }).filter({ visible: true });
}

export async function visibleLanguageNavigation(page: Page): Promise<Locator> {
  const mobile = await openVisibleMobileMenu(page);
  const scope = mobile ?? await openVisibleContextMenu(page, 'site-header__context-menu--language');
  return scope.getByRole('navigation', { name: 'Language navigation', exact: true }).filter({ visible: true });
}
