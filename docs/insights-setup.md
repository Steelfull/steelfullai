# Chat Insights — deploy & use

The chat now logs every conversation **anonymously** to a SQLite file on a Docker
volume, and a weekly agent turns that into a private dashboard at
**`https://your-domain/insights`** (only you can open it).

## One-time setup on the VPS

1. **Update the lockfile** (a new dependency, `better-sqlite3`, was added):

   ```bash
   npm install        # regenerates package-lock.json so `npm ci` works in Docker
   ```

2. **Create the dashboard password** (bcrypt hash via Caddy):

   ```bash
   docker run --rm caddy:2-alpine caddy hash-password --plaintext 'pick-a-strong-password'
   ```

3. **Add to your `.env` on the VPS** (next to `docker-compose.yml`):

   ```env
   INSIGHTS_USER=tim
   INSIGHTS_PASSWORD_HASH='<paste the hash from step 2 — keep the single quotes>'
   ```

   The single quotes matter: a bcrypt hash contains `$` characters.

4. **Rebuild and restart:**

   ```bash
   docker compose up -d --build
   ```

That's it. Visit `https://your-domain/insights`, log in with `INSIGHTS_USER` and
your password, and you'll see live counts immediately. Themed analysis appears
after the first run.

## How it runs

- **Logging** happens automatically on every chat (one anonymous row per
  conversation: language, industry, message count, free-vs-paid answers, outcome,
  and a PII-scrubbed pain-point summary).
- **Weekly analysis** is triggered by the `insights-cron` container (runs on
  start, then every 7 days). It also prunes raw rows older than
  `INSIGHTS_RETENTION_DAYS` (default 90).
- **On demand:** click **Run analysis now** on the dashboard anytime.

## What you'll see

Funnel (conversations → engaged → handoffs/book-clicks → conversion %), free-answer
rate (your cost-saver metric), top industries and languages, and — from the agent —
the most-requested automations, common objections, high-intent chats that didn't
convert, and **suggested new canned answers**. When a suggestion is good, paste it
into `src/lib/chatFaq.ts` so the bot answers it for free next time.

## Safety / cost notes

- Everything is **fail-soft**: if the database or the analysis ever errors, the
  chat keeps working — you just won't get that data point.
- The weekly run uses Haiku over *aggregated* data and a small text sample, so
  it costs cents.
- The dashboard and `POST /api/insights` are behind Caddy basic-auth; the app's
  internal port is never exposed publicly.

## Tuning

All optional, via `.env`: `INSIGHTS_PERIOD_DAYS`, `INSIGHTS_RETENTION_DAYS`,
`INSIGHTS_MODEL`, and `INSIGHTS_TRIGGER_SECRET` (extra header guard on the run
endpoint). Rate limits for the chat live in `src/app/api/chat/route.ts`
(`CHAT_PER_IP_PER_HOUR`, `CHAT_MAX_USER_MESSAGES`).
