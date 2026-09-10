import { permanentRedirect } from 'next/navigation';

export default function SingaporeOverviewAlias() {
  permanentRedirect('/ko/sg/');
}

export const revalidate = 3_600;
