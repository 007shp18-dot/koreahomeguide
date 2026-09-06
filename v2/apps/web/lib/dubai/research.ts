export const DUBAI_RESEARCH_DATE = '2026-09-06';
export const DUBAI_SOURCES = {
  annual2024: 'https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-sector-records-aed761-billion-in-transactions-in-2024',
  annual2025: 'https://dmo.dof.gov.ae/en/news-and-publications/latest-press-releases/dubai-s-real-estate-market-records-new-historic-milestone-with-transactions-exceeding-aed917-billion-usd-2497-bn-in-2025/',
  quarter2026: 'https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-transactions-surge-31-to-reach-aed-252-billion-in-q1-2026/',
  projects: 'https://dubailand.gov.ae/en/eservices/real-estate-project-status-landing/real-estate-project-status',
  charges: 'https://dubailand.gov.ae/en/eservices/service-charge-index-overview/',
  services: 'https://dubailand.gov.ae/en/eservices/all-services/',
  rest: 'https://dubailand.gov.ae/en/eservices/dubai-rest/',
  data: 'https://dubailand.gov.ae/en/open-data/real-estate-data/',
} as const;

/** Aggregate government releases, all transaction classes; never residential sale prices. */
export const DUBAI_ANNUAL_TRANSACTIONS = [
  { year: '2024', valueBillions: 761, source: DUBAI_SOURCES.annual2024, published: '2025-01-26' },
  { year: '2025', valueBillions: 917, source: DUBAI_SOURCES.annual2025, published: '2026-01-12' },
] as const;

export const DUBAI_AREAS = [
  { id: 'downtown-dubai', name: 'Downtown Dubai', kind: 'Central district', description: 'The district around Burj Khalifa and Dubai Mall.', question: 'For a tower shortlist, compare the exact building, unit orientation and access route. Landmark proximity alone does not establish a comparable price.', source: 'https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/downtown-dubai' },
  { id: 'business-bay', name: 'Business Bay', kind: 'Canal district', description: 'A mixed-use district beside Downtown and the Dubai Water Canal.', question: 'Check whether the unit is residential, serviced or another permitted use. Compare the actual building location and annual charges before combining nearby towers.', source: 'https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/business-bay' },
  { id: 'dubai-marina', name: 'Dubai Marina', kind: 'Waterfront district', description: 'A waterfront neighbourhood built around the marina and its promenade.', question: 'Record the tower, parking arrangements and walking route to transport. Separate a marina-facing unit from an inland-facing unit in the same building.', source: 'https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/dubai-marina' },
  { id: 'palm-jumeirah', name: 'Palm Jumeirah', kind: 'Island district', description: 'The palm-shaped island with residential, hotel and beachfront areas.', question: 'Keep apartment and villa research separate. Check the precise location, access arrangements and building or community charges against the property documents.', source: 'https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/palm-jumeirah' },
] as const;

export function filterDubaiAreas(query: string) {
  const normalized = query.trim().toLocaleLowerCase('en');
  return DUBAI_AREAS.filter((area) => `${area.name} ${area.kind}`.toLocaleLowerCase('en').includes(normalized));
}
