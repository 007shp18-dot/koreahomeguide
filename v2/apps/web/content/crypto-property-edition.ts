import type { EditorialPortfolioRecord } from './portfolio-types';
import bodies from './editions/september-16-crypto/dubai-crypto.json';

const slug = 'dubai-buy-property-with-bitcoin';
const checkedAt = '2026-09-16';
const publishedAt = '2026-09-16T11:00:00Z';
const sources = [
  { id: 'dld-sale-registration', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Property Sale Registration: procedures, fees and payment methods', href: 'https://dubailand.gov.ae/en/eservices/property-sale-registration/', checkedAt },
  { id: 'vara-register', kind: 'primary' as const, publisher: 'VARA', title: 'Public Register: licence status and authorised activities', href: 'https://www.vara.ae/en/licenses-and-register/public-register/', checkedAt },
  { id: 'cbuae-payment-token', kind: 'primary' as const, publisher: 'Central Bank of the UAE', title: 'Payment Token Services Regulation: business-payment restrictions', href: 'https://rulebook.centralbank.ae/en/rulebook/payment-token-services-regulation', checkedAt },
];
export const CRYPTO_PROPERTY_EDITION: readonly EditorialPortfolioRecord[] = (['en', 'ko'] as const).map(locale => {
  const ko = locale === 'ko';
  const title = ko ? '비트코인으로 두바이 집을 산다면, 돈은 어떻게 움직일까?' : 'Buying a Dubai Home with Bitcoin: Where Does the Money Go?';
  return {
    id: `${locale}:${slug}`, slug, locale, marketId: 'ae-dubai', type: 'market-brief', title,
    deck: ko ? '코인 수취 광고에서 실제 소유권 이전까지. 환전, 자금 증빙, 정산 시점과 환불 조건을 따라가며 구매 과정을 살펴본다.' : 'From a crypto-payment headline to a completed purchase: conversion, the money trail, settlement deadlines and what happens if the deal falls through.',
    bodyMarkdown: bodies[locale], status: 'published', evidenceState: 'verified', authorName: 'SignedPrice Editorial',
    reviewedBy: 'SignedPrice Editorial (AI-assisted source and calculation review)', reviewedAt: publishedAt, publishedAt, updatedAt: publishedAt,
    readerQuestion: title, revisionNote: 'Primary-source process review; CBUAE indexed text checked for payment restrictions. Hypothetical calculations, not live quotes. No provider endorsement or project acceptance claimed.',
    sources, evidenceReleaseIds: ['september-16-crypto-process-review'], canonicalHref: `${ko ? '/ko' : ''}/news/${slug}/`, translationGroupId: slug,
    relatedHref: `${ko ? '/ko' : ''}/ae/dubai/explore/`, infographic: null,
  };
});
