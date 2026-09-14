import { QuestionsPage } from '@/components/questions/questions-page';
import { isCity } from '@/lib/questions/model';
export const metadata={alternates:{canonical:'https://www.signedprice.com/zh-cn/community/'},title:'房屋与社区问答 | SignedPrice',robots:{index:false,follow:true}};
export default async function Page({searchParams}:{searchParams:Promise<{market?:string}>}) {const {market}=await searchParams;return <QuestionsPage locale="zh-CN" market={isCity(market)?market:''}/>;}
