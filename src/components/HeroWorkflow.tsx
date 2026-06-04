'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MessageSquare, Workflow, Database, CheckCircle2 } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroWorkflow() {
  const t = useTranslations('hero.flow');

  const nodes = [
    { icon: MessageSquare, title: t('inquiry'), meta: t('inquiryMeta') },
    { icon: Workflow, title: t('automation'), meta: t('automationMeta'), highlight: true },
    { icon: Database, title: t('systems'), meta: t('systemsMeta') },
    { icon: CheckCircle2, title: t('result'), meta: t('resultMeta'), done: true },
  ];

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Soft glow behind the floating diagram */}
      <div className="pointer-events-none absolute -inset-10 -z-10 bg-radial-forest opacity-90 blur-2xl" />

      <div className="relative flex flex-col">
        {nodes.map((node, i) => (
          <div key={node.title}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.15 + i * 0.16 }}
              className="flex items-center gap-4"
            >
              <span
                className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition ${
                  node.highlight
                    ? 'border-forest-500 bg-forest-500 text-canvas-soft shadow-[0_14px_30px_-12px_rgba(30,92,68,0.6)]'
                    : node.done
                      ? 'border-forest-300 bg-forest-50 text-forest-600'
                      : 'border-ink-900/10 bg-canvas-raised text-ink-700 shadow-soft'
                }`}
              >
                {node.highlight && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-2xl"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(30,92,68,0)',
                        '0 0 0 6px rgba(30,92,68,0.10)',
                        '0 0 0 0 rgba(30,92,68,0)',
                      ],
                    }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <node.icon className="h-6 w-6" />
              </span>

              <div className="min-w-0 border-b border-ink-900/[0.07] py-3.5 pr-2">
                <p className="truncate text-[0.95rem] font-semibold text-ink-900">{node.title}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-wider text-ink-400">
                  {node.meta}
                </p>
              </div>
            </motion.div>

            {/* Connector aligned under the icon column */}
            {i < nodes.length - 1 && (
              <div className="relative ml-7 h-6 w-px overflow-hidden">
                <div className="absolute inset-0 bg-ink-900/10" />
                <motion.div
                  className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-transparent via-forest-400 to-transparent"
                  initial={{ y: '-100%' }}
                  animate={{ y: '300%' }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.4,
                    repeatDelay: 0.8,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mt-7 text-pretty text-sm leading-relaxed text-ink-400"
      >
        {t('caption')}
      </motion.p>
    </div>
  );
}
