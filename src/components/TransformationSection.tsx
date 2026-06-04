'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';

type Node = { node: string; meta: string };
const ease = [0.16, 1, 0.3, 1] as const;

function FlowColumn({
  nodes,
  variant,
  label,
  tag,
}: {
  nodes: Node[];
  variant: 'before' | 'after';
  label: string;
  tag: string;
}) {
  const isAfter = variant === 'after';
  return (
    <div className="relative flex flex-col">
      <div className="mb-7 flex items-center justify-between">
        <span
          className={`text-xs font-semibold uppercase tracking-[0.22em] ${
            isAfter ? 'text-forest-500' : 'text-ink-400'
          }`}
        >
          {label}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
            isAfter ? 'bg-forest-50 text-forest-600' : 'bg-canvas-sunk text-ink-400'
          }`}
        >
          {tag}
        </span>
      </div>

      <div className="flex flex-col">
        {nodes.map((n, i) => {
          const highlight = isAfter && i === 1;
          return (
            <div key={`${n.node}-${i}`}>
              <motion.div
                initial={{ opacity: 0, x: isAfter ? 12 : -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease, delay: i * 0.12 }}
                className="flex items-center gap-4"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold transition ${
                    highlight
                      ? 'bg-forest-500 text-canvas-soft shadow-[0_10px_24px_-10px_rgba(30,92,68,0.6)]'
                      : isAfter
                        ? 'border border-forest-300 bg-forest-50 text-forest-600'
                        : 'border border-ink-900/12 bg-canvas-raised text-ink-400'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className={`truncate text-[0.95rem] font-semibold ${
                      isAfter ? 'text-ink-900' : 'text-ink-700'
                    }`}
                  >
                    {n.node}
                  </p>
                  <p className="truncate text-xs text-ink-400">{n.meta}</p>
                </div>
              </motion.div>

              {i < nodes.length - 1 && (
                <div className="relative ml-[1.05rem] h-6 w-px overflow-hidden">
                  <div
                    className={`absolute inset-0 ${
                      isAfter ? 'bg-forest-500/25' : 'bg-ink-900/12'
                    } ${!isAfter ? '[mask-image:repeating-linear-gradient(transparent,transparent_3px,black_3px,black_6px)]' : ''}`}
                  />
                  {isAfter && (
                    <motion.div
                      className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-transparent via-forest-400 to-transparent"
                      initial={{ y: '-100%' }}
                      animate={{ y: '300%' }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.3,
                        repeatDelay: 0.6,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TransformationSection() {
  const t = useTranslations('transformation');
  const before = t.raw('before') as Node[];
  const after = t.raw('after') as Node[];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-72 max-w-3xl bg-radial-forest opacity-70 blur-2xl" />

      <div className="container-content">
        <SectionHeader
          label={t('label')}
          title={t('title')}
          subtitle={t('subtitle')}
          align="center"
        />

        <div className="relative mx-auto mt-16 grid max-w-4xl items-start gap-y-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-12">
          <FlowColumn nodes={before} variant="before" label={t('beforeLabel')} tag={t('beforeTag')} />

          <div className="flex items-center justify-center lg:mt-12 lg:py-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.3 }}
              className="grid h-12 w-12 place-items-center rounded-full border border-forest-500/25 bg-canvas-raised text-forest-500 shadow-soft"
            >
              <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
            </motion.div>
          </div>

          <FlowColumn nodes={after} variant="after" label={t('afterLabel')} tag={t('afterTag')} />
        </div>
      </div>
    </section>
  );
}
