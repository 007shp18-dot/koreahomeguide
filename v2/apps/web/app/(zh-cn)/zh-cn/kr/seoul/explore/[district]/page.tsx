import { notFound } from 'next/navigation';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import { renderSeoulDistrictPage } from '@/lib/public-market/district-detail-route.server';
import { buildPublicDistrictModel } from '@/lib/public-market/area-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';
type Props = { params: Promise<{ district: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };
export const dynamicParams = false;
export function generateStaticParams() { return SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({ district: slug })); }
export async function generateMetadata({ params }: Props) {
 const { district } = await params;
 const model = buildPublicDistrictModel(district);
 if (!model) notFound();
 const metadata = indexableMetadata({ path: `/zh-cn/kr/seoul/explore/${district}/`, title: `${model.identity.nameKo}成交数据与地区比较 | SignedPrice`, description: '查看本行政区的官方申报交易、楼盘、价格分布与统计范围。', locale: 'zh_CN', languageAlternates: { en: `/kr/seoul/explore/${district}/`, ko: `/ko/kr/seoul/explore/${district}/`, 'zh-Hans': `/zh-cn/kr/seoul/explore/${district}/` } });
 if (model.status !== 'published') metadata.robots = { index: false, follow: true };
 return metadata;
}
export default async function Page(props: Props) { return renderSeoulDistrictPage(props, 'zh-CN'); }
