// ai-analysis.jsx — merged "التحليل" screen. One page, one density control
// (مبسّط / متوسط / كامل) governs how much of the analysis is on screen —
// replaces the old split between "التحليل" and "التحليل الذكي".

const { useState: useStateAI, useMemo: useMemoAI } = React;
const DENSITY_KEY = 'waffer-analysis-density';

// ─────────── crunch the mock data into everything the UI needs ───────────
function useAnalysis() {
  return useMemoAI(() => {
    const cats = window.CATS_META;
    const budgets = window.CATEGORY_BUDGETS;
    const months = window.MONTHLY_SPEND.map(m => ({
      ...m,
      total: cats.reduce((s, c) => s + m[c.id], 0),
    }));

    const totalBudget = cats.reduce((s, c) => s + budgets[c.id], 0);
    const grandTotal = months.reduce((s, m) => s + m.total, 0);
    const avgMonthly = grandTotal / months.length;

    const maxMonth = months.reduce((a, b) => (b.total > a.total ? b : a));
    const minMonth = months.reduce((a, b) => (b.total < a.total ? b : a));
    const latestMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];
    const deltaVsPrevPct = Math.round(((latestMonth.total - prevMonth.total) / prevMonth.total) * 100);
    const avgDaily = latestMonth.total / 30;

    const catStats = cats.map(c => {
      const total = months.reduce((s, m) => s + m[c.id], 0);
      const avg = total / months.length;
      const budget = budgets[c.id];
      const overBy = avg - budget;
      const overPct = (overBy / budget) * 100;
      return { ...c, total, avg, budget, overBy, overPct, over: overBy > 0.5, latest: latestMonth[c.id] };
    }).sort((a, b) => b.total - a.total);

    const topCat = catStats[0];
    const overCats = catStats.filter(c => c.over).sort((a, b) => b.overPct - a.overPct);
    const overallOverPct = ((avgMonthly - totalBudget) / totalBudget) * 100;
    const inLine = overallOverPct <= 0.5;

    let score = Math.round(100 - Math.max(0, overallOverPct) * 3 - overCats.length * 4);
    score = Math.max(0, Math.min(100, score));
    let verdict, verdictColor;
    if (score >= 90) { verdict = 'ممتاز'; verdictColor = 'var(--green)'; }
    else if (score >= 75) { verdict = 'جيد'; verdictColor = 'var(--green)'; }
    else if (score >= 60) { verdict = 'متوسط'; verdictColor = 'var(--sadu-brown)'; }
    else { verdict = 'يحتاج تحسين'; verdictColor = 'var(--najdi-red)'; }

    const maxDeltaPct = Math.round(((maxMonth.total - avgMonthly) / avgMonthly) * 100);

    return {
      cats, budgets, months, totalBudget, grandTotal, avgMonthly,
      maxMonth, minMonth, maxDeltaPct, latestMonth, prevMonth, deltaVsPrevPct, avgDaily,
      catStats, topCat, overCats, overallOverPct, inLine, score, verdict, verdictColor,
    };
  }, []);
}

function aiSummaryText(a) {
  return `حلّلت إنفاقك آخر ١٢ شهر: إجمالي ${fmt(a.grandTotal)} ${SAR}، بمعدّل ${fmt(Math.round(a.avgMonthly))} شهرياً. أعلى شهر صرف كان ${a.maxMonth.month} بفارق ${toArabicDigits(Math.abs(a.maxDeltaPct))}٪ عن معدّلك، وأكبر باب صرف عندك هو ${a.topCat.label}.`;
}

// ─────────── merged + deduped alternatives list ───────────
function useAlternatives(a) {
  return useMemoAI(() => {
    const budgetAlts = window.SAVING_ALTS.map(alt => ({
      ...alt,
      type: alt.type || 'budget_match',
      matched: a.overCats.some(c => c.id === alt.cat),
    }));
    const nearbyAlts = window.MERCHANT_MAP_ALTS.map(m => ({
      id: m.id, cat: m.cat, type: m.type || 'nearby',
      from: m.match, to: m.alt, dist: m.dist, save: m.save, period: 'بالزيارة',
      matched: false,
    }));
    return [...budgetAlts, ...nearbyAlts].sort((x, y) => (y.matched ? 1 : 0) - (x.matched ? 1 : 0));
  }, [a]);
}

