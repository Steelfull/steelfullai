'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Reveal } from './ui/Reveal';

const ease = [0.16, 1, 0.3, 1] as const;

export function AboutSection() {
  const t = useTranslations('about');
  const points = t.raw('points') as string[];

  return (
    <section id="about" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-content">
        <div className="mx-auto max-w-3xl">
          {/* Copy */}
          <div className="flex flex-col">
            <Reveal>
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
                {t('label')}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="heading-lg mt-5 max-w-2xl">{t('title')}</h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-7 text-xl font-medium text-ink-900">{t('greeting')}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink-500">{t('p1')}</p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink-500">{t('p2')}</p>
            </Reveal>

            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {points.map((p) => (
                <motion.li
                  key={p}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-canvas-raised px-4 py-2 text-sm font-medium text-ink-700 shadow-soft"
                >
                  <Check className="h-4 w-4 text-forest-500" />
                  {p}
                </motion.li>
              ))}
            </motion.ul>

            <Reveal delay={0.25}>
              <p className="mt-8 max-w-2xl border-l-2 border-forest-500/50 pl-5 text-lg font-medium text-ink-900">
                {t('closing')}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
