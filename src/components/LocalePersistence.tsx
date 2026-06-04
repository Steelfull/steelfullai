'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { hasLocale } from 'next-intl';
import { routing, type Locale } from '@/i18n/routing';
import { LOCALE_STORAGE_KEY } from './LanguageSwitcher';

/**
 * Restores a returning visitor's saved language preference.
 *
 * Runs once on mount: if a previously chosen locale is stored and differs from
 * the locale resolved from the URL, it performs a soft client-side navigation
 * (no full reload). Normal in-session switches keep storage in sync, so this
 * only ever fires for genuine return visits.
 */
export function LocalePersistence() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      return;
    }

    if (stored && hasLocale(routing.locales, stored) && stored !== locale) {
      router.replace(pathname, { locale: stored });
    }
  }, [locale, pathname, router]);

  return null;
}
