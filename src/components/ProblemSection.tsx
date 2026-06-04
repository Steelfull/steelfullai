'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Clock, Copy, UserX, Unplug, GitBranch } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';

type Item = { title: string; desc: string };

const icons = [Clock, Copy, UserX, Unplug, GitBranch];
const ease = [0.16, 1, 0.3, 1] as const;

export function ProblemSection() {
  const t = useTranslations('problem');
  const items = t.raw('items') as Item[];

  return (
    <section id="problems" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-content">
        <SectionHeader label={t('label')} title={t('title')} subtitle={t('subtitle')} />

        <div className="relative mt-16">
          {/* Vertical rail */}
          <div className="absolute left-[1.35rem] top-2 bottom-2 hidden w-px bg-gradient-to-b from-transparent via-ink-900/15 to-transparent sm:block" />

          <ul className="flex flex-col">
            {items.map((item, i) => {
              const Icon = icons[i];
              return (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.7, ease, delay: i * 0.06 }}
                  className="group relative grid grid-cols-[auto_1fr] gap-5 border-b border-ink-900/[0.08] py-7 sm:gap-8"
                >
                  <div className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-ink-900/10 bg-canvas-raised text-ink-400 shadow-soft transition-colors duration-300 group-hover:border-forest-500/40 group-hover:text-forest-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-baseline sm:gap-10">
                    <h3 className="text-lg font-semibold text-ink-900 sm:w-72 sm:shrink-0">
                      {item.title}
                    </h3>
                    <p className="max-w-xl text-pretty leading-relaxed text-ink-500">
                      {item.desc}
                    </p>
                  </div>
                  <span className="pointer-events-none absolute right-0 top-7 hidden font-mono text-sm text-ink-900/15 transition-colors group-hover:text-forest-500/50 lg:block">
                    0{i + 1}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
