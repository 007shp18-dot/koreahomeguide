'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mobileAppCopy, mobileAppNavigation } from '@/lib/mobile-app/model';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import styles from './mobile-app.module.css';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type InstallStatus = 'idle' | 'opening' | 'accepted' | 'fallback';
type InstallContextValue = { installed: boolean; canPrompt: boolean; status: InstallStatus; install: () => Promise<void> };
const InstallContext = createContext<InstallContextValue | null>(null);

function installedSnapshot() {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}
function subscribeInstalled(callback: () => void) {
  const query = window.matchMedia('(display-mode: standalone)');
  query.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => { query.removeEventListener('change', callback); window.removeEventListener('appinstalled', callback); };
}

const iconPaths: Record<string, string> = {
  explore: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15',
  saved: 'M6 4h12v17l-6-4-6 4V4Z',
  insights: 'M4 4h16v16H4V4Zm4 4h8M8 12h8m-8 4h5',
  tools: 'M5 3h14v18H5V3Zm3 4h8m-8 5h1m6 0h1m-8 4h1m6 0h1',
};

export function MobileAppProvider({ children, locale }: { children: ReactNode; locale: SiteLocale }) {
  const pathname = usePathname() ?? '/';
  const installed = useSyncExternalStore(subscribeInstalled, installedSnapshot, () => false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [status, setStatus] = useState<InstallStatus>('idle');
  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
      setStatus('idle');
    };
    const afterInstall = () => { setPrompt(null); setStatus('accepted'); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', afterInstall);
    return () => { window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', afterInstall); };
  }, []);
  async function install() {
    if (!prompt) { setStatus('fallback'); return; }
    setStatus('opening');
    setPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setStatus(choice.outcome === 'accepted' ? 'accepted' : 'fallback');
    } catch { setStatus('fallback'); }
  }
  return <InstallContext.Provider value={{ installed, canPrompt: prompt !== null, status, install }}>
    {children}
    <nav className={styles.navigation} aria-label={mobileAppCopy[locale].navigation} data-mobile-app-navigation>
      {mobileAppNavigation(pathname, locale).map(item => <Link key={item.key} href={item.href} prefetch={false} aria-current={item.current ? 'page' : undefined}>
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[item.key]} /></svg>
        <span>{item.label}</span>
      </Link>)}
    </nav>
  </InstallContext.Provider>;
}

export function useAppInstallation() { return useContext(InstallContext); }
