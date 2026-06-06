'use strict';
/**
 * Best-effort email enrichment. For a lead that has a website but no email,
 * fetch the homepage + a couple of likely contact pages and extract the first
 * plausible business email. Pure fetch + regex, no dependencies.
 */
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const JUNK = /(sentry|wixpress|example|\.png|\.jpg|\.jpeg|\.gif|\.webp|@2x|@sentry|your-?email|email@|user@)/i;
const PATHS = ['', '/contato', '/contato.html', '/contact', '/fale-conosco', '/sobre'];

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SteelfullAI-LeadBot/1.0)' },
    });
    if (!res.ok) return '';
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('text/plain')) return '';
    return (await res.text()).slice(0, 400000);
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

function pickEmail(html, siteHost) {
  const found = new Set();
  for (const m of html.matchAll(EMAIL_RE)) {
    const e = m[0].toLowerCase().replace(/\.$/, '');
    if (JUNK.test(e)) continue;
    if (e.length > 80) continue;
    found.add(e);
  }
  if (found.size === 0) return '';
  const list = [...found];
  // Prefer an address on the site's own domain.
  const host = (siteHost || '').replace(/^www\./, '');
  const sameDomain = list.find((e) => host && e.endsWith('@' + host));
  return sameDomain || list[0];
}

/** Returns an email string (or '') for one lead. */
async function findEmail(website) {
  let base;
  try {
    base = new URL(website.startsWith('http') ? website : `https://${website}`);
  } catch {
    return '';
  }
  for (const p of PATHS) {
    const html = await fetchText(new URL(p, base).toString());
    if (!html) continue;
    const email = pickEmail(html, base.hostname);
    if (email) return email;
  }
  return '';
}

module.exports = { findEmail };
