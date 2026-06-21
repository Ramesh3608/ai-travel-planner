/**
 * Grounds the "AI Weather-Aware Packing Assistant" in real climate data
 * instead of letting the LLM guess at a destination's weather from memory.
 *
 * Flow:
 *   1. Geocode the free-text destination to lat/lon (Open-Meteo Geocoding API).
 *   2. Pull historical monthly climate normals for that location (Open-Meteo
 *      Climate API), optionally narrowed to the user's chosen travel month.
 *   3. Return a compact summary that gets injected into the Gemini prompt.
 *
 * Both Open-Meteo endpoints are free and require no API key. If either step
 * fails (typo'd destination, network hiccup, rate limit), we fail soft and
 * let the LLM fall back to its own estimate -- the trip generation must
 * never be blocked by this enrichment step.
 */

const MONTH_INDEX = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

async function geocodeDestination(destination) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    destination
  )}&count=1&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const match = data?.results?.[0];
  if (!match) return null;

  return {
    latitude: match.latitude,
    longitude: match.longitude,
    resolvedName: [match.name, match.admin1, match.country].filter(Boolean).join(', '),
  };
}

async function fetchClimateNormals(latitude, longitude, travelMonth) {
  // Open-Meteo's historical-weather endpoint gives us a full year of recent
  // daily data; we average the month we care about ourselves. This avoids
  // needing a paid "climate normals" product while still being grounded in
  // real measurements rather than a guess.
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 1);

  const fmt = (d) => d.toISOString().slice(0, 10);
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}` +
    `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const daily = data?.daily;
  if (!daily?.time?.length) return null;

  const monthIdx = travelMonth ? MONTH_INDEX[travelMonth.toLowerCase()] : null;

  const rows = daily.time
    .map((dateStr, i) => ({
      month: new Date(dateStr).getMonth(),
      max: daily.temperature_2m_max[i],
      min: daily.temperature_2m_min[i],
      precip: daily.precipitation_sum[i],
    }))
    .filter((r) => (monthIdx === null ? true : r.month === monthIdx))
    .filter((r) => Number.isFinite(r.max) && Number.isFinite(r.min));

  if (!rows.length) return null;

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    avgHighC: Math.round(avg(rows.map((r) => r.max)) * 10) / 10,
    avgLowC: Math.round(avg(rows.map((r) => r.min)) * 10) / 10,
    precipitationMm: Math.round(avg(rows.map((r) => r.precip ?? 0)) * 10) / 10,
  };
}

/**
 * Returns a best-effort climate context object. Never throws -- on any
 * failure it returns a fallback object flagged with source "llm-estimate"
 * so callers know to lean on the LLM's own knowledge instead.
 */
async function getClimateContext(destination, travelMonth) {
  try {
    const geo = await geocodeDestination(destination);
    if (!geo) {
      return fallback();
    }

    const normals = await fetchClimateNormals(geo.latitude, geo.longitude, travelMonth);
    if (!normals) {
      return fallback();
    }

    const monthLabel = travelMonth ? ` in ${travelMonth}` : ' (year-round average)';
    return {
      summary: `${geo.resolvedName}${monthLabel}: avg high ${normals.avgHighC}°C, avg low ${normals.avgLowC}°C, ~${normals.precipitationMm}mm precipitation/day.`,
      avgHighC: normals.avgHighC,
      avgLowC: normals.avgLowC,
      precipitationMm: normals.precipitationMm,
      source: 'open-meteo',
    };
  } catch (_err) {
    return fallback();
  }
}

function fallback() {
  return {
    summary: '',
    avgHighC: null,
    avgLowC: null,
    precipitationMm: null,
    source: 'llm-estimate',
  };
}

module.exports = { getClimateContext };
