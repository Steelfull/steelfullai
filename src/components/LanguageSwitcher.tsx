'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, localeNames, type Locale } from '@/i18n/routing';

export const LOCALE_STORAGE_KEY = 'steelfullai.locale';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — ignore */
    }
    // Soft client-side navigation: no full page reload.
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  const current = localeNames[locale];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
        onClick={() => setOpen((v) => !v)}
        className={`group inline-flex items-center gap-2 rounded-full border border-ink-900/12 bg-canvas-raised text-sm font-medium text-ink-700 transition hover:border-forest-500/30 hover:text-ink-900 ${
          compact ? 'px-3 py-2' : 'px-3.5 py-2'
        } ${isPending ? 'opacity-60' : ''}`}
      >
        <Globe className="h-4 w-4 text-forest-500" />
        <span className="tabular-nums">{current.native}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-ink-900/10 bg-canvas-raised p-1.5 shadow-soft"
          >
            {routing.locales.map((l) => {
              const info = localeNames[l];
              const active = l === locale;
              return (
                <li key={l} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => switchTo(l)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? 'bg-forest-50 text-ink-900'
                        : 'text-ink-700 hover:bg-canvas-sunk hover:text-ink-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{info.flag}</span>
                      <span>{info.label}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-forest-500" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
