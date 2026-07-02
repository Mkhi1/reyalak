// aiGoalPlan.js — asks the LLM to look at the user's real month-by-month
// category spending (not just a 12-month average) and decide a personalized
// savings plan itself: which categories to trim, by how much, and why —
// instead of the fixed-percentage formula in goalPlan.js. Falls back to that
// deterministic calculation if the AI call fails, returns unusable JSON, or
// GROQ_API_KEY isn't configured, so the UI never breaks even when the LLM
// misbehaves.
const db = require('../db');
const { monthlySpend } = require('./aggregate');
const { computeGoalPlan, FLEXIBLE } = require('./goalPlan');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getGoal(userId) {
  return db.prepare(
    "SELECT * FROM goals WHERE user_id = ? ORDER BY (tag IS NOT NULL) DESC, id ASC LIMIT 1"
  ).get(userId);
}

function buildPrompt(userId, goal) {
  const user = db.prepare('SELECT monthly_income FROM users WHERE id = ?').get(userId);
  const cats = db.prepare('SELECT * FROM categories').all();
  const catLabel = Object.fromEntries(cats.map(c => [c.id, c.label]));
  const months = monthlySpend(userId);

  const monthLines = months.map(m =>
    `${m.month}: ${cats.map(c => `${c.label} ${m[c.id]}`).join('، ')}`
  ).join('\n');

  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const flexLabels = FLEXIBLE.map(id => catLabel[id]).join('، ');

  return `أنت مخطط مالي شخصي داخل تطبيق ريالك. حلّل صرف المستخدم الفعلي شهرياً خلال آخر ${months.length} شهر (موزّع حسب الفئة أدناه) وقرّر خطة ادخار واقعية وشخصية توصله لهدفه.

دخله الشهري: ${user.monthly_income} ر.س
هدفه: "${goal.title}" — باقي له ${remaining} ر.س، وخطته الحالية تحتاج توفير ${goal.monthly_contribution} ر.س شهرياً.

صرفه الفعلي شهرياً حسب الفئة:
${monthLines}

الفئات القابلة للتخفيض فقط (لا تلمس الفواتير والبقالة والبيت أبداً): ${flexLabels}.

مهم: انظر للنمط عبر الأشهر، مو بس المعدل — إذا فئة معينة صاعدة أو فيها شهر شاذ، اذكر هذا صراحة في السبب. لا تقترح تخفيض أكثر من ٣٥٪ من متوسط أي فئة مرنة — خلي الخطة واقعية مو قاسية. لا تخترع أرقام غير موجودة بالبيانات أعلاه.

رجّع JSON فقط بهذا الشكل بالضبط، بدون أي نص إضافي قبله أو بعده أو markdown:
{"verdict":"achievable|cuts|adjust","requiredMonthly":<رقم>,"summary":"<جملة أو جملتين بالعربي بأسلوب مدرّب متفائل، تشرح الحكم وتشير لنمط حقيقي وجدته بالبيانات>","cuts":[{"category":"food|shop|other|car","currentAvg":<رقم>,"suggestedTarget":<رقم>,"reason":"<سبب قصير مبني على نمط حقيقي لاحظته بصرفه>"}],"realisticMonths":<رقم أو null>}`;
}

function normalizePlan(parsed, goal) {
  if (!parsed || !['achievable', 'cuts', 'adjust'].includes(parsed.verdict)) return null;

  const cats = db.prepare('SELECT * FROM categories').all();
  const catById = Object.fromEntries(cats.map(c => [c.id, c]));

  const cuts = Array.isArray(parsed.cuts)
    ? parsed.cuts
        .filter(c => c && FLEXIBLE.includes(c.category))
        .map(c => {
          const current = Math.round(Number(c.currentAvg) || 0);
          const target = Math.max(0, Math.round(Number(c.suggestedTarget) || 0));
          return {
            catId: c.category,
            label: (catById[c.category] || {}).label || c.category,
            icon: (catById[c.category] || {}).icon || c.category,
            current,
            target,
            save: Math.max(0, current - target),
            reason: typeof c.reason === 'string' ? c.reason : '',
          };
        })
        .filter(c => c.save > 0)
        .sort((a, b) => b.save - a.save)
    : [];

  const requiredMonthly = Math.round(Number(parsed.requiredMonthly) || goal.monthly_contribution);
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);

  return {
    goalId: goal.icon_key + '-' + goal.id,
    goalTitle: goal.title,
    verdict: parsed.verdict,
    requiredMonthly,
    goalMonths: Math.max(1, Math.ceil(remaining / requiredMonthly)),
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    cuts,
    realisticMonths: parsed.realisticMonths != null && !Number.isNaN(Number(parsed.realisticMonths))
      ? Math.round(Number(parsed.realisticMonths))
      : null,
    source: 'ai',
  };
}

async function computeAiGoalPlan(userId) {
  const goal = getGoal(userId);
  if (!goal) return null;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return computeGoalPlan(userId);

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
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildPrompt(userId, goal) }],
      }),
    });
    if (!groqRes.ok) throw new Error('groq request failed: ' + groqRes.status);

    const data = await groqRes.json();
    const raw = data?.choices?.[0]?.message?.content;
    const parsed = normalizePlan(JSON.parse(raw), goal);
    return parsed || computeGoalPlan(userId);
  } catch (err) {
    console.error('AI goal plan failed, falling back to formula', err.message);
    return computeGoalPlan(userId);
  }
}

module.exports = { computeAiGoalPlan };