// ─────────── density switch — controls the whole page ───────────
function useDensity() {
  const [level, setLevelState] = useStateAI(() => {
    try { return localStorage.getItem(DENSITY_KEY) || 'lite'; } catch (e) { return 'lite'; }
  });
  const setLevel = (l) => {
    setLevelState(l);
    try { localStorage.setItem(DENSITY_KEY, l); } catch (e) { /* ignore */ }
  };
  return [level, setLevel];
}

function DensitySwitch({ level, setLevel }) {
  const opts = [{ id: 'lite', label: 'مبسّط' }, { id: 'standard', label: 'متوسط' }, { id: 'full', label: 'كامل' }];
  return (
    <div style={{ display: 'flex', gap: 4, background: 'rgba(27,52,36,0.06)', padding: 4, borderRadius: 12 }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => setLevel(o.id)} style={{
          flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
          background: level === o.id ? 'var(--green)' : 'transparent',
          color: level === o.id ? 'var(--cream)' : 'var(--ink-soft)',
          fontWeight: 600, fontSize: 12, borderRadius: 9,
          fontFamily: 'IBM Plex Sans Arabic, sans-serif', transition: 'all 0.18s ease',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ─────────── AI score orb (geometric — ring + sparkle, no faces) ───────────
function AIOrb({ score, color, size = 124 }) {
  return (
    <CircularProgress value={score} total={100} size={size} stroke={10} color={color} track="rgba(255,239,179,0.18)">
      <Icon.sparkle size={15} />
      <div className="num" style={{ fontSize: 28, fontWeight: 800, color: 'var(--cream)', lineHeight: 1, marginTop: 3 }}>
        {toArabicDigits(score)}
      </div>
      <div style={{ fontSize: 9.5, color: 'rgba(255,239,179,0.65)', marginTop: 1 }}>من ١٠٠</div>
    </CircularProgress>
  );
}

// ─────────── overview card — ring + total + avg-daily + delta ───────────
function OverviewCard({ a }) {
  const items = a.catStats.map(c => ({ value: c.latest, color: c.color }));
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 150, height: 150 }}>
          <Donut items={items} size={150} stroke={20} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>إجمالي {a.latestMonth.month}</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', lineHeight: 1.1 }}>{fmt(a.latestMonth.total)}</div>
            <div style={{ fontSize: 9, color: 'var(--ink-soft)', marginTop: 1 }}>{SAR}</div>
          </div>
        </div>
        <div style={{ flex: 1, fontSize: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: 'var(--ink-soft)', fontSize: 10 }}>المتوسط اليومي</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{fmt(Math.round(a.avgDaily))} {SAR}</div>
          </div>
          <div>
            <div style={{ color: 'var(--ink-soft)', fontSize: 10 }}>مقارنة بالشهر الماضي</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {a.deltaVsPrevPct > 0 ? <Icon.arrowUp size={14} /> : <Icon.arrowDown size={14} />}
              <span className="num" style={{ fontSize: 14, fontWeight: 700, color: a.deltaVsPrevPct > 0 ? 'var(--najdi-red)' : 'var(--green)' }}>
                {toArabicDigits(Math.abs(a.deltaVsPrevPct))}٪ {a.deltaVsPrevPct > 0 ? 'أعلى' : 'أقل'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── category distribution — stacked bar + legend ───────────
function CategoryDistribution({ a }) {
  const total = a.latestMonth.total;
  return (
    <div className="card" style={{ padding: 16 }}>
      <StackedBar items={a.catStats.map(c => ({ value: c.latest, color: c.color, label: c.label }))} height={18} />
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {a.catStats.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, background: c.color, borderRadius: 3, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</span>
            <span className="num" style={{ fontWeight: 700, color: 'var(--green)' }}>{toArabicDigits(Math.round(c.latest / total * 100))}٪</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────── ONE AI insight card — auto-adjust notice OR score verdict ───────────
function AIInsightCard({ a, adjActive, undone, onDismiss, onUndo }) {
  if (adjActive) {
    return (
      <div className="card" style={{ padding: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: 'var(--green)' }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: 'var(--green)', color: 'var(--cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon.sparkle size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green)' }}>عدّل وفّر خطتك تلقائيًا الآن</div>
            <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 4, lineHeight: 1.6 }}>
              لاحظنا إنك قريب من حدّ <strong>{a.overCats[0] ? a.overCats[0].label : 'مطاعم وكافيهات'}</strong> أسرع من المتوقع هالشهر — نقلنا <strong className="num">٥٠</strong> {SAR} من ميزانية <strong>أخرى</strong> (متوفّرة عندك) إليها، بدون ما تطلب.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={onDismiss} className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 11.5, borderRadius: 10 }}>تمام</button>
              <button onClick={onUndo} className="btn" style={{ padding: '7px 14px', fontSize: 11.5, background: 'rgba(27,52,36,0.06)', color: 'var(--ink)', borderRadius: 10 }}>تراجع</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="ai-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AIOrb score={a.score} color={a.verdictColor === 'var(--najdi-red)' ? '#E8847E' : (a.verdictColor === 'var(--sadu-brown)' ? '#D8A87A' : 'var(--cream)')} size={84} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,239,179,0.14)', padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
            <Icon.sparkle size={10} /> تقييم وفّر الذكي
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 7 }}>{a.verdict}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,239,179,0.75)', marginTop: 4, lineHeight: 1.5 }}>
            {a.inLine ? 'إنفاقك متوازن مقابل ميزانيتك — واصل!' : `فيه فرصة توفير لو ضبطت ${a.overCats.length > 1 ? 'شوي فئات' : 'فئة وحدة'} بس.`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── category budget bars (متوسط+) ───────────
function CategoryBudgetRow({ c }) {
  const IconC = Icon[c.icon];
  return (
    <div className="card" style={{ padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: 'rgba(27,52,36,0.06)', color: c.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><IconC size={18} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{c.label}</span>
            <span className="num" style={{ fontSize: 12, fontWeight: 700, color: c.over ? 'var(--najdi-red)' : 'var(--green)' }}>
              {fmt(Math.round(c.avg))} / {fmt(c.budget)} {SAR}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <LinearProgress value={c.avg} total={c.budget} height={7} color={c.over ? 'var(--najdi-red)' : 'var(--green)'} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <span className={`badge ${c.over ? 'badge-late' : 'badge-paid'}`}>
          {c.over
            ? <>تجاوزت بـ <span className="num">{fmt(Math.round(c.overBy))}</span> {SAR}/شهر</>
            : <><Icon.check size={10} /> داخل الميزانية</>}
        </span>
      </div>
    </div>
  );
}

// ─────────── savings-goal slider (متوسط+) ───────────
function GoalSlider({ goal, setGoal }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>هدف الادخار الشهري</span>
        <span className="num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>{fmt(goal)} {SAR}</span>
      </div>
      <input type="range" min="300" max="3500" step="50" value={goal} onChange={e => setGoal(+e.target.value)}
        style={{ width: '100%', marginTop: 10, accentColor: 'var(--green)' }} />
      <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 6 }}>حرّك السلايدر، ووفّر يعيد توزيع ميزانية فئاتك تلقائيًا عشان توصل لهذا الهدف.</div>
    </div>
  );
}

// ─────────── unified "بدائل أوفر لك" card — one shape, badge varies ───────────
function AltCard({ alt }) {
  const showBudgetBadge = alt.type === 'budget_match' && alt.matched;
  return (
    <div className="card" style={{ padding: 14, marginBottom: 10, position: 'relative', border: showBudgetBadge ? '1.5px solid rgba(27,52,36,0.25)' : undefined }}>
      {showBudgetBadge && (
        <div style={{
          position: 'absolute', top: -9, right: 14,
          background: 'var(--green)', color: 'var(--cream)',
          fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}><Icon.sparkle size={9} /> يطابق فئة فوق ميزانيتك</div>
      )}
      {alt.type === 'nearby' && alt.dist !== '—' && (
        <div style={{
          position: 'absolute', top: -9, right: 14,
          background: 'var(--sadu-brown)', color: 'var(--cream)',
          fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}><Icon.pin size={9} /> {alt.dist}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>الحالي</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{alt.from}</div>
          {alt.fromAmt != null && <div className="num" style={{ fontSize: 13, color: 'var(--najdi-red)', fontWeight: 700, marginTop: 4 }}>{fmt(alt.fromAmt)} {SAR}</div>}
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--vanilla)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sadu-brown)' }}>
          <Icon.arrowLeft size={14} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>البديل</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginTop: 2 }}>{alt.to}</div>
          {alt.toAmt != null && <div className="num" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>{fmt(alt.toAmt)} {SAR}</div>}
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed rgba(168,117,74,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>توفير متوقع {alt.period}</div>
        <div className="num" style={{ background: 'var(--green)', color: 'var(--cream)', padding: '4px 10px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>+{fmt(alt.save)} {SAR}</div>
      </div>
    </div>
  );
}

// ─────────── 12-month bar chart with click-to-drill-down (كامل) ───────────
function MonthlyChart({ months, avgMonthly, maxMonth, selectedId, onSelect }) {
  const maxTotal = Math.max(...months.map(m => m.total));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 118, padding: '0 2px' }}>
      {months.map(m => {
        const h = Math.max(6, (m.total / maxTotal) * 100);
        const isPeak = m.id === maxMonth.id;
        const isSel = m.id === selectedId;
        const color = isPeak ? 'var(--najdi-red)' : (m.total > avgMonthly ? 'var(--sadu-brown)' : 'var(--green)');
        return (
          <button key={m.id} onClick={() => onSelect(m.id)} style={{
            flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0,
          }}>
            <div style={{
              width: '100%', maxWidth: 22, height: 100, display: 'flex', alignItems: 'flex-end',
              borderRadius: 6, overflow: 'hidden', background: 'rgba(27,52,36,0.06)',
            }}>
              <div style={{
                width: '100%', height: `${h}%`, background: color, borderRadius: 6,
                outline: isSel ? '2px solid var(--green)' : 'none', outlineOffset: 1,
                transition: 'height 0.5s cubic-bezier(0.2,0.8,0.2,1), background 0.2s ease',
              }} />
            </div>
            <span style={{
              fontSize: 9, color: isSel ? 'var(--green)' : 'var(--ink-soft)',
              fontWeight: isSel ? 700 : 500,
            }}>{m.month.slice(0, 3)}</span>
          </button>
        );
      })}
    </div>
  );
}

function MonthDetail({ month, cats, avgMonthly }) {
  const deltaPct = Math.round(((month.total - avgMonthly) / avgMonthly) * 100);
  const items = cats.map(c => ({ value: month[c.id], color: c.color, label: c.label }));
  return (
    <div className="card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{month.month}</div>
        <div className="num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>
          {fmt(month.total)} <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{SAR}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: deltaPct > 0 ? 'var(--najdi-red)' : 'var(--green)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
        {deltaPct > 0 ? <Icon.arrowUp size={12} /> : <Icon.arrowDown size={12} />}
        <span className="num">{toArabicDigits(Math.abs(deltaPct))}٪</span> {deltaPct > 0 ? 'أعلى من معدّلك' : 'أقل من معدّلك'}
      </div>

      <div style={{ marginTop: 12 }}>
        <StackedBar items={items} height={14} />
      </div>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {cats.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</span>
            <span className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>{fmt(month[c.id])}</span>
          </div>
        ))}
      </div>

      {month.note && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 12,
          background: 'rgba(168,117,74,0.10)', display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span style={{ color: 'var(--sadu-brown)', flexShrink: 0, marginTop: 1 }}><Icon.sparkle size={13} /></span>
          <span style={{ fontSize: 11.5, color: 'var(--ink)', lineHeight: 1.5 }}>{month.note}</span>
        </div>
      )}
    </div>
  );
}

