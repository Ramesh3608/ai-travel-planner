const ApiError = require('../utils/ApiError');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Calls fn() and retries on transient failures (HTTP 429 / 5xx / network
 * errors) with exponential backoff: 1s, 2s, 4s, 8s, 16s. Anything else
 * (e.g. a 400 from a malformed prompt) is not retried since retrying would
 * just fail the same way five times.
 */
async function withRetry(fn, retries = 5, delay = 1000) {
  try {
    return await fn();
  } catch (err) {
    const retriable = err.retriable !== false;
    if (retries > 0 && retriable) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'Server misconfiguration: GEMINI_API_KEY is not set.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
  };

  return withRetry(async () => {
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (networkErr) {
      networkErr.retriable = true;
      throw networkErr;
    }

    if (!response.ok) {
      const err = new Error(`Gemini API error: HTTP ${response.status}`);
      err.retriable = response.status === 429 || response.status >= 500;
      throw err;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const err = new Error('Gemini returned an empty response.');
      err.retriable = true;
      throw err;
    }

    try {
      return JSON.parse(text);
    } catch (_parseErr) {
      const err = new Error('Gemini returned malformed JSON.');
      err.retriable = true; // worth one more shot, the model can be flaky
      throw err;
    }
  }).catch((err) => {
    console.error('[gemini] generation failed after retries:', err.message);
    throw new ApiError(502, 'The AI agent is temporarily unavailable. Please try again.');
  });
}

function buildTripPrompt({ destination, durationDays, budgetTier, interests, climateContext, travelMonth }) {
  const climateLine = climateContext?.summary
    ? `Real recent climate data for this destination: ${climateContext.summary}`
    : `No verified climate data is available; use your best knowledge of typical weather${
        travelMonth ? ` for ${destination} in ${travelMonth}` : ` for ${destination}`
      }.`;

  return `
You are an expert travel planner and packing specialist. Create a detailed, realistic travel plan.

Destination: ${destination}
Trip length: ${durationDays} day(s)
Budget preference: ${budgetTier}
Traveler interests: ${interests?.length ? interests.join(', ') : 'general sightseeing'}
${travelMonth ? `Planned travel month: ${travelMonth}` : ''}
${climateLine}

Requirements:
- Each day must have 2-4 activities spread across Morning/Afternoon/Evening, relevant to the stated interests.
- Costs must be realistic for the destination and reflect the ${budgetTier} budget tier.
- Suggest exactly 3 hotels: one Budget, one Mid-Range, one Luxury, each with a realistic nightly cost and rating.
- estimatedBudget totals must roughly equal the sum of accommodation (hotel nights x durationDays), food, activities, and transport.
- The packingList must be genuinely tailored to the climate data given above (e.g. rain gear if precipitation is notable, layers if avg low is under 10°C, sun protection if hot) AND to the planned activities (e.g. hiking boots for an outdoor-heavy trip). Include at least 8 items split across Documents, Clothing, Gear, and Other.

Respond with ONLY valid JSON, no markdown fences, matching exactly this shape:
{
  "itinerary": [
    {
      "dayNumber": 1,
      "theme": "Short theme for the day",
      "activities": [
        { "title": "string", "description": "string", "estimatedCostUSD": 0, "timeOfDay": "Morning" }
      ]
    }
  ],
  "hotels": [
    { "name": "string", "tier": "Budget", "estimatedCostNightUSD": 0, "rating": "4.3/5", "notes": "string" }
  ],
  "estimatedBudget": { "transport": 0, "accommodation": 0, "food": 0, "activities": 0, "total": 0 },
  "packingList": [ { "item": "string", "category": "Documents", "isPacked": false } ]
}`.trim();
}

function buildRegenerateDayPrompt({ destination, budgetTier, interests, dayNumber, durationDays, feedback, climateContext }) {
  return `
You are revising a single day of an existing ${durationDays}-day trip to ${destination} (budget tier: ${budgetTier}, interests: ${
    interests?.join(', ') || 'general'
  }).
${climateContext?.summary ? `Climate context: ${climateContext.summary}` : ''}

Regenerate ONLY Day ${dayNumber} based on this traveler feedback: "${feedback}"

Respond with ONLY valid JSON, no markdown fences, matching exactly:
{
  "dayNumber": ${dayNumber},
  "theme": "string",
  "activities": [
    { "title": "string", "description": "string", "estimatedCostUSD": 0, "timeOfDay": "Morning" }
  ]
}`.trim();
}

module.exports = {
  callGemini,
  buildTripPrompt,
  buildRegenerateDayPrompt,
};
