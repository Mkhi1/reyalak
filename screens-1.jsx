// screens-1.jsx — Dashboard, Spending Analysis screens

const SAR = "ر.س";

// ═════════════════════════════════════════════════════════
// HOME / DASHBOARD
// ═════════════════════════════════════════════════════════
function HomeScreen({ goto, openSheet }) {
  const savingsAccount = window.ACCOUNTS.find(a => a.kind === 'savings') || window.ACCOUNTS[0];
  const totalSaved = savingsAccount.balance;
  const mainGoal = window.GOALS.find(g => g.tag) || window.GOALS[0];
  const income = window.USER.monthlyIncome;
  const latestMonth = window.MONTHLY_SPEND[window.MONTHLY_SPEND.length - 1];
  const spent = window.CATS_META.reduce((s, c) => s + latestMonth[c.id], 0);
  const savingsRate = Math.round(((income - spent) / income) * 100);

  const topCats = window.CATS_META
    .map(c => ({ ...c, amount: latestMonth[c.id] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map(c => ({ ...c, pct: Math.round((c.amount / spent) * 100), IconComp: Icon[c.icon] }));
  const rowColors = ['var(--green)', 'var(--sadu-brown)', 'var(--moss)'];

  const MainGoalIcon = window.GOAL_ICONS[mainGoal.icon] || Icon.target;

  // AI-reasoned savings plan — fetched after the page renders so it never
  // blocks Home's initial paint (the LLM call takes 1-3s).
  const [plan, setPlan] = React.useState(null);
  const [planLoading, setPlanLoading] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    window.loadGoalPlan()
      .then(p => { if (alive) setPlan(p); })
      .catch(() => { /* leave plan null — hero stat shows a dash, card stays hidden */ })
      .finally(() => { if (alive) setPlanLoading(false); });
    return () => { alive = false; };
  }, []);

  const heroStats = [
    { label: 'الدخل', value: fmt(income), tone: 'rgba(255,239,179,0.78)' },
    { label: 'الصرف', value: fmt(spent), tone: 'rgba(255,239,179,0.78)' },
    { label: 'نسبة الادخار', value: `${toArabicDigits(savingsRate)}٪`, tone: 'var(--cream)' },
    { label: 'لهدفك هالشهر', value: plan ? fmt(plan.requiredMonthly) : (planLoading ? '⋯' : '—'), tone: 'var(--cream)' },
  ];

  return (
    <div className="screen-enter" style={{ paddingBottom: 130 }}>
      <TopHeader name="فيصل" onNotif={() => openSheet('notif')} />

      {/* Hero: dark green savings card */}
      <div style={{ padding: '0 14px' }}>
        <div className="card-green" style={{ padding: '22px 22px 18px' }}>
          {/* Faint kilim pattern in top-right corner */}
          <div style={{
            position: 'absolute', top: 14, left: 14, opacity: 0.18,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, background: 'var(--cream)', transform: 'rotate(45deg)' }} />)}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, background: 'var(--cream)', transform: 'rotate(45deg)' }} />)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,239,179,0.7)', fontWeight: 500 }}>إجمالي المدخرات</div>
            <span className="badge badge-cream-on-green">
              <Icon.arrowUp size={10} /> {toArabicDigits(12)}٪ هذا الشهر
            </span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div className="num" style={{ fontSize: 44, fontWeight: 700, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {fmt(totalSaved)}
            </div>
            <div style={{ fontSize: 16, color: 'rgba(255,239,179,0.6)', fontWeight: 500 }}>{SAR}</div>
          </div>

          {/* sub stats */}
          <div style={{
            marginTop: 18, display: 'grid',
            gridTemplateColumns: heroStats.map(() => '1fr').join(' 1px '), gap: 0,
            borderTop: '1px solid rgba(255,239,179,0.14)', paddingTop: 14,
          }}>
            {heroStats.flatMap((s, i, arr) => [
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="num" style={{ fontSize: heroStats.length > 3 ? 14 : 16, fontWeight: 700, color: s.tone }}>{s.value}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,239,179,0.55)', marginTop: 2 }}>{s.label}</div>
              </div>,
              i < arr.length - 1 ? <div key={`d${i}`} style={{ background: 'rgba(255,239,179,0.14)' }} /> : null
            ]).filter(Boolean)}
          </div>

          {/* Sadu strip at the bottom of hero */}
          <div style={{ marginTop: 18, marginInline: -22, marginBottom: -18, opacity: 0.85 }}>
            <SaduStrip variant="kilim" style={{ display: 'block' }} />
          </div>
        </div>
      </div>

      {/* Goal progress (next milestone) */}
      <div style={{ padding: '18px 14px 0' }}>
        <SectionTitle action="عرض الكل" hint={`${toArabicDigits(window.GOALS.length)} أهداف نشطة`}>هدفك الحالي</SectionTitle>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => goto('goals')}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--vanilla)', color: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MainGoalIcon size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{mainGoal.title}</div>
                <div className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--sadu-brown)' }}>
                  {toArabicDigits(Math.round((mainGoal.saved/mainGoal.target)*100))}٪
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <LinearProgress value={mainGoal.saved} total={mainGoal.target} height={7} color="var(--green)" />
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)' }}>
                <span className="num">{fmt(mainGoal.saved)} / {fmt(mainGoal.target)} {SAR}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon.clock size={11} /> <span className="num">{toArabicDigits(mainGoal.months)} {mainGoal.months > 10 ? 'شهر' : 'أشهر'} متبقية</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings plan teaser — the AI reasons over real month-by-month
          spending (see server/lib/aiGoalPlan.js + aiGoalSchedule.js), not a
          fixed formula. Compact here; full month-by-month breakdown lives
          on the dedicated plan page (tap through). */}
      <div style={{ padding: '14px 14px 0' }}>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => goto('goal-plan')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 11, flexShrink: 0,
              background: 'var(--vanilla)', color: 'var(--sadu-brown)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon.sparkle size={16} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>خطتك للوصول لهدفك</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.5 }}>
                {planLoading
                  ? 'المساعد الذكي يحلل صرفك...'
                  : plan
                    ? (plan.summary || `وفّر ${fmt(plan.requiredMonthly)} ${SAR} هالشهر وبتوصل لهدفك`)
                    : 'اضغط عشان تشوف خطتك الكاملة'}
              </div>
            </div>
            <Icon.arrowLeft size={16} style={{ color: 'var(--sadu-brown)', flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* AI suggestion */}
      <div style={{ padding: '16px 14px 0' }}>
        <div className="ai-card" style={{ padding: 16 }}>
          {/* sparkle dots */}
          <div style={{ position: 'absolute', top: 12, left: 12, opacity: 0.5, color: 'var(--cream)' }}>
            <Icon.sparkle size={14} />
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 30, opacity: 0.3, color: 'var(--cream)' }}>
            <Icon.sparkle size={10} />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'rgba(255,239,179,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cream)', flexShrink: 0,
            }}>
              <Icon.sparkle size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,239,179,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                اقتراح ريالك الذكي
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', marginTop: 4, lineHeight: 1.5 }}>
                لو خفّضت طلبات المطاعم من <span className="num">١٢</span> إلى <span className="num">٦</span> مرات بالشهر، توفّر تقريباً <span className="num">٤٨٠</span> {SAR}.
              </div>
              <button onClick={() => goto('analysis')} style={{
                marginTop: 10, background: 'var(--cream)', color: 'var(--green)',
                border: 'none', padding: '8px 14px', borderRadius: 10,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              }}>
                خلّيني أشوف التفاصيل
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top spending categories */}
      <div style={{ padding: '20px 14px 0' }}>
        <SectionTitle action="التفاصيل" hint="آخر شهر">أكبر أبواب الصرف</SectionTitle>
        <div className="card" style={{ padding: 16 }}>
          {topCats.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: i < topCats.length - 1 ? '1px dashed rgba(168,117,74,0.18)' : 'none',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'var(--vanilla-soft)', color: rowColors[i],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <c.IconComp size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{c.label}</div>
                <div style={{ marginTop: 4 }}>
                  <LinearProgress value={c.pct} total={50} height={4} color={rowColors[i]} track="rgba(27,52,36,0.06)" />
                </div>
              </div>
              <div style={{ textAlign: 'left', minWidth: 70 }}>
                <div className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{fmt(c.amount)}</div>
                <div className="num" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{toArabicDigits(c.pct)}٪</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Savings over time chart */}
      <div style={{ padding: '20px 14px 0' }}>
        <SectionTitle hint="آخر ٦ أشهر">مدخراتك تكبر</SectionTitle>
        <div className="card" style={{ padding: '18px 14px' }}>
          <LineChart data={[2400, 3800, 5100, 8200, 11500, totalSaved]} width={320} height={110} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--ink-soft)' }}>
            {window.MONTHLY_SPEND.slice(-6).map(m => <span key={m.id}>{m.month}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, SAR });
