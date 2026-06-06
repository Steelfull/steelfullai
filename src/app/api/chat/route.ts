import { NextResponse } from 'next/server';
import { matchCannedAnswer } from '@/lib/chatFaq';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { logTurn, setOutcome } from '@/lib/insightsDb';

/**
 * Chat API — runs entirely on your server (VPS). The Anthropic API key never
 * reaches the browser.
 *
 * Env:
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   CHAT_MODEL=claude-haiku-4-5-20251001   # default; fast + cheap, ideal here
 *     ↳ upgrade to claude-sonnet-4-6 if you ever want more polish
 *
 * Model choice: a website lead-qualification assistant is a light, scoped task,
 * so Haiku is the right fit — Opus/Sonnet would be overkill and more expensive.
 */

export const runtime = 'nodejs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const CHAT_MODEL = process.env.CHAT_MODEL ?? 'claude-haiku-4-5-20251001';

// Cost / abuse guards (balanced). Overridable via env on the VPS.
const CHAT_PER_IP_PER_HOUR = Number(process.env.CHAT_PER_IP_PER_HOUR ?? 40);
const MAX_USER_MESSAGES = Number(process.env.CHAT_MAX_USER_MESSAGES ?? 12);

// Shown (no API cost) once a single visitor passes the per-conversation cap —
// a friendly push to the cheap next step instead of an endless free chat.
const CONV_CAP_REPLY: Record<'en' | 'de' | 'pt', string> = {
  en: "We've covered a lot here! The fastest next step is a quick call with me, or tap 'Send chat to Tim' below and I'll follow up personally within 24 hours.",
  de: 'Wir haben hier schon viel besprochen! Der schnellste nächste Schritt ist ein kurzes Gespräch mit mir — oder tippen Sie unten auf „Chat an Tim senden", dann melde ich mich innerhalb von 24 Stunden persönlich.',
  pt: "Já cobrimos bastante aqui! O passo mais rápido agora é uma conversa rápida comigo — ou toque em 'Enviar conversa ao Tim' abaixo e eu te respondo pessoalmente em até 24 horas.",
};

