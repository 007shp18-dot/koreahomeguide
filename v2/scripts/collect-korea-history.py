"""Read authenticated Vercel preview export; resumable full-page source archive.
Requires requests (pip install requests). Supply the official temporary preview
share URL on stdin; it is never saved. SIGNEDPRICE_HISTORY_OUTPUT sets the output directory.
"""
import concurrent.futures, gzip, hashlib, json, math, os, re, sys, threading, time
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlsplit
import requests
Session = requests.Session

OUT = Path(os.environ.get('SIGNEDPRICE_HISTORY_OUTPUT', 'korea-history-2020-latest')).resolve()
OUT.mkdir(exist_ok=True)
DISTRICTS = ['11110','11140','11170','11200','11215','11230','11260','11290','11305','11320','11350','11380','11410','11440','11470','11500','11530','11545','11560','11590','11620','11650','11680','11710','11740']
MONTHS = [f'{y}{m:02}' for y in range(2020,2027) for m in range(1,13) if (y,m)<=(2026,9)]
share = sys.stdin.readline().strip()
auth = Session()
for attempt in range(3):
 try:
  r = auth.get(share,timeout=60); r.raise_for_status()
  match = re.search(r'const runnerToken = ("[^"\n]+");',r.text)
  if not match: raise ValueError('runner_missing')
  token=json.loads(match.group(1));break
 except Exception as e:
  if attempt==2: print('Authentication failed:',type(e).__name__,flush=True);sys.exit(2)
parts=urlsplit(share)
endpoint=f'{parts.scheme}://{parts.netloc}/api/internal/korea-sale-history/'
local=threading.local()
stop=threading.Event()
rate_lock=threading.Lock()
next_call=0.0
def throttle():
 global next_call
 with rate_lock:
  time.sleep(max(0,next_call-time.monotonic()))
  next_call=time.monotonic()+0.5
def session():
 if not hasattr(local,'session'):
  local.session=Session();local.session.cookies.update(auth.cookies)
  local.session.headers.update({'Authorization':'Bearer '+token})
 return local.session

def collect(coord):
 district,month=coord
 dest=OUT/f'{district}-{month}.json.gz'
 if dest.exists():
  try:
   with gzip.open(dest,'rt') as f:d=json.load(f)
   if d['complete'] and sum(p['recordCount'] for p in d['pages'])==d['totalCount']:
    return district,month,d['totalCount'],None
  except Exception:pass
 if stop.is_set():return district,month,0,'collection_paused'
 error='unknown'
 for attempt in range(3):
  try:
   pages=[];page_no=1;total=None
   while True:
    if stop.is_set():return district,month,0,'collection_paused'
    throttle()
    r=session().post(endpoint,json={'lawdCd':district,'dealYmd':month,'pageNo':page_no},timeout=65)
    if r.status_code!=200:
     try:code=r.json().get('code','http_error')+'_'+str(r.json().get('providerStatus',''))
     except Exception:code='http_error'
     stop.set()
     raise ValueError(f'HTTP_{r.status_code}_{code}')
    page=r.json()
    assert page['lawdCd']==district and page['dealYmd']==month and page['pageNo']==page_no
    if total is None:total=page['totalCount']
    assert page['totalCount']==total and page['pageSize']==1000
    expected=max(0,min(1000,total-(page_no-1)*1000))
    assert page['recordCount']==expected
    page['sha256']=hashlib.sha256(page['xml'].encode()).hexdigest()
    pages.append(page)
    if page_no>=max(1,math.ceil(total/1000)):break
    page_no+=1
   assert sum(p['recordCount'] for p in pages)==total
   result={'lawdCd':district,'dealYmd':month,'totalCount':total,'complete':True,'pages':pages}
   tmp=dest.with_suffix('.tmp')
   with gzip.open(tmp,'wt',encoding='utf-8') as f:json.dump(result,f,ensure_ascii=False)
   os.replace(tmp,dest)
   return district,month,total,None
  except Exception as e:
   error=str(e) if isinstance(e,(ValueError,AssertionError)) else type(e).__name__
   print(json.dumps({'retry':attempt+1,'district':district,'month':month,'error':error}),flush=True)
   if stop.is_set():break
   if attempt<2:time.sleep(10*(attempt+1))
 return district,month,0,error

results=[];started=time.monotonic()
coords=[(d,m) for m in MONTHS for d in DISTRICTS]
print('Authenticated. Planned district-months:',len(coords),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for result in pool.map(collect,coords):
  results.append(dict(zip(['lawdCd','dealYmd','records','error'],result)))
  if len(results)%25==0 or (result[-1] and result[-1]!='collection_paused'):
   print(json.dumps({'completed':len(results),'planned':len(coords),'records':sum(x['records'] for x in results),'failures':sum(x['error'] is not None for x in results),'elapsedSeconds':round(time.monotonic()-started),'lastError':result[-1]}),flush=True)
  if len(results)%25==0:
   (OUT/'progress.json').write_text(json.dumps(results,ensure_ascii=False))
manifest={'source':'MOLIT RTMSDataSvcAptTradeDev','scope':'Seoul 25 districts, apartment sales, all reported records including cancellations','start':'202001','end':'202609','currentMonthIncomplete':True,'retrievedAt':datetime.now(timezone.utc).isoformat(),'plannedCoordinates':len(coords),'complete':all(x['error'] is None for x in results),'records':sum(x['records'] for x in results),'coordinates':results}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('FINISHED',json.dumps({k:v for k,v in manifest.items() if k!='coordinates'}),flush=True)
