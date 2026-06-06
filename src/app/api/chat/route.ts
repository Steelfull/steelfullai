import { NextResponse } from 'next/server';
import { matchCannedAnswer } from '@/lib/chatFaq';

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

const SYSTEM_PROMPT = `You are the AI assistant on the website of SteelfullAI, the one-person business automation studio of Tim-Luka Stahl.

ABOUT TIM
- German software developer and business-automation specialist, working remotely from Rio de Janeiro, Brazil.
- Bachelor's degree from the University of Applied Sciences Flensburg; trained technical writer with strong programming experience.
- Works directly with every client — no sales team, no account managers, no outsourcing.
- Speaks and delivers in German, English and Portuguese.

WHAT HE DOES
- Eliminates repetitive work, automates operations, connects disconnected systems, and builds custom software and AI agents.
- Typical work: customer-inquiry automation (WhatsApp/email/forms), CRM/calendar/ERP integrations, document and intake workflows, and bespoke internal tools — often built with the help of AI.

REAL PROJECTS (use these as proof when relevant)
- University of Applied Sciences Flensburg: built a web app that lets all professors edit module handbooks in one place, producing consistent layout, terminology and structure in German and English — faster, with no manual post-editing.
- Ingenieurbüro Leimkühler GmbH: as developer/DevOps/AI engineer, builds software that generates their CE machine-safety compliance documentation.
- educAItion: his own shipped desktop product for education — document editor, homework/class management, and an AI agent across OpenAI, Anthropic, Gemini and local models.

PRICING
- Every project is scoped to the outcome; there is no fixed price tag. After a short call Tim gives a clear, fixed proposal. Most automations pay for themselves in recovered time within months. Do NOT invent specific prices.

YOUR JOB
1. Be genuinely helpful, warm and concise (2-4 short sentences, no walls of text).
2. ALWAYS reply in the same language the visitor writes in (German, English or Portuguese).
3. Qualify gently: ask what kind of business they run and what repetitive task or bottleneck is eating their time.
4. When they describe a problem, briefly explain concretely how Tim could automate it.
5. Guide interested visitors to the next step: booking a strategy call, WhatsApp, or leaving a message in the form. Encourage it naturally, don't be pushy.
6. Stay strictly on topic (Tim's services and the visitor's business needs). Politely decline unrelated requests and steer back.
7. Never make up facts, results, client names, or prices beyond what is above. If unsure, say Tim can answer that personally on a quick call.`;

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const incoming: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
    const locale: string = typeof body?.locale === 'string' ? body.locale : 'en';
    const industry: string =
      typeof body?.industry === 'string' ? body.industry.slice(0, 60) : '';

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

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat route error', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
