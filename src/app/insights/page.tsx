import { aggregate, latestRun, type Aggregates } from '@/lib/insightsDb';
import { RunButton } from './RunButton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PERIOD_DAYS = Number(process.env.INSIGHTS_PERIOD_DAYS ?? 90);

type LlmShape = {
  summary?: string;
  requested_automations?: { theme?: string; demand?: string; example?: string }[];
  objections?: { objection?: string; note?: string }[];
  high_intent_misses?: string[];
  suggested_canned_answers?: { language?: string; question?: string; answer?: string }[];
  recommendations?: string[];
};

const pct = (n: number) => `${Math.round(n * 100)}%`;
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-canvas-raised p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; count: number }[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  if (rows.length === 0) return <p className="text-sm text-ink-400">No data yet.</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-ink-700" title={r.label}>
            {r.label}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded-full bg-canvas-sunk">
            <div
              className="h-full rounded-full bg-forest-400"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm tabular-nums text-ink-600">
            {r.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-ink-900/10 bg-canvas-raised p-5 shadow-soft">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">{title}</h2>
      {children}
    </section>
  );
}

const demandColor: Record<string, string> = {
  high: 'bg-forest-500 text-canvas-soft',
  medium: 'bg-forest-100 text-forest-700',
  low: 'bg-canvas-sunk text-ink-500',
};

export default function InsightsPage() {
  const since = Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const agg: Aggregates = aggregate(since, PERIOD_DAYS);
  const run = latestRun();
  const llm = (run?.llm ?? null) as LlmShape | null;

  const automations = arr<NonNullable<LlmShape['requested_automations']>[number]>(
    llm?.requested_automations,
  );
  const objections = arr<NonNullable<LlmShape['objections']>[number]>(llm?.objections);
  const misses = arr<string>(llm?.high_intent_misses);
  const canned = arr<NonNullable<LlmShape['suggested_canned_answers']>[number]>(
    llm?.suggested_canned_answers,
  );
  const recs = arr<string>(llm?.recommendations);

  const lastRun = run?.createdAt ? new Date(run.createdAt).toLocaleString() : 'never';
  const empty = agg.total === 0;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Chat Insights</h1>
          <p className="mt-1 text-sm text-ink-500">
            Last {PERIOD_DAYS} days · analysis last run: {lastRun}
          </p>
        </div>
        <RunButton />
      </div>

      {empty ? (
        <Card title="No conversations yet">
          <p className="text-sm text-ink-600">
            Once visitors start chatting, the funnel and themes will appear here. Click{' '}
            <span className="font-medium">Run analysis now</span> after some traffic to generate the
            first themed report.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Funnel */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Conversations" value={String(agg.total)} />
            <Stat label="Engaged" value={String(agg.engaged)} hint="2+ messages" />
            <Stat label="Handoffs" value={String(agg.handoffs)} hint="emailed you" />
            <Stat label="Book clicks" value={String(agg.bookClicks)} />
            <Stat label="Conversion" value={pct(agg.conversionRate)} hint="of engaged" />
            <Stat
              label="Free answers"
              value={pct(agg.cannedHitRate)}
              hint="no API cost"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Top industries">
              <Bars rows={agg.byIndustry.map((r) => ({ label: r.industry, count: r.count }))} />
            </Card>
            <Card title="By language">
              <Bars rows={agg.byLocale.map((r) => ({ label: r.locale, count: r.count }))} />
            </Card>
          </div>

          {llm?.summary ? (
            <Card title="Summary">
              <p className="text-sm leading-relaxed text-ink-700">{llm.summary}</p>
            </Card>
          ) : null}

          {automations.length > 0 ? (
            <Card title="Most-requested automations">
              <ul className="space-y-3">
                {automations.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        demandColor[String(a.demand)] ?? 'bg-canvas-sunk text-ink-500'
                      }`}
                    >
                      {a.demand ?? '—'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{a.theme}</p>
                      {a.example ? (
                        <p className="text-xs text-ink-500">e.g. {a.example}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            {objections.length > 0 ? (
              <Card title="Common objections">
                <ul className="space-y-3">
                  {objections.map((o, i) => (
                    <li key={i}>
                      <p className="text-sm font-medium text-ink-900">{o.objection}</p>
                      {o.note ? <p className="text-xs text-ink-500">{o.note}</p> : null}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {misses.length > 0 ? (
              <Card title="High-intent misses">
                <ul className="list-inside list-disc space-y-1 text-sm text-ink-700">
                  {misses.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>

          {canned.length > 0 ? (
            <Card title="Suggested canned answers (add the good ones to chatFaq.ts)">
              <ul className="space-y-3">
                {canned.map((c, i) => (
                  <li key={i} className="rounded-2xl bg-canvas-sunk p-3">
                    <p className="text-xs font-semibold uppercase text-ink-400">
                      {c.language ?? '—'}
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-900">{c.question}</p>
                    <p className="mt-1 text-sm text-ink-600">{c.answer}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {recs.length > 0 ? (
            <Card title="Recommendations">
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-700">
                {recs.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {!llm ? (
            <p className="text-sm text-ink-400">
              Showing live counts only. Click <span className="font-medium">Run analysis now</span>{' '}
              to generate themes, objections and suggestions (needs ANTHROPIC_API_KEY).
            </p>
          ) : null}
        </div>
      )}
    </main>
  );
}
