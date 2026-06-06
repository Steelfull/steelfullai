/**
 * Lead handling — shared by the contact form (/api/contact) and the chatbot
 * hand-off (/api/lead).
 *
 * For each incoming lead we:
 *   1. Run the project description through an internal "triage" briefing agent
 *      (a smarter model — Sonnet by default) that estimates scope, effort,
 *      difficulty and a ROUGH internal price range.
 *   2. Email Tim the raw lead with that briefing appended.
 *
 * The briefing is FOR TIM ONLY — it is never shown to the customer and is
 * explicitly an estimate to verify, never a quote. Briefing generation is
 * best-effort: if it fails or times out, the lead email is still sent.
 *
 * Env:
 *   ANTHROPIC_API_KEY            (shared with the chatbot)
 *   BRIEFING_MODEL=claude-sonnet-4-6   (the smarter model for triage)
 *   SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS
 *   CONTACT_TO / CONTACT_FROM
 *   LEAD_WEBHOOK_URL            (optional — also POST the lead+briefing here)
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const BRIEFING_MODEL = process.env.BRIEFING_MODEL ?? 'claude-sonnet-4-6';

const BRIEFING_SYSTEM = `You are an internal project-triage assistant for Tim-Luka Stahl, a solo software developer and business-automation specialist. A potential client has described a project or problem. Produce a SHORT internal briefing that helps Tim plan before he replies. This is for Tim's eyes only — it is never shown to the client and is an estimate to verify, never a quote.

Be realistic, concise and honest. Use exactly these headings:
- Summary: one or two sentences in plain English (translate if the client wrote another language).
- Likely scope: a few bullets of what building this probably involves.
- Estimated effort: a range in developer-days.
- Difficulty: a number 1-5 (1 = trivial, 5 = very hard) with a few words why.
- Rough price range: an internal ballpark in EUR, clearly marked as an estimate to verify. Base it on the effort (assume a solo developer-day is roughly €400-700).
- Key risks / unknowns.
- Questions Tim should ask the client.
- Recommended next step.

If the description is too vague to estimate, say so plainly and focus on the questions to ask. Never invent requirements the client did not state.`;

/** Generate the internal briefing. Returns null on any failure (non-fatal). */
export async function generateBriefing(projectText: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY || !projectText.trim()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: BRIEFING_MODEL,
        max_tokens: 800,
        temperature: 0.3,
        system: BRIEFING_SYSTEM,
        messages: [{ role: 'user', content: projectText.slice(0, 6000) }],
      }),
    });
    if (!res.ok) {
      console.error('Briefing model error', res.status);
      return null;
    }
    const data = await res.json();
    return (
      data?.content?.find((b: { type: string }) => b.type === 'text')?.text?.trim() ?? null
    );
  } catch (err) {
    console.error('Briefing generation failed', err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export type Lead = {
  source: 'form' | 'chat';
  name?: string;
  email?: string;
  industry?: string;
  projectText: string; // the description / transcript used for the briefing
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Email Tim the lead + briefing. Throws if SMTP is not configured (the caller
 * decides how to respond). Optionally forwards to LEAD_WEBHOOK_URL.
 */
export async function notifyTim(lead: Lead, briefing: string | null): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error('SMTP not configured');
  }

  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  const to = process.env.CONTACT_TO ?? user;
  const from = process.env.CONTACT_FROM ?? user;
  const who = lead.name || (lead.source === 'chat' ? 'Chat visitor' : 'Website lead');

  const metaLines = [
    `Source: ${lead.source === 'chat' ? 'Chatbot conversation' : 'Contact form'}`,
    lead.name ? `Name: ${lead.name}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.industry ? `Industry: ${lead.industry}` : null,
  ].filter(Boolean) as string[];

  const briefingBlock = briefing
    ? `\n\n──────────────\nAI BRIEFING (internal estimate — verify, not a quote)\n──────────────\n${briefing}`
    : `\n\n(AI briefing unavailable for this lead.)`;

  const text = `${metaLines.join('\n')}\n\n— Description —\n${lead.projectText}${briefingBlock}`;

  const html = `<p>${metaLines.map(escapeHtml).join('<br>')}</p>
<p><strong>Description</strong></p>
<p style="white-space:pre-wrap">${escapeHtml(lead.projectText)}</p>
${
  briefing
    ? `<hr><p><strong>AI briefing</strong> <em>(internal estimate — verify, not a quote)</em></p>
<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(briefing)}</pre>`
    : `<hr><p><em>AI briefing unavailable for this lead.</em></p>`
}`;

  await transporter.sendMail({
    from,
    to,
    replyTo: lead.email ? `${who} <${lead.email}>` : undefined,
    subject: `New ${lead.source === 'chat' ? 'chat' : 'form'} lead from ${who}`,
    text,
    html,
  });

  // Optional: also forward to another agent / automation.
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, briefing }),
      });
    } catch (err) {
      console.error('Lead webhook failed', err);
    }
  }
}
