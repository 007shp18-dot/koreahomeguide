import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialGrowthReviewShell } from '@/components/design-review/editorial-growth-review-shell';
import {
  REVIEW_SURFACES,
  resolveReviewQuery,
  type ReviewSurface,
} from '@/lib/design-review/editorial-growth-review-model';
import { buildEditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model.server';

export const metadata: Metadata = {
  title: 'SignedPrice editorial growth design review',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return REVIEW_SURFACES.map((surface) => ({ surface }));
}

export default async function EditorialGrowthReviewPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ surface: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { surface } = await params;

  if (!REVIEW_SURFACES.includes(surface as ReviewSurface)) {
    notFound();
  }

  const query = resolveReviewQuery(await searchParams);
  const model = await buildEditorialGrowthReviewModel(query);

  return (
    <EditorialGrowthReviewShell
      surface={surface as ReviewSurface}
      model={model}
    />
  );
}
