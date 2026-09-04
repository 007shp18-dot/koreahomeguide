import type { Metadata } from 'next';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { PolicyTracker } from '@/components/newsroom/policy-tracker';
import { policyRepository } from '@/lib/policy/policy-repository.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/news/policy/',
  title: 'Property policy tracker | signedprice',
  description: 'Track announced, enacted, effective, amended and expired housing policies for Seoul and Singapore against official sources.',
});

export default function PolicyTrackerPage() {
  return <EditorialGrowthPublicFrame locale="en" surface="content">
    <PolicyTracker policies={policyRepository.list()} referenceDate={new Date().toISOString().slice(0, 10)} />
  </EditorialGrowthPublicFrame>;
}