// ─────────── recent transactions feed (كامل) ───────────
function RecentTransactions() {
  const items = window.LIVE_FEED.slice(0, 4);
  const times = ['قبل دقيقتين', 'قبل ٥ دقايق', 'قبل ١٢ دقيقة', 'قبل ٣٠ دقيقة'];
  return (
    <div className="card" style={{ padding: 14 }}>
      {items.map((tx, i) => {
        const meta = window.CATS_META.find(c => c.id === tx.cat);
        const IconC = Icon[meta.icon];
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
            borderBottom: i < items.length - 1 ? '1px solid rgba(27,52,36,0.06)' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9, flexShrink: 0,
              background: 'rgba(27,52,36,0.06)', color: meta.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IconC size={13} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.merchant}</div>
              <div style={{ fontSize: 9.5, color: 'var(--ink-soft)', marginTop: 1 }}>{times[i]}</div>
            </div>
            <div className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>−{fmt(tx.amount)} <span style={{ fontSize: 9, color: 'var(--ink-soft)' }}>{SAR}</span></div>
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// MAIN SCREEN — one page, density-gated
// ═════════════════════════════════════════════════════════
function AnalysisScreen({ goto }) {
  const a = useAnalysis();
  const alternatives = useAlternatives(a);
  const [density, setDensity] = useDensity();
  const [adjVisible, setAdjVisible] = useStateAI(true);
  const [undone, setUndone] = useStateAI(false);
  const [goal, setGoal] = useStateAI(Math.max(300, Math.round(window.MONTHLY_INCOME - a.totalBudget)));
  const [selectedId, setSelectedId] = useStateAI(a.maxMonth.id);
  const selectedMonth = a.months.find(m => m.id === selectedId);

  const adjActive = adjVisible && !undone;

  return (
    <div className="screen-enter" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ padding: '18px 18px 8px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)', fontFamily: 'Rubik, sans-serif' }}>
          وين راحت فلوسك؟
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="live-now-dot" /> متصل ببنكك — يراقب صرفك أول بأول
        </div>
      </div>

      {/* Single density control — governs the whole page */}
      <div style={{ padding: '10px 16px 4px' }}>
        <DensitySwitch level={density} setLevel={setDensity} />
      </div>

      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 12-month chart — كامل only, shown at the top */}
        {density === 'full' && (
          <div>
            <SectionTitle hint="اضغط على شهر تشوف تفاصيله">صرفك آخر ١٢ شهر</SectionTitle>
            <div className="card" style={{ padding: 16 }}>
              <MonthlyChart months={a.months} avgMonthly={a.avgMonthly} maxMonth={a.maxMonth} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
            {selectedMonth && <MonthDetail month={selectedMonth} cats={a.cats} avgMonthly={a.avgMonthly} />}
          </div>
        )}

        {/* Overview — always visible */}
        <OverviewCard a={a} />

        {/* Category distribution — always visible */}
        <div>
          <SectionTitle hint="نسبة كل فئة من صرف هالشهر">توزيع الصرف</SectionTitle>
          <CategoryDistribution a={a} />
        </div>

        {/* ONE AI insight card — always visible */}
        <AIInsightCard a={a} adjActive={adjActive} undone={undone}
          onDismiss={() => setAdjVisible(false)} onUndo={() => setUndone(true)} />

        {density === 'lite' && (
          <button onClick={() => setDensity('standard')} className="btn" style={{
            width: '100%', background: 'rgba(27,52,36,0.06)', color: 'var(--green)',
            borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>شوف التفاصيل الكاملة <Icon.arrowLeft size={14} /></button>
        )}

        {/* ── متوسط + ── */}
        {density !== 'lite' && (
          <>
            <div>
              <SectionTitle hint="متوسط صرفك الشهري مقابل ميزانية كل فئة">ميزانيتك حسب الفئة</SectionTitle>
              {a.catStats.map(c => <CategoryBudgetRow key={c.id} c={c} />)}
            </div>

            <GoalSlider goal={goal} setGoal={setGoal} />

            <div>
              <SectionTitle hint="بدّل واستفد — وفّر يقترح لك" action={density === 'standard' ? 'عرض الكل' : undefined}>بدائل أوفر لك</SectionTitle>
              {(density === 'standard' ? alternatives.slice(0, 2) : alternatives).map(alt => <AltCard key={alt.id} alt={alt} />)}
              {density === 'standard' && (
                <button onClick={() => setDensity('full')} className="btn" style={{
                  width: '100%', background: 'rgba(27,52,36,0.06)', color: 'var(--green)',
                  borderRadius: 12, padding: '10px', fontSize: 12, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>عرض الكل ({toArabicDigits(alternatives.length)}) <Icon.arrowLeft size={13} /></button>
              )}
            </div>
          </>
        )}

        {/* ── كامل ── */}
        {density === 'full' && (
          <div>
            <SectionTitle hint="آخر حركاتك على البطاقة">حركات حديثة</SectionTitle>
            <RecentTransactions />
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  AnalysisScreen, useAnalysis, aiSummaryText,
  AIOrb, MonthlyChart, MonthDetail, CategoryBudgetRow, AltCard,
});
