import { GET } from '../../api/japan/transactions/route';

export const dynamic = 'force-dynamic';
type RecordRow = {rowReference:string;type:string;municipality:string;district:string;price:number|null;currency:string;areaSqm:number|null;areaLabel:string;floorPlan:string;buildingYear:string;structure:string;period:string};
export default async function Tokyo({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  const query=new URLSearchParams();
  for(const key of ['city','year','quarter']) {
    const value=params[key]; if(typeof value==='string') query.set(key,value);
  }
  const response=await GET(new Request('https://signedprice.com/api/japan/transactions?'+query));
  const data=await response.json();
  const records=(data.records??[]) as RecordRow[];
  const format=(n:number|null)=>n===null?'Not disclosed':new Intl.NumberFormat('en').format(n);
  const wards=[['13103','Minato'],['13113','Shibuya'],['13104','Shinjuku'],['13102','Chuo'],['13101','Chiyoda'],['13112','Setagaya']];
  return <main style={{maxWidth:1200,margin:'40px auto',padding:'0 24px',fontFamily:'Arial, sans-serif',color:'#182329'}}>
    <p style={{fontSize:12,letterSpacing:2,color:'#657784'}}>JAPAN · TRANSACTION EVIDENCE</p>
    <h1 style={{fontSize:42,fontWeight:500,letterSpacing:-1.5,margin:'15px 0'}}>A closer look at Tokyo.</h1>
    <p>Recorded prices, neighbourhoods, floor plans and building ages.</p>
    <form style={{display:'flex',gap:16,flexWrap:'wrap',padding:'25px 0'}}>
      <label>Ward <select name="city" defaultValue={query.get('city')??'13103'}>{wards.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
      <label>Year <select name="year" defaultValue={query.get('year')??'2025'}>{['2024','2025','2026'].map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Quarter <select name="quarter" defaultValue={query.get('quarter')??'4'}>{['1','2','3','4'].map(v=><option key={v} value={v}>Q{v}</option>)}</select></label>
      <button type="submit" style={{background:'#254fce',color:'#fff',padding:'8px 20px',border:0,borderRadius:3}}>Explore transactions</button>
    </form>
    {!response.ok?<p role="alert">The source could not be loaded. Status: {data.error}. This is not a zero-transactions result.</p>:<>
      <p>{data.returnedRecords} records returned · {data.query.year} Q{data.query.quarter} · {data.truncated?'Excerpt of '+data.totalSourceRecords+' source records':'Complete response for this ward and quarter'}</p>
      <p style={{fontSize:12,color:'#637784'}}>MLIT Real Estate Information Library · XIT001 · Retrieved {data.retrievedAt}</p>
      <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['Reference','Neighbourhood','Type','Price (JPY)','Area (m²)','Floor plan','Built','Period'].map(label=><th key={label} style={{textAlign:'left',padding:12,borderBottom:'1px solid #cbd5df'}}>{label}</th>)}</tr></thead><tbody>{records.map(row=><tr key={row.rowReference}>{[row.rowReference,row.district||row.municipality,row.type,format(row.price),row.areaLabel||'Not disclosed',row.floorPlan||'Not disclosed',row.buildingYear||'Not disclosed',row.period].map((cell,i)=><td key={i} style={{padding:12,borderBottom:'1px solid #e2e8ed'}}>{cell}</td>)}</tr>)}</tbody></table></div>
      {!records.length&&<p>No disclosed transactions returned for this ward and quarter. Try an earlier quarter.</p>}
    </>}
    <p style={{fontSize:13,color:'#637784',margin:'30px 0'}}>These are anonymized transaction records, not listings. The source does not disclose building names, exact addresses or unit identities. Area and prices retain the provider's disclosed precision. No exact property-location pins are inferred.</p>
    <a href="https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/">Source and field definitions ↗</a>
  </main>;
}
