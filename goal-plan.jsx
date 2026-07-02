// goal-plan.jsx — full multi-month AI-reasoned savings schedule for the
// user's featured goal. Reached by tapping the compact plan card on Home;
// not a bottom-nav tab. See server/lib/aiGoalSchedule.js for how the LLM
// decides varying month-to-month amounts from real seasonal spending
// patterns, instead of splitting the remaining balance evenly.

function GoalPlanScreen({ goto }) {
  const [schedule, setSchedule] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    window.loadGoalSchedule()
      .then(s => { if (alive) setSchedule(s); })
      .catch(() => { /* leave schedule null — error state renders below */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const maxAmount = schedule ? Math.max(...schedule.schedule.map(m => m.amount), 1) : 1;

  return (
    <div className="screen-enter" style={{ paddingBottom: 130 }}>
      {/* Header */}
      <div style={{ padding: '18px 18px 10px' }}>
        <button onClick={() => goto('home')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          color: 'var(--sadu-brown)', fontSize: 11, fontWeight: 600, marginBottom: 10,
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}><Icon.arrowRight size={13} /> رجوع</button>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--green)', fontFamily: 'Rubik, sans-serif' }}>
          خطتك الكاملة
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
          {schedule ? `للوصول لـ${schedule.goalTitle}` : 'يجهّز المساعد الذكي خطتك...'}
        </div>
      </div>

      <div style={{ padding: '4px 14px 0' }}>
        {loading && (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '6px 0' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: 'var(--sadu-brown)',
                  opacity: 0.6, animation: `planDot 1.1s ${i * 0.15}s infinite ease-in-out`,
                }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>
              المساعد الذكي يحلل نمط صرفك عبر الأشهر...
            </div>
            <style>{`@keyframes planDot { 0%,80%,100% { transform: scale(0.6); opacity: 0.3; } 40% { transform: scale(1); opacity: 0.95; } }`}</style>
          </div>
        )}

        {!loading && schedule && (
          <>
            {/* Summary card */}
            <div className="card-green" style={{ padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,239,179,0.7)' }}>إجمالي المطلوب</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <div className="num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--cream)' }}>{fmt(schedule.totalNeeded)}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,239,179,0.6)' }}>
                  {SAR} خلال <span className="num">{toArabicDigits(schedule.totalMonths)}</span> {schedule.totalMonths > 10 ? 'شهر' : 'أشهر'}
                </div>
              </div>
              {schedule.summary && (
                <div style={{ fontSize: 12.5, color: 'var(--cream)', lineHeight: 1.7, marginTop: 12, opacity: 0.92 }}>
                  {schedule.summary}
                </div>
              )}
            </div>

            {/* Month-by-month */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>شهر بشهر</div>
            {schedule.schedule.map((m, i) => (
              <div key={i} className="card" style={{ padding: 14, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{m.label}</div>
                  <div className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>
                    {fmt(m.amount)} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-soft)' }}>{SAR}</span>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <LinearProgress value={m.amount} total={maxAmount} height={5} color="var(--sadu-brown)" track="rgba(27,52,36,0.06)" />
                </div>
                {m.reason && (
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.6, marginTop: 8 }}>{m.reason}</div>
                )}
              </div>
            ))}
          </>
        )}

        {!loading && !schedule && (
          <div className="card" style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--ink-soft)' }}>
            تعذّر تجهيز الخطة الآن، حاول مرة ثانية لاحقاً.
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { GoalPlanScreen });
