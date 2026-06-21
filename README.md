# Voyager AI — AI Travel Planner

A multi-user web app that generates, edits, and helps you pack for a trip using an LLM agent,
with strict per-user data isolation.

Live demo: `<add your deployed URL here>`
Video walkthrough: `<add your video link here>`
Repo: `<add your GitHub URL here>`

---

## 1. Project Overview

Users register, describe a trip (destination, length, budget tier, interests, and an optional
travel month), and Voyager generates:

- A day-by-day itinerary (2–4 activities/day, tagged Morning/Afternoon/Evening, with costs)
- A budget breakdown (transport, accommodation, food, activities, total)
- 3 hotel recommendations (Budget / Mid-range / Luxury)
- A **climate-grounded packing checklist**

Users can add/remove activities, regenerate a single day with feedback (e.g. "more outdoor
activities"), and roll back to any previous version of the itinerary.

## 2. Tech Stack

| Layer      | Choice                                   |
|------------|-------------------------------------------|
| Frontend   | Next.js 14 (App Router) + Tailwind CSS, JavaScript |
| Backend    | Node.js + Express, JavaScript             |
| Database   | MongoDB + Mongoose                        |
| Auth       | JWT in an **httpOnly cookie** + bcrypt    |
| AI         | Google Gemini (`gemini-2.5-flash`), JSON mode |
| Climate data | Open-Meteo Geocoding + Historical Weather APIs (free, no key) |

This matches the assessment's preferred stack, with JavaScript chosen end-to-end (not
TypeScript) to keep the codebase approachable and the review fast — see [Key Design Decisions](#6-key-design-decisions--trade-offs) for the reasoning.

## 3. Setup Instructions

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (free tier is fine) or local MongoDB
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Local setup

```bash
# Backend
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run dev             # http://localhost:5000

# Frontend (in a new terminal)
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev              # http://localhost:3000
```

Visit `http://localhost:3000`, register an account, and create a trip.

### Deployed setup

- **Backend** → Render / Railway. Set env vars `PORT`, `MONGO_URI`, `JWT_SECRET`,
  `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV=production`, and `CLIENT_ORIGIN` to your
  deployed frontend's exact origin (no trailing slash).
- **Frontend** → Vercel. Set `NEXT_PUBLIC_API_URL` to your deployed backend's URL.
- Because auth uses an httpOnly cross-site cookie, the backend's CORS config must have
  `credentials: true` and `CLIENT_ORIGIN` set precisely, and the cookie is set with
  `sameSite: 'none'; secure: true` in production (both Render/Railway and Vercel serve HTTPS,
  satisfying the `secure` requirement).

## 4. High-Level Architecture

```
Next.js (App Router)  --fetch, credentials:'include'-->  Express API
   AuthContext                                              ├─ /api/auth   (register/login/logout/me)
   ProtectedRoute                                            └─ /api/trips  (protected by JWT middleware)
   dashboard/* pages                                                ├─ Mongoose -> MongoDB (User, Trip)
                                                                     ├─ geminiService  -> Google Gemini API
                                                                     └─ weatherService -> Open-Meteo APIs
```

- **Frontend**: client components only where interactivity is needed (forms, dashboard);
  a single `AuthContext` is the source of truth for the logged-in user; a thin `lib/api.js`
  wrapper centralizes fetch + error handling.
- **Backend**: classic layered structure — `routes` → `controllers` → `models`/`services`.
  `middleware/auth.js` verifies the JWT and attaches `req.user.id`; every trip query in
  `tripController.js` is scoped with `{ userId: req.user.id }`, which is what actually enforces
  data isolation (not just route-level auth).

## 5. Authentication & Authorization

- Passwords are hashed with `bcryptjs` (cost factor 12) before being stored; the hash is
  excluded from query results by default (`select: false` on the schema) and stripped from
  any JSON response as a second layer of defense.
- On login/register, the backend signs a JWT and sets it as an **httpOnly, `secure` (in prod),
  `sameSite` cookie** — not a value the frontend reads or stores in `localStorage`.
- `middleware/auth.js` verifies the JWT on every protected route and attaches `req.user.id`.
- **Data isolation**: every Trip read/write/delete query is filtered by `{ _id, userId }`
  together. Requesting another user's trip ID returns a 404, not a 403 — this avoids leaking
  whether a given trip ID exists at all.

## 6. AI Agent Design

- `services/geminiService.js` builds a single structured prompt per generation requesting
  *only* valid JSON (`responseMimeType: 'application/json'`) matching the Trip schema exactly,
  which avoids brittle regex-parsing of free text.
- **Resilience**: `withRetry()` retries on HTTP 429/5xx and network errors with exponential
  backoff (1s → 2s → 4s → 8s → 16s, 5 attempts), and only on errors flagged as `retriable` —
  a malformed request (4xx other than 429) fails fast instead of retrying a doomed call 5
  times.
- **Climate grounding** (`services/weatherService.js`): before prompting Gemini, the backend
  geocodes the destination and pulls a year of real daily highs/lows/precipitation from
  Open-Meteo, averaged for the user's chosen travel month if given. That summary is injected
  into the prompt so the packing list reflects actual measured climate instead of the model's
  possibly-stale or hallucinated weather knowledge. If geocoding or the climate fetch fails for
  any reason, generation still proceeds — it falls back to the LLM's own estimate rather than
  blocking trip creation.
- Single generation call returns itinerary + budget + hotels + packing list together (one
  Gemini call instead of four), reducing latency, cost, and rate-limit exposure.

## 7. Creative / Custom Feature

**Itinerary Version History ("Time Machine")** — every initial generation and every
"Regenerate Day" action archives a full snapshot of the itinerary into `trip.versions` *before*
applying the change. The dashboard surfaces this as a restorable timeline.

**Why I built this**: "Regenerate Day 3" is inherently risky — the LLM is non-deterministic, so
a regeneration can easily turn out worse than what the user already had, and the reference
design in this assessment has no way to undo that. Losing a itinerary you liked because a
retry went badly is a real, avoidable failure mode. Snapshotting before every mutation turns a
one-way door into a two-way one at near-zero implementation cost (a single `push()` to an
array), which is exactly the kind of small, high-leverage safety net I look for in product
design.

Paired with this is the **climate-grounded packing list** described above — together they
push the assistant from "looks AI-generated" to "behaves like it understands the trip."

## 8. Key Design Decisions & Trade-offs

- **httpOnly cookie auth vs. localStorage + Bearer header**: the reference implementation
  pattern stores the JWT in `localStorage` and attaches it manually. I moved it to an httpOnly
  cookie instead — it can't be read by injected/XSS JavaScript at all, closing a real attack
  surface, at the cost of needing precise CORS + `sameSite` configuration across two different
  hosting providers.
- **Single combined Gemini call** for itinerary + budget + hotels + packing list, rather than
  four separate calls: lower latency and cost, at the cost of a larger, more complex prompt
  and JSON schema to validate.
- **JavaScript over TypeScript**: the assessment allows either. I chose plain JS to keep the
  codebase fast to read end-to-end for review; the trade-off is losing compile-time schema
  safety between the Gemini JSON output and what the frontend expects.
- **404 (not 403) on cross-user access**: avoids confirming to an attacker that a given trip ID
  exists, at a small cost to debuggability.

## 9. Known Limitations

- No automated test suite (manual testing only) — given the assessment's time-boxed scope, I
  prioritized correctness of auth/isolation and AI resilience over test coverage.
- Climate grounding uses Open-Meteo's *historical* archive as a proxy for typical seasonal
  weather, not a true climate-normal product; it's a meaningful improvement over LLM-only
  guessing but isn't a long-range forecast.
- No CSRF token is implemented beyond `sameSite` cookie protection; for a production system
  handling sensitive data I'd add a double-submit CSRF token as defense in depth.
- Activity "remove" matches by `_id` when available and falls back to array index for
  freshly-added activities that haven't been re-fetched yet; a brief race is possible if a user
  double-clicks remove very quickly before the UI updates.
- No rate limiting on the trip-generation endpoint, so a user could spam Gemini calls; would
  add `express-rate-limit` per-user before production use.
