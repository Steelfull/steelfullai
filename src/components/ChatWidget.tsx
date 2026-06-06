'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { contact } from '@/config/contact';
import { getIndustries, industryName } from '@/lib/industries';

type Msg = { role: 'user' | 'assistant'; content: string };

export function ChatWidget() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [industryId, setIndustryId] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const silentSent = useRef(false);

  // Seed the greeting once.
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: t('greeting') }]);
    }
  }, [open, messages.length, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Skip the seeded greeting when sending history to the model.
        body: JSON.stringify({
          messages: next.filter((_, i) => i !== 0),
          locale,
          industry: industryId ? industryName(industryId) : '',
        }),
      });
      const data = await res.json();
      const full: Msg[] = [
        ...next,
        { role: 'assistant', content: res.ok && data.reply ? data.reply : t('error') },
      ];
      setMessages(full);
      fireSilentLead(full, 4); // fallback only for long open conversations
    } catch {
      setMessages([...next, { role: 'assistant', content: t('error') }]);
    } finally {
      setLoading(false);
    }
  }

  function pickIndustry(ind: { id: string; label: string; opener: string }) {
    setIndustryId(ind.id);
    setMessages((m) => [
      ...m,
      { role: 'user', content: ind.label },
      { role: 'assistant', content: ind.opener },
    ]);
  }

  // Silent background hand-off: once a visitor has genuinely engaged, send the
  // conversation to Tim with an internal AI briefing. The visitor never sees or
  // knows about this — there is no UI for it.
  function fireSilentLead(msgs: Msg[], minUser = 2) {
    if (silentSent.current) return;
    if (msgs.filter((m) => m.role === 'user').length < minUser) return;
    silentSent.current = true;
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: msgs.filter((_, i) => i !== 0),
        industry: industryId ? industryName(industryId) : '',
      }),
    }).catch(() => {});
  }

  const industries = getIndustries(locale);
  const suggestions = [t('suggest1'), t('suggest2'), t('suggest3')];
  const showIndustry = !industryId && messages.length <= 1 && !loading;
  const showSuggestions = !!industryId && messages.length <= 3 && !loading;

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => {
          if (open) fireSilentLead(messages); // closing — send heads-up to Tim
          setOpen((v) => !v);
        }}
        aria-label={t('launcher')}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-forest-500 text-canvas-soft shadow-[0_12px_30px_-8px_rgba(30,92,68,0.7)] transition hover:bg-forest-600 sm:bottom-6 sm:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'x' : 'chat'}
            initial={{ opacity: 0, rotate: -30, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.6 }}
            transition={{ duration: 0.18 }}
          >
            {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(34rem,75vh)] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-3xl border border-ink-900/10 bg-canvas-raised shadow-[0_30px_70px_-25px_rgba(20,24,26,0.5)] sm:right-6"
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-ink-900/10 bg-forest-600 px-5 py-4 text-canvas-soft">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold leading-tight">{t('title')}</p>
                <p className="mt-0.5 text-xs leading-snug text-forest-100">{t('subtitle')}</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={`max-w-[85%] text-pretty rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-forest-500 text-canvas-soft'
                        : 'bg-canvas-sunk text-ink-800'
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        a: ({ children, href }) => <a href={href} className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>,
                        code: ({ children }) => <code className="bg-ink-900/10 px-2 py-0.5 rounded text-xs">{children}</code>,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-canvas-sunk px-4 py-3">
                    {[0, 0.15, 0.3].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-ink-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {showIndustry && (
                <div className="pt-1">
                  <p className="mb-2 px-1 text-xs font-medium text-ink-500">
                    {t('industryPrompt')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((ind) => (
                      <button
                        key={ind.id}
                        type="button"
                        onClick={() => pickIndustry(ind)}
                        className="rounded-full border border-ink-900/15 bg-canvas px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-forest-500/40 hover:bg-forest-50 hover:text-forest-700"
                      >
                        {ind.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showSuggestions && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-forest-500/30 bg-forest-50 px-3 py-1.5 text-left text-xs font-medium text-forest-700 transition hover:bg-forest-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-ink-900/10 px-3 py-3"
            >
              <div className="flex items-end gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('placeholder')}
                  className="min-w-0 flex-1 rounded-full border border-ink-900/15 bg-canvas px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500/60 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label={t('send')}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-500 text-canvas-soft transition hover:bg-forest-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 px-1">
                <p className="text-[10px] leading-tight text-ink-400">{t('disclaimer')}</p>
                <a
                  href={contact.calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-forest-600 hover:text-forest-700"
                >
                  <Calendar className="h-3 w-3" />
                  {t('bookCall')}
                </a>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
