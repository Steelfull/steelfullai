# Chat Insights Agent — Design & Build Plan

*SteelfullAI — turning chatbot conversations into business intelligence*

## The idea in one paragraph

Every chat your bot has is free market research. Right now that signal is thrown
away after each conversation. This plan adds a quiet logging layer, an analysis
agent that reads those logs on a schedule, and a private dashboard where you can
see — at a glance — which industries are showing up, what people most want
automated, what objections keep coming up, and which interested visitors *didn't*
convert. The agent also proposes new canned answers, which you approve. Those go
back into the bot, so it gets smarter **and cheaper** over time (more questions
answered for free, fewer paid API calls). That closing loop is what makes the
whole thing "run on its own."

---

## How it fits what we just changed

The chat now only emails you when a visitor **opts in** ("Send chat to Tim").
That's good for your inbox, but it means the ~90% of conversations that *don't*
convert — exactly the ones full of useful signal — would otherwise vanish. The
insights layer captures that silent majority **anonymously and in aggregate**, so
you learn from every conversation without an email for each one.

---

## Architecture — three layers

```
   Visitor chats
        │
        ▼
 ┌──────────────────┐     1. CAPTURE
 │  logConversation │  one compact, anonymous record per conversation
 │  (in /api/chat)  │  → stored on your VPS
 └──────────────────┘
        │
        ▼
 ┌──────────────────┐     2. ANALYZE (scheduled, e.g. weekly)
 │  Insights agent  │  deterministic counts + an LLM pass for themes,
 │  /api/insights   │  objections, requested automations, suggestions
 └──────────────────┘
        │
        ▼
 ┌──────────────────┐     3. PRESENT
 │  /insights page  │  a private live dashboard you open anytime;
 │  (password-gated) │  "Run analysis now" button to refresh
 └──────────────────┘
        │
        ▼
   You approve suggested canned answers → back into the bot (self-improving loop)
```

---

## Layer 1 — Conversation logging

**What we record (one row per conversation, not per message):**

- a random `sessionId` (generated in the browser; **not** tied to a person)
- timestamps (started, last activity)
- site language (`de` / `en` / `pt`)
- industry the visitor picked, plus the industry the model infers from the text
- number of user messages, and how many were answered by the **free canned layer**
  vs. the **paid model**
- outcome: `abandoned` / `hit_cap` / `clicked_book_call` / `handoff_sent`
- the "drop-off point" (which step they stopped at)
- a short, **anonymised** summary of the pain point they described — generated
  cheaply, with names/emails/phone numbers stripped

**What we deliberately do NOT store:** no email or name unless they actively hand
off; no raw IP (hash it, or skip it); no third-party tracking. This keeps you on
the right side of EU/GDPR rules (you operate from the EU context) and means the
dataset is low-risk.

**Where to store it — recommended: a small SQLite file on a Docker volume.**

You already run Postgres for Umami, but I'd keep this **separate and dead-simple**
rather than coupling chat logs to your web-analytics DB. A single SQLite file on a
mounted volume needs zero extra services, survives restarts, and is trivial to
query and back up:

```yaml
# docker-compose.yml — add a volume to the existing `app` service
  app:
    # ...existing config...
    volumes:
      - app_data:/data          # ← new: persistent storage for chat logs

volumes:
  app_data:                      # ← new
```

The app writes `/data/chat.sqlite`. (Library: `better-sqlite3` — synchronous,
fast, no server.) If you'd rather centralise everything in Postgres later, the
table schema is identical — it's a one-file swap.

**When we write:** logging is fire-and-forget and must never slow the chat or
cost a visitor anything. We upsert the conversation row keyed by `sessionId` —
updating message counts and outcome as the chat progresses, finalised when the
panel closes, the cap is hit, or a handoff fires.

---

## Layer 2 — The insights agent

A scheduled job (a cron entry in the container, **or** a Cowork scheduled task,
**or** a protected `/api/insights` route pinged by cron) that runs e.g. every
Monday morning. It works in two stages to stay cheap:

**Stage A — deterministic aggregation (no AI, free):**

- conversations per week, per language, per industry
- conversion funnel: opened → engaged (≥2 msgs) → handoff/booked
- canned-answer hit rate (your cost-saver metric)
- message-count distribution and most common drop-off step

