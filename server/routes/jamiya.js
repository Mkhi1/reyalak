// jamiya.js — POST /api/jamiya/pay: marks the current user's turn as paid
// (wires up PaySheet, which today just fakes success after a setTimeout).
const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/pay', (req, res) => {
  const userId = db.prepare('SELECT id FROM users LIMIT 1').get()?.id;
  if (!userId) return res.status(500).json({ error: 'No seeded user — run `npm run seed`' });

  const group = db.prepare('SELECT * FROM jamiya_groups WHERE user_id = ?').get(userId);
  if (!group) return res.status(404).json({ error: 'No jam\'iya group found' });

  const me = db.prepare('SELECT * FROM jamiya_members WHERE group_id = ? AND is_me = 1').get(group.id);
  if (!me) return res.status(404).json({ error: 'Current user is not a member of this group' });

  db.prepare("UPDATE jamiya_members SET status = 'paid' WHERE id = ?").run(me.id);

  const members = db.prepare('SELECT * FROM jamiya_members WHERE group_id = ? ORDER BY order_index ASC').all(group.id);
  res.json({
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
  });
});

module.exports = router;
