/**
 * Lead storage (SQLite) — shares the same database file as insightsDb.
 *
 * Same design rules as insightsDb.ts: fail-soft (never throw into a route),
 * native module loaded lazily via createRequire, kept out of the bundle via
 * `serverExternalPackages`. Leads are written by the leadgen CLI (via the
 * protected /api/insights/leads endpoint) and read by /insights/leads.
 */
import { createRequire } from 'node:module';

const DB_PATH = process.env.INSIGHTS_DB_PATH ?? '/data/chat.sqlite';

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
      CREATE TABLE IF NOT EXISTS leads (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        dedupe_key        TEXT UNIQUE,
        name              TEXT,
        niche             TEXT,
        suggested_service TEXT,
        phone             TEXT,
        email             TEXT,
        website           TEXT,
        address           TEXT,
        status            TEXT NOT NULL DEFAULT 'new',
        source            TEXT,
        created_at        INTEGER NOT NULL,
        updated_at        INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
    `);
    db = d;
    return db;
  } catch (err) {
    console.error('leadsDb: init failed — lead storage disabled.', err);
    initFailed = true;
    return null;
  }
}

export type LeadInput = {
  placeId?: string;
  name?: string;
  niche?: string;
  suggestedService?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  status?: string;
  source?: string;
};

export type LeadRow = {
  id: number;
  name: string;
  niche: string;
  suggestedService: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  status: string;
  source: string;
  createdAt: number;
  updatedAt: number;
};

const str = (v: unknown): string => (v == null ? '' : String(v));
const keyOf = (l: LeadInput): string =>
  str(l.placeId) ||
  str(l.phone).replace(/[^\d]/g, '') ||
  str(l.email).toLowerCase() ||
  str(l.name).toLowerCase();

/** Insert new leads / refresh existing ones (dedupe by key). Fail-soft. */
export function upsertLeads(leads: LeadInput[]): { added: number; updated: number } {
  const d = getDb();
  if (!d) return { added: 0, updated: 0 };
  let added = 0;
  let updated = 0;
  try {
    const now = Date.now();
    const existsStmt = d.prepare(`SELECT 1 AS x FROM leads WHERE dedupe_key = @key`);
    const stmt = d.prepare(
      `INSERT INTO leads
         (dedupe_key, name, niche, suggested_service, phone, email, website, address, status, source, created_at, updated_at)
       VALUES (@key, @name, @niche, @service, @phone, @email, @website, @address, @status, @source, @now, @now)
       ON CONFLICT(dedupe_key) DO UPDATE SET
         name              = COALESCE(NULLIF(@name, ''), name),
         niche             = COALESCE(NULLIF(@niche, ''), niche),
         suggested_service = COALESCE(NULLIF(@service, ''), suggested_service),
         phone             = COALESCE(NULLIF(@phone, ''), phone),
         email             = COALESCE(NULLIF(@email, ''), email),
         website           = COALESCE(NULLIF(@website, ''), website),
         address           = COALESCE(NULLIF(@address, ''), address),
         source            = COALESCE(NULLIF(@source, ''), source),
         updated_at        = @now`,
    );
    for (const l of leads) {
      const key = keyOf(l);
      if (!key) continue;
      const existed = !!existsStmt.get({ key });
      stmt.run({
        key,
        name: str(l.name),
        niche: str(l.niche),
        service: str(l.suggestedService),
        phone: str(l.phone),
        email: str(l.email),
        website: str(l.website),
        address: str(l.address),
        status: str(l.status) || 'new',
        source: str(l.source),
        now,
      });
      if (existed) updated++;
      else added++;
    }
  } catch (err) {
    console.error('leadsDb: upsert failed.', err);
  }
  return { added, updated };
}

export function listLeads(limit = 1000): LeadRow[] {
  const d = getDb();
  if (!d) return [];
  try {
    const rows = d
      .prepare(
        `SELECT id, name, niche, suggested_service, phone, email, website, address, status, source, created_at, updated_at
         FROM leads ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ limit }) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: Number(r.id) || 0,
      name: str(r.name),
      niche: str(r.niche),
      suggestedService: str(r.suggested_service),
      phone: str(r.phone),
      email: str(r.email),
      website: str(r.website),
      address: str(r.address),
      status: str(r.status),
      source: str(r.source),
      createdAt: Number(r.created_at) || 0,
      updatedAt: Number(r.updated_at) || 0,
    }));
  } catch (err) {
    console.error('leadsDb: listLeads failed.', err);
    return [];
  }
}

export function updateLeadStatus(id: number, status: string): boolean {
  const d = getDb();
  if (!d) return false;
  try {
    const res = d
      .prepare(`UPDATE leads SET status = @s, updated_at = @now WHERE id = @id`)
      .run({ s: status, now: Date.now(), id }) as { changes?: number };
    return !!(res && res.changes);
  } catch (err) {
    console.error('leadsDb: updateLeadStatus failed.', err);
    return false;
  }
}

export type LeadStats = {
  total: number;
  withEmail: number;
  byStatus: { status: string; count: number }[];
  byNiche: { niche: string; count: number }[];
};

export function leadStats(): LeadStats {
  const empty: LeadStats = { total: 0, withEmail: 0, byStatus: [], byNiche: [] };
  const d = getDb();
  if (!d) return empty;
  try {
    const total = Number(
      (d.prepare(`SELECT COUNT(*) AS c FROM leads`).get() as { c?: number })?.c ?? 0,
    );
    const withEmail = Number(
      (
        d.prepare(`SELECT COUNT(*) AS c FROM leads WHERE email IS NOT NULL AND email != ''`).get() as {
          c?: number;
        }
      )?.c ?? 0,
    );
    const byStatus = (
      d
        .prepare(`SELECT COALESCE(NULLIF(status,''),'—') AS status, COUNT(*) AS count FROM leads GROUP BY status ORDER BY count DESC`)
        .all() as Record<string, unknown>[]
    ).map((r) => ({ status: str(r.status), count: Number(r.count) || 0 }));
    const byNiche = (
      d
        .prepare(`SELECT COALESCE(NULLIF(niche,''),'—') AS niche, COUNT(*) AS count FROM leads GROUP BY niche ORDER BY count DESC`)
        .all() as Record<string, unknown>[]
    ).map((r) => ({ niche: str(r.niche), count: Number(r.count) || 0 }));
    return { total, withEmail, byStatus, byNiche };
  } catch (err) {
    console.error('leadsDb: leadStats failed.', err);
    return empty;
  }
}
