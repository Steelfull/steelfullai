'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, Hammer, LineChart } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';

type Step = { title: string; desc: string };
const icons = [Search, Compass, Hammer, LineChart];
const ease = [0.16, 1, 0.3, 1] as const;

export function ProcessSection() {
  const t = useTranslations('process');
  const steps = t.raw('steps') as Step[];
  const [active, setActive] = useState(0);

  // Gentle auto-advance; pauses are not required since it loops slowly.
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), 4200);
    return () => clearInterval(id);
  }, [steps.length]);

  const progress = (active / (steps.length - 1)) * 100;

  return (
    <section id="process" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-content">
        <SectionHeader label={t('label')} title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-16">
          {/* Timeline rail */}
          <div className="relative">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-ink-900/10 sm:block" />
            <motion.div
              className="absolute left-0 top-6 hidden h-px bg-gradient-to-r from-forest-600 to-forest-400 sm:block"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease }}
            />

            <ol className="grid gap-8 sm:grid-cols-4 sm:gap-4">
              {steps.map((step, i) => {
                const Icon = icons[i];
                const isActive = i === active;
                const isDone = i < active;
                return (
                  <li key={step.title} className="relative">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className="group flex items-start gap-4 text-left sm:flex-col sm:items-start"
                    >
                      <span
                        className={`relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                          isActive
                            ? 'border-forest-500 bg-forest-500 text-canvas-soft shadow-[0_12px_28px_-10px_rgba(30,92,68,0.6)]'
                            : isDone
                              ? 'border-forest-300 bg-forest-50 text-forest-600'
                              : 'border-ink-900/12 bg-canvas-raised text-ink-400 shadow-soft group-hover:border-ink-900/25'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="pt-0.5 sm:pt-4">
                        <span
                          className={`font-mono text-xs ${isActive ? 'text-forest-500' : 'text-ink-400'}`}
                        >
                          0{i + 1}
                        </span>
                        <h3
                          className={`mt-1 text-base font-semibold transition-colors sm:text-lg ${
                            isActive ? 'text-ink-900' : 'text-ink-500 group-hover:text-ink-700'
                          }`}
                        >
                          {step.title}
                        </h3>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Active step detail */}
          <div className="mt-12 min-h-[7rem] border-t border-ink-900/10 pt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-forest-500">
                    0{active + 1} / 0{steps.length}
                  </span>
                  <span className="h-px flex-1 bg-ink-900/10" />
                </div>
                <h3 className="text-2xl font-semibold text-ink-900">{steps[active].title}</h3>
                <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink-500">
                  {steps[active].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
