'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { BookCallButton, WhatsAppButton } from './ui/Cta';
import { HeroWorkflow } from './HeroWorkflow';

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const t = useTranslations('hero');

  const trust = [t('trust.direct'), t('trust.noObligation'), t('trust.response')];

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="container-content">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Copy */}
          <div className="flex flex-col items-start">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-canvas-raised px-3.5 py-1.5 text-xs font-medium text-ink-700"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-500" />
              </span>
              {t('badge')}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.08 }}
              className="heading-xl mt-6"
            >
              {t('headline')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.16 }}
              className="body-lg mt-6 max-w-xl"
            >
              {t('subheadline')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.24 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <BookCallButton label={t('primaryCta')} size="lg" />
              <WhatsAppButton label={t('secondaryCta')} size="lg" />
            </motion.div>

            <motion.ul
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.32 }}
              className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6"
            >
              {trust.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-ink-500">
                  <Check className="h-4 w-4 text-forest-500" />
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease, delay: 0.2 }}
          >
            <HeroWorkflow />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
