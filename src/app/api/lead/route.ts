import { NextResponse } from 'next/server';
import { generateBriefing, notifyTim } from '@/lib/lead';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { setOutcome } from '@/lib/insightsDb';

// Each hand-off triggers a Sonnet briefing + an email, so guard it per IP.
const LEAD_PER_IP_PER_HOUR = Number(process.env.LEAD_PER_IP_PER_HOUR ?? 5);

/**
 * Chatbot hand-off API — a visitor sends their conversation to Tim. We turn the
 * transcript into a project description, generate an internal AI briefing, and
 * email it to Tim. Shares the logic in src/lib/lead.ts with the contact form.
 */

export const runtime = 'nodejs';

type Turn = { role: 'user' | 'assistant'; content: string };
type Payload = {
  transcript?: Turn[];
  name?: string;
  email?: string;
  industry?: string;
  sessionId?: string;
  company?: string; // honeypot
};

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Payload;
    if (body.company) return NextResponse.json({ ok: true }); // honeypot

    const gate = rateLimit(`lead:${clientIp(req)}`, LEAD_PER_IP_PER_HOUR, 60 * 60 * 1000);
    if (!gate.ok) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    // Silent background hand-off: a visitor's email is usually not available
    // (the lead never sees this). Include it only if it happens to be valid.
    const rawEmail = (body.email ?? '').trim().slice(0, 200);
    const email = isEmail(rawEmail) ? rawEmail : '';
    const name = (body.name ?? '').trim().slice(0, 120);
    const industry = (body.industry ?? '').trim().slice(0, 60);
    const sessionId = (body.sessionId ?? '').trim().slice(0, 64);

    const turns = Array.isArray(body.transcript) ? body.transcript : [];
    const conversation = turns
      .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
      .slice(-20)
      .map((t) => `${t.role === 'user' ? 'Visitor' : 'Assistant'}: ${t.content.slice(0, 1500)}`)
      .join('\n');

    if (!conversation) {
      return NextResponse.json({ error: 'empty' }, { status: 400 });
    }

    const projectText = `Chatbot conversation${industry ? ` (industry: ${industry})` : ''}:\n\n${conversation}`;

    const briefing = await generateBriefing(projectText);

    try {
      await notifyTim({ source: 'chat', name, email, industry, projectText }, briefing);
    } catch (err) {
      console.error('Lead email failed', err);
      return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
    }

    setOutcome(sessionId, 'handoff_sent');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Lead route error', err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
