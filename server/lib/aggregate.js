// aggregate.js — turns raw transaction rows into the shapes the frontend needs
// (12-month per-category totals, recent live feed), same contract ai-data.js
// used to hand the frontend as static arrays.
const db = require('../db');

const ARABIC_MONTHS = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTH_IDS = ['', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const CAT_IDS = ['food', 'car', 'shop', 'bills', 'home', 'other'];

// Narrative notes for this seeded year — mirrors what ai-data.js used to hardcode.
const MONTH_NOTES = {
  '03': 'تسوّق العيد رفع صرفك هالشهر',
  '06': 'فاتورة الكهرباء زادت مع الحر',
  '07': 'رحلة الصيف + تكييف — أعلى شهر صرف هذا العام',
  '12': 'تسوّق المناسبات ونهاية السنة',
};

function monthlySpend(userId) {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', occurred_at) AS ym, category_id, SUM(amount) AS total
    FROM transactions WHERE user_id = ?
    GROUP BY ym, category_id
    ORDER BY ym ASC
  `).all(userId);

  const byMonth = new Map();
  for (const r of rows) {
    if (!byMonth.has(r.ym)) byMonth.set(r.ym, {});
    byMonth.get(r.ym)[r.category_id] = r.total;
  }

  return Array.from(byMonth.keys()).sort().map(ym => {
    const monthNum = +ym.split('-')[1];
    const entry = { id: MONTH_IDS[monthNum], month: ARABIC_MONTHS[monthNum] };
    for (const c of CAT_IDS) entry[c] = byMonth.get(ym)[c] || 0;
    const noteKey = ym.split('-')[1];
    if (MONTH_NOTES[noteKey]) entry.note = MONTH_NOTES[noteKey];
    return entry;
  });
}

function liveFeed(userId, limit = 10) {
  const rows = db.prepare(`
    SELECT merchant, category_id AS cat, amount
    FROM transactions WHERE user_id = ?
    ORDER BY occurred_at DESC, id DESC
    LIMIT ?
  `).all(userId, limit);
  return rows;
}

module.exports = { monthlySpend, liveFeed };
