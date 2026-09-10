import { permanentRedirect } from 'next/navigation';

export default function SingaporeOverviewAlias() {
  permanentRedirect('/sg/');
}

export const revalidate = 3_600;
