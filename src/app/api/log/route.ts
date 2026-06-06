import { NextResponse } from 'next/server';
import { setOutcome, type Outcome } from '@/lib/insightsDb';
import { rateLimit, clientIp } from '@/lib/rateLimit';

/**
 * Lightweight outcome beacon. The chat widget calls this (via navigator.sendBeacon)
 * to record low-frequency events the chat route can't see — e.g. the visitor
 * clicking "Book a call". Always responds 200; logging is best-effort.
 */

export const runtime = 'nodejs';

const LOG_PER_IP_PER_HOUR = Number(process.env.LOG_PER_IP_PER_HOUR ?? 60);
const ALLOWED: Outcome[] = ['clicked_book_call', 'handoff_sent', 'hit_cap'];

export async function POST(req: Request) {
  try {
    const gate = rateLimit(`log:${clientIp(req)}`, LOG_PER_IP_PER_HOUR, 60 * 60 * 1000);
    if (!gate.ok) return NextResponse.json({ ok: true });

    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: string;
      outcome?: string;
    };
    const sessionId = (body.sessionId ?? '').trim().slice(0, 64);
    const outcome = (body.outcome ?? '').trim();

    if (sessionId && (ALLOWED as string[]).includes(outcome)) {
      setOutcome(sessionId, outcome as Outcome);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
