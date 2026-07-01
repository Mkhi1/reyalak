# وفّر (Waffer) — Backend Design

**Date:** 2026-07-01
**Status:** Approved for planning

## Context

وفّر is a no-build-step React prototype (plain `<script type="text/babel">` files loaded
directly in `Waffer App - AI Insights.html`, transpiled live by Babel-standalone in the
browser). Today every screen either reads static mock arrays from `ai-data.js`
(`window.CATS_META`, `window.MONTHLY_SPEND`, etc.) or hardcodes its own numbers inline
(`HomeScreen`, `GoalsScreen`, `JamiyaScreen`, `ai-chat.jsx`'s `GOAL_CONTEXT`/`JAMIYA_CONTEXT`
all independently hardcode slightly different values for the same "goal" and "jam'iya"
concepts). The AI chat screen calls `window.claude.complete(...)`, a browser-injected
helper with no real backend behind it.

Goal of this project: give the app a real backend with a realistic seeded dataset, make
all screens read from one consistent source of truth, and make the AI chat call a real
LLM (Groq) through a server-side proxy the user will configure with their own API key.

## Decisions made during brainstorming

- **Stack:** Node.js + Express + `better-sqlite3` (file-based SQLite, no external DB
  server to install).
- **Data depth:** rich realistic seed data — multiple bank accounts, dozens of
  real-looking Saudi merchant transactions per month across 12 months, narrative spikes
  (Eid shopping, summer AC bill) similar to what `ai-data.js` already tells today, goals,
  and an 8-member jam'iya group.
- **Auth:** none. One seeded demo user ("فيصل") owns all the data; no login screen is
  wired up (`OnboardingScreen` stays cosmetic — it already has a "skip" path to `home`).
- **AI provider:** Groq, via its OpenAI-compatible chat completions endpoint. The user
  supplies `GROQ_API_KEY` themselves in `server/.env`.
