import type { Page } from '@playwright/test';
/** Existing market release fixtures have no writable community DB. */
export async function emptyQuestions(page: Page) {
 await page.route('**/api/questions/**',route=>route.fulfill({json:route.request().url().includes('/account/')?{user:null}:{posts:[],hasMore:false}}));
}
