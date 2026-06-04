'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, GraduationCap, Building2, Scale, ArrowRight } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';

type Item = { industry: string; scenario: string; outcome: string };
const icons = [Stethoscope, GraduationCap, Building2, Scale];
const ease = [0.16, 1, 0.3, 1] as const;

export function UseCasesSection() {
  const t = useTranslations('useCases');
  const items = t.raw('items') as Item[];
  const [active, setActive] = useState(0);
  const Icon = icons[active];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-content">
        <SectionHeader label={t('label')} title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:gap-16">
          {/* Industry selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0 mask-fade-edges lg:[mask-image:none]">
            {items.map((item, i) => {
              const ItemIcon = icons[i];
              const isActive = i === active;
              return (
                <button
                  key={item.industry}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`group flex shrink-0 items-center gap-3 rounded-full px-4 py-3 text-left transition-all duration-300 lg:rounded-none lg:border-l-2 lg:px-5 lg:py-4 ${
                    isActive
                      ? 'bg-forest-50 text-ink-900 lg:bg-transparent lg:border-forest-500'
                      : 'text-ink-500 hover:text-ink-900 lg:border-ink-900/10 lg:hover:border-ink-900/30'
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition lg:h-7 lg:w-7 lg:rounded-lg ${
                      isActive ? 'bg-forest-500 text-canvas-soft lg:bg-transparent lg:text-forest-500' : 'text-ink-400'
                    }`}
                  >
                    <ItemIcon className="h-5 w-5 lg:h-[18px] lg:w-[18px]" />
                  </span>
                  <span className="whitespace-nowrap font-semibold lg:whitespace-normal">
                    {item.industry}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Story detail — borderless */}
          <div className="relative lg:border-l lg:border-ink-900/10 lg:pl-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease }}
                className="relative flex flex-col"
              >
                <div className="flex items-center gap-3.5">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-500">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-2xl font-semibold text-ink-900">{items[active].industry}</h3>
                </div>

                <div className="mt-8 grid gap-7 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">
                      {t('label')} · before
                    </span>
                    <p className="mt-3 text-pretty leading-relaxed text-ink-500">
                      {items[active].scenario}
                    </p>
                  </div>

                  <div className="hidden items-center justify-center pt-6 sm:flex">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-forest-500/25 bg-canvas-raised text-forest-500 shadow-soft">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="flex flex-col border-l-2 border-forest-500/40 pl-5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest-500">
                      after
                    </span>
                    <p className="mt-3 text-pretty leading-relaxed text-ink-800">
                      {items[active].outcome}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