- **Frontend scope:** all screens (Home, Analysis, Map, Goals, Jam'iya, AI Chat) read
  from the backend, not just Analysis/Chat.

## Architecture

```
ai-analysis/                       (project root, already exists)
├── Waffer App - AI Insights.html  (edited: swap ai-data.js → data-client.js script tag)
├── data-client.js                 (NEW — replaces ai-data.js)
├── app.jsx, ai-analysis.jsx, ai-chat.jsx, screens-*.jsx, ui.jsx, ios-frame.jsx, styles.css
│                                   (edited: read window.* globals fed by data-client.js
│                                    instead of local hardcoded arrays; ai-chat.jsx calls
│                                    fetch('/api/chat') instead of window.claude.complete)
└── server/                        (NEW)
    ├── package.json
    ├── .env.example                (GROQ_API_KEY=, GROQ_MODEL=llama-3.3-70b-versatile)
    ├── .gitignore                  (node_modules/, .env, data/waffer.db)
    ├── index.js                    (Express app: mounts /api routes, serves the project
    │                                root as static files, single port)
    ├── db.js                       (opens/creates data/waffer.db, runs schema)
    ├── schema.sql                  (table definitions)
    ├── seed.js                     (idempotent: seeds only if `users` table is empty;
    │                                runnable standalone via `npm run seed`)
    ├── lib/
    │   ├── aggregate.js             (transactions → 12-month per-category totals, the
    │   │                             same shape MONTHLY_SPEND has today)
    │   └── systemPrompt.js          (builds the Arabic system prompt from live DB rows —
    │                                 ports buildSystemPrompt() out of ai-chat.jsx)
    └── routes/
        ├── bootstrap.js             (GET /api/bootstrap)
        ├── chat.js                  (POST /api/chat)
        ├── goals.js                 (POST /api/goals)
        └── jamiya.js                (POST /api/jamiya/pay)
```

One process, one port (default `3001`). Express serves the existing static frontend
files directly from the project root, so opening `http://localhost:3001/Waffer App -
AI Insights.html` in a browser gives the whole working app — no CORS configuration
needed, no second dev server.

## Data model (SQLite)

All tables are scoped to a single seeded user, but keep a `user_id` foreign key
throughout so the shape is realistic and would extend to multi-user later without a
rewrite.

- **users** — `id, name, phone, monthly_income, created_at`
- **accounts** — `id, user_id, bank_name, masked_number, kind, balance` (e.g. الراجحي
  ××٤٤٢١ checking, STC Pay wallet)
- **categories** — `id (food|car|shop|bills|home|other), label, icon, color` (mirrors
  today's `CATS_META`)
- **budgets** — `user_id, category_id, monthly_cap` (mirrors `CATEGORY_BUDGETS`)
- **transactions** — `id, user_id, account_id, category_id, merchant, amount,
  occurred_at, note` — the real ledger. Dozens of rows per month × 12 months, real
  merchant names (ستاربكس، كودو، أرامكو، نمشي، STC، بنده، هنقرستيشن، نون, etc.), a few
  rows in specific months tagged with a `note` to produce the narrative spikes (Eid
  shopping in March, AC/electricity in June, summer trip in July, year-end shopping in
  December) — same story `ai-data.js` tells today, generated instead of hand-authored.
- **goals** — `id, user_id, title, icon_key, accent, target_amount, saved_amount,
  monthly_contribution, tag, created_at`
- **jamiya_groups** — `id, user_id, name, monthly_amount, current_round`
- **jamiya_members** — `id, group_id, full_name, initial, tone, status
  (paid|pending|late), payout_month, order_index, is_me`
- **saving_alternatives** — `id, user_id, category_id, type, from_label, from_amount,
  to_label, to_amount, save_amount, period` (mirrors `SAVING_ALTS`)
- **merchant_alternatives** — `id, user_id, match_merchant, category_id, alt_label,
  distance_label, save_amount` (mirrors `MERCHANT_MAP_ALTS`)
- **map_stores** — `id, user_id, x, y, type (current|alt), category_id, name,
  avg_amount, monthly_amount, alt_store_id, save_amount, distance_label` (mirrors the
  stylized map pin data in `screens-3.jsx`; `x`/`y` stay as stylized 0–100 canvas
  coordinates, not real geo — the map itself is a decorative illustration today, not a
  real map, so this isn't changing)

`icon_key` values map to the existing `Icon.*` components client-side (e.g. `'hajj'` →
`Icon.hajj`) — the DB never stores JSX/components, just string keys the frontend already
knows how to resolve (`GoalsScreen` already does `g.icon` → component lookup today, this
just becomes a lookup table).

## API

### `GET /api/bootstrap`
Single aggregate payload, fetched once on app boot. Response shape matches (and
extends) today's `ai-data.js` globals so the frontend diff stays mechanical:

```json
{
  "user": { "name": "فيصل", "monthlyIncome": 8500 },
  "accounts": [ { "bankName": "الراجحي", "maskedNumber": "××٤٤٢١", "balance": 6120 } ],
  "cats": [ /* same shape as CATS_META */ ],
  "budgets": { "food": 1400, "car": 900, ... },
  "monthlySpend": [ /* same shape as MONTHLY_SPEND, 12 rows, computed from transactions */ ],
  "liveFeed": [ /* same shape as LIVE_FEED, most recent N transactions */ ],
  "savingAlts": [ /* same shape as SAVING_ALTS */ ],
  "merchantMapAlts": [ /* same shape as MERCHANT_MAP_ALTS */ ],
  "goals": [ /* same shape as today's GoalsScreen local `goals` array */ ],
  "jamiya": { "name": "...", "monthlyAmount": 8000, "currentRound": 5, "members": [ ... ] },
  "mapStores": [ /* same shape as today's MapScreen local `stores` array */ ]
}
```

`monthlySpend` is computed server-side by `lib/aggregate.js` by summing `transactions`
grouped by month + category — not stored redundantly.

### `POST /api/chat`
Body: `{ "message": "...", "history": [ { "role": "user"|"assistant", "content": "..." } ] }`
(history = prior turns from the client's existing localStorage-backed message list, same
as what's already assembled in `ai-chat.jsx`).

Server rebuilds the system prompt itself from live DB rows (via `lib/systemPrompt.js`,
ported from today's client-side `buildSystemPrompt()`), calls Groq's OpenAI-compatible
endpoint (`https://api.groq.com/openai/v1/chat/completions`) with
`{ system, ...history, message }`, and returns `{ "reply": "..." }`.

If `GROQ_API_KEY` isn't set, responds `503 { "error": "AI not configured" }` rather than
crashing — the frontend already has a fallback message for chat errors
("صار خطأ بسيط بالاتصال...") and will reuse it as-is.

### `POST /api/goals`
Body: `{ "title": "...", "targetAmount": 15000, "monthlyContribution": 1000 }`.
Validates `title` non-empty and both amounts `> 0` (400 on failure). Inserts a row,
returns the created goal. Wires up `NewGoalSheet` in `app.jsx`, which today just shows a
toast and throws the input away.

### `POST /api/jamiya/pay`
No body needed (single user, single group). Sets the `is_me` member's `status` to
`'paid'`. Returns the updated jam'iya object. Wires up `PaySheet` in `app.jsx`, which
today just shows a toast after a fake `setTimeout`.

## Frontend integration

- **`data-client.js`** (new, loads where `ai-data.js` used to in the HTML `<script>`
  order): exposes `window.loadWafferData()`, which `fetch('/api/bootstrap')`s once and
  `Object.assign(window, {...})`s the same globals `ai-data.js` used to set
  (`CATS_META`, `CATEGORY_BUDGETS`, `MONTHLY_SPEND`, `SAVING_ALTS`, `LIVE_FEED`,
  `MERCHANT_MAP_ALTS`, `MONTHLY_INCOME`) plus new ones the screens will start reading
  (`USER`, `ACCOUNTS`, `GOALS`, `JAMIYA`, `MAP_STORES`).
- **`app.jsx`**: calls `loadWafferData()` in a `useEffect` on mount, renders a small
  loading state (reuses the existing spinner styling already used in
  `OnboardingScreen`'s "نحلّل كشفك..." step) until it resolves, and a simple error state
  with a retry button if the fetch fails (e.g. server not running).
- **`screens-1.jsx` (`HomeScreen`)**: replace the hardcoded `totalSaved`, `target`,
  `income`, `spent`, category list, and jam'iya teaser numbers with reads from
  `window.USER` / `window.GOALS[0]` / `window.MONTHLY_SPEND` / `window.JAMIYA`.
- **`screens-2.jsx` (`GoalsScreen`, `JamiyaScreen`)**: replace local `goals` /
  `members` arrays with `window.GOALS` / `window.JAMIYA.members`.
- **`screens-3.jsx` (`MapScreen`)**: replace local `stores` array with
  `window.MAP_STORES`.
- **`ai-analysis.jsx`**: already reads `window.MONTHLY_SPEND` etc., so `useAnalysis()`
  needs no change; only `window.MONTHLY_INCOME` and `RecentTransactions`'s
  `window.LIVE_FEED` usage carry over unchanged since `data-client.js` sets the same
  global names.
- **`ai-chat.jsx`**: delete `buildSystemPrompt()` and `GOAL_CONTEXT`/`JAMIYA_CONTEXT`
  (logic moves server-side); `send()` calls
  `fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message, history }) })`
  instead of `window.claude.complete(...)`; everything else (word-reveal, localStorage
  history, quick questions) is unchanged.
- **`app.jsx`** (`NewGoalSheet`, `PaySheet`): call `POST /api/goals` /
  `POST /api/jamiya/pay` respectively before showing the success toast; on success,
  re-fetch `/api/bootstrap` (or merge the returned row into the existing `window.GOALS`/
  `window.JAMIYA`) so the change is visible immediately without a manual page reload.

## Error handling

- Server: one centralized Express error-handling middleware returns
  `{ "error": "<message>" }` JSON with an appropriate status code (400 validation, 404
  unknown route, 500 unexpected, 503 AI-not-configured); no stack traces leak to the
  client.
- Client: `app.jsx`'s bootstrap loader distinguishes "still loading" vs "failed to
  load" (network error / non-2xx) and shows a retry button in the latter case instead of
  rendering screens against `undefined` globals.
- `ai-chat.jsx` keeps its existing try/catch around the network call and existing
  fallback assistant message on any error (network failure or `503` from a missing API
  key look the same to the user: a friendly retry prompt, not a stack trace).

## Running it

```
cd server
npm install
cp .env.example .env      # then fill in GROQ_API_KEY
npm run seed               # one-time: creates data/waffer.db and populates it
npm start                  # serves API + frontend on http://localhost:3001
```

## Testing plan

This stays a prototype, so no full automated test suite. Verification is manual/smoke:

- `npm run seed` completes and `data/waffer.db` contains the expected row counts per
  table (sanity-checked by the seed script itself logging counts).
- `curl` smoke tests for each endpoint: `GET /api/bootstrap` returns the full shape;
  `POST /api/goals` with valid/invalid bodies returns 201/400 respectively;
  `POST /api/jamiya/pay` flips status; `POST /api/chat` without `GROQ_API_KEY` set
  returns 503 (proves the fallback path works even before the user adds their key).
- Open the app in a real browser via the server's static hosting and click through every
  screen (Home, Analysis, Map, Goals, Jam'iya, AI Chat) to confirm numbers now come from
  the DB and are consistent across screens, and that the goal-creation and jam'iya-pay
  sheets actually persist.
