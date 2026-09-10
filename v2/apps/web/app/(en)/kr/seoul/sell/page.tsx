import { notFound } from 'next/navigation';

// This retired route must resolve to the custom 404, not the generic
// country/city/intent fallback's on-demand static generation.
export default function RetiredSeoulSellPage() {
  notFound();
}
