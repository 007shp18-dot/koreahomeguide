const fs=require('node:fs'),path=require('node:path');
const sharp=require('../../v2/node_modules/.pnpm/sharp@0.35.4_@types+node@20.19.43/node_modules/sharp');
const data=require('./2026-09-11-sales.json');
const output=process.argv[2];
if(!output)throw new Error('Pass an output directory');
fs.mkdirSync(output,{recursive:true});
const aliases={
 '타워팰리스2':'Tower Palace 2',
 '나인원한남':'Nine One Hannam','갤러리아포레':'Galleria Foret','래미안퍼스티지':'Raemian Firstige','한양4':'Hanyang 4','래미안원베일리':'Raemian One Bailey','아크로리버파크':'Acro River Park','한양3':'Hanyang 3','신현대9차':'Shin Hyundai 9','현대13차(208~211동)':'Hyundai 13 (208–211)',
 '한양아이클래스':'Hanyang I-Class','비즈트위트바이올렛5차':'Biz Twit Violet 5','와이즈플레이스':'Wise Place','프라비다트라움':'Pravida Traum','코스모그린':'Cosmo Green','비즈트위트오렌지':'Biz Twit Orange','대림역포스큐':'Daerim Station Pos-Q','해담채3':'Haedamchae 3','강동큐브':'Gangdong Cube',
};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,s,size=24,color='#172030',weight=400,anchor='start')=>`<text x="${x}" y="${y}" font-family="${size>=39?'Archivo':'Inter'}, Noto Sans CJK KR, sans-serif" letter-spacing="${size>=39?-1.4:size>=23?-0.35:0}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`;
const title=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bIi\b/g,'II');
const compact=(n,kr)=>{
 const value=Number(n), [divisor,suffix]=Math.abs(value)>=1e9?[1e9,'B']:Math.abs(value)>=1e6?[1e6,'M']:Math.abs(value)>=1e3?[1e3,'K']:[1,''];
 return `${kr?'₩':'S$'}${(value/divisor).toLocaleString('en-US',{maximumFractionDigits:3})}${suffix}`;
};
const headline=compact;
const badge=(rank,x,y,large=false)=>{
 const w=large?88:66,h=large?104:50,color=rank===1?'#f2c65d':rank===2?'#dbe3ed':'#e5bc98';
 return `<path d="M${x} ${y}h${w}v${h}l-${w/2} -8l-${w/2} 8Z" fill="${color}"/>`+text(x+w/2,y+(large?29:17),'TOP',large?19:12,'#172030',700,'middle')+text(x+w/2,y+(large?77:37),rank,large?45:23,'#172030',600,'middle');
};
async function card({city,order,month,rows,regional=false,conditions,sourceDate,checkedAt="2026-09-11"}){
 const kr=city==='seoul',low=order==='lowest',lead=rows[0];if(!lead)return;
 const count=Math.min(10,rows.length),accent=low?'#0b7168':'#2563d8';
 let s='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#fff"/><g font-family="Inter, Noto Sans CJK KR, sans-serif">';
 s+=text(56,60,'signedprice',29,'#172030',600)+text(1024,60,regional?'THE RENT MAP':'THE SALE LIST',18,'#687385',600,'end');
 s+='<path d="M56 86H1024" stroke="#172030" stroke-width="2"/>';
 s+=text(56,156,kr?'SEOUL':'SINGAPORE',62,'#172030',600)+text(1024,151,`TOP ${count}`,34,accent,600,'end');
 s+=text(56,209,regional?(low?'Lowest district rents':'Highest district rents'):(low?'Lowest reported sales':'Highest reported sales'),39,'#172030',500);
 s+=text(56,248,`${month} · ${regional?'Monthly rent medians':kr?'Apartment contracts':'Private condo contracts'}`,22,'#687385',500);
 s+='<path d="M56 277H1024" stroke="#172030" stroke-width="3"/>';
 s+=badge(lead.rank,56,308,true)+text(168,334,lead.name,lead.name.length>30?28:33,'#172030',600);
 s+=text(168,369,lead.detail,21,'#687385',500);
 const big=headline(lead.amount,kr,regional);
 s+=text(168,429,big,big.length>22?48:64,accent,600)+(regional?text(1024,429,'/ month',22,'#687385',600,'end'):'');
 s+=text(168,466,regional?(kr?`Median deposit ${compact(lead.deposit,true)} · ${lead.n} contracts`:`${lead.n} matched contracts`):(kr?'KRW · Total transaction price':'SGD · Total transaction price'),19,'#687385',500);
 s+='<path d="M56 493H1024" stroke="#172030" stroke-width="2"/>';
 s+=text(56,523,'RANK',15,'#687385',700)+text(150,523,regional?'DISTRICT / MATCHED CONTRACTS':'PROPERTY / AREA',17,'#687385',600)+text(1024,523,regional?'MEDIAN / MONTH':'TOTAL CONTRACT PRICE',17,'#687385',600,'end');
 rows.slice(1,count).forEach((r,i)=>{
  const y=537+i*63;if(i%2===0)s+=`<rect x="56" y="${y}" width="968" height="63" fill="#f4f6f8"/>`;
  s+=r.rank<=3?badge(r.rank,58,y+4):text(90,y+35,String(r.rank).padStart(2,'0'),24,'#687385',600,'middle');
  s+=text(150,y+26,r.name,r.name.length>32?20:23,'#172030',500)+text(150,y+51,r.detail,16,'#687385',450);
  s+=text(1024,y+28,compact(r.amount,kr),28,accent,600,'end');
  if(regional&&kr)s+=text(1024,y+52,`Deposit ${compact(r.deposit,true)}`,16,'#687385',500,'end');
 });
 s+='<path d="M56 1112H1024" stroke="#172030" stroke-width="2"/>';
 s+=text(56,1148,conditions,20,'#172030',500);
 s+=text(56,1180,regional?'10+ contracts per district. Conditions still vary within each group.':'Reported contracts, not available listings. Floor area matters.',18,'#687385');
 s+=text(56,1210,`Source: ${kr?'MOLIT':'URA'} · Collected ${sourceDate} · Checked ${checkedAt} (UTC)`,18,'#687385');
 s+=text(56,1240,'K = thousand · M = million · B = billion · Rounded; ranks use exact amounts.',18,'#687385');
 s+=text(56,1270,regional&&kr?'Eligibility varies; median rent and deposit are separate statistics.':regional?'Condo-linked projects only; unmatched projects excluded.':'Reported amounts; late filings and corrections can change rankings.',18,'#687385');
 s+=text(56,1320,regional?'Compare districts & conditions':'Explore the full TOP 50',27,'#172030',600)+text(1024,1320,'signedprice.com/rankings',23,accent,700,'end')+'</g></svg>';
 const file=`${city}-${regional?'district-rent':'sale'}-${order}-${month}`;
 fs.writeFileSync(path.join(output,file+'.svg'),s);await sharp(Buffer.from(s)).png().toFile(path.join(output,file+'.png'));
}
async function main(){
 for(const city of ['seoul','singapore'])for(const order of ['highest','lowest']){
  const raw=data.rows.filter(r=>r.city===city&&r.kind==='sale'&&r.order===order);
  await card({city,order,checkedAt:data.checkedAt,month:raw[0].month,sourceDate:raw[0].source_as_of.slice(0,10),conditions:city==='seoul'?'Apartments only · Exclusive area · Clear source property names':'URA condominium classification · Single-unit sales only',rows:raw.slice(0,10).map(r=>({...r,name:aliases[r.name]||title(r.name),detail:city==='seoul'?`${r.name} · ${Number(r.area)} m²`:`District ${r.district} · ${Number(r.area)} m²`}))});
 }
 const regionPath=path.join(__dirname,'2026-09-11-regional-rents.json');
 if(fs.existsSync(regionPath))for(const group of JSON.parse(fs.readFileSync(regionPath,'utf8')).groups)for(const order of ['highest','lowest']){
  const sorted=[...group.rows].sort((a,b)=>(order==='highest'?b.amount-a.amount:a.amount-b.amount)||a.region.localeCompare(b.region));let rank=1;
  const rows=sorted.map((r,i)=>{if(i===0||r.amount!==sorted[i-1].amount)rank=i+1;return {...r,rank,name:group.city==='seoul'?title(r.region):`District ${r.region}`,deposit:r.median_deposit,detail:`${r.n} contracts · ${group.area} m²${group.city==='singapore'?' · '+group.beds+' bedrooms':''}`};});
  if(rows.length)await card({city:group.city,order,month:rows[0].month,sourceDate:rows.map(r=>r.source_as_of).sort().at(-1).slice(0,10),rows,regional:true,conditions:group.city==='seoul'?'40 < area ≤ 60 m² · Deposit ₩100M–300M (upper excluded)':'2 bedrooms · URA area ranges within 60–90 m² · Condos'});
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
