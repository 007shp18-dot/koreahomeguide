import { QuestionsPage } from '@/components/questions/questions-page';
import { isCity } from '@/lib/questions/model';
export const metadata={alternates:{canonical:'https://www.signedprice.com/ko/community/'},title:'집과 동네 질문 | SignedPrice',robots:{index:false,follow:true}};
export default async function Page({searchParams}:{searchParams:Promise<{market?:string}>}) {const {market}=await searchParams;return <QuestionsPage locale="ko" market={isCity(market)?market:''}/>;}
