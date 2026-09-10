import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { CostStructureInfographic } from './cost-structure';
import { DistrictComparisonInfographic } from './district-comparison';
import { MarketTrendInfographic } from './market-trend';
import { PolicyChangeInfographic } from './policy-change';
import { PolicyTimelineInfographic } from './policy-timeline';

export function Infographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  switch (spec.template) {
    case 'policy-before-after': return <PolicyChangeInfographic spec={spec} />;
    case 'policy-timeline': return <PolicyTimelineInfographic spec={spec} />;
    case 'district-comparison': return <DistrictComparisonInfographic spec={spec} />;
    case 'market-trend': return <MarketTrendInfographic spec={spec} />;
    case 'cost-structure': return <CostStructureInfographic spec={spec} />;
  }
}
