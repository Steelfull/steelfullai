'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { Reveal } from './ui/Reveal';

const MAX_HOURS = 40;

export function RoiCalculator() {
  const t = useTranslations('roi');
  const locale = useLocale();
  const [hours, setHours] = useState(10);

  const monthly = hours * 4.33;
  const yearly = hours * 52;
  const weeks = yearly / 40; // full-time weeks lost to repetitive work each year

  const metrics = [
    { label: t('monthly'), value: monthly, decimals: 0 },
    { label: t('yearly'), value: yearly, decimals: 0, accent: true },
  ];

  const pct = (hours / MAX_HOURS) * 100;

  return (
    <section className="relative py-12 sm:py-16">
      <div className="container-content">
        <Reveal>
          <div className="surface relative overflow-hidden p-7 sm:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-forest-500/[0.07] blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
              {/* Input */}
              <div className="flex flex-col">
                <span className="eyebrow">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t('label')}
                </span>
                <h2 className="mt-4 text-2xl font-semibold leading-snug text-ink-900 sm:text-3xl">
                  {t('title')}
                </h2>
                <label htmlFor="roi-hours" className="mt-7 text-sm text-ink-500">
                  {t('question')}
                </label>

                <div className="mt-5 flex items-baseline gap-3">
                  <span className="font-mono text-5xl font-semibold tabular-nums text-forest-600 sm:text-6xl">
                    {hours}
                  </span>
                  <span className="text-sm text-ink-400">{t('inputSuffix')}</span>
                </div>

                <input
                  id="roi-hours"
                  type="range"
                  min={1}
                  max={MAX_HOURS}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="roi-slider mt-6 w-full"
                  style={{
                    background: `linear-gradient(to right, #1e5c44 ${pct}%, rgba(20,24,26,0.10) ${pct}%)`,
                  }}
                  aria-valuetext={`${hours} ${t('inputSuffix')}`}
                />
                <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-400">
                  <span>1</span>
                  <span>{MAX_HOURS}+</span>
                </div>
              </div>

              {/* Output */}
              <div className="flex flex-col justify-center lg:border-l lg:border-ink-900/10 lg:pl-14">
                <div className="flex flex-col">
                  {metrics.map((m, i) => (
                    <div
                      key={m.label}
                      className={`flex items-center justify-between py-4 ${
                        i > 0 ? 'border-t border-ink-900/[0.08]' : ''
                      }`}
                    >
                      <span className={`text-sm ${m.accent ? 'font-medium text-forest-600' : 'text-ink-500'}`}>
                        {m.label}
                      </span>
                      <span
                        className={`font-mono text-2xl font-semibold tabular-nums sm:text-3xl ${
                          m.accent ? 'text-forest-600' : 'text-ink-900'
                        }`}
                      >
                        <AnimatedNumber value={m.value} decimals={m.decimals} locale={locale} />
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-forest-50 px-5 py-4">
                  <p className="text-sm leading-relaxed text-ink-700">
                    ≈{' '}
                    <span className="font-mono text-lg font-semibold text-forest-600">
                      <AnimatedNumber value={weeks} decimals={1} locale={locale} />
                    </span>{' '}
                    {t('weeksValue', { count: '' }).replace('{count}', '').trim()}
                  </p>
                </div>

                <a
                  href="#message"
                  className="group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-forest-500 px-6 py-3.5 text-sm font-semibold text-canvas-soft transition hover:bg-forest-600"
                >
                  {t('cta')}
                  <motion.span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </motion.span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
