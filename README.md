# ريالك (Reyalak)

A Saudi personal-finance and savings prototype — iPhone-framed, RTL Arabic, dark-green and cream Najdi-inspired design. Built for a hackathon.

**Team: A.M.Y.M**

## What it does

- **Home** — real savings balance, income/spend overview, and an AI-computed "how much to save this month" figure
- **بدائل (Alternatives)** — cheaper ways to spend, both nearby merchant swaps (shown on a map) and budget/behavior changes (subscriptions, cooking at home)
- **التحليل (Analysis)** — 12-month spending breakdown, category budgets, recent transactions
- **الأهداف (Goals)** — savings goals with progress tracking, plus a full AI-generated month-by-month savings schedule that adapts to real seasonal spending patterns

- **المساعد الذكي (AI Assistant)** — a chat assistant grounded in your real data, powered by Groq (Llama 3.3 70B)

All financial data is synthetic/seeded — no real bank, merchant, or place names are used anywhere in the app.

## Tech stack

- **Frontend:** React + Babel Standalone, no build step — plain `.jsx` files transpiled live in the browser
- **Backend:** Node.js + Express, serving both the REST API and the static frontend from one process
- **Database:** SQLite via Node's built-in `node:sqlite` module (no native dependencies)
- **AI:** Groq API (Llama 3.3 70B) — powers the chat assistant and the AI-reasoned savings plans

## How to run it

**Requirements:** Node.js ≥ 22.5.0, a free [Groq API key](https://console.groq.com)

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Configure your API key
cp .env.example .env
# open .env and set GROQ_API_KEY=your_key_here

# 3. Seed the database with demo data
npm run seed

# 4. Start the server
npm start
```

Then open **http://localhost:3001/Reyalak%20App%20-%20AI%20Insights.html** in your browser.

The app works without a Groq key too — the AI chat and AI savings-plan features will fall back to a formula-based plan instead of erroring out.

## Project structure

```
├── Reyalak App - AI Insights.html   # entry point
├── app.jsx                          # app shell / screen router
├── screens-1.jsx / -2.jsx / -3.jsx  # Home, Goals/Jam'iya, بدائل
├── ai-analysis.jsx, ai-chat.jsx     # Analysis screen, AI chat screen
├── goal-plan.jsx                    # full AI savings-schedule page
├── ui.jsx                           # shared components (icons, cards, nav)
├── data-client.js                   # fetches live data from the backend
└── server/
    ├── index.js                     # Express app entry
    ├── db.js, schema.sql, seed.js   # SQLite setup + demo data
    ├── routes/                      # /api/* endpoints
    └── lib/                         # AI prompt builders, aggregation logic
```
