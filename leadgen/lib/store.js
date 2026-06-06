'use strict';
/** Tiny JSON-file lead store with dedupe + opt-out handling. No DB needed. */
const fs = require('fs');
const cfg = require('../config');

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}
function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function normalizePhone(v) {
  return (v || '').replace(/[^\d]/g, '');
}
function normalizeEmail(v) {
  return (v || '').trim().toLowerCase();
}

function loadLeads() {
  return readJson(cfg.paths.leads, []);
}
function saveLeads(leads) {
  writeJson(cfg.paths.leads, leads);
}

function loadOptout() {
  return readJson(cfg.paths.optout, { phones: [], emails: [] });
}
function isOptedOut(lead) {
  const o = loadOptout();
  const phone = normalizePhone(lead.phone);
  const email = normalizeEmail(lead.email);
  return (
    (phone && o.phones.map(normalizePhone).includes(phone)) ||
    (email && o.emails.map(normalizeEmail).includes(email))
  );
}

/** Dedupe key: prefer Google place id, then phone, then email, then name. */
function keyOf(lead) {
  return (
    lead.placeId ||
    normalizePhone(lead.phone) ||
    normalizeEmail(lead.email) ||
    (lead.name || '').toLowerCase()
  );
}

/** Insert leads that don't already exist. Returns count added. */
function upsertMany(newLeads) {
  const leads = loadLeads();
  const seen = new Set(leads.map(keyOf));
  let added = 0;
  for (const l of newLeads) {
    const k = keyOf(l);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    leads.push({ status: 'new', createdAt: new Date().toISOString(), ...l });
    added++;
  }
  saveLeads(leads);
  return added;
}

module.exports = {
  loadLeads,
  saveLeads,
  loadOptout,
  isOptedOut,
  normalizePhone,
  normalizeEmail,
  keyOf,
  upsertMany,
};
