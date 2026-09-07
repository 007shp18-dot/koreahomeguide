"""Verify downloaded district-month coverage and package all source rows."""
import csv,gzip,hashlib,json,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path('/workspace/scratch/c6531e12b8d9/korea-history-2020-latest')
manifest=json.loads((ROOT/'manifest.json').read_text())
assert manifest['complete'] and len(manifest['coordinates'])==2025
fields=set();total=0;monthly={};files=[]
for coord in manifest['coordinates']:
 path=ROOT/f"{coord['lawdCd']}-{coord['dealYmd']}.json.gz"
 with gzip.open(path,'rt') as f:data=json.load(f)
 count=0
 for page in data['pages']:
  assert hashlib.sha256(page['xml'].encode()).hexdigest()==page['sha256']
  rows=ET.fromstring(page['xml']).findall('./body/items/item')
  assert len(rows)==page['recordCount']
  for row in rows:fields.update(e.tag for e in row)
  count+=len(rows)
 assert count==coord['records']==data['totalCount']
 total+=count;monthly[coord['dealYmd']]=monthly.get(coord['dealYmd'],0)+count;files.append(path)
assert total==manifest['records']
output=ROOT/'seoul-apartment-sales-202001-202609.csv.gz'
with gzip.open(output,'wt',encoding='utf-8-sig',newline='') as f:
 writer=csv.DictWriter(f,fieldnames=['query_lawd_cd','query_deal_ymd','retrieved_at']+sorted(fields));writer.writeheader()
 for path in files:
  with gzip.open(path,'rt') as src:data=json.load(src)
  for page in data['pages']:
   for item in ET.fromstring(page['xml']).findall('./body/items/item'):
    writer.writerow({'query_lawd_cd':data['lawdCd'],'query_deal_ymd':data['dealYmd'],'retrieved_at':page['fetchedAt'],**{x.tag:(x.text or '').strip() for x in item}})
manifest['monthlyCounts']=monthly
manifest['csvSha256']=hashlib.sha256(output.read_bytes()).hexdigest()
manifest['limitations']=['September 2026 is an incomplete calendar month.','Historical cancellations and corrections reflect provider state at retrieval, not original report time.','The API is read over multiple requests, not an atomic market snapshot.','All reported rows are retained; cancellations and possible duplicate source records are not silently removed.']
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(ROOT/'README.txt').write_text('서울 아파트 매매 실거래 원본\n2020년 1월~2026년 9월 현재, 서울 25개 구\n국토교통부 아파트 매매 실거래가 상세 API에서 직접 조회했습니다.\nCSV는 원본 필드를 보존하며, 취소 거래도 포함합니다. 가격 필드 dealAmount의 단위는 만원입니다.\n2026년 9월은 진행 중인 달이며, 신고 지연으로 최신 월의 건수는 이후 증가할 수 있습니다.\nmanifest.json에 구·월별 검증 건수와 다운로드 시점이 있습니다. raw/에 API 원본 XML을 포함한 페이지별 응답을 보관했습니다.\n')
archive=ROOT/'seoul-apartment-sales-2020-latest.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED) as z:
 for name in ['README.txt','manifest.json',output.name]:z.write(ROOT/name,name)
 for path in files:z.write(path,'raw/'+path.name)
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'records':total,'districtMonths':len(files),'monthlyCounts':monthly}))
