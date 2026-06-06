'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Check, MessageCircle, Calendar, Loader2 } from 'lucide-react';
import { contact } from '@/config/contact';
import { SectionHeader } from './ui/SectionHeader';
import { Reveal } from './ui/Reveal';

type Status = 'idle' | 'sending' | 'success' | 'error';

export function ContactSection() {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({ name: '', email: '', message: '', company: '' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
      setForm({ name: '', email: '', message: '', company: '' });
    } catch {
      setStatus('error');
    }
  }

  const field =
    'w-full rounded-xl border border-ink-900/15 bg-canvas-raised px-4 py-3 text-ink-900 placeholder:text-ink-400 transition focus:border-forest-500/60 focus:outline-none focus:ring-2 focus:ring-forest-500/20';

  return (
    <section id="message" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-content">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="flex flex-col">
            <SectionHeader label={t('label')} title={t('title')} subtitle={t('subtitle')} />

            <Reveal delay={0.15}>
              <div className="mt-10">
                <p className="text-sm font-medium text-ink-500">{t('orReachOut')}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={contact.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-canvas-raised px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition hover:border-forest-500/40 hover:bg-forest-50"
                  >
                    <MessageCircle className="h-4 w-4 text-forest-500" />
                    WhatsApp
                  </a>
                  <a
                    href={contact.calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-canvas-raised px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition hover:border-forest-500/40 hover:bg-forest-50"
                  >
                    <Calendar className="h-4 w-4 text-forest-500" />
                    {t('bookCall')}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="surface p-6 sm:p-8">
              {status === 'success' ? (
                <div className="flex min-h-[18rem] flex-col items-center justify-center text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest-500 text-canvas-soft">
                    <Check className="h-7 w-7" />
                  </span>
                  <p className="mt-6 max-w-sm text-lg font-medium text-ink-900">
                    {t('success')}
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
                  {/* Honeypot — hidden from humans */}
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                    aria-hidden="true"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      placeholder={t('name')}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={field}
                    />
                    <input
                      type="email"
                      required
                      placeholder={t('email')}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={field}
                    />
                  </div>
                  <textarea
                    required
                    rows={5}
                    placeholder={t('message')}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${field} resize-none`}
                  />

                  {status === 'error' && (
                    <p className="text-sm text-red-600">{t('error')}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-forest-500 px-7 py-3.5 text-[0.95rem] font-semibold text-canvas-soft shadow-[0_10px_30px_-12px_rgba(30,92,68,0.6)] transition hover:bg-forest-600 disabled:opacity-60"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t('send')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
