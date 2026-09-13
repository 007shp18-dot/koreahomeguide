import { mobileAppManifest } from '@/lib/mobile-app/model';

export const dynamic = 'force-static';
export function generateStaticParams() { return ['en', 'ko', 'zh-CN'].map(locale => ({ locale })); }

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'en' && locale !== 'ko' && locale !== 'zh-CN') return new Response('Not found', { status: 404 });
  return Response.json(mobileAppManifest(locale), { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } });
}
