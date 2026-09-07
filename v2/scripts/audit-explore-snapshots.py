import json,gzip,re,statistics,collections,math,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'apps/web/data'
def read(n):return json.loads(gzip.decompress((root/n).read_bytes()))
inv=read('observed-building-inventory.json.gz')['records']; sale=read('korea-sale-evidence.json.gz'); rent=read('korea-rent-evidence.json.gz'); sg=read('singapore-private-sale.json.gz'); du=read('dubai-area-evidence.json.gz')
def dup(rows,key):return {str(k):v for k,v in collections.Counter(key(r) for r in rows).items() if v>1}
def krkey(r):return (r['districtSlug'],r['buildingId'])
si={krkey(r):r for r in sale['buildingRecords']};ri={krkey(r):r for r in rent['buildingRecords']};ii={krkey(r):r for r in inv}
issues=[]
for source,data,metric in [('sale',sale,'price'),('rent',rent,'primary')]:
 for row in data['buildingRecords']:
  for c in row['cohorts']:
   m=c[metric]
   if m.get('published'):
    vals=[m.get(k) for k in ['min','p25','med','p75','max']]
    if m['n']<data['publicationMinimum'] or any(not isinstance(v,(int,float)) or not math.isfinite(v) or v<0 for v in vals) or vals!=sorted(vals):issues.append([source,row['buildingId'],c.get('transaction'),c['areaBand']])
sgrows=collections.defaultdict(list)
for row in sg['records']:sgrows[row['projectId']].append(row)
sgissues=[];loc=collections.Counter(); coordkeys=collections.defaultdict(list)
for p in sg['projects']:
 rows=sgrows[p['id']]; prices=[r['priceSgd'] for r in rows]
 if p['n']!=len(rows) or (p['published'] and abs(statistics.median(prices)-p['medianPriceSgd'])>1):sgissues.append(p['id'])
 points=[(r['x'],r['y']) for r in rows if isinstance(r.get('x'),(int,float)) and isinstance(r.get('y'),(int,float)) and 0<=r['x']<=60000 and 0<=r['y']<=60000]
 if not points:loc['missing']+=1
 elif any(math.dist(points[0],pt)>250 for pt in points):loc['conflicting_over_250m']+=1
 else:loc['consistent']+=1;coordkeys[points[0]].append(p['id'])
duissues=[];ids={a['id'] for a in du['areas']}
for a in du['areas']:
 for seg in a['segments']:
  for typ,m in seg['sales'].items():
   if m and (m['n']<du['publicationMinimum'] or not 0<m['priceP25Aed']<=m['medianPriceAed']<=m['priceP75Aed']):duissues.append([a['slug'],typ,'price'])
  for typ,targets in seg.get('comparableAreaIds',{}).items():
   for target in targets:
    if target not in ids:duissues.append([a['slug'],typ,'missing_comparable',target])
union={**ii,**si}; names=collections.defaultdict(list)
for k,r in union.items():names[(r['districtSlug'],r['neighborhoodName'],r['officialName'])].append(r['buildingId'])
out={'scope':'Installed full snapshots; DB projection inventory audited separately. Bounds/consistency checks do not establish real-world address accuracy.', 'seoul':{'rental_inventory':len(inv),'sale_buildings':len(si),'union_buildings':len(union),'sale_only_buildings_not_in_rent_inventory':len(set(si)-set(ii)),'rent_inventory_missing_evidence':len(set(ii)-set(ri)),'duplicate_inventory_ids':dup(inv,krkey),'duplicate_sale_ids':dup(sale['buildingRecords'],krkey),'numeric_lot_names':sum(bool(re.fullmatch(r'\(?산?\d+(?:-\d+)?\)?',r['officialName'].strip())) for r in union.values()),'name_collisions_same_neighborhood':sum(len(v)>1 for v in names.values()),'sale_rent_identity_mismatches':[list(k) for k in si.keys()&ri.keys() if any(si[k][f]!=ri[k][f] for f in ['officialName','neighborhoodName','housingType'])],'published_cohort_issues':issues,'period':sale['provenance']['period'],'central_park':[r for r in union.values() if r['districtSlug']=='yongsan-gu' and r['officialName']=='센트럴파크']},'singapore':{'projects':len(sg['projects']),'transactions':len(sg['records']),'duplicate_project_ids':dup(sg['projects'],lambda r:r['id']),'orphan_transaction_project_ids':len(set(sgrows)-{p['id'] for p in sg['projects']}),'count_or_median_mismatches':sgissues,'coordinate_groups':dict(loc),'shared_coordinate_groups':sum(len(v)>1 for v in coordkeys.values()),'period':sg['period']},'dubai':{'areas':len(du['areas']),'segments':sum(len(a['segments']) for a in du['areas']),'duplicate_ids':dup(du['areas'],lambda r:r['id']),'price_or_reference_issues':duissues,'area_only_no_building_coordinates':True,'coverage':du['totals'],'period':du['comparisonPeriod']}}
if len(sys.argv)>1: Path(sys.argv[1]).write_text(json.dumps(out,ensure_ascii=False,indent=2))
out['seoul']['central_park']=[{'id':r['buildingId'],'name':r['officialName'],'neighborhood':r['neighborhoodName']} for r in out['seoul']['central_park']]
print(json.dumps(out,ensure_ascii=False,indent=2))
