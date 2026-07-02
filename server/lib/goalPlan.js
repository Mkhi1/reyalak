// goalPlan.js — "how much should I save this month to reach my goal", grounded
// in the user's own trailing-12-month spending (via analyze()'s catStats),
// not a generic 50/30/20 rule. Reused by GET /api/bootstrap for the featured
// (tagged) goal.
const db = require('../db');
const { analyze } = require('./systemPrompt');

// FIXED categories aren't touched by the plan (rent-like, hard to flex).
// FLEXIBLE is where slack lives; we never ask to cut more than CUTTABLE_PCT
// of a flexible category's own average — keeps the plan realistic, not punishing.
const FIXED = ['home', 'bills'];
const FLEXIBLE = ['food', 'shop', 'other', 'car'];
const CUTTABLE_PCT = 0.30;

function computeGoalPlan(userId) {
  const goal = db.prepare(
    "SELECT * FROM goals WHERE user_id = ? ORDER BY (tag IS NOT NULL) DESC, id ASC LIMIT 1"
  ).get(userId);
  if (!goal) return null;

  const user = db.prepare('SELECT monthly_income FROM users WHERE id = ?').get(userId);
  const cats = db.prepare('SELECT * FROM categories').all();
  const catById = Object.fromEntries(cats.map(c => [c.id, c]));

  // catStats[].avg is the trailing average across every seeded month (12),
  // not a single recent month — reflects a full year of real habits.
  const a = analyze(userId);
  const avgByCat = Object.fromEntries(a.catStats.map(c => [c.id, c.avg]));

  const income = user.monthly_income;
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const requiredMonthly = goal.monthly_contribution;
  const baselineAvailable = income - a.avgMonthly;

  const flexSlack = FLEXIBLE.reduce((s, id) => s + (avgByCat[id] || 0) * CUTTABLE_PCT, 0);
  const maxAvailable = baselineAvailable + flexSlack;

  function buildCuts(gapAmount) {
    if (flexSlack <= 0 || gapAmount <= 0) return [];
    return FLEXIBLE
      .map(id => {
        const slack = (avgByCat[id] || 0) * CUTTABLE_PCT;
        const share = slack / flexSlack;
        const cut = Math.min(gapAmount * share, slack);
        return {
          catId: id,
          label: (catById[id] || {}).label || id,
          icon: (catById[id] || {}).icon || id,
          current: Math.round(avgByCat[id] || 0),
          target: Math.round((avgByCat[id] || 0) - cut),
          save: Math.round(cut),
        };
      })
      .filter(c => c.save > 0)
      .sort((x, y) => y.save - x.save);
  }

  let verdict = 'achievable';
  let cuts = [];
  let realisticMonths = null;
  let suggestions = [];

  if (requiredMonthly > baselineAvailable) {
    if (requiredMonthly <= maxAvailable) {
      verdict = 'cuts';
      cuts = buildCuts(requiredMonthly - baselineAvailable);
    } else {
      verdict = 'adjust';
      cuts = buildCuts(flexSlack);
      realisticMonths = maxAvailable > 0 ? Math.ceil(remaining / maxAvailable) : null;
      const topCat = cuts[0];
      if (topCat) {
        suggestions = db.prepare(
          'SELECT * FROM saving_alternatives WHERE user_id = ? AND category_id = ? LIMIT 2'
        ).all(userId, topCat.catId).map(alt => ({
          from: alt.from_label, fromAmt: alt.from_amount,
          to: alt.to_label, toAmt: alt.to_amount, save: alt.save_amount,
        }));
      }
    }
  }

  return {
    goalId: goal.icon_key + '-' + goal.id,
    goalTitle: goal.title,
    verdict,
    requiredMonthly: Math.round(requiredMonthly),
    baselineAvailable: Math.round(baselineAvailable),
    maxAvailable: Math.round(maxAvailable),
    remainingAmount: Math.round(remaining),
    goalMonths: Math.max(1, Math.ceil(remaining / requiredMonthly)),
    realisticMonths,
    cuts,
    suggestions,
  };
}

module.exports = { computeGoalPlan, FLEXIBLE, FIXED, CUTTABLE_PCT };
