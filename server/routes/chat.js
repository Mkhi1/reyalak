// chat.js — POST /api/chat: proxies to Groq's OpenAI-compatible chat completions
// endpoint. The system prompt is built server-side from live DB data so the
// client never needs to (and can't) fabricate financial context.
const express = require('express');
const db = require('../db');
const { buildSystemPrompt } = require('../lib/systemPrompt');

const router = express.Router();
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI not configured — set GROQ_API_KEY in server/.env' });
  }

  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  const userId = db.prepare('SELECT id FROM users LIMIT 1').get()?.id;
  if (!userId) return res.status(500).json({ error: 'No seeded user — run `npm run seed`' });

  const systemPrompt = buildSystemPrompt(userId);
  const priorTurns = Array.isArray(history)
    ? history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map(m => ({ role: m.role, content: m.content }))
    : [];

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          ...priorTurns,
          { role: 'user', content: message },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text().catch(() => '');
      console.error('Groq API error', groqRes.status, errBody);
      return res.status(502).json({ error: 'AI provider error' });
    }

    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'ما قدرت أجاوب هالمرة، جرّب مرة ثانية.';
    res.json({ reply });
  } catch (err) {
    console.error('Chat proxy failed', err);
    res.status(502).json({ error: 'AI provider unreachable' });
  }
});

module.exports = router;
