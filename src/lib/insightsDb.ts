/**
 * Conversation logging + insights storage (SQLite).
 *
 * Design goals:
 *  - NEVER break the site. Every function is fail-soft: if the database can't be
 *    opened or written, we log a warning and no-op. The chat keeps working.
 *  - No native module at import time. `better-sqlite3` is loaded lazily via
 *    createRequire inside a try/catch, so a missing/broken binary disables
 *    logging instead of crashing a route. (It's kept external from the Next
 *    bundle via `serverExternalPackages` in next.config.mjs.)
 *  - Privacy-conscious: we store one anonymous row per conversation (keyed by a
 *    random sessionId, never a person), and scrub obvious PII from the text.
 *
 * Storage: a single SQLite file on a mounted Docker volume (default /data).
 */

import { createRequire } from 'node:module';

const DB_PATH = process.env.INSIGHTS_DB_PATH ?? '/data/chat.sqlite';

// Minimal local typings for the slice of better-sqlite3 we use. This avoids a
// hard dependency on @types/better-sqlite3 and keeps the native module fully
// out of the type graph.
interface Stmt {
  run(params?: unknown): unknown;
  get(params?: unknown): unknown;
  all(params?: unknown): unknown[];
}
interface SqliteDb {
  prepare(sql: string): Stmt;
  exec(sql: string): void;
  pragma(sql: string): void;
}

let db: SqliteDb | null = null;
let initFailed = false;

