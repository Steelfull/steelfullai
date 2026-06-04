'use client';

import { useTranslations } from 'next-intl';
import { Check, Calendar, MessageCircle, Mail } from 'lucide-react';
import { contact } from '@/config/contact';
import { Reveal } from './ui/Reveal';

export function FinalCta() {
  const t = useTranslations('finalCta');
  const trust = [t('trust.noObligation'), t('trust.response'), t('trust.direct')];

  return (
    <section id="contact" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-content">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-forest-600 px-7 py-16 text-center shadow-[0_40px_80px_-40px_rgba(20,62,46,0.8)] sm:px-12 sm:py-20">
            {/* Ambient */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-0 -top-16 mx-auto h-72 max-w-2xl rounded-full bg-forest-400/30 opacity-80 blur-3xl" />
              <div
                className="absolute inset-0 opacity-[0.12] mask-fade-b"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }}
              />
            </div>

            <div className="relative mx-auto flex max-w-2xl flex-col items-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-forest-200">
                <span className="h-1.5 w-1.5 rounded-full bg-forest-200" />
                {t('label')}
              </span>
              <h2 className="mt-6 text-balance text-3xl font-semibold leading-[1.07] tracking-[-0.02em] text-canvas-soft sm:text-4xl lg:text-[2.9rem]">
                {t('title')}
              </h2>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-forest-100 sm:text-xl">
                {t('text')}
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={contact.calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-canvas-soft px-7 py-3.5 text-[0.95rem] font-semibold text-forest-700 transition hover:bg-white"
                >
                  <Calendar className="h-4 w-4" />
                  {t('bookCall')}
                </a>
                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-canvas-soft/25 px-7 py-3.5 text-[0.95rem] font-semibold text-canvas-soft transition hover:border-canvas-soft/50 hover:bg-white/5"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('whatsapp')}
                </a>
                <a
                  href={contact.emailUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[0.95rem] font-semibold text-forest-100 transition hover:text-canvas-soft"
                >
                  <Mail className="h-4 w-4" />
                  {t('email')}
                </a>
              </div>

              <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
                {trust.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-forest-100">
                    <Check className="h-4 w-4 text-forest-200" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
