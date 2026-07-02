// bootstrap.js — GET /api/bootstrap: single aggregate payload for app boot.
// Field names are chosen to match exactly what the existing screens already
// destructure (e.g. GoalsScreen reads g.saved/g.target/g.monthly/g.months;
// MapScreen reads s.avg/s.monthly/s.alt/s.save/s.dist/s.cat) so wiring the
// frontend to this is a straight swap, not a rewrite of every screen.
const express = require('express');
const db = require('../db');
const { monthlySpend, liveFeed } = require('../lib/aggregate');

const router = express.Router();
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (n) => String(n).replace(/\d/g, d => AR_DIGITS[+d]);

function getUserId() {
  const u = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!u) throw Object.assign(new Error('No seeded user — run `npm run seed`'), { status: 500 });
  return u.id;
}

router.get('/', (req, res) => {
  const userId = getUserId();

  const user = db.prepare('SELECT name, monthly_income FROM users WHERE id = ?').get(userId);
  const accounts = db.prepare('SELECT bank_name, masked_number, kind, balance FROM accounts WHERE user_id = ?').all(userId)
    .map(a => ({ bankName: a.bank_name, maskedNumber: a.masked_number, kind: a.kind, balance: a.balance }));

  const cats = db.prepare('SELECT * FROM categories').all();
  const budgets = Object.fromEntries(
    db.prepare('SELECT category_id, monthly_cap FROM budgets WHERE user_id = ?').all(userId)
      .map(b => [b.category_id, b.monthly_cap])
  );

  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY (tag IS NOT NULL) DESC, id ASC').all(userId)
    .map(g => ({
      id: g.icon_key + '-' + g.id,
      title: g.title,
      saved: g.saved_amount,
      target: g.target_amount,
      monthly: g.monthly_contribution,
      months: Math.max(1, Math.ceil((g.target_amount - g.saved_amount) / g.monthly_contribution)),
      icon: g.icon_key,
      accent: g.accent,
      tag: g.tag,
    }));

  const group = db.prepare('SELECT * FROM jamiya_groups WHERE user_id = ?').get(userId);
  const members = group ? db.prepare('SELECT * FROM jamiya_members WHERE group_id = ? ORDER BY order_index ASC').all(group.id) : [];
  const jamiya = group ? {
    name: group.name,
    monthlyAmount: group.monthly_amount,
    currentRound: group.current_round,
    memberCount: members.length,
    members: members.map(m => ({
      name: m.initial,
      full: m.full_name,
      tone: m.tone,
      status: m.status,
      month: m.payout_month,
      order: m.order_index,
      isMe: !!m.is_me,
    })),
  } : null;

  const savingAlts = db.prepare('SELECT * FROM saving_alternatives WHERE user_id = ?').all(userId)
    .map(a => ({ id: 'alt-' + a.id, cat: a.category_id, type: a.type, from: a.from_label, fromAmt: a.from_amount, to: a.to_label, toAmt: a.to_amount, save: a.save_amount, period: a.period }));

  const merchantMapAlts = db.prepare('SELECT * FROM merchant_alternatives WHERE user_id = ?').all(userId)
    .map(m => ({ id: 'malt-' + m.id, match: m.match_merchant, cat: m.category_id, type: 'nearby', alt: m.alt_label, dist: m.distance_label, save: m.save_amount }));

  const storeRows = db.prepare('SELECT * FROM map_stores WHERE user_id = ?').all(userId);
  const mapStores = storeRows.map(s => ({
    id: s.id,
    x: s.x,
    y: s.y,
    type: s.type,
    cat: s.map_cat,
    name: s.name,
    avg: s.avg_amount,
    monthly: s.monthly_amount,
    alt: s.alt_store_id,
    save: s.save_amount,
    savingNote: s.save_amount ? `توفّر ${toArabicDigits(s.save_amount)} ر.س شهرياً` : undefined,
    dist: s.distance_label,
  }));

  res.json({
    user: { name: user.name, monthlyIncome: user.monthly_income },
    accounts,
    cats,
    budgets,
    monthlySpend: monthlySpend(userId),
    liveFeed: liveFeed(userId, 10),
    savingAlts,
    merchantMapAlts,
    goals,
    jamiya,
    mapStores,
  });
});

module.exports = router;
