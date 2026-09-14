import { QuestionsPage } from '@/components/questions/questions-page';
import { isCity } from '@/lib/questions/model';
export const metadata={alternates:{canonical:'https://www.signedprice.com/community/'},title:'Home & neighbourhood questions | SignedPrice',robots:{index:false,follow:true}};
export default async function Page({searchParams}:{searchParams:Promise<{market?:string}>}) {const {market}=await searchParams;return <QuestionsPage locale="en" market={isCity(market)?market:''}/>;}
