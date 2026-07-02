// goals.js — POST /api/goals: persists a new goal (wires up NewGoalSheet,
// which today just shows a toast and discards the input).
const express = require('express');
const db = require('../db');

const router = express.Router();
const ACCENTS = ['#1B3424', '#A8754A', '#9E2B25', '#898F65', '#013E37'];

router.post('/', (req, res) => {
  const { title, targetAmount, monthlyContribution } = req.body || {};

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const target = Number(targetAmount);
  const monthly = Number(monthlyContribution);
  if (!Number.isFinite(target) || target <= 0) {
    return res.status(400).json({ error: 'targetAmount must be a positive number' });
  }
  if (!Number.isFinite(monthly) || monthly <= 0) {
    return res.status(400).json({ error: 'monthlyContribution must be a positive number' });
  }

  const userId = db.prepare('SELECT id FROM users LIMIT 1').get()?.id;
  if (!userId) return res.status(500).json({ error: 'No seeded user — run `npm run seed`' });

  const accent = ACCENTS[Math.floor(Math.random() * ACCENTS.length)];
  const info = db.prepare(
    'INSERT INTO goals (user_id, title, icon_key, accent, target_amount, saved_amount, monthly_contribution, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, title.trim(), 'target', accent, target, 0, monthly, null);

  res.status(201).json({
    id: 'target-' + info.lastInsertRowid,
    title: title.trim(),
    saved: 0,
    target,
    monthly,
    months: Math.max(1, Math.ceil(target / monthly)),
    icon: 'target',
    accent,
    tag: null,
  });
});

module.exports = router;
