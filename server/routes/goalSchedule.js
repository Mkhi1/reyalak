// goalSchedule.js (route) — GET /api/goal-schedule: full multi-month AI
// savings schedule for the plan detail page. Only fetched when the user
// actually opens that page (tapped through from Home), since it's a heavier
// LLM call than the this-month summary in /api/goal-plan.
const express = require('express');
const db = require('../db');
const { computeAiGoalSchedule } = require('../lib/aiGoalSchedule');

const router = express.Router();

router.get('/', async (req, res) => {
  const u = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!u) return res.status(500).json({ error: 'No seeded user — run `npm run seed`' });
  const schedule = await computeAiGoalSchedule(u.id);
  res.json(schedule);
});

module.exports = router;
