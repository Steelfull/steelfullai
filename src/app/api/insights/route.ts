import { NextResponse } from 'next/server';
import {
  aggregate,
  recentPains,
  saveRun,
  latestRun,
  purgeOld,
  type Aggregates,
  type PainSample,
} from '@/lib/insightsDb';

/**
 * Insights agent.
 *
 *  POST  → run a fresh analysis (deterministic aggregates + one cheap LLM pass),
 *          persist it, and prune old raw rows. Triggered weekly by the cron
 *          sidecar and on-demand by the dashboard "Run analysis now" button.
 *  GET   → return the latest stored run (used as a convenience API).
 *
 * Protection: this lives behind Caddy basic-auth on the public path
 * (/api/insights), and the internal app:3000 port is not exposed publicly.
 * Optionally set INSIGHTS_TRIGGER_SECRET for an extra header check.
 */

export const runtime = 'nodejs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const INSIGHTS_MODEL = process.env.INSIGHTS_MODEL ?? 'claude-haiku-4-5-20251001';
const PERIOD_DAYS = Number(process.env.INSIGHTS_PERIOD_DAYS ?? 90);
const RETENTION_DAYS = Number(process.env.INSIGHTS_RETENTION_DAYS ?? 90);
const TRIGGER_SECRET = process.env.INSIGHTS_TRIGGER_SECRET ?? '';

const SYSTEM = `You are a business analyst for Tim-Luka Stahl, a solo automation developer (SteelfullAI). You receive aggregated, anonymous stats from his website chatbot plus a sample of anonymised visitor "pain point" snippets (visitors describing what they want automated). Produce a concise, practical analysis to help Tim decide what to build and how to convert more leads.

Return ONLY valid JSON (no markdown, no commentary) with exactly this shape:
{
  "summary": "2-3 sentences on what visitors want and how the funnel looks",
  "requested_automations": [ { "theme": "short label", "demand": "high|medium|low", "example": "one anonymised example" } ],
  "objections": [ { "objection": "short label", "note": "how Tim could address it" } ],
  "high_intent_misses": [ "one line describing a specific, detailed chat that did NOT convert" ],
  "suggested_canned_answers": [ { "language": "en|de|pt", "question": "common question to pre-answer", "answer": "concise on-brand answer in Tim's first-person voice" } ],
  "recommendations": [ "concrete next step for Tim" ]
}
Base everything ONLY on the data provided. If data is thin, say so in the summary and keep arrays short. Never invent client names, prices, or numbers.`;

function parseJsonLoose(text: string): unknown {
  if (!text) return null;
  const tries = [text];
  tries.push(text.replace(/```(?:json)?/gi, '').trim());
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) tries.push(text.slice(start, end + 1));
  for (const t of tries) {
    try {
      return JSON.parse(t);
    } catch {
      /* try next */
    }
  }
  return null;
}

async function runLlm(aggregates: Aggregates, pains: PainSample[]): Promise<unknown> {
  if (!ANTHROPIC_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const userContent = JSON.stringify({ aggregates, painSamples: pains }).slice(0, 12000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: INSIGHTS_MODEL,
        max_tokens: 1800,
        temperature: 0.3,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
    if (!res.ok) {
      console.error('insights LLM error', res.status);
      return null;
    }
    const data = await res.json();
    const text: string =
      data?.content?.find((b: { type: string }) => b.type === 'text')?.text?.trim() ?? '';
    return parseJsonLoose(text);
  } catch (err) {
    console.error('insights LLM failed', err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function runAnalysis() {
  const since = Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const aggregates = aggregate(since, PERIOD_DAYS);
  const pains = recentPains(since, 60);
  const llm = await runLlm(aggregates, pains);
  const id = saveRun(PERIOD_DAYS, aggregates, llm);
  purgeOld(RETENTION_DAYS);
  return { id };
}

export async function POST(req: Request) {
  if (TRIGGER_SECRET) {
    const provided = req.headers.get('x-insights-secret') ?? '';
    if (provided !== TRIGGER_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }
  try {
    const { id } = await runAnalysis();
    return NextResponse.json({ ok: true, runId: id });
  } catch (err) {
    console.error('insights run failed', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(latestRun() ?? { empty: true });
}
