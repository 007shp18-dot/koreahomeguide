import type { Locator, Page } from '@playwright/test';

async function openMobileMenu(page: Page): Promise<void> {
  const header = page.locator('header.site-header');
  const toggle = header.getByLabel(/^(?:Open menu|메뉴 열기)$/);
  if (!await toggle.isVisible()) return;
  const menu = header.locator('details.site-header__mobile-menu');
  if (await menu.getAttribute('open') === null) await toggle.click();
}

export async function openPrimaryNavigation(page: Page): Promise<Locator> {
  const header = page.locator('header.site-header');
  const desktop = header.getByRole('navigation', {
    name: 'Primary navigation',
    exact: true,
  });
  if (await desktop.isVisible()) return desktop;
  await openMobileMenu(page);
  return header.getByRole('navigation', { name: /^(?:Site menu|전체 메뉴)$/, exact: true });
}

export async function openCityNavigation(page: Page): Promise<Locator> {
  const header = page.locator('header.site-header');
  const desktop = header.getByRole('navigation', {
    name: 'Market navigation',
    exact: true,
  });
  if (await desktop.isVisible()) return desktop;
  await openMobileMenu(page);
  return header.getByRole('navigation', { name: /^(?:Choose a city|도시 선택)$/, exact: true });
}

export async function openMarketPagesNavigation(
  page: Page,
  market: 'Seoul' | 'Singapore' | 'Dubai',
): Promise<Locator> {
  const desktop = page.getByRole('navigation', {
    name: `${market} market navigation`,
    exact: true,
  });
  if (await desktop.isVisible()) return desktop;
  await openMobileMenu(page);
  return page.getByRole('navigation', { name: `${market} pages`, exact: true });
}
