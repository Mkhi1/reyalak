// systemPrompt.js — builds the Arabic system prompt for the AI chat from LIVE
// database rows (ported from the client-side buildSystemPrompt() that used to
// live in ai-chat.jsx and take pre-computed stats from the browser).
const db = require('../db');
const { monthlySpend } = require('./aggregate');

const SAR = 'ر.س';

function analyze(userId) {
  const months = monthlySpend(userId);
  const categories = db.prepare('SELECT * FROM categories').all();
  const budgets = Object.fromEntries(
    db.prepare('SELECT category_id, monthly_cap FROM budgets WHERE user_id = ?').all(userId)
      .map(b => [b.category_id, b.monthly_cap])
  );

  const withTotals = months.map(m => ({
    ...m,
    total: categories.reduce((s, c) => s + (m[c.id] || 0), 0),
  }));
  const grandTotal = withTotals.reduce((s, m) => s + m.total, 0);
  const avgMonthly = grandTotal / withTotals.length;
  const maxMonth = withTotals.reduce((a, b) => (b.total > a.total ? b : a));

  const catStats = categories.map(c => {
    const total = withTotals.reduce((s, m) => s + (m[c.id] || 0), 0);
    const avg = total / withTotals.length;
    const budget = budgets[c.id] || 0;
    const over = avg - budget > 0.5;
    return { id: c.id, label: c.label, avg, budget, over, total };
  }).sort((a, b) => b.total - a.total);

  const topCat = catStats[0];
  const totalBudget = categories.reduce((s, c) => s + (budgets[c.id] || 0), 0);
  const overallOverPct = ((avgMonthly - totalBudget) / totalBudget) * 100;
  const overCatsCount = catStats.filter(c => c.over).length;
  let score = Math.round(100 - Math.max(0, overallOverPct) * 3 - overCatsCount * 4);
  score = Math.max(0, Math.min(100, score));
  let verdict = 'يحتاج تحسين';
  if (score >= 90) verdict = 'ممتاز';
  else if (score >= 75) verdict = 'جيد';
  else if (score >= 60) verdict = 'متوسط';

  return { grandTotal, avgMonthly, maxMonth, topCat, catStats, score, verdict };
}

function buildSystemPrompt(userId) {
  const a = analyze(userId);

  const catLines = a.catStats.map(c =>
    `${c.label}: متوسط ${Math.round(c.avg)} ${SAR}/شهر (ميزانية ${c.budget} ${SAR})${c.over ? ' — متجاوز' : ' — ضمن الميزانية'}`
  ).join('\n');

  const alts = db.prepare('SELECT * FROM saving_alternatives WHERE user_id = ?').all(userId);
  const altLines = alts.map(alt =>
    `- بدّل "${alt.from_label}" (${alt.from_amount} ${SAR}) بـ "${alt.to_label}" (${alt.to_amount} ${SAR}) ← يوفّر ${alt.save_amount} ${SAR} بالشهر`
  ).join('\n');

  const goal = db.prepare(
    "SELECT * FROM goals WHERE user_id = ? ORDER BY (tag IS NOT NULL) DESC, id ASC LIMIT 1"
  ).get(userId);
  const monthsLeft = goal ? Math.max(1, Math.ceil((goal.target_amount - goal.saved_amount) / goal.monthly_contribution)) : null;

  const group = db.prepare('SELECT * FROM jamiya_groups WHERE user_id = ?').get(userId);
  const members = group ? db.prepare('SELECT * FROM jamiya_members WHERE group_id = ?').all(group.id) : [];
  const me = members.find(m => m.is_me);

  return `أنت "المساعد الذكي" داخل تطبيق ريالك — تطبيق سعودي للادخار وتحليل المصاريف. تتكلم عربي بأسلوب ودود وواضح (لهجة خليجية خفيفة مقبولة)، وإجاباتك مختصرة (٢-٤ جمل عادة) إلا إذا طلب المستخدم تفصيل أكثر. لا تستخدم markdown ولا نجوم؛ فقرات عادية فقط. اكتب الأرقام بالأرقام الهندية (١٢٣...) لأن كل أرقام التطبيق بهالشكل.

بيانات المستخدم (كلها بيانات تجريبية/وهمية لغرض العرض التوضيحي — تعامل معها كأنها حقيقية عند الإجابة):

إجمالي صرفه آخر ١٢ شهر: ${Math.round(a.grandTotal)} ${SAR}، بمعدّل ${Math.round(a.avgMonthly)} ${SAR} شهرياً.
أعلى شهر صرف: ${a.maxMonth.month} (${a.maxMonth.total} ${SAR})${a.maxMonth.note ? ' — ' + a.maxMonth.note : ''}.
أكبر باب صرف: ${a.topCat.label}.
تقييم ريالك الذكي لعاداته: ${a.score}/100 (${a.verdict}).

الصرف حسب الفئة (متوسط شهري مقابل الميزانية):
${catLines}

بدائل توفير مقترحة:
${altLines}

${goal ? `هدفه الحالي: "${goal.title}" — جمع ${goal.saved_amount} من أصل ${goal.target_amount} ${SAR}، وباقي له ${monthsLeft} أشهر تقريباً.` : ''}

${group ? `جمعيته: "${group.name}" — ${members.length} أعضاء، دوره ${me ? me.payout_month : 'غير محدد'}، والقيمة الشهرية ${group.monthly_amount} ${SAR}.` : ''}

أجب فقط بناءً على هذي البيانات. إذا سأل عن شي مو موجود بالبيانات، وضّح إنه مو متوفر بدل ما تختلق رقم.`;
}

module.exports = { buildSystemPrompt, analyze };
