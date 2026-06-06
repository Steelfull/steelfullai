'use strict';
/**
 * Generate a short, human-sounding opening line per lead with the Claude API.
 * The goal is RELEVANCE, not volume: one tailored sentence referencing the
 * business's niche, so outreach never looks like a mass blast.
 */
const cfg = require('../config');

const SYSTEM = `You write the FIRST line of a cold B2B outreach message for Tim-Luka Stahl, a solo software & business-automation specialist based in Rio de Janeiro. Audience: small businesses and self-employed professionals in Brazil. Write in natural Brazilian Portuguese (pt-BR), warm and respectful, never salesy or hypey. ONE or TWO short sentences. Reference the business's niche concretely and a plausible repetitive-work pain it has (e.g. agendamentos, atendimento no WhatsApp fora do horário, recadastro manual de dados). Do NOT invent specific facts about the company. Do NOT include greetings like "Olá" or a sign-off — only the opening hook. Output just the line, nothing else.`;

async function openingLine(lead) {
  if (!cfg.anthropicKey) throw new Error('ANTHROPIC_API_KEY is not set');
  const ctx = `Business name: ${lead.name}\nNiche: ${lead.niche}\nCategory: ${lead.category || ''}\nWebsite: ${lead.website || '(none)'}`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.leadgenModel,
      max_tokens: 160,
      temperature: 0.7,
      system: SYSTEM,
      messages: [{ role: 'user', content: ctx }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.content?.find((b) => b.type === 'text')?.text?.trim() || '';
}

/** Full message body built around the AI opening line + a soft CTA. */
function buildMessage(lead, channel) {
  const hook = lead.openingLine || '';
  const cta =
    channel === 'whatsapp'
      ? `Se fizer sentido, posso te mostrar em 15 min onde dá pra economizar tempo — sem compromisso. Prefere que eu te mande um resumo por aqui ou agendamos uma conversa rápida?`
      : `Se fizer sentido, posso te mostrar em uma conversa de 15 min onde dá pra economizar tempo, sem compromisso. Agenda aqui: ${cfg.calendly}`;
  const greeting = lead.name ? `Olá, ${lead.name}!` : 'Olá!';
  const signoff = `\n\n— ${cfg.senderName}\n${cfg.senderSite}`;
  const optout =
    channel === 'whatsapp'
      ? `\n\n(Se preferir não receber mensagens, é só responder SAIR.)`
      : `\n\nVocê recebeu este e-mail porque é um negócio local; se não quiser mais contato, responda com "REMOVER".`;
  return `${greeting}\n\n${hook}\n\n${cta}${signoff}${optout}`;
}

module.exports = { openingLine, buildMessage };