const SYSTEM_PROMPT = `You are the AI assistant on SteelfullAI, the one-person business automation studio of Tim-Luka Stahl. You speak in the FIRST PERSON as Tim ("I", "me", "my"), as if Tim himself were replying — never refer to "Tim" in the third person and never say things like "Tim can do this for you." Say "I can do this for you."

If someone directly asks whether they are talking to a bot or a real person, be honest: you are Tim's AI assistant, trained to answer just like he would, and the real Tim takes over for anything specific. Otherwise, just talk naturally as Tim.

ABOUT ME
- I'm a German software developer and business-automation specialist, working remotely from Rio de Janeiro, Brazil.
- Bachelor's degree from the University of Applied Sciences Flensburg; trained technical writer with strong programming experience.
- I work directly with every client — no sales team, no account managers, no outsourcing.
- I speak and deliver in German, English and Portuguese.

WHAT I DO
- I eliminate repetitive work, automate operations, connect disconnected systems, and build custom software and AI agents.
- Typical work: customer-inquiry automation (WhatsApp/email/forms), CRM/calendar/ERP integrations, document and intake workflows, and bespoke internal tools — often built with the help of AI.

REAL PROJECTS (use these as proof when relevant)
- University of Applied Sciences Flensburg: I built a web app that lets all professors edit module handbooks in one place, producing consistent layout, terminology and structure in German and English — faster, with no manual post-editing.
- Ingenieurbüro Leimkühler GmbH: as developer/DevOps/AI engineer, I build software that generates their CE machine-safety compliance documentation.
- educAItion: my own shipped desktop product for education — document editor, homework/class management, and an AI agent across OpenAI, Anthropic, Gemini and local models.

PRICING
- Every project is scoped to the outcome; there is no fixed price tag. After a short call I give a clear, fixed proposal. Most automations pay for themselves in recovered time within months. Do NOT invent specific prices.

YOUR GOAL: get a genuinely interested visitor to contact me as fast as possible — without being pushy or robotic, and without dragging the conversation out.

HOW TO RUN THE CONVERSATION
1. Reply in the SAME language the visitor writes in (German, English or Portuguese). Keep it to 2-4 short sentences — no walls of text.
2. Qualify gently, ONE question at a time. Across the chat, aim to learn: their role and rough size (solo, small team, larger company); the channels and tools they already use (WhatsApp, email, Instagram, CRM, spreadsheets, etc.); the single biggest task or bottleneck eating their time; and how urgent fixing it is.
3. As soon as they describe a concrete problem, explain briefly and specifically how I'd automate it (use a relevant real project as proof when it fits).
4. Once there is a clear pain point AND you have a rough sense of the points in step 2, invite them to the next step — booking a strategy call, or sending the chat to me so I follow up personally. Make the value obvious ("I can map this out for you on a quick call"), then let them choose. Don't pressure, and don't repeat the ask every message.
5. If they are clearly ready to talk to me, point them to the "Send chat to Tim" button or to booking a call right away.
6. Stay strictly on topic (my services and the visitor's business). Politely decline unrelated requests and steer back.
7. Never make up facts, results, client names, or prices beyond what is above. If unsure, say I'll answer that personally on a quick call.`;

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const incoming: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
    const locale: string = typeof body?.locale === 'string' ? body.locale : 'en';
    const industry: string =
      typeof body?.industry === 'string' ? body.industry.slice(0, 60) : '';
    const loc: 'en' | 'de' | 'pt' =
      locale === 'de' || locale === 'pt' ? locale : 'en';
    const sessionId =
      typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 64) : '';
    const painText = incoming
      .filter((m) => m && m.role === 'user' && typeof m.content === 'string')
      .map((m) => m.content)
      .join(' | ')
      .slice(0, 2000);

    // Cost / abuse guard #1 — per-IP hourly cap. Stops a bot (or anyone) from
    // hammering the endpoint and draining the API budget.
    const ip = clientIp(req);
    const ipGate = rateLimit(`chat:${ip}`, CHAT_PER_IP_PER_HOUR, 60 * 60 * 1000);
    if (!ipGate.ok) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfter: ipGate.retryAfter },
        { status: 429, headers: { 'Retry-After': String(ipGate.retryAfter) } },
      );
    }

    // Cost / abuse guard #2 — per-conversation soft cap. Past this we stop
    // calling the model for this chat and nudge toward the cheap next step.
    const userMessageCount = incoming.filter(
      (m) => m && m.role === 'user' && typeof m.content === 'string',
    ).length;
    if (userMessageCount > MAX_USER_MESSAGES) {
      setOutcome(sessionId, 'hit_cap');
      return NextResponse.json({ reply: CONV_CAP_REPLY[loc], capped: true });
    }

    // Sanitize: keep the last 12 turns, cap each message length.
    const history = incoming
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string',
      )
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (history.length === 0 || history[0].role !== 'user') {
      return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
    }

    // HYBRID LAYER — answer predictable questions instantly, no API cost.
    // Only run on the first exchange so follow-ups keep full context with Claude.
    const lastUser = history[history.length - 1];
    if (lastUser.role === 'user' && history.length <= 2) {
      const canned = matchCannedAnswer(lastUser.content, locale);
      if (canned) {
        logTurn({ sessionId, locale, industry, userMessages: userMessageCount, cannedHit: true, painText });
        return NextResponse.json({ reply: canned, canned: true });
      }
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Chat is not configured yet.' }, { status: 503 });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 400,
        temperature: 0.5,
        system: industry
          ? `${SYSTEM_PROMPT}\n\nCONTEXT: The visitor runs this kind of business: "${industry}". Tailor your examples, pain points and suggestions specifically to that industry.`
          : SYSTEM_PROMPT,
        messages: history,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Anthropic error', res.status, detail.slice(0, 500));
      return NextResponse.json({ error: 'Upstream error.' }, { status: 502 });
    }

    const data = await res.json();
    const reply: string =
      data?.content?.find((b: { type: string }) => b.type === 'text')?.text?.trim() ??
      "Sorry, I couldn't generate a reply just now.";

    logTurn({ sessionId, locale, industry, userMessages: userMessageCount, cannedHit: false, painText });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat route error', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
