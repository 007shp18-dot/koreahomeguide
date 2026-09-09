import 'server-only';
import type {SqlPort} from '../evidence-pool/repository.server';
import {collectionFailureCode} from './fetch.server';
export type KaptProbeResult={status:string;checkedAt:string;httpStatus?:number;providerCode?:string;month?:string;rowCount?:number;fields?:string[];limitation:string};
export async function probeKaptCosts(sql:SqlPort,fetcher:typeof fetch=fetch,now=new Date()):Promise<KaptProbeResult>{
 const key=process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY?.trim() || process.env.DATA_GO_KR_SERVICE_KEY?.trim();
 const base={checkedAt:now.toISOString(),limitation:'A sample response does not approve unit interpretation or per-household cost. Complex-level amounts require denominator and billing-period review.'};
 let result:KaptProbeResult;
 if(!key) result={...base,status:'runtime_credential_unavailable'};
 else {
  const row=(await sql.query("SELECT kapt_code FROM building_facts WHERE kapt_code ~ '^[A-Za-z0-9]{5,20}$' ORDER BY updated_at DESC LIMIT 1"))[0];
  if(!row) result={...base,status:'building_identifier_unavailable'};
  else {
   const monthDate=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-2,1)); const month=monthDate.toISOString().slice(0,7).replace('-','');
   const url=new URL('https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV3/getHsmpRepairsCostInfoV3');
   let decoded=key;try{decoded=decodeURIComponent(key);}catch{/* raw issued key */}
   url.search=new URLSearchParams({serviceKey:decoded,kaptCode:String(row.kapt_code),searchDate:month,_type:'json'}).toString();
   try {
    const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(15_000),cache:'no-store',headers:{Accept:'application/json'}});
    if(!response.ok) result={...base,status:'http_failure',httpStatus:response.status,month};
    else {
     if(Number(response.headers.get('content-length'))>100000 || !response.body) throw new Error('invalid_response');
     const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
     try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>100000)throw new Error('response_too_large');chunks.push(next.value);}}finally{await reader.cancel();}
     const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));const envelope=body?.response;const code=String(envelope?.header?.resultCode??'');
     const safeCode=/^[a-zA-Z0-9_]{1,20}$/.test(code)?code:'unrecognized';const item=envelope?.body?.item;
     const valid=item && typeof item==='object' && !Array.isArray(item) && item.kaptCode===row.kapt_code;
     result={...base,status:code==='00'?(valid?'sample_received_units_unverified':'no_matching_sample'):'provider_rejected',httpStatus:response.status,providerCode:safeCode,month,rowCount:code==='00'&&valid?1:0,fields:code==='00'&&valid?Object.keys(item).filter((name)=>/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(name)).slice(0,40):[]};
    }
   }catch(error){result={...base,status:collectionFailureCode(error),month};}
  }
 }
 await sql.query(`INSERT INTO data_collection_probes(source_id,result) VALUES('kr-kapt-cost',$1::jsonb) ON CONFLICT(source_id) DO UPDATE SET result=excluded.result,checked_at=now()`,[JSON.stringify(result)]);
 return result;
}
