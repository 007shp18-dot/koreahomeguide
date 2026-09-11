import { permanentRedirect } from 'next/navigation';

export default function SingaporeOverviewAlias() {
  permanentRedirect('/zh-cn/sg/');
}

export const revalidate = 3_600;
