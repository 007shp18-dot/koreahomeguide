import type { Metadata } from 'next';

import { RentCheckWorkspace } from '@/components/rent-check/rent-check-workspace';
import { ToolsShell } from '@/components/tools/tools-shell';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';
import {
  DEFAULT_RENT_CHECK_INPUT,
  type RentCheckInput,
} from '@/lib/rent-check/client-state';
import { resolveExplorerRentCheckContext } from '@/lib/rent-check/explorer-context';
import { indexableMetadata } from '@/lib/public-metadata';

type RentCheckPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/tools/rent-check/',
  title: 'Seoul Rent Check | signedprice',
  description: 'Compare a Seoul rent quote with compatible official reported contracts.',
});

export default async function RentCheckPage({ searchParams }: RentCheckPageProps) {
  const explorerContext = resolveExplorerRentCheckContext(await searchParams);
  const initialInput: RentCheckInput = explorerContext ? {
    ...DEFAULT_RENT_CHECK_INPUT,
    lawdCd: explorerContext.lawdCd,
    housingType: explorerContext.housingType,
  } : DEFAULT_RENT_CHECK_INPUT;

  return (
    <ToolsShell locale="en" href="/kr/seoul/tools/rent-check/">
      <ResearchPageHeading
        title="Check a Seoul rent quote"
        description="Compare your deposit and monthly rent with similar reported contracts."
      />
      <RentCheckWorkspace initialInput={initialInput} explorerContext={explorerContext} />
    </ToolsShell>
  );
}
