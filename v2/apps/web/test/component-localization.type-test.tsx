import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { TrustStrip } from '../components/trust-strip';
import { KOREAN_SITE_HEADER } from '../lib/locale/ko';
import type {
  SiteFooterModel,
  SiteHeaderModel,
  TrustStripModel,
} from '../lib/site-copy';

const localizedHeader = {
  brand: 'signedprice',
  homeLabel: 'Accueil signedprice',
  navigationLabel: 'Navigation principale',
  navigationVariant: 'supplied',
  links: [
    { label: 'Marchés', href: '#markets' },
    { label: 'Fonctionnement', href: '#principles' },
    { label: 'Méthodologie', href: '#methodology' },
  ],
} as const satisfies SiteHeaderModel;

const localizedFooter = {
  brand: 'signedprice',
  descriptor: 'Intelligence immobilière pour Séoul, Singapour et Dubaï.',
  navigationLabel: 'Navigation de pied de page',
  links: [
    { label: 'Marchés', href: '#markets' },
    { label: 'Méthodologie', href: '#methodology' },
    { label: 'Retour en haut', href: '#top' },
  ],
  status: "Fondation d'aperçu. Le lancement public n'est pas encore autorisé.",
} as const satisfies SiteFooterModel;

const localizedTrust = {
  sectionLabel: 'Méthodologie et confiance',
  eyebrow: 'Méthodologie',
  heading: "L'étiquette accompagne la preuve.",
  description:
    "La source, la période, la méthode, les corrections et les droits d'utilisation restent visibles.",
  items: [
    { term: 'Sources', description: 'Nommées par marché et jeu de données' },
    { term: 'Droits', description: 'Refusés sans approbation explicite' },
    { term: 'Préparation', description: "Non indexé jusqu'à validation" },
  ],
} as const satisfies TrustStripModel;

export const localizedComponentFixtures = [
  createElement(SiteHeader, { copy: localizedHeader }),
  createElement(SiteFooter, { copy: localizedFooter }),
  createElement(TrustStrip, { copy: localizedTrust }),
];

describe('localized shared components', () => {
  it('renders region-only navigation and a crawlable English switch', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={KOREAN_SITE_HEADER} />);

    expect(html).toContain('aria-label="Market navigation"');
    expect(html).toContain('>Seoul<');
    expect(html).toContain('>Singapore<');
    expect(html).toContain('>Dubai<');
    expect(html).toContain('href="/kr/seoul"');
    expect(html).toMatch(/hreflang="en"/i);
    expect(html).not.toContain('>Briefs<');
  });
});
