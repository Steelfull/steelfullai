import { NextResponse } from 'next/server';
import { generateBriefing, notifyTim } from '@/lib/lead';

/**
 * Contact form API — emails each submission to Tim with an internal AI briefing
 * (scope/effort/difficulty/rough price) appended. See src/lib/lead.ts for the
 * required SMTP_* / ANTHROPIC_API_KEY / BRIEFING_MODEL env vars.
 */

export const runtime = 'nodejs';

type Payload = { name?: string; email?: string; message?: string; company?: string };

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Payload;

    // Honeypot: bots fill the hidden "company" field; humans never see it.
    if (body.company) return NextResponse.json({ ok: true });

    const name = (body.name ?? '').trim().slice(0, 120);
    const email = (body.email ?? '').trim().slice(0, 200);
    const message = (body.message ?? '').trim().slice(0, 4000);

    if (!name || !message || !isEmail(email)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    // Best-effort internal briefing (never blocks the lead from being sent).
    const briefing = await generateBriefing(message);

    try {
      await notifyTim({ source: 'form', name, email, projectText: message }, briefing);
    } catch (err) {
      console.error('Contact email failed', err);
      return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact route error', err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
