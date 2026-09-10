import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {SavedCities} from '@/components/global-shortlist/saved-cities';
export const metadata = {title:'Saved places | SignedPrice', robots:{index:false,follow:true}};
export default function Page() {return <ToolsShell locale="en" href="/saved/"><ResearchPageHeading title="Saved places" description="Return to your saved buildings and check their latest records in Seoul, Singapore and Dubai."/><SavedCities locale="en" initiallyOpen /></ToolsShell>;}
