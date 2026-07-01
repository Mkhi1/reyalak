// screens-1.jsx — Dashboard, Spending Analysis screens

const SAR = "ر.س";

// ═════════════════════════════════════════════════════════
// HOME / DASHBOARD
// ═════════════════════════════════════════════════════════
function HomeScreen({ goto, openSheet }) {
  const totalSaved = 14750;
  const target = 25000;
  const savingsRate = 28;
  const income = 8500;
  const spent = 6120;

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
            marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 0,
            borderTop: '1px solid rgba(255,239,179,0.14)', paddingTop: 14,
          }}>
            {[
              { label: 'الدخل', value: fmt(income), tone: 'rgba(255,239,179,0.78)' },
              { label: 'الصرف', value: fmt(spent), tone: 'rgba(255,239,179,0.78)' },
              { label: 'نسبة الادخار', value: `${toArabicDigits(savingsRate)}٪`, tone: 'var(--cream)' },
            ].flatMap((s, i, arr) => [
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="num" style={{ fontSize: 16, fontWeight: 700, color: s.tone }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,239,179,0.55)', marginTop: 2 }}>{s.label}</div>
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
        <SectionTitle action="عرض الكل" hint={`${toArabicDigits(3)} أهداف نشطة`}>هدفك الحالي</SectionTitle>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => goto('goals')}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--vanilla)', color: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon.hajj size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>رحلة العمرة ١٤٤٧</div>
                <div className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--sadu-brown)' }}>
                  {toArabicDigits(Math.round((totalSaved/target)*100))}٪
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <LinearProgress value={totalSaved} total={target} height={7} color="var(--green)" />
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)' }}>
                <span className="num">{fmt(totalSaved)} / {fmt(target)} {SAR}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon.clock size={11} /> <span className="num">٤ أشهر متبقية</span>
                </span>
              </div>
            </div>
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
                اقتراح وفّر الذكي
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
        <SectionTitle action="التفاصيل" hint="آخر ٣٠ يوم">أكبر أبواب الصرف</SectionTitle>
        <div className="card" style={{ padding: 16 }}>
          {[
            { id:'food', label: 'مطاعم وكافيهات', amount: 1840, pct: 30, color: 'var(--green)', icon: Icon.cafe },
            { id:'car', label: 'بنزين ومواصلات', amount: 980, pct: 16, color: 'var(--sadu-brown)', icon: Icon.car2 },
            { id:'shop', label: 'تسوّق', amount: 760, pct: 12, color: 'var(--moss)', icon: Icon.bag },
          ].map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: i < 2 ? '1px dashed rgba(168,117,74,0.18)' : 'none',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'var(--vanilla-soft)', color: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <c.icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{c.label}</div>
                <div style={{ marginTop: 4 }}>
                  <LinearProgress value={c.pct} total={50} height={4} color={c.color} track="rgba(27,52,36,0.06)" />
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

      {/* Group jam'iya teaser */}
      <div style={{ padding: '18px 14px 0' }}>
        <div className="card-cream" style={{ padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => goto('jamiya')}>
          {/* Sadu side strip */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 6,
            background: 'repeating-linear-gradient(180deg, var(--najdi-red) 0 6px, var(--sadu-brown) 6px 12px, transparent 12px 18px)',
            opacity: 0.7,
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 8 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'var(--green)', color: 'var(--cream)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.users size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>جمعية الشلّة 🌴</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                دورك الشهر <span className="num">القادم</span> · <span className="num">٨</span> أعضاء
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)' }}>{fmt(8000)}</div>
              <div style={{ fontSize: 9, color: 'var(--ink-soft)' }}>{SAR} / شهر</div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings over time chart */}
      <div style={{ padding: '20px 14px 0' }}>
        <SectionTitle hint="آخر ٦ أشهر">مدخراتك تكبر</SectionTitle>
        <div className="card" style={{ padding: '18px 14px' }}>
          <LineChart data={[2400, 3800, 5100, 8200, 11500, 14750]} width={320} height={110} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--ink-soft)' }}>
            {['يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, SAR });
