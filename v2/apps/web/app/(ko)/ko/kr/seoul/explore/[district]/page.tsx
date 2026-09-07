import { notFound } from 'next/navigation';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import KoreanExplorePage from '../page';
import { buildPublicDistrictModel } from '@/lib/public-market/area-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';
type Props = {params: Promise<{district: string}>; searchParams: Promise<Record<string,string|string[]|undefined>>};
export const dynamicParams = false;
export function generateStaticParams() {return SEOUL_RENT_CHECK_DISTRICTS.map(({slug}) => ({district:slug}));}
export async function generateMetadata({params}: Props) {
 const {district} = await params; const model = buildPublicDistrictModel(district); if (!model) notFound();
 const metadata = indexableMetadata({path:`/ko/kr/seoul/explore/${district}/`,title:`${model.identity.nameKo} 실거래가 · 아파트 매매 전세 월세 | signedprice`, description:`${model.identity.nameKo}의 신고된 매매·전세·월세 계약을 동과 건물, 면적별로 확인하세요. 계약 수와 자료 기간을 함께 보여드립니다.`,locale:'ko_KR',languageAlternates:{en:`/kr/seoul/explore/${district}/`,ko:`/ko/kr/seoul/explore/${district}/`}});
 if(model.status !== 'published') metadata.robots={index:false,follow:true}; return metadata;
}
export default async function Page({params,searchParams}:Props) {const {district}=await params;if(!SEOUL_RENT_CHECK_DISTRICTS.some(d=>d.slug===district)) notFound();return KoreanExplorePage({searchParams:Promise.resolve({...await searchParams,district})});}
