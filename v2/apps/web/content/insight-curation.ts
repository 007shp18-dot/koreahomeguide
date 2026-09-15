// Retired coverage explainers redirect to substantive articles. Exclude any
// older cached copies from discovery as well.
export const INSIGHT_REFERENCE_SLUGS = [
  'seoul-sale-market-monthly-brief',
  'seoul-jeonse-market-monthly-brief',
  'seoul-monthly-rent-market-brief',
  'singapore-private-market-quarterly-brief',
] as const;

export function isInsightReference(slug: string): boolean {
  return INSIGHT_REFERENCE_SLUGS.some(reference => reference === slug);
}

// Stored profiles use the data-story route but belong with neighborhood stories.
// Curate their topic explicitly; titles and author names are not reliable types.
const NEIGHBORHOOD_EDITORIAL_SLUGS: readonly string[] = [
  'dubai-without-a-car-metro-last-mile',
  'singapore-everton-park-blair-plain-afternoon',
  'seoul-euljiro-read-the-workshop-signs',
  'dubai-deira-gold-and-spice-walk',
  'seoul-buam-dong-afternoon-walk',
  'tokyo-koenji-vintage-evening-walk',
  'singapore-queenstown-everyday-heritage',
  'tokyo-kiyosumi-shirakawa-between-stops',
  'seoul-mullae-steel-and-art',
  'singapore-kampong-gelam-trades-and-streets',
  'dubai-al-fahidi-creek-walk',
  'tokyo-kuramae-craft-and-river',
];

export function isNeighborhoodEditorial(slug: string): boolean {
  return NEIGHBORHOOD_EDITORIAL_SLUGS.includes(slug);
}

export const MONTHLY_REPORT_REFERENCES: Readonly<Record<string, readonly string[]>> = {};
