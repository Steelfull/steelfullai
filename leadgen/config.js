'use strict';
/**
 * Central configuration for the SteelfullAI lead engine.
 * Reads from environment variables (and an optional repo-root .env file).
 * Nothing here is secret — secrets live in .env (see leadgen/.env.example).
 */
const fs = require('fs');
const path = require('path');

// Minimal .env loader (no dependency). Looks at repo root and leadgen/.
function loadEnv() {
  for (const p of [path.join(__dirname, '..', '.env'), path.join(__dirname, '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const raw of fs.readFileSync(p, 'utf8').split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}
loadEnv();

const env = (k, d) => process.env[k] ?? d;

module.exports = {
  // Where to look for prospects.
  location: env('LEADGEN_LOCATION', 'Rio de Janeiro, RJ, Brazil'),
  // Niches map to a Portuguese search query each (matches the site's use-cases).
  niches: [
    { key: 'clinica', query: 'clínicas e consultórios em {loc}', service: 'Automação de agendamento e atendimento no WhatsApp' },
    { key: 'idiomas', query: 'escolas de idiomas em {loc}', service: 'Automação de matrículas, lembretes e atendimento' },
    { key: 'imobiliaria', query: 'imobiliárias em {loc}', service: 'Captação e roteamento de leads (WhatsApp + CRM)' },
    { key: 'advocacia', query: 'escritórios de advocacia em {loc}', service: 'Automação de intake de clientes e organização de documentos' },
  ],

  // Sending guardrails (keep these LOW — this is cold B2B, not spam).
  dailyLimit: Number(env('LEADGEN_DAILY_LIMIT', 20)),
  perRunLimit: Number(env('LEADGEN_PER_RUN_LIMIT', 10)),
  minDelayMs: Number(env('LEADGEN_MIN_DELAY_MS', 8000)),
  maxDelayMs: Number(env('LEADGEN_MAX_DELAY_MS', 25000)),

  // Channel + provider selection.
  channel: env('LEADGEN_CHANNEL', 'email'), // 'email' | 'whatsapp'
  whatsappProvider: env('WHATSAPP_PROVIDER', 'evolution'), // 'cloud' | 'evolution'

  // Models / keys (shared with the website where it makes sense).
  anthropicKey: env('ANTHROPIC_API_KEY', ''),
  leadgenModel: env('LEADGEN_MODEL', 'claude-haiku-4-5-20251001'),
  placesKey: env('GOOGLE_PLACES_API_KEY', ''),

  // Your identity, injected into outreach copy.
  senderName: env('LEADGEN_SENDER_NAME', 'Tim-Luka Stahl'),
  senderSite: env('LEADGEN_SENDER_SITE', 'https://steelfullai.com'),
  calendly: env('NEXT_PUBLIC_CALENDLY_URL', 'https://calendly.com/tim-luka_stahl'),

  // Pushing leads to the private /insights/leads dashboard.
  siteUrl: env('SITE_URL', 'https://steelfullai.com'),
  insightsUser: env('INSIGHTS_USER', ''),
  insightsPassword: env('INSIGHTS_PASSWORD', ''),
  leadsIngestSecret: env('LEADS_INGEST_SECRET', ''),

  paths: {
    leads: path.join(__dirname, 'data', 'leads.json'),
    optout: path.join(__dirname, 'data', 'optout.json'),
  },
};
