// app.jsx — main app shell, screen orchestrator

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "sadu",
  "showHeritagePattern": true,
  "startScreen": "home"
}/*EDITMODE-END*/;

function App() {
  const [screen, setScreen] = useState('analysis');
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const goto = (s) => {
    setScreen(s);
  };

  const openSheet = (kind) => setSheet(kind);
  const closeSheet = () => setSheet(null);

  // ─── Tweaks bridge ───
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 30%, #2d3a2f 0%, #1a1f1b 70%)',
      padding: '40px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 30,
    }}>
      {/* Top branding tag for the canvas */}
      <div style={{ textAlign: 'center', color: 'var(--cream)', fontFamily: 'Rubik, sans-serif' }}>
        <div className="wordmark" style={{ fontSize: 36, color: 'var(--cream)' }}>
          وفّر
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: 'var(--najdi-red)', marginInlineStart: 4, transform: 'translateY(-6px)',
          }} />
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,239,179,0.6)', marginTop: 4, fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
          مدّخر ذكي سعودي · هاكاثون prototype
        </div>
        {/* tabs to jump between screens */}
        <div style={{
          marginTop: 18, display: 'inline-flex', gap: 6,
          background: 'rgba(255,239,179,0.08)', padding: 5, borderRadius: 12,
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}>
          {[
            { id: 'onboarding', label: 'الربط' },
            { id: 'home', label: 'الرئيسية' },
            { id: 'analysis', label: 'التحليل' },
            { id: 'ai-chat', label: 'المساعد 💬' },
            { id: 'map', label: 'الخريطة' },
            { id: 'goals', label: 'الأهداف' },
          ].map(t => (
            <button key={t.id} onClick={() => goto(t.id)} style={{
              background: screen === t.id ? 'var(--cream)' : 'transparent',
              color: screen === t.id ? 'var(--green)' : 'rgba(255,239,179,0.65)',
              border: 'none', borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer',
              fontWeight: 600, fontSize: 11,
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              transition: 'all 0.2s ease',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Device */}
      <IOSDevice width={402} height={874} dark={false} title={undefined}>
        <div className="waffer-app" style={{
          height: '100%', position: 'relative', overflow: 'hidden',
        }}>
          {/* Status bar spacer (status bar lives in frame) */}
          <div style={{ height: 54 }} />

          {/* Scrollable content */}
          <div className="no-scrollbar" style={{
            height: 'calc(100% - 54px)', overflowY: 'auto', overflowX: 'hidden',
            position: 'relative',
          }}>
            {screen === 'home' && <HomeScreen goto={goto} openSheet={openSheet} />}
            {screen === 'analysis' && <AnalysisScreen goto={goto} />}
            {screen === 'map' && <MapScreen goto={goto} openSheet={openSheet} />}
            {screen === 'goals' && <GoalsScreen goto={goto} openSheet={openSheet} />}
            {screen === 'ai-chat' && <AIChatScreen goto={goto} />}
            {screen === 'jamiya' && <JamiyaScreen goto={goto} openSheet={openSheet} />}
            {screen === 'onboarding' && <OnboardingScreen goto={goto} />}
          </div>

          {/* Bottom nav (not on onboarding) */}
          {screen !== 'onboarding' && (
            <BottomNav active={screen} onChange={goto} />
          )}

          {/* Toast */}
          {toast && (
            <div className="toast">
              <Icon.check size={14} /> {toast}
            </div>
          )}

          {/* Sheets */}
          {sheet && <SheetHost kind={sheet} close={closeSheet} showToast={showToast} />}
        </div>
      </IOSDevice>

      {/* Hint below device */}
      <div style={{ color: 'rgba(255,239,179,0.55)', fontSize: 12, fontFamily: 'IBM Plex Sans Arabic, sans-serif', textAlign: 'center', maxWidth: 380, lineHeight: 1.6 }}>
        ↑ تنقّل بين الشاشات من شريط التبويب فوق، أو من شريط التنقّل أسفل الجهاز.
        البيانات تجريبية للهاكاثون.
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// Bottom-sheets (modals)
// ═════════════════════════════════════════════════════════
function SheetHost({ kind, close, showToast }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={close} />
      <div className="sheet">
        <div className="sheet-handle" />
        {kind === 'notif' && <NotifSheet />}
        {kind === 'pay' && <PaySheet close={close} showToast={showToast} />}
        {kind === 'newGoal' && <NewGoalSheet close={close} showToast={showToast} />}
      </div>
    </>
  );
}

function NotifSheet() {
  const items = [
    { icon: Icon.sparkle, color: 'var(--green)', title: 'اقتراح ذكي جديد', body: 'وفّرنا لك ٢١٠ ر.س على اشتراك ستريمنق.', time: 'قبل ساعة' },
    { icon: Icon.users, color: 'var(--sadu-brown)', title: 'جمعية الشلّة', body: 'محمد دفع دفعة نوفمبر — تبقّى تركي.', time: 'قبل ٣ ساعات' },
    { icon: Icon.target, color: 'var(--green)', title: 'هدف العمرة', body: 'وصلت ٥٩٪ — ٤ أشهر للوصول!', time: 'اليوم' },
    { icon: Icon.bolt, color: 'var(--najdi-red)', title: 'تنبيه صرف', body: 'تجاوزت ميزانية المطاعم بـ ٢٢٠ ر.س.', time: 'أمس' },
  ];
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', marginBottom: 14, fontFamily: 'Rubik, sans-serif' }}>الإشعارات</div>
      {items.map((n, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, padding: '12px 0',
          borderBottom: i < items.length - 1 ? '1px solid rgba(27,52,36,0.08)' : 'none',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(27,52,36,0.06)', color: n.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <n.icon size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{n.title}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.5 }}>{n.body}</div>
            <div style={{ fontSize: 10, color: 'var(--sadu-brown)', marginTop: 4 }}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PaySheet({ close, showToast }) {
  const [confirming, setConfirming] = useState(false);
  const handlePay = () => {
    setConfirming(true);
    setTimeout(() => {
      close();
      showToast('تم الدفع بنجاح — جمعية الشلّة');
    }, 900);
  };
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', marginBottom: 6, fontFamily: 'Rubik, sans-serif' }}>دفع دفعة الجمعية</div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>جمعية الشلّة 🌴 · دورة ديسمبر <span className="num">٢٠٢٦</span></div>

      <div className="card-green" style={{ marginTop: 16, padding: 18, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,239,179,0.65)' }}>المبلغ</div>
        <div className="num" style={{ fontSize: 40, fontWeight: 800, color: 'var(--cream)', lineHeight: 1.1 }}>
          {fmt(1000)} <span style={{ fontSize: 14, color: 'rgba(255,239,179,0.5)' }}>{SAR}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,239,179,0.7)' }}>سيتم خصمه من <strong>الراجحي ××٤٤٢١</strong></div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <button onClick={close} className="btn btn-outline" style={{ flex: 1 }}>إلغاء</button>
        <button onClick={handlePay} className="btn btn-primary" style={{ flex: 2 }}>
          {confirming ? 'جارٍ التأكيد...' : 'تأكيد الدفع'}
        </button>
      </div>
    </div>
  );
}

function NewGoalSheet({ close, showToast }) {
  const [amount, setAmount] = useState(15000);
  const [monthly, setMonthly] = useState(1000);
  const [title, setTitle] = useState('');
  const months = Math.ceil(amount / monthly);
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', marginBottom: 6, fontFamily: 'Rubik, sans-serif' }}>هدف جديد</div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>حدّد اسم الهدف، المبلغ، وكم تقدر تدّخر شهرياً.</div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>اسم الهدف</div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: رحلة طوكيو ٢٠٢٧" style={{
          width: '100%', padding: '12px 14px', borderRadius: 12,
          border: '1.5px solid rgba(27,52,36,0.15)', background: '#fff',
          fontSize: 13, fontFamily: 'IBM Plex Sans Arabic, sans-serif', direction: 'rtl',
          outline: 'none', color: 'var(--ink)',
        }} />
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>المبلغ المستهدف</div>
          <div style={{ position: 'relative' }}>
            <input value={fmt(amount)} onChange={e => setAmount(+e.target.value.replace(/[^\d]/g, '') || 0)} style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: '1.5px solid rgba(27,52,36,0.15)', background: '#fff',
              fontSize: 13, fontFamily: 'Rubik, sans-serif', fontWeight: 700,
              direction: 'rtl', textAlign: 'center', outline: 'none', color: 'var(--green)',
            }} />
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-soft)' }}>{SAR}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>شهرياً</div>
          <div style={{ position: 'relative' }}>
            <input value={fmt(monthly)} onChange={e => setMonthly(+e.target.value.replace(/[^\d]/g, '') || 1)} style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: '1.5px solid rgba(27,52,36,0.15)', background: '#fff',
              fontSize: 13, fontFamily: 'Rubik, sans-serif', fontWeight: 700,
              direction: 'rtl', textAlign: 'center', outline: 'none', color: 'var(--green)',
            }} />
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-soft)' }}>{SAR}</span>
          </div>
        </div>
      </div>

      {/* slider for monthly */}
      <div style={{ marginTop: 14 }}>
        <input type="range" min="100" max="3000" step="50" value={monthly} onChange={e => setMonthly(+e.target.value)}
          style={{ width: '100%', accentColor: 'var(--green)' }} />
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-soft)' }}>
          ستوصل لهدفك خلال <span className="num" style={{ color: 'var(--green)', fontWeight: 700 }}>{toArabicDigits(months)}</span> {months > 10 ? 'شهر' : 'أشهر'}.
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={close} className="btn btn-outline" style={{ flex: 1 }}>إلغاء</button>
        <button onClick={() => { close(); showToast('تم إنشاء الهدف!'); }} className="btn btn-primary" style={{ flex: 2 }}>إنشاء الهدف</button>
      </div>
    </div>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
