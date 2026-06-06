'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { GraduationCap, ShieldCheck, Bot } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';

type Item = { name: string; tag: string; title: string; desc: string };
const icons = [GraduationCap, ShieldCheck, Bot];
const ease = [0.16, 1, 0.3, 1] as const;

export function SelectedWorkSection() {
  const t = useTranslations('selectedWork');
  const items = t.raw('items') as Item[];

  return (
    <section id="work" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-content">
        <SectionHeader label={t('label')} title={t('title')} subtitle={t('subtitle')} />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {items.map((item, i) => {
            const Icon = icons[i];
            return (
              <motion.article
                key={item.name}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
                }}
                className="group relative flex flex-col rounded-2xl border border-ink-900/10 bg-canvas-raised p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-forest-500/30 hover:shadow-raised"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-500 transition group-hover:bg-forest-500 group-hover:text-canvas-soft">
                  <Icon className="h-6 w-6" />
                </span>

                <span className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-forest-500">
                  {item.tag}
                </span>
                <h3 className="mt-2 text-xl font-semibold text-ink-900">{item.name}</h3>
                <p className="mt-1.5 font-medium text-ink-700">{item.title}</p>
                <p className="mt-4 text-pretty leading-relaxed text-ink-500">{item.desc}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
