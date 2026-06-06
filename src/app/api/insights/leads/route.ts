import { NextResponse } from 'next/server';
import { upsertLeads, listLeads, updateLeadStatus, type LeadInput } from '@/lib/leadsDb';

/**
 * Lead ingest + list API.
 *
 * Path note: this lives UNDER /api/insights, so Caddy's basic-auth (which
 * matches /insights* and /api/insights*) already protects it — no extra Caddy
 * rule needed. The leadgen CLI sends those basic-auth credentials when it
 * pushes. For defense-in-depth you can also set LEADS_INGEST_SECRET and send it
 * as the `x-leads-secret` header.
 *
 *   POST  { leads: LeadInput[] }  → upsert, returns { added, updated }
 *   GET                            → { leads: LeadRow[] }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INGEST_SECRET = process.env.LEADS_INGEST_SECRET ?? '';
const ALLOWED_STATUSES = ['new', 'contacted', 'qualified', 'no_interest', 'won'];

export async function POST(req: Request) {
  if (INGEST_SECRET) {
    if ((req.headers.get('x-leads-secret') ?? '') !== INGEST_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { leads?: LeadInput[] };
    const leads = Array.isArray(body.leads) ? body.leads.slice(0, 5000) : [];
    if (leads.length === 0) {
      return NextResponse.json({ error: 'no_leads' }, { status: 400 });
    }
    const result = upsertLeads(leads);
    return NextResponse.json({ ok: true, ...result, received: leads.length });
  } catch (err) {
    console.error('leads ingest failed', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // Status changes come from the dashboard (already behind Caddy basic-auth),
  // so no ingest secret is required here.
  try {
    const body = (await req.json().catch(() => ({}))) as { id?: number; status?: string };
    const id = Number(body.id);
    const status = String(body.status ?? '');
    if (!id || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
    const ok = updateLeadStatus(id, status);
    return NextResponse.json(ok ? { ok: true } : { error: 'not_found' }, { status: ok ? 200 : 404 });
  } catch (err) {
    console.error('lead status update failed', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ leads: listLeads() });
}
