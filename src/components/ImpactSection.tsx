'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Zap, Minus, Eye, ShieldCheck, Maximize } from 'lucide-react';
import { Reveal } from './ui/Reveal';

type Item = { stat: string; title: string; desc: string };
const icons = [Zap, Minus, Eye, ShieldCheck, Maximize];
const ease = [0.16, 1, 0.3, 1] as const;

export function ImpactSection() {
  const t = useTranslations('impact');
  const items = t.raw('items') as Item[];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-content">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Sticky header */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
                {t('label')}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="heading-lg mt-5">{t('title')}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="body-lg mt-5">{t('subtitle')}</p>
            </Reveal>
          </div>

          {/* Outcome rows */}
          <ul className="flex flex-col">
            {items.map((item, i) => {
              const Icon = icons[i];
              return (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.7, ease, delay: i * 0.07 }}
                  className="group flex gap-5 border-t border-ink-900/[0.08] py-7 first:border-t-0 first:pt-0"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-500 transition-colors duration-300 group-hover:bg-forest-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-ink-900">{item.title}</h3>
                    <p className="mt-2 max-w-lg leading-relaxed text-ink-500">{item.desc}</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
