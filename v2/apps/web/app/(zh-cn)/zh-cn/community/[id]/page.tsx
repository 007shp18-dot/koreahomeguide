import { notFound } from 'next/navigation';
import { QuestionsPage } from '@/components/questions/questions-page';
export const metadata={title:'Questions | SignedPrice',robots:{index:false,follow:true}};
export default async function Page({params}:{params:Promise<{id:string}>}) {const {id}=await params;if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))notFound();return <QuestionsPage locale="zh-CN" id={id}/>;}
