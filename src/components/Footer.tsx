'use client';

import { useTranslations } from 'next-intl';
import { Github, Mail, MapPin } from 'lucide-react';
import { contact } from '@/config/contact';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_ITEMS = [
  { key: 'problems', href: '#problems' },
  { key: 'process', href: '#process' },
  { key: 'about', href: '#about' },
  { key: 'faq', href: '#faq' },
] as const;

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();

  const socials = [
    { icon: Github, href: contact.social.github, label: 'GitHub' },
    { icon: Mail, href: contact.emailUrl, label: 'Email', internal: true },
  ];

  return (
    <footer className="relative border-t border-ink-900/10 bg-canvas-soft">
      <div className="container-content py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-ink-500">
              {t('tagline')}. {t('founded')}.
            </p>
            <p className="flex items-center gap-2 text-sm text-ink-400">
              <MapPin className="h-4 w-4 text-forest-500" />
              {t('location')}
            </p>
          </div>

          {/* Nav */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              {t('nav')}
            </p>
            <ul className="flex flex-col gap-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className="text-sm text-ink-500 transition hover:text-ink-900"
                  >
                    {tNav(item.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect + language */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              {t('connect')}
            </p>
            <div className="flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target={s.internal ? undefined : '_blank'}
                  rel={s.internal ? undefined : 'noopener noreferrer'}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-ink-900/10 bg-canvas-raised text-ink-500 shadow-soft transition hover:border-forest-500/40 hover:bg-forest-50 hover:text-forest-600"
                >
                  <s.icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
            <div className="mt-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                {t('language')}
              </p>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start gap-4 border-t border-ink-900/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            © {year} STEELFULLAI. {t('rights')}
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/impressum"
              className="text-xs text-ink-400 transition hover:text-ink-900"
            >
              {t('imprint')}
            </Link>
            <Link
              href="/datenschutz"
              className="text-xs text-ink-400 transition hover:text-ink-900"
            >
              {t('privacy')}
            </Link>
          </div>
          <p className="text-xs text-ink-300">{t('built')}</p>
        </div>
      </div>
    </footer>
  );
}
