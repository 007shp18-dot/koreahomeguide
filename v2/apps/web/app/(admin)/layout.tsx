import type { Metadata } from 'next';
import type { ReactNode } from 'react';
export const metadata: Metadata = { title: '자료 관리 | SignedPrice', robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <html lang="ko"><body style={{ margin: 0 }}>{children}</body></html>;
}
