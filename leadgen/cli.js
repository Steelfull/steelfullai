#!/usr/bin/env node
'use strict';
/**
 * SteelfullAI lead engine — CLI.
 *
 *   node leadgen/cli.js source                 # find prospects -> data/leads.json
 *   node leadgen/cli.js export                  # write a review list -> data/leads.csv
 *   node leadgen/cli.js stats                   # show pipeline summary
 *
 *   (optional, only when YOU decide to reach out:)
 *   node leadgen/cli.js personalize            # add an AI opening line per lead
 *   node leadgen/cli.js send                    # DRY-RUN: preview outreach
 *   node leadgen/cli.js send --live             # actually send (rate-limited)
 *
 * Recommended flow: source -> export -> review the CSV yourself.
 * Nothing is ever sent unless you explicitly run `send --live`.
 */
const path = require('path');
const cfg = require('./config');
const store = require('./lib/store');
const { searchNiche } = require('./lib/sources');
const { openingLine, buildMessage } = require('./lib/personalize');
const { findEmail } = require('./lib/enrich');
const channels = require('./lib/channels');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => Math.floor(a + Math.random() * (b - a));

async function cmdSource() {
  let total = 0;
  for (const niche of cfg.niches) {
    process.stdout.write(`Searching "${niche.key}" in ${cfg.location}... `);
    try {
      const found = await searchNiche(niche);
      const added = store.upsertMany(found);
      total += added;
      console.log(`${found.length} found, ${added} new`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
  }
  console.log(`\nDone. ${total} new leads added.`);
}

async function cmdPersonalize() {
  const leads = store.loadLeads();
  const pending = leads.filter((l) => !l.openingLine);
  console.log(`Personalizing ${pending.length} leads...`);
  let done = 0;
  for (const lead of pending) {
    try {
      lead.openingLine = await openingLine(lead);
      done++;
      store.saveLeads(leads);
      console.log(`  ${lead.name}: ${lead.openingLine.slice(0, 70)}...`);
      await sleep(400);
    } catch (e) {
      console.log(`  ${lead.name}: ERROR ${e.message}`);
    }
  }
  console.log(`Done. ${done} personalized.`);
}

function sentToday(leads) {
  const today = new Date().toISOString().slice(0, 10);
  return leads.filter((l) => (l.contactedAt || '').slice(0, 10) === today).length;
}

async function cmdSend(live) {
  const leads = store.loadLeads();
  const channelField = cfg.channel === 'whatsapp' ? 'phone' : 'email';
  const budget = Math.min(cfg.perRunLimit, cfg.dailyLimit - sentToday(leads));
  if (budget <= 0) {
    console.log(`Daily limit (${cfg.dailyLimit}) reached. Nothing to send.`);
    return;
  }
  const queue = leads
    .filter((l) => l.status === 'new' && l.openingLine && l[channelField])
    .filter((l) => !store.isOptedOut(l))
    .slice(0, budget);

  console.log(
    `${live ? 'SENDING' : 'DRY-RUN'} via ${cfg.channel} — ${queue.length} message(s) (daily budget left: ${cfg.dailyLimit - sentToday(leads)})\n`
  );

  for (const lead of queue) {
    const body = buildMessage(lead, cfg.channel);
    console.log('────────────────────────────────────');
    console.log(`To: ${lead.name} <${lead[channelField]}> [${lead.niche}]`);
    console.log(body);
    if (live) {
      try {
        await channels.send(lead, body);
        lead.status = 'contacted';
        lead.contactedAt = new Date().toISOString();
        store.saveLeads(leads);
        console.log('✓ sent');
        await sleep(rnd(cfg.minDelayMs, cfg.maxDelayMs));
      } catch (e) {
        lead.status = 'error';
        lead.error = e.message;
        store.saveLeads(leads);
        console.log(`✗ ${e.message}`);
      }
    }
  }
  if (!live) console.log('\n(DRY-RUN — no messages sent. Re-run with --live to send.)');
}

async function cmdEnrich() {
  const leads = store.loadLeads();
  const pending = leads.filter((l) => l.website && !l.email);
  console.log(`Enriching ${pending.length} leads with a website but no email...`);
  let found = 0;
  for (const lead of pending) {
    try {
      const email = await findEmail(lead.website);
      if (email) {
        lead.email = email;
        found++;
        store.saveLeads(leads);
        console.log(`  ${lead.name}: ${email}`);
      } else {
        console.log(`  ${lead.name}: (no email found)`);
      }
    } catch (e) {
      console.log(`  ${lead.name}: ERROR ${e.message}`);
    }
    await sleep(rnd(1500, 4000));
  }
  console.log(`Done. Found ${found} email(s).`);
}

function csvCell(v) {
  const s = String(v == null ? '' : v).replace(/"/g, '""');
  return `"${s}"`;
}

function cmdExport() {
  const leads = store.loadLeads();
  const headers = [
    'Nome',
    'Nicho',
    'Serviço sugerido',
    'Telefone',
    'E-mail',
    'Website',
    'Endereço',
    'Status',
    'Fonte',
  ];
  const rows = leads.map((l) =>
    [
      l.name,
      l.niche,
      l.suggestedService,
      l.phone,
      l.email,
      l.website,
      l.address,
      l.status,
      l.source,
    ]
      .map(csvCell)
      .join(',')
  );
  // UTF-8 BOM so Excel renders accents correctly.
  const csv = '\ufeff' + [headers.map(csvCell).join(','), ...rows].join('\n') + '\n';
  const out = path.join(__dirname, 'data', 'leads.csv');
  require('fs').writeFileSync(out, csv);
  console.log(`Exported ${leads.length} leads -> ${out}`);
  console.log('Open it in Excel or Google Sheets to review.');
}

async function cmdPush() {
  const leads = store.loadLeads();
  if (leads.length === 0) {
    console.log('No leads to push. Run "source" first.');
    return;
  }
  const url = `${cfg.siteUrl.replace(/\/$/, '')}/api/insights/leads`;
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.insightsUser && cfg.insightsPassword) {
    headers.Authorization =
      'Basic ' + Buffer.from(`${cfg.insightsUser}:${cfg.insightsPassword}`).toString('base64');
  }
  if (cfg.leadsIngestSecret) headers['x-leads-secret'] = cfg.leadsIngestSecret;

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ leads }) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Push failed ${res.status}: ${text}`);
  console.log(`Pushed ${leads.length} leads -> ${url}`);
  console.log(text);
}

function cmdStats() {
  const leads = store.loadLeads();
  const by = (f) => leads.reduce((a, l) => ((a[l[f] || '—'] = (a[l[f] || '—'] || 0) + 1), a), {});
  console.log(`Total leads: ${leads.length}`);
  console.log('By status:', by('status'));
  console.log('By niche :', by('niche'));
  console.log('Sent today:', sentToday(leads));
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const live = rest.includes('--live');
  switch (cmd) {
    case 'source': return cmdSource();
    case 'enrich': return cmdEnrich();
    case 'export': return cmdExport();
    case 'push': return cmdPush();
    case 'personalize': return cmdPersonalize();
    case 'send': return cmdSend(live);
    case 'stats': return cmdStats();
    default:
      console.log('Usage: node leadgen/cli.js <source|enrich|export|push|stats|personalize|send [--live]>');
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
