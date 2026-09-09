export type AmktcTariff = { rooms: number; rateType: 'normal' | 'reduced'; amount: number; effectiveOn: '2024-07-01'; currency: 'SGD'; unit: 'monthly'; authority: 'Ang Mo Kio Town Council' };
function plain(value: string) { return value.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim(); }
/** Only the verified Tier2, ordinary 1–4-room table. Fail closed when structure/date change. */
export function extractAmktcTariffs(html: string): AmktcTariff[] {
 if(/Tier\s+[3-9]\s+S(?:&amp;|&)CC/i.test(html))throw new Error('amktc_newer_tier_unreviewed');
 const start=html.indexOf('Tier 2 S&amp;CC Increment - 1st July 2024');
 const end=html.indexOf('Tier 1 S&amp;CC Increment',start+1);
 if(start<0 || end<start) throw new Error('amktc_section_changed');
 const section=html.slice(start,end); const table=section.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i)?.[1];
 if(!table || !table.includes('Normal Rate') || !table.includes('Reduced Rates')) throw new Error('amktc_columns_changed');
 const result: AmktcTariff[]=[]; const seen=new Set<number>();
 for(const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
  const cells=[...row[1]!.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell)=>plain(cell[1]!));
  const rooms=cells[0]?.match(/^\d+\.\s*([1-4])-room flat$/i)?.[1];
  if(!rooms) continue;
  if(cells.length!==3 || seen.has(Number(rooms))) throw new Error('amktc_rows_changed');
  seen.add(Number(rooms));
  for(const [index,rateType] of [[1,'normal'],[2,'reduced']] as const) {
   if(!/^\$\d{1,4}\.\d{2}$/.test(cells[index]!)) throw new Error('amktc_amount_changed');
   const amount=Number(cells[index]!.slice(1));
   if(amount<=0) throw new Error('amktc_amount_changed');
   result.push({rooms:Number(rooms),rateType,amount,effectiveOn:'2024-07-01',currency:'SGD',unit:'monthly',authority:'Ang Mo Kio Town Council'});
  }
 }
 if(seen.size!==4) throw new Error('amktc_rows_missing');
 return result;
}
