import type { Locator, Page } from '@playwright/test';

async function openMobileMenu(page: Page): Promise<void> {
  const header = page.locator('header.site-header:visible');
  const toggle = header.getByLabel(/^(?:Open menu|메뉴 열기)$/);
  if (!await toggle.isVisible()) return;
  const menu = header.locator('details.site-header__mobile-menu');
  if (await menu.getAttribute('open') === null) await toggle.click();
}

async function openDesktopContextMenu(
  header: Locator,
  className: string,
): Promise<Locator | null> {
  const menu = header.locator(`details.${className}`).filter({ visible: true });
  if (await menu.count() === 0) return null;
  if (await menu.getAttribute('open') === null) await menu.locator('summary').click();
  return menu;
}

export async function openPrimaryNavigation(page: Page): Promise<Locator> {
  const header = page.locator('header.site-header:visible');
  const desktop = header.getByRole('navigation', {
    name: 'Primary navigation',
    exact: true,
  });
  if (await desktop.isVisible()) return desktop;
  await openMobileMenu(page);
  return header.getByRole('navigation', { name: /^(?:Site menu|전체 메뉴)$/, exact: true });
}

export async function openCityNavigation(page: Page): Promise<Locator> {
  const header = page.locator('header.site-header:visible');
  const desktop = await openDesktopContextMenu(header, 'site-header__context-menu--market');
  if (desktop) return desktop.getByRole('navigation', { name: 'Market navigation', exact: true });
  await openMobileMenu(page);
  return header.getByRole('navigation', { name: /^(?:Choose a city|도시 선택)$/, exact: true });
}

export async function openMarketPagesNavigation(
  page: Page,
  market: 'Seoul' | 'Singapore' | 'Dubai',
): Promise<Locator> {
  const header = page.locator('header.site-header:visible');
  const desktop = await openDesktopContextMenu(header, 'site-header__context-menu--market');
  if (desktop) return desktop.getByRole('navigation', {
    name: `${market} market navigation`,
    exact: true,
  });
  await openMobileMenu(page);
  return header.getByRole('navigation', { name: `${market} pages`, exact: true });
}
