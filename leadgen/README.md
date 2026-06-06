# SteelfullAI — Lead Engine

A small, self-contained pipeline to (1) **find** local prospects, (2) **personalize**
a first line with Claude, and (3) **send** compliant, rate-limited outreach.
No database, no extra npm packages — just Node 18+ and the API keys you choose.

```
leadgen/
  cli.js              # entry point (source | personalize | send | stats)
  config.js           # all settings (reads .env)
  lib/sources.js      # Google Places search
  lib/personalize.js  # Claude opening line + message builder
  lib/channels.js     # email (SMTP) + WhatsApp (Cloud / Evolution)
  lib/store.js        # JSON lead store + dedupe + opt-out
  data/               # leads.json + optout.json (git-ignored)
```

## Setup
1. `cp leadgen/.env.example .env` and fill in keys (Google Places + Anthropic at minimum).
2. Run the pipeline:

```bash
node leadgen/cli.js source        # collect prospects into data/leads.json
node leadgen/cli.js enrich        # find emails on each website (best-effort)
node leadgen/cli.js export        # write a review list -> data/leads.csv
node leadgen/cli.js push          # send leads to the private /insights/leads dashboard
node leadgen/cli.js stats         # pipeline summary

# Optional — only when YOU decide to reach out:
node leadgen/cli.js personalize   # add one tailored PT-BR opening line each
node leadgen/cli.js send          # DRY-RUN — prints every message, sends nothing
node leadgen/cli.js send --live   # actually send, respecting daily/per-run limits
```

**Default mode = collect + list.** Run `source` then `export`, then open
`data/leads.csv` (Name, niche, suggested service, phone, website, address) and decide
who to contact yourself. Nothing is sent unless you explicitly run `send --live`.

> Note: Google Places returns **phone, website and address** — not email. The E-mail
> column stays empty; grab the address from each website, or enrich it later.

## Where to see the list
Two ways to review collected leads:

1. **CSV** — `node leadgen/cli.js export` → open `data/leads.csv` in Excel/Sheets.
2. **Live dashboard** — `node leadgen/cli.js push` sends them to your private
   **steelfullai.com/insights/leads** page (a sortable table with name, niche,
   suggested service, phone, email, website, address). That page sits under
   `/insights`, so it's already protected by the same basic-auth login as your
   chat-insights dashboard — it is NOT public. Leads are stored in the app's
   SQLite database (same volume as the insights data).

## Run it daily (automatic)
Two options — pick one:

- **GitHub Actions (turnkey):** `.github/workflows/leads.yml` runs `source → enrich →
  push` every day at 06:00 BRT. Add these repo secrets: `GOOGLE_PLACES_API_KEY`,
  `ANTHROPIC_API_KEY`, `SITE_URL`, `INSIGHTS_USER`, `INSIGHTS_PASSWORD`
  (and optionally `LEADS_INGEST_SECRET`). No server access needed.
- **Server cron (VPS):** add to `crontab -e`:

  ```
  0 6 * * * /path/to/steelfullai/leadgen/refresh.sh >> /var/log/leadgen.log 2>&1
  ```

Either way nothing is *sent to prospects* — the daily job only collects, enriches and
publishes the list to your dashboard. Outreach stays manual (`send --live`).

## Compliance — read before going --live
This is built for **relevant, low-volume, opt-out-respecting** outreach, not mass spam.

- **WhatsApp & Instagram forbid bulk unsolicited automation.** Numbers/accounts get
  banned fast. For WhatsApp prefer the **official Cloud API** with an approved template
  for cold contact; free text only works inside a 24h reply window. The Evolution
  provider is included because it's common in Brazil, but it carries ban risk — warm the
  number up, keep volume tiny, and personalize every message.
- **Email is the safest cold B2B channel.** Use a real mailbox (e.g. Hostinger), set up
  SPF/DKIM/DMARC, and warm the domain.
- **LGPD (Brazil):** cold B2B contact can rely on legitimate interest, but you must offer
  a clear opt-out and honor it. Add opted-out contacts to `data/optout.json`
  (`phones` / `emails`) — the sender skips them automatically.
- Keep `LEADGEN_DAILY_LIMIT` / `PER_RUN_LIMIT` low and the random delays on.

## Customizing
- Niches & search queries: `config.js` → `niches`.
- Tone of the opening line: `lib/personalize.js` → `SYSTEM`.
- Channel: `LEADGEN_CHANNEL=email|whatsapp` in `.env`.

## Run it on a schedule (later)
Wire `source` + `personalize` to a daily cron, review the queue, then run `send --live`
yourself. Keeping a human in the loop before sending is the safest setup.
