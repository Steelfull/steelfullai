'use strict';
/**
 * Lead sourcing via the Google Places API (Text Search, v1).
 * Collects PUBLIC business listings only — name, address, phone, website.
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 */
const cfg = require('../config');

const FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.primaryTypeDisplayName',
].join(',');

async function searchOnce(textQuery, pageToken) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': cfg.placesKey,
      'X-Goog-FieldMask': FIELDS + ',nextPageToken',
    },
    body: JSON.stringify({
      textQuery,
      languageCode: 'pt-BR',
      regionCode: 'BR',
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Places API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/** Search one niche, following pagination up to `max` results. */
async function searchNiche(niche, max = 40) {
  if (!cfg.placesKey) throw new Error('GOOGLE_PLACES_API_KEY is not set');
  const query = niche.query.replace('{loc}', cfg.location);
  const out = [];
  let pageToken;
  do {
    const data = await searchOnce(query, pageToken);
    for (const p of data.places || []) {
      out.push({
        placeId: p.id,
        name: p.displayName?.text || '',
        address: p.formattedAddress || '',
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
        website: p.websiteUri || '',
        category: p.primaryTypeDisplayName?.text || niche.key,
        niche: niche.key,
        suggestedService: niche.service || '',
        source: 'google_places',
      });
      if (out.length >= max) return out;
    }
    pageToken = data.nextPageToken;
    if (pageToken) await new Promise((r) => setTimeout(r, 2000)); // token settle
  } while (pageToken);
  return out;
}

module.exports = { searchNiche };