**Stage B — one LLM pass over the *aggregated* data + a sample of anonymised
pain-point summaries** (Haiku is enough; send summaries, never full transcripts —
keeps tokens and cost tiny):

- cluster pain points into **themes** ("appointment reminders", "lead routing"…)
- rank the **most-requested automations**
- surface recurring **objections / hesitations** (price, trust, "will it work with
  my tools")
- flag **high-intent visitors who didn't convert** (long, specific chats with no
  handoff) so you can tighten the funnel
- propose **new canned Q&As and industry openers** drawn from real questions

The run output is saved as a structured record (`insights_runs`) so the dashboard
just reads the latest — no recompute on page load.

---

## Layer 3 — The live dashboard (your view)

A private page at `/insights` on the same app, gated by a password (simplest:
HTTP basic-auth via Caddy, or a single shared secret in an env var — same pattern
as your Umami subdomain). It shows:

- **Funnel** — how many open the chat, engage, and convert, with the conversion %
- **Top industries** this period
- **Most-requested automations** (the themes) — your roadmap of what to productise
- **Common objections** — what to pre-empt on the site / in canned answers
- **High-intent misses** — specific chats that almost converted
- **Agent suggestions** — proposed new canned answers, each with an
  *Approve / Dismiss* action

A **"Run analysis now"** button triggers `/api/insights` on demand, so you're
never waiting for the weekly cron. (Charts: Chart.js. Tables: plain HTML.)

> Alternative: this could be a **Cowork artifact** instead of a page on your site.
> The trade-off: a Cowork artifact is faster for me to build and lives in your
> Claude app, but it would need a way to reach the VPS data. A page on your own
> domain keeps everything self-hosted next to Umami. My recommendation is the
> self-hosted page; we can revisit.

---

## The self-improving loop (your "runs on its own" vision)

```
 real visitor questions  ──►  insights agent clusters them
          ▲                              │
          │                              ▼
   bot answers more         agent proposes new canned Q&A + openers
   questions for FREE                    │
          ▲                              ▼
          │                     you approve in the dashboard
   added to chatFaq.ts  ◄──────────────┘
   & industries.ts
```

Each loop, more questions get answered by the free canned layer instead of the
paid model — so the bot's quality goes **up** while your per-chat cost goes
**down**. That's the compounding payoff.

---

## Privacy & compliance checklist (EU/DE)

- **Lawful basis:** legitimate interest for anonymous, aggregated product
  analytics; explicit consent (the handoff form) for anything with an email.
- **Data minimisation:** store summaries, not raw transcripts, beyond a short
  window; never store IPs in the clear.
- **Retention:** e.g. raw conversation rows auto-deleted after 90 days; aggregates
  kept indefinitely.
- **Transparency:** one line in your Datenschutz page that the chat is analysed in
  aggregate to improve the service.
- **Deletion:** because rows are keyed by an anonymous `sessionId`, there's no
  person to link them to — but handoff leads (with email) should be deletable on
  request.

---

## Build plan — incremental, lowest-risk first

| Phase | What ships | Why first | Rough effort |
|------|-------------|-----------|--------------|
| **0** | `sessionId` + logging table + `logConversation()` | start collecting data *today*; everything else needs it | ~0.5–1 day |
| **1** | Deterministic aggregates + minimal `/insights` dashboard (funnel, top industries, canned-hit rate) | useful signal with zero AI cost | ~1–1.5 days |
| **2** | LLM insights agent on a weekly schedule (themes, objections, misses) | the "what do people want" intelligence | ~1–2 days |
| **3** | Approve-suggested-answers UI → feedback into `chatFaq` / `industries` | closes the self-improving loop | ~1 day |

Ship Phase 0 first and let real data accumulate for a week or two before building
the analysis on top — the agent is far more useful with a real sample than with a
handful of test chats.

---

## Decisions I need from you before building

1. **Storage:** SQLite-on-a-volume (recommended, simplest) or reuse Postgres?
2. **Retention window** for raw conversation rows (suggest 90 days).
3. **Dashboard auth:** Caddy basic-auth, or a shared secret link?
4. **Run cadence:** weekly (recommended) or daily?
5. **Dashboard home:** a page on `steelfullai.com/insights`, or a Cowork artifact?

Once you pick, Phase 0 + 1 can ship quickly and you'll start seeing the funnel and
top industries within the first week of traffic.
