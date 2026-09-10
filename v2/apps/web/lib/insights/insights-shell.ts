import { homepageCopy, type SiteFooterModel, type SiteHeaderModel } from '../site-copy';

export const INSIGHTS_HEADER: SiteHeaderModel = Object.freeze({
  ...homepageCopy.header,
  links: homepageCopy.header.links.map((link) => Object.freeze({
    ...link,
    isCurrent: link.href === '/news/',
  })),
});

export const INSIGHTS_FOOTER: SiteFooterModel = Object.freeze({
  ...homepageCopy.footer,
  descriptor: 'Original property reporting built from visible evidence boundaries.',
  links: Object.freeze([
    { label: 'Newsroom', href: '/news/' },
    ...homepageCopy.footer.links,
  ]),
});