function getDb(): SqliteDb | null {
  if (db) return db;
  if (initFailed) return null;
  try {
    const require = createRequire(import.meta.url);
    const Database = require('better-sqlite3') as new (path: string) => SqliteDb;
    const d = new Database(DB_PATH);
    d.pragma('journal_mode = WAL');
    d.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        session_id    TEXT PRIMARY KEY,
        created_at    INTEGER NOT NULL,
        updated_at    INTEGER NOT NULL,
        locale        TEXT,
        industry      TEXT,
        user_messages INTEGER NOT NULL DEFAULT 0,
        canned_hits   INTEGER NOT NULL DEFAULT 0,
        outcome       TEXT NOT NULL DEFAULT 'engaged',
        pain_text     TEXT
      );
      CREATE TABLE IF NOT EXISTS insights_runs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at  INTEGER NOT NULL,
        period_days INTEGER NOT NULL,
        aggregates  TEXT NOT NULL,
        llm         TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_conv_created ON conversations(created_at);
    `);
    db = d;
    return db;
  } catch (err) {
    console.error('insightsDb: init failed — logging disabled.', err);
    initFailed = true;
    return null;
  }
}

/** Strip obvious PII (emails, phone-like number runs) and cap length. */
function scrub(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]')
    .slice(0, 2000);
}

const OUTCOMES = [
  'engaged',
  'hit_cap',
  'clicked_book_call',
  'handoff_sent',
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export type TurnLog = {
  sessionId: string;
  locale?: string;
  industry?: string;
  userMessages: number;
  cannedHit: boolean;
  painText?: string;
};

/** Upsert a conversation row as it progresses (called per user turn). */
export function logTurn(t: TurnLog): void {
  const d = getDb();
  if (!d || !t.sessionId) return;
  try {
    const now = Date.now();
    const pain = t.painText ? scrub(t.painText) : null;
    d.prepare(
      `INSERT INTO conversations
         (session_id, created_at, updated_at, locale, industry, user_messages, canned_hits, outcome, pain_text)
       VALUES (@sid, @now, @now, @locale, @industry, @um, @canned, 'engaged', @pain)
       ON CONFLICT(session_id) DO UPDATE SET
         updated_at    = @now,
         locale        = COALESCE(@locale, locale),
         industry      = COALESCE(NULLIF(@industry, ''), industry),
         user_messages = MAX(user_messages, @um),
         canned_hits   = canned_hits + @canned,
         pain_text     = COALESCE(NULLIF(@pain, ''), pain_text)`,
    ).run({
      sid: t.sessionId,
      now,
      locale: t.locale ?? null,
      industry: t.industry ?? null,
      um: t.userMessages,
      canned: t.cannedHit ? 1 : 0,
      pain,
    });
  } catch (err) {
    console.error('insightsDb: logTurn failed.', err);
  }
}

/** Set the conversation outcome (upserts a minimal row if needed). */
export function setOutcome(sessionId: string, outcome: Outcome): void {
  const d = getDb();
  if (!d || !sessionId) return;
  try {
    const now = Date.now();
    d.prepare(
      `INSERT INTO conversations (session_id, created_at, updated_at, outcome, user_messages)
       VALUES (@sid, @now, @now, @o, 0)
       ON CONFLICT(session_id) DO UPDATE SET outcome = @o, updated_at = @now`,
    ).run({ sid: sessionId, now, o: outcome });
  } catch (err) {
    console.error('insightsDb: setOutcome failed.', err);
  }
}

export type Aggregates = {
  periodDays: number;
  total: number;
  engaged: number;
  handoffs: number;
  bookClicks: number;
  hitCap: number;
  abandoned: number;
  conversionRate: number; // (handoffs + bookClicks) / engaged
  cannedHitRate: number; // canned_hits / total user messages
  avgUserMessages: number;
  byIndustry: { industry: string; count: number }[];
  byLocale: { locale: string; count: number }[];
};

const num = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : 0);

/** Deterministic aggregates over conversations since `sinceMs`. No AI, no cost. */
export function aggregate(sinceMs: number, periodDays: number): Aggregates {
  const empty: Aggregates = {
    periodDays,
    total: 0,
    engaged: 0,
    handoffs: 0,
    bookClicks: 0,
    hitCap: 0,
    abandoned: 0,
    conversionRate: 0,
    cannedHitRate: 0,
    avgUserMessages: 0,
    byIndustry: [],
    byLocale: [],
  };
  const d = getDb();
  if (!d) return empty;
  try {
    const row = d
      .prepare(
        `SELECT
           COUNT(*)                                                   AS total,
           SUM(CASE WHEN user_messages >= 2 THEN 1 ELSE 0 END)        AS engaged,
           SUM(CASE WHEN outcome = 'handoff_sent' THEN 1 ELSE 0 END)  AS handoffs,
           SUM(CASE WHEN outcome = 'clicked_book_call' THEN 1 ELSE 0 END) AS book_clicks,
           SUM(CASE WHEN outcome = 'hit_cap' THEN 1 ELSE 0 END)       AS hit_cap,
           SUM(canned_hits)                                           AS canned_hits,
           SUM(user_messages)                                         AS user_messages
         FROM conversations WHERE created_at >= @since`,
      )
      .get({ since: sinceMs }) as Record<string, unknown>;

    const total = num(row.total);
    const engaged = num(row.engaged);
    const handoffs = num(row.handoffs);
    const bookClicks = num(row.book_clicks);
    const hitCap = num(row.hit_cap);
    const cannedHits = num(row.canned_hits);
    const userMessages = num(row.user_messages);

    const byIndustry = (
      d
        .prepare(
          `SELECT COALESCE(NULLIF(industry, ''), 'Unspecified') AS industry, COUNT(*) AS count
           FROM conversations WHERE created_at >= @since
           GROUP BY industry ORDER BY count DESC LIMIT 12`,
        )
        .all({ since: sinceMs }) as Record<string, unknown>[]
    ).map((r) => ({ industry: String(r.industry ?? 'Unspecified'), count: num(r.count) }));

    const byLocale = (
      d
        .prepare(
          `SELECT COALESCE(locale, '?') AS locale, COUNT(*) AS count
           FROM conversations WHERE created_at >= @since
           GROUP BY locale ORDER BY count DESC`,
        )
        .all({ since: sinceMs }) as Record<string, unknown>[]
    ).map((r) => ({ locale: String(r.locale ?? '?'), count: num(r.count) }));

    return {
      periodDays,
      total,
      engaged,
      handoffs,
      bookClicks,
      hitCap,
      abandoned: Math.max(0, engaged - handoffs - bookClicks),
      conversionRate: engaged ? (handoffs + bookClicks) / engaged : 0,
      cannedHitRate: userMessages ? cannedHits / userMessages : 0,
      avgUserMessages: total ? userMessages / total : 0,
      byIndustry,
      byLocale,
    };
  } catch (err) {
    console.error('insightsDb: aggregate failed.', err);
    return empty;
  }
}

export type PainSample = { industry: string; text: string };

/** Recent anonymised pain-point texts, for the LLM clustering pass. */
export function recentPains(sinceMs: number, limit: number): PainSample[] {
  const d = getDb();
  if (!d) return [];
  try {
    const rows = d
      .prepare(
        `SELECT COALESCE(NULLIF(industry, ''), 'Unspecified') AS industry, pain_text
         FROM conversations
         WHERE created_at >= @since AND pain_text IS NOT NULL AND length(pain_text) > 0
         ORDER BY updated_at DESC LIMIT @limit`,
      )
      .all({ since: sinceMs, limit }) as Record<string, unknown>[];
    return rows.map((r) => ({
      industry: String(r.industry ?? 'Unspecified'),
      text: String(r.pain_text ?? ''),
    }));
  } catch (err) {
    console.error('insightsDb: recentPains failed.', err);
    return [];
  }
}

/** Persist one analysis run. Returns the new row id, or null on failure. */
export function saveRun(
  periodDays: number,
  aggregates: Aggregates,
  llm: unknown,
): number | null {
  const d = getDb();
  if (!d) return null;
  try {
    d.prepare(
      `INSERT INTO insights_runs (created_at, period_days, aggregates, llm)
       VALUES (@now, @pd, @agg, @llm)`,
    ).run({
      now: Date.now(),
      pd: periodDays,
      agg: JSON.stringify(aggregates),
      llm: llm ? JSON.stringify(llm) : null,
    });
    const row = d.prepare(`SELECT last_insert_rowid() AS id`).get() as Record<string, unknown>;
    return num(row?.id) || null;
  } catch (err) {
    console.error('insightsDb: saveRun failed.', err);
    return null;
  }
}

export type InsightsRun = {
  id: number;
  createdAt: number;
  periodDays: number;
  aggregates: Aggregates | null;
  llm: unknown;
};

/** Most recent analysis run, or null. */
export function latestRun(): InsightsRun | null {
  const d = getDb();
  if (!d) return null;
  try {
    const row = d
      .prepare(`SELECT * FROM insights_runs ORDER BY id DESC LIMIT 1`)
      .get() as Record<string, unknown> | undefined;
    if (!row) return null;
    const parse = (s: unknown) => {
      try {
        return s ? JSON.parse(String(s)) : null;
      } catch {
        return null;
      }
    };
    return {
      id: num(row.id),
      createdAt: num(row.created_at),
      periodDays: num(row.period_days),
      aggregates: parse(row.aggregates),
      llm: parse(row.llm),
    };
  } catch (err) {
    console.error('insightsDb: latestRun failed.', err);
    return null;
  }
}

/** Delete raw conversation rows older than `days` (retention policy). */
export function purgeOld(days: number): void {
  const d = getDb();
  if (!d) return;
  try {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    d.prepare(`DELETE FROM conversations WHERE created_at < @cutoff`).run({ cutoff });
  } catch (err) {
    console.error('insightsDb: purgeOld failed.', err);
  }
}
