import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { notFoundPageModel } from '@/lib/route-model';
import type { Metadata } from 'next';

export const metadata: Metadata = notFoundPageModel.metadata;

export default function NotFound() {
  return (
    <div id="top">
      <SiteHeader copy={notFoundPageModel.header} />
      <main className="not-found site-shell" aria-labelledby="not-found-heading">
        <p className="section-eyebrow">{notFoundPageModel.eyebrow}</p>
        <h1 id="not-found-heading">{notFoundPageModel.heading}</h1>
        <p>{notFoundPageModel.description}</p>
        <a href={notFoundPageModel.action.href}>
          <span>{notFoundPageModel.action.label}</span>
          <small>{notFoundPageModel.action.description}</small>
        </a>
      </main>
      <SiteFooter copy={notFoundPageModel.footer} />
    </div>
  );
}
