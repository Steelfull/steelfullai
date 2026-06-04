'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Calendar } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { contact } from '@/config/contact';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_ITEMS = [
  { key: 'problems', href: '#problems' },
  { key: 'process', href: '#process' },
  { key: 'about', href: '#about' },
  { key: 'faq', href: '#faq' },
] as const;

export function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-500 ${
          scrolled
            ? 'border-b border-ink-900/[0.07] bg-canvas/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav className="container-content flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="SteelfullAI home" className="shrink-0">
            <Logo />
          </Link>

          {/* Center nav */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <ul className="flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className="relative text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-forest-500 after:transition-all hover:after:w-full"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <a
              href={contact.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-canvas-soft shadow-[0_10px_30px_-12px_rgba(30,92,68,0.6)] transition hover:bg-forest-600 sm:inline-flex"
            >
              <Calendar className="h-4 w-4" />
              {t('bookCall')}
            </a>

            <button
              type="button"
              aria-label={t('menu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-ink-900/10 bg-canvas-raised text-ink-900 lg:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden"
          >
            <div className="container-content border-b border-ink-900/[0.07] bg-canvas/95 pb-8 pt-2 backdrop-blur-xl">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-3 text-base font-medium text-ink-700 transition hover:bg-forest-50 hover:text-ink-900"
                    >
                      {t(item.key)}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between gap-3">
                <LanguageSwitcher compact />
                <a
                  href={contact.calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-500 px-4 py-3 text-sm font-semibold text-canvas-soft"
                >
                  <Calendar className="h-4 w-4" />
                  {t('bookCall')}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
