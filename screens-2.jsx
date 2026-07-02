// screens-2.jsx — Goals, Jam'iya, Onboarding

// ═════════════════════════════════════════════════════════
// GOALS
// ═════════════════════════════════════════════════════════
function GoalsScreen({ goto, openSheet }) {
  const goals = window.GOALS.map(g => ({ ...g, IconComp: window.GOAL_ICONS[g.icon] || Icon.target }));
  const mainGoal = goals.find(g => g.tag) || goals[0];
  const restGoals = goals.filter(g => g.id !== mainGoal.id);

  return (
    <div className="screen-enter" style={{ paddingBottom: 130 }}>
      <div style={{ padding: '18px 18px 8px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500 }}>أهدافك المالية</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)', fontFamily: 'Rubik, sans-serif', marginTop: 2 }}>
          خطوة خطوة وتوصل
        </div>
      </div>

      {/* Hero goal — circular progress */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card-green" style={{ padding: 20 }}>
          {/* Sadu decorative strip */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 5,
            background: 'repeating-linear-gradient(90deg, var(--sadu-brown) 0 8px, var(--cream) 8px 12px, var(--najdi-red) 12px 18px, var(--cream) 18px 22px)',
            opacity: 0.6,
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
            <CircularProgress
              value={mainGoal.saved} total={mainGoal.target}
              size={130} stroke={11}
              color="var(--cream)" track="rgba(255,239,179,0.18)"
            >
              <div className="num" style={{ fontSize: 26, fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>
                {toArabicDigits(Math.round(mainGoal.saved/mainGoal.target*100))}٪
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,239,179,0.7)', marginTop: 2 }}>أنجزت</div>
            </CircularProgress>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,239,179,0.14)', color: 'var(--cream)', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600 }}>
                <Icon.target size={11} /> الهدف الرئيسي
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cream)', marginTop: 6, lineHeight: 1.3 }}>
                {mainGoal.title}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,239,179,0.7)' }}>المتبقّي للهدف</div>
              <div className="num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--cream)' }}>
                {fmt(mainGoal.target - mainGoal.saved)} <span style={{ fontSize: 12, color: 'rgba(255,239,179,0.6)' }}>{SAR}</span>
              </div>
            </div>
          </div>

          {/* Timeline / forecast */}
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'rgba(255,239,179,0.10)', borderRadius: 12,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,239,179,0.65)' }}>ادخار شهري</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>{fmt(mainGoal.monthly)} {SAR}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,239,179,0.14)' }} />
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,239,179,0.65)' }}>التاريخ المتوقّع</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>رمضان <span className="num">١٤٤٧</span></div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,239,179,0.14)' }} />
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,239,179,0.65)' }}>متبقّي</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>{toArabicDigits(mainGoal.months)} {mainGoal.months > 10 ? 'شهر' : 'أشهر'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionTitle hint="٥٠٠ ر.س × ٥٠ معلم">معالم الهدف</SectionTitle>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {Array.from({length: 10}).flatMap((_, i) => {
              const done = i < 6;
              const isLast = i === 5;
              return [
                <div key={`dot-${i}`} style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: done ? 'var(--green)' : 'transparent',
                  border: done ? 'none' : '2px dashed rgba(27,52,36,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--cream)', flexShrink: 0,
                  transform: isLast ? 'scale(1.25)' : 'none',
                  boxShadow: isLast ? '0 0 0 4px rgba(168,117,74,0.18)' : 'none',
                }}>
                  {done && <Icon.check size={10} />}
                </div>,
                i < 9 ? (
                  <div key={`conn-${i}`} style={{
                    flex: 1, height: 2,
                    background: i < 5 ? 'var(--green)' : 'rgba(27,52,36,0.10)',
                  }} />
                ) : null
              ].filter(Boolean);
            })}
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-soft)' }}>
            <span><span className="num">٦</span> من <span className="num">١٠</span> معالم</span>
            <span>المعلم القادم: <span className="num">١٧٥٠٠</span> {SAR}</span>
          </div>
        </div>
      </div>

      {/* All goals list */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionTitle action={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.plus size={12} /> هدف جديد</span>}>كل أهدافك</SectionTitle>
        {restGoals.map((g) => {
          const pct = Math.round(g.saved/g.target*100);
          return (
            <div key={g.id} className="card" style={{ padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 4,
                background: g.accent,
              }} />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingRight: 6 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: 'var(--vanilla)', color: g.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <g.IconComp size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{g.title}</div>
                    <div className="num" style={{ fontSize: 12, fontWeight: 700, color: g.accent }}>{toArabicDigits(pct)}٪</div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <LinearProgress value={g.saved} total={g.target} height={6} color={g.accent} />
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-soft)' }}>
                    <span className="num">{fmt(g.saved)} / {fmt(g.target)} {SAR}</span>
                    <span><span className="num">{toArabicDigits(g.months)}</span> {g.months > 10 ? 'شهر' : 'أشهر'} متبقية</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* New goal CTA */}
        <button onClick={() => openSheet('newGoal')} style={{
          width: '100%', marginTop: 4,
          background: 'transparent', color: 'var(--green)',
          border: '1.5px dashed rgba(27,52,36,0.30)',
          padding: '14px', borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer', fontWeight: 600, fontSize: 13,
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}>
          <Icon.plus size={16} /> أضف هدف جديد
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// JAM'IYA — Group savings
// ═════════════════════════════════════════════════════════
function JamiyaScreen({ goto, openSheet }) {
  const jamiya = window.JAMIYA;
  const members = jamiya.members;
  const myTurn = members.find(m => m.isMe);
  const perMember = Math.round(jamiya.monthlyAmount / jamiya.memberCount);

  return (
    <div className="screen-enter" style={{ paddingBottom: 130 }}>
      <div style={{ padding: '18px 18px 8px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500 }}>الجمعية الرقمية</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)', fontFamily: 'Rubik, sans-serif', marginTop: 2 }}>
          {jamiya.name}
        </div>
      </div>

      {/* Pot card */}
      <div style={{ padding: '4px 16px 0' }}>
        <div className="card-green" style={{ padding: 20 }}>
          {/* Camel-row stand-in: triangular Sadu pattern at top */}
          <div style={{ marginInline: -20, marginTop: -20, marginBottom: 16, height: 18 }}>
            <SaduStrip variant="kilim" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,239,179,0.65)' }}>إجمالي المبلغ الشهري</div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div className="num" style={{ fontSize: 38, fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>{fmt(jamiya.monthlyAmount)}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,239,179,0.6)' }}>{SAR}</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,239,179,0.7)' }}>
                <span className="num">{toArabicDigits(perMember)}</span> {SAR} × <span className="num">{toArabicDigits(jamiya.memberCount)}</span> أعضاء
              </div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,239,179,0.14)',
              color: 'var(--cream)', padding: '6px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 600,
            }}>
              <Icon.shield size={13} /> آمنة وشفّافة
            </div>
          </div>

          {/* Rotation indicator */}
          <div style={{ marginTop: 18, padding: 12, background: 'rgba(255,239,179,0.10)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,239,179,0.7)' }}>
              <span>الدورة الحالية</span>
              <span><span className="num">{toArabicDigits(jamiya.currentRound)}</span> من <span className="num">{toArabicDigits(jamiya.memberCount)}</span></span>
            </div>
            <div style={{ marginTop: 8 }}>
              <LinearProgress value={jamiya.currentRound} total={jamiya.memberCount} height={6} color="var(--cream)" track="rgba(255,239,179,0.14)" />
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,239,179,0.65)' }}>دورك</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)' }}>
                <span className="num">{myTurn.month}</span> <span style={{ color: 'rgba(255,239,179,0.5)' }}>(الترتيب {toArabicDigits(myTurn.order)})</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={() => openSheet('pay')} className="btn btn-cream" style={{ flex: 1, fontSize: 13, padding: '12px' }}>
              ادفع دفعتك ({toArabicDigits(perMember)} {SAR})
            </button>
            <button style={{
              padding: 12, background: 'rgba(255,239,179,0.14)',
              border: 'none', borderRadius: 12, color: 'var(--cream)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Why safe */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="card-cream" style={{ padding: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--sadu-brown)', color: 'var(--cream)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.shield size={16} />
            </div>
            <div style={{ flex: 1, fontSize: 11, color: 'var(--ink)', lineHeight: 1.5 }}>
              المبالغ في حساب وسيط مرخّص — لا يطلع لأحد إلا بدورة الاستلام. تذكيرات تلقائية لكل عضو.
            </div>
          </div>
        </div>
      </div>

      {/* Members list */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionTitle hint="حسب ترتيب الاستلام" action={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.plus size={12} /> دعوة</span>}>
          الأعضاء ({toArabicDigits(jamiya.memberCount)})
        </SectionTitle>

        <div className="card" style={{ padding: '4px 0', overflow: 'hidden' }}>
          {members.map((m, i) => {
            const isNext = m.order === jamiya.currentRound + 1;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderBottom: i < members.length - 1 ? '1px solid rgba(27,52,36,0.06)' : 'none',
                background: m.isMe ? 'rgba(255,239,179,0.35)' : 'transparent',
              }}>
                {/* Order chip */}
                <div className="num" style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: m.status === 'paid' ? 'var(--green)' : (m.status === 'late' ? 'var(--najdi-red)' : 'rgba(168,117,74,0.20)'),
                  color: m.status === 'pending' ? 'var(--sadu-brown)' : 'var(--cream)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{toArabicDigits(m.order)}</div>

                <Avatar name={m.name} tone={m.tone} size={36} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    {m.full}
                    {isNext && <span style={{ marginInlineStart: 6, background: 'var(--green)', color: 'var(--cream)', padding: '1px 6px', borderRadius: 6, fontSize: 9, fontWeight: 700 }}>التالي</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>
                    يستلم في {m.month}
                  </div>
                </div>

                <span className={`badge badge-${m.status}`}>
                  {m.status === 'paid' && <><Icon.check size={10} /> دفع</>}
                  {m.status === 'pending' && <>قيد الانتظار</>}
                  {m.status === 'late' && <>متأخر</>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// ONBOARDING — Connect account
// ═════════════════════════════════════════════════════════
function OnboardingScreen({ goto }) {
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleConnect = (m) => {
    setMethod(m);
    setStep(1);
    if (m === 'pdf') {
      setUploading(true);
      setTimeout(() => setUploading(false), 2200);
    }
  };

  return (
    <div className="screen-enter bg-heritage" style={{ minHeight: '100%', padding: '40px 18px 130px' }}>
      {step === 0 && (
        <div className="fade-in">
          {/* Wordmark hero */}
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <Wordmark size={64} />
            <div style={{ marginTop: 14, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              توفيرك يبدأ من ربط حسابك
            </div>
          </div>

          {/* decorative diamonds */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <i style={{ width: 6, height: 6, background: 'var(--sadu-brown)', transform: 'rotate(45deg)' }} />
            <i style={{ width: 10, height: 10, background: 'var(--najdi-red)', transform: 'rotate(45deg)' }} />
            <i style={{ width: 6, height: 6, background: 'var(--sadu-brown)', transform: 'rotate(45deg)' }} />
          </div>

          <div style={{ marginTop: 32, fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.05em' }}>
            اختر طريقة الربط
          </div>

          {/* Bank connect option */}
          <div onClick={() => handleConnect('bank')} className="card" style={{
            marginTop: 14, padding: 18, cursor: 'pointer',
            border: '1.5px solid var(--green)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--green)', color: 'var(--cream)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.bank size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  اربط بنكك تلقائياً
                  <span style={{ background: 'var(--green)', color: 'var(--cream)', padding: '1px 6px', borderRadius: 5, fontSize: 9, fontWeight: 700 }}>موصى به</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.5 }}>
                  عبر الخدمات المصرفية المفتوحة — تحليل لحظي
                </div>
              </div>
              <Icon.chevron size={16} />
            </div>
            {/* bank logo placeholders */}
            <div style={{
              marginTop: 14, paddingTop: 12,
              borderTop: '1px dashed rgba(168,117,74,0.25)',
              display: 'flex', gap: 6, flexWrap: 'wrap',
            }}>
              {['بنك أ'].map((b, i) => (
                <div key={i} style={{
                  padding: '4px 10px', borderRadius: 8,
                  background: 'var(--vanilla)', color: 'var(--green)',
                  fontSize: 10, fontWeight: 600,
                }}>{b}</div>
              ))}
            </div>
          </div>

          {/* PDF upload option */}
          <div onClick={() => handleConnect('pdf')} style={{
            marginTop: 12, padding: 18, cursor: 'pointer',
            background: 'rgba(255,255,255,0.5)',
            border: '1.5px dashed rgba(168,117,74,0.5)',
            borderRadius: 18,
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--vanilla)', color: 'var(--sadu-brown)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.upload size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>ارفع كشف حساب PDF</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.5 }}>
                  جرّب ريالك بدون ربط — يكفي كشف آخر ٣ أشهر
                </div>
              </div>
              <Icon.chevron size={16} />
            </div>
          </div>

          {/* Privacy note */}
          <div style={{
            marginTop: 20, padding: '12px 14px',
            background: 'rgba(27,52,36,0.06)',
            borderRadius: 12,
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <div style={{ color: 'var(--green)', flexShrink: 0 }}><Icon.shield size={18} /></div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              بياناتك مشفّرة ومحمية وفق أعلى معايير الأمان المصرفي. لن نشاركها مع أي طرف ثالث.
            </div>
          </div>

          {/* Skip */}
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <button onClick={() => goto('home')} style={{
              background: 'none', border: 'none', color: 'var(--sadu-brown)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              تخطّى الآن واستعرض التطبيق
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="fade-in" style={{ marginTop: 60 }}>
          <div style={{ textAlign: 'center' }}>
            {uploading ? (
              <>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'var(--green)', color: 'var(--cream)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  animation: 'fadeIn 0.4s ease',
                }}>
                  <Icon.doc size={36} />
                  <div style={{
                    position: 'absolute', inset: -8, borderRadius: '50%',
                    border: '3px solid var(--sadu-brown)',
                    borderTopColor: 'transparent', borderRightColor: 'transparent',
                    animation: 'spin 1.2s linear infinite',
                  }} />
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
                <div style={{ marginTop: 20, fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>
                  نحلّل كشفك...
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-soft)' }}>
                  نقرأ المعاملات ونصنّفها — ثوانٍ معدودة.
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'var(--green)', color: 'var(--cream)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'fadeIn 0.4s ease',
                }}>
                  <Icon.check size={42} w={3} />
                </div>
                <div style={{ marginTop: 20, fontSize: 22, fontWeight: 800, color: 'var(--green)', fontFamily: 'Rubik, sans-serif' }}>
                  جاهز! تم التحليل
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                  {method === 'pdf' ? 'كشفك تحلّل بنجاح.' : 'حسابك مربوط بنجاح.'}<br/>
                  اكتشفنا فرص توفير بقيمة <span className="num" style={{ color: 'var(--najdi-red)', fontWeight: 700 }}>١٣٧٠</span> {SAR} شهرياً!
                </div>
                <button onClick={() => goto('home')} className="btn btn-primary" style={{ marginTop: 24, width: '100%' }}>
                  ابدأ التوفير
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { GoalsScreen, JamiyaScreen, OnboardingScreen });
