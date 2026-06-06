import { NextResponse } from 'next/server';
import { generateBriefing, notifyTim } from '@/lib/lead';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// Each submission triggers a Sonnet briefing + an email, so guard it per IP.
const CONTACT_PER_IP_PER_HOUR = Number(process.env.CONTACT_PER_IP_PER_HOUR ?? 5);

/**
 * Contact form API — emails each submission to Tim with an internal AI briefing
 * (scope/effort/difficulty/rough price) appended. See src/lib/lead.ts for the
 * required SMTP_* / ANTHROPIC_API_KEY / BRIEFING_MODEL env vars.
 */

export const runtime = 'nodejs';

type Payload = {
  name?: string;
  email?: string;
  message?: string;
  service?: string;
  meeting?: string;
  company?: string;
};

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Stable keys sent by the form -> readable labels for Tim's internal email.
const SERVICE_LABELS: Record<string, string> = {
  automation: 'Process automation / WhatsApp',
  software: 'Custom software',
  integration: 'Systems integration (CRM/ERP)',
  aiagents: 'AI agents / chatbots',
  audit: 'Not sure yet - wants an audit',
};
const MEETING_LABELS: Record<string, string> = {
  inperson: 'In person (Rio de Janeiro)',
  online: 'Online / remote',
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Payload;

    // Honeypot: bots fill the hidden "company" field; humans never see it.
    if (body.company) return NextResponse.json({ ok: true });

    const gate = rateLimit(`contact:${clientIp(req)}`, CONTACT_PER_IP_PER_HOUR, 60 * 60 * 1000);
    if (!gate.ok) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const name = (body.name ?? '').trim().slice(0, 120);
    const email = (body.email ?? '').trim().slice(0, 200);
    const message = (body.message ?? '').trim().slice(0, 4000);

    if (!name || !message || !isEmail(email)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    // Optional qualifiers from the form (only accept known values).
    const service = SERVICE_LABELS[body.service ?? ''] ?? undefined;
    const meeting = MEETING_LABELS[body.meeting ?? ''] ?? undefined;

    // Give the briefing model the chosen service as context, too.
    const projectText = service ? `Requested service: ${service}\n\n${message}` : message;

    // Best-effort internal briefing (never blocks the lead from being sent).
    const briefing = await generateBriefing(projectText);

    try {
      await notifyTim(
        { source: 'form', name, email, service, meeting, projectText: message },
        briefing
      );
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
