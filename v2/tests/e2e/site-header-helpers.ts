import { expect, type Locator, type Page } from '@playwright/test';

async function openVisibleMobileMenu(page: Page): Promise<Locator | null> {
  const mobile = page.locator('.site-header__mobile-menu').filter({ visible: true });
  if (await mobile.count() === 0) return null;

  await expect(mobile).toHaveCount(1);
  // Boolean attributes are present as an empty string, not a truthy value.
  if (await mobile.getAttribute('open') === null) {
    await mobile.locator('summary').click();
  }
  await expect(mobile).toHaveAttribute('open', '');
  return mobile;
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
  const name = market
    ? mobile ? `${market} pages` : isKorean ? `${market} 시장 메뉴` : `${market} market navigation`
    : mobile ? isKorean ? '도시 선택' : 'Choose a city' : 'Market navigation';
  return (mobile ?? page.locator('header.site-header'))
    .getByRole('navigation', { name, exact: true }).filter({ visible: true });
}

export async function visibleLanguageNavigation(page: Page): Promise<Locator> {
  await openVisibleMobileMenu(page);
  return page.locator('header.site-header nav.site-header__languages').filter({ visible: true });
}
