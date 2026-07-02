// goalPlan.js (route) — GET /api/goal-plan: AI-reasoned savings plan for the
// user's featured goal. Separate from /api/bootstrap because this one calls
// an LLM (1-3s), so the rest of the app can render instantly while this
// loads in afterward.
const express = require('express');
const db = require('../db');
const { computeAiGoalPlan } = require('../lib/aiGoalPlan');

const router = express.Router();

router.get('/', async (req, res) => {
  const u = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!u) return res.status(500).json({ error: 'No seeded user — run `npm run seed`' });
  const plan = await computeAiGoalPlan(u.id);
  res.json(plan);
});

module.exports = router;
