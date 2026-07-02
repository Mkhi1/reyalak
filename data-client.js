// data-client.js — fetches live data from the ريالك backend (server/) and
// exposes it through the same window.* globals the screens already read
// (previously populated by the static ai-data.js). Also exposes new globals
// (USER, ACCOUNTS, GOALS, JAMIYA, MAP_STORES) that the screens now read
// instead of their old locally-hardcoded arrays.

function assignWafferGlobals(data) {
  Object.assign(window, {
    CATS_META: data.cats,
    CATEGORY_BUDGETS: data.budgets,
    MONTHLY_SPEND: data.monthlySpend,
    SAVING_ALTS: data.savingAlts,
    LIVE_FEED: data.liveFeed,
    MERCHANT_MAP_ALTS: data.merchantMapAlts,
    MONTHLY_INCOME: data.user.monthlyIncome,
    USER: data.user,
    ACCOUNTS: data.accounts,
    GOALS: data.goals,
    JAMIYA: data.jamiya,
    MAP_STORES: data.mapStores,
  });
}

// Fetches /api/bootstrap once and populates window.* globals. Rejects on
// network failure or non-2xx so callers (app.jsx) can show a retry state.
window.loadWafferData = async function loadWafferData() {
  const res = await fetch('/api/bootstrap');
  if (!res.ok) throw new Error('bootstrap failed: ' + res.status);
  const data = await res.json();
  assignWafferGlobals(data);
  return data;
};

// Fetches the AI-reasoned savings plan (GET /api/goal-plan) — separate from
// bootstrap since this one calls an LLM and can take 1-3s. Home fetches this
// itself after it's already rendered, so it never blocks initial load.
window.loadGoalPlan = async function loadGoalPlan() {
  const res = await fetch('/api/goal-plan');
  if (!res.ok) throw new Error('goal-plan failed: ' + res.status);
  return res.json();
};

// Fetches the full multi-month AI savings schedule (GET /api/goal-schedule)
// — only called when the user opens the plan detail page, since it's a
// heavier LLM call than the this-month summary above.
window.loadGoalSchedule = async function loadGoalSchedule() {
  const res = await fetch('/api/goal-schedule');
  if (!res.ok) throw new Error('goal-schedule failed: ' + res.status);
  return res.json();
};
