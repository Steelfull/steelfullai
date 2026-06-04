'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';

type Item = { q: string; a: string };
const ease = [0.16, 1, 0.3, 1] as const;

export function FaqSection() {
  const t = useTranslations('faq');
  const items = t.raw('items') as Item[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-content">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader label={t('label')} title={t('title')} subtitle={t('subtitle')} />
          </div>

          <ul className="flex flex-col">
            {items.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={item.q} className="border-b border-ink-900/[0.08] first:border-t">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span
                      className={`text-lg font-semibold transition-colors ${
                        isOpen ? 'text-ink-900' : 'text-ink-700 group-hover:text-ink-900'
                      }`}
                    >
                      {item.q}
                    </span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? 'rotate-45 border-forest-500 bg-forest-500 text-canvas-soft'
                          : 'border-ink-900/12 text-ink-400 group-hover:border-ink-900/25'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl pb-7 pr-12 leading-relaxed text-ink-500">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
