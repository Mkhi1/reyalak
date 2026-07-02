// aiGoalSchedule.js — full multi-month savings schedule for the plan detail
// page. Unlike aiGoalPlan.js (this month only), this asks the LLM to spread
// varying amounts across every remaining month until the goal is funded,
// informed by real seasonal spending patterns (Eid, summer trip, etc.) in
// the user's own history — some months save more, some less, not a flat
// divide. Falls back to an even split if the AI call fails or the goal is
// too far out to fit a reasonable prompt.
const db = require('../db');
const { monthlySpend } = require('./aggregate');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MAX_AI_MONTHS = 24;

function getGoal(userId) {
  return db.prepare(
    "SELECT * FROM goals WHERE user_id = ? ORDER BY (tag IS NOT NULL) DESC, id ASC LIMIT 1"
  ).get(userId);
}

function upcomingMonthLabels(count) {
  const now = new Date();
  const labels = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    labels.push(ARABIC_MONTHS[d.getMonth()]);
  }
  return labels;
}

function evenFallback(goal, months, labels, remaining) {
  const per = Math.round(remaining / months);
  const schedule = labels.map((label, i) => ({ month: i + 1, label, amount: per, reason: '' }));
  return {
    goalTitle: goal.title,
    totalMonths: months,
    totalNeeded: remaining,
    summary: `توزيع ثابت على ${months} أشهر بما إن ما قدرنا نحلل نمط صرفك بالذكاء الاصطناعي هالمرة.`,
    schedule,
    source: 'fallback',
  };
}

function buildPrompt(userId, goal, months, labels, remaining) {
  const user = db.prepare('SELECT monthly_income FROM users WHERE id = ?').get(userId);
  const cats = db.prepare('SELECT * FROM categories').all();
  const history = monthlySpend(userId);
  const monthLines = history.map(m =>
    `${m.month}${m.note ? ' (' + m.note + ')' : ''}: ${cats.map(c => `${c.label} ${m[c.id]}`).join('، ')}`
  ).join('\n');

  return `أنت مخطط مالي شخصي داخل تطبيق ريالك. المستخدم يحتاج يجمع ${remaining} ر.س خلال ${months} شهر قادمة عشان يحقق هدفه "${goal.title}". دخله الشهري ${user.monthly_income} ر.س.

هذا صرفه الفعلي شهرياً خلال آخر سنة (لاحظ الأنماط الموسمية المذكورة بين قوسين):
${monthLines}

الأشهر القادمة اللي تحتاج تحط لها خطة ادخار، بالترتيب: ${labels.join('، ')}.

مهم: لا توزّع المبلغ بالتساوي. استخدم الأنماط الموسمية اللي شفتها بالبيانات — إذا شهر تاريخياً فيه صرف مرتفع (زي رمضان أو العيد أو الصيف)، خلي مبلغ الادخار المطلوب فيه أقل من المعتاد، وعوّضه بمبلغ أعلى بشهر يكون الصرف فيه عادة أخف. لازم كل شهر بالقائمة أعلاه يكون له مبلغ. المجموع الكلي للمبالغ يجب يساوي تقريباً ${remaining} ر.س.

رجّع JSON فقط بهذا الشكل، بدون أي نص إضافي أو markdown:
{"summary":"<جملتين بالعربي يشرحون استراتيجية التوزيع عبر الأشهر>","schedule":[{"label":"<اسم الشهر بالضبط من القائمة أعلاه>","amount":<رقم>,"reason":"<سبب قصير ليه هالمبلغ بالذات لهالشهر>"}]}`;
}

function normalize(parsed, goal, months, labels, remaining) {
  if (!parsed || !Array.isArray(parsed.schedule) || parsed.schedule.length === 0) return null;

  const byLabel = new Map();
  for (const entry of parsed.schedule) {
    if (entry && typeof entry.label === 'string' && labels.includes(entry.label)) {
      byLabel.set(entry.label, {
        amount: Math.max(0, Number(entry.amount) || 0),
        reason: typeof entry.reason === 'string' ? entry.reason : '',
      });
    }
  }
  if (byLabel.size === 0) return null;

  // Fill any month the AI skipped so every month in the range has a number.
  const filled = labels.map(label => byLabel.get(label) || { amount: 0, reason: '' });
  const rawTotal = filled.reduce((s, f) => s + f.amount, 0);
  const missingCount = filled.filter(f => f.amount === 0).length;
  if (missingCount > 0 && rawTotal < remaining) {
    const fillAmount = Math.round((remaining - rawTotal) / missingCount);
    filled.forEach(f => { if (f.amount === 0) f.amount = fillAmount; });
  }

  // Scale proportionally so the schedule sums exactly to what's actually
  // needed — keeps the AI's relative shape (which months get more/less)
  // while guaranteeing the total is financially correct.
  const total = filled.reduce((s, f) => s + f.amount, 0) || 1;
  const scale = remaining / total;
  const schedule = labels.map((label, i) => ({
    month: i + 1,
    label,
    amount: Math.round(filled[i].amount * scale),
    reason: filled[i].reason,
  }));

  return {
    goalTitle: goal.title,
    totalMonths: months,
    totalNeeded: remaining,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    schedule,
    source: 'ai',
  };
}

async function computeAiGoalSchedule(userId) {
  const goal = getGoal(userId);
  if (!goal) return null;

  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const months = Math.max(1, Math.ceil(remaining / goal.monthly_contribution));
  const labels = upcomingMonthLabels(months);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || months > MAX_AI_MONTHS) return evenFallback(goal, months, labels, remaining);

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildPrompt(userId, goal, months, labels, remaining) }],
      }),
    });
    if (!groqRes.ok) throw new Error('groq request failed: ' + groqRes.status);

    const data = await groqRes.json();
    const raw = data?.choices?.[0]?.message?.content;
    const normalized = normalize(JSON.parse(raw), goal, months, labels, remaining);
    return normalized || evenFallback(goal, months, labels, remaining);
  } catch (err) {
    console.error('AI goal schedule failed, falling back to even split', err.message);
    return evenFallback(goal, months, labels, remaining);
  }
}

module.exports = { computeAiGoalSchedule };
