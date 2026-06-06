'use strict';
/** Sending layer. Email via SMTP (nodemailer); WhatsApp via Cloud or Evolution API. */
const cfg = require('../config');

async function sendEmail(lead, body) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error('SMTP_* not configured');
  if (!lead.email) throw new Error('lead has no email');

  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
  const from = process.env.OUTREACH_FROM ?? process.env.CONTACT_FROM ?? user;
  await transporter.sendMail({
    from,
    to: lead.email,
    subject: process.env.OUTREACH_SUBJECT ?? 'Uma ideia rápida para o seu negócio',
    text: body,
  });
}

async function sendWhatsApp(lead, body) {
  if (!lead.phone) throw new Error('lead has no phone');
  if (cfg.whatsappProvider === 'cloud') {
    // Official WhatsApp Cloud API. NOTE: cold/outbound to new numbers must use
    // an APPROVED template; free-text only works inside a 24h customer window.
    const token = process.env.WHATSAPP_CLOUD_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) throw new Error('WHATSAPP_CLOUD_TOKEN/PHONE_ID not set');
    const to = lead.phone.replace(/[^\d]/g, '');
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    });
    if (!res.ok) throw new Error(`WhatsApp Cloud ${res.status}: ${await res.text()}`);
    return;
  }
  // Evolution API (popular self-hosted gateway in Brazil).
  const url = process.env.EVOLUTION_URL;
  const instance = process.env.EVOLUTION_INSTANCE;
  const apikey = process.env.EVOLUTION_API_KEY;
  if (!url || !instance || !apikey) throw new Error('EVOLUTION_* not set');
  const number = lead.phone.replace(/[^\d]/g, '');
  const res = await fetch(`${url.replace(/\/$/, '')}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { apikey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number, text: body }),
  });
  if (!res.ok) throw new Error(`Evolution ${res.status}: ${await res.text()}`);
}

async function send(lead, body) {
  if (cfg.channel === 'whatsapp') return sendWhatsApp(lead, body);
  return sendEmail(lead, body);
}

module.exports = { send, sendEmail, sendWhatsApp };
