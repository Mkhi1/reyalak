// screens-3.jsx — Map page: nearby stores + cheaper alternatives

// ═════════════════════════════════════════════════════════
// MAP SCREEN
// ═════════════════════════════════════════════════════════
function MapScreen({ goto, openSheet }) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const categories = [
    { id: 'all',     label: 'الكل',    icon: Icon.bag },
    { id: 'food',    label: 'مطاعم',   icon: Icon.food },
    { id: 'cafe',    label: 'قهوة',    icon: Icon.cafe },
    { id: 'grocery', label: 'بقالة',   icon: Icon.home2 },
    { id: 'delivery',label: 'توصيل',   icon: Icon.bolt },
    { id: 'pharmacy',label: 'صيدلية', icon: Icon.shield },
  ];

  // Mock store data. `alt` references the id of a cheaper alternative for "current" pins.
  const stores = [
    { id: 1, x: 32, y: 26, type: 'current', cat: 'cafe',    name: 'كافيه ستارز',      avg: 28, monthly: 560,
      alt: 2, save: 300, savingNote: 'توفّر ٣٠٠ ر.س شهرياً' },
    { id: 2, x: 44, y: 30, type: 'alt',     cat: 'cafe',    name: 'قهوة الديوانية',  avg: 12, dist: '٤٠٠ م' },

    { id: 3, x: 62, y: 42, type: 'current', cat: 'food',    name: 'هنقرستيشن',        avg: 65, monthly: 1300,
      alt: 4, save: 560, savingNote: 'توفّر ٥٦٠ ر.س شهرياً' },
    { id: 4, x: 52, y: 50, type: 'alt',     cat: 'food',    name: 'مطعم البلد',       avg: 35, dist: '٧٠٠ م' },

    { id: 5, x: 24, y: 62, type: 'current', cat: 'grocery', name: 'دانوب الرومانسية', avg: 320, monthly: 1280,
      alt: 6, save: 180, savingNote: 'توفّر ١٨٠ ر.س شهرياً' },
    { id: 6, x: 32, y: 70, type: 'alt',     cat: 'grocery', name: 'العثيم — العليا',  avg: 240, dist: '١.٢ كم' },

    { id: 7, x: 72, y: 22, type: 'current', cat: 'food',    name: 'مطعم بومبيز',      avg: 110, monthly: 880,
      alt: null, save: 0 },
    { id: 8, x: 78, y: 58, type: 'alt',     cat: 'pharmacy',name: 'صيدلية النهدي',    avg: 90, dist: '٩٠٠ م' },
  ];

  const matchesFilter = (s) => filter === 'all' || s.cat === filter;
  const visible = stores.filter(matchesFilter);
  const currentStores = visible.filter(s => s.type === 'current');
  const totalSaving = currentStores.reduce((sum, s) => sum + (s.save || 0), 0);

  const selectedStore = stores.find(s => s.id === selected);
  const altStore = selectedStore?.alt ? stores.find(s => s.id === selectedStore.alt) : null;

  return (
    <div className="screen-enter" style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden',
    }}>
      {/* ─── MAP CANVAS ─── */}
      <div style={{ position: 'absolute', inset: '0 0 74px 0' }}>
        <MapCanvas />
      </div>

      {/* Pins overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 74, pointerEvents: 'none' }}>
        {visible.map(s => (
          <button key={s.id}
            onClick={() => setSelected(s.id)}
            style={{
              position: 'absolute',
              left: `${s.x}%`, top: `${s.y}%`,
              transform: 'translate(-50%, -100%)',
              background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', pointerEvents: 'auto',
              filter: selected === s.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
              transition: 'filter 0.15s ease',
            }}>
            <Pin type={s.type} selected={selected === s.id} />
          </button>
        ))}
      </div>

      {/* ─── TOP: Search + chips ─── */}
      <div style={{
        position: 'absolute', top: 14, left: 12, right: 12, zIndex: 30,
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 14,
          padding: '11px 14px',
          boxShadow: '0 6px 18px rgba(13,30,21,0.16), 0 1px 0 rgba(168,117,74,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: 'var(--sadu-brown)' }}><Icon.search size={18} /></span>
          <input
            placeholder="ابحث عن محل أو فئة"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--ink)',
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              fontSize: 13, direction: 'rtl',
            }}
          />
          <div style={{
            width: 1, height: 18, background: 'rgba(27,52,36,0.10)',
          }} />
          <Avatar name="ف" size={26} tone={0} />
        </div>

        {/* Filter chips */}
        <div className="no-scrollbar" style={{
          marginTop: 10,
          display: 'flex', gap: 6, overflowX: 'auto',
          paddingBottom: 2,
        }}>
          {categories.map(c => {
            const active = filter === c.id;
            return (
              <button key={c.id} onClick={() => setFilter(c.id)} style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 999,
                background: active ? 'var(--green)' : 'rgba(255,255,255,0.94)',
                color: active ? 'var(--cream)' : 'var(--green)',
                border: active ? 'none' : '1px solid rgba(168,117,74,0.18)',
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                fontWeight: 600, fontSize: 12,
                cursor: 'pointer',
                boxShadow: active ? '0 4px 10px rgba(27,52,36,0.18)' : '0 2px 6px rgba(13,30,21,0.06)',
                transition: 'all 0.18s ease',
              }}>
                <c.icon size={13} w={1.9} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Savings strip (floats above sheet) ─── */}
      {!selectedStore && (
        <div style={{
          position: 'absolute',
          bottom: sheetExpanded ? 460 : 326,
          left: 12, right: 12, zIndex: 18,
          transition: 'bottom 0.32s cubic-bezier(0.2,0.8,0.2,1)',
        }}>
          <div style={{
            background: 'var(--green)',
            color: 'var(--cream)',
            borderRadius: 14,
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 22px rgba(13,30,21,0.22)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(255,239,179,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon.sparkle size={16} />
            </div>
            <div style={{ flex: 1, fontSize: 11, lineHeight: 1.4 }}>
              <div style={{ color: 'rgba(255,239,179,0.7)' }}>توفير محتمل من بدائل قريبة</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                <span className="num">{fmt(totalSaving)}</span> {SAR} شهرياً
              </div>
            </div>
            <span className="badge" style={{ background: 'var(--cream)', color: 'var(--green)' }}>
              <span className="num">{toArabicDigits(currentStores.length)}</span> فرصة
            </span>
          </div>
        </div>
      )}

      {/* ─── My-location floating button ─── */}
      <button
        onClick={() => { /* mock */ }}
        aria-label="موقعي"
        style={{
          position: 'absolute',
          bottom: sheetExpanded ? 534 : 400,
          right: 14,
          width: 44, height: 44, borderRadius: 14,
          background: '#fff',
          color: 'var(--green)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(13,30,21,0.20)',
          zIndex: 25,
          transition: 'bottom 0.32s cubic-bezier(0.2,0.8,0.2,1)',
        }}>
        <Icon.locate size={20} />
      </button>

      {/* ─── Pin detail card (sheet replacement when selected) ─── */}
      {selectedStore && (
        <PinDetailCard
          store={selectedStore}
          alt={altStore}
          close={() => setSelected(null)}
        />
      )}

      {/* ─── Bottom sheet list (when no pin selected) ─── */}
      {!selectedStore && (
        <MapBottomSheet
          stores={visible}
          expanded={sheetExpanded}
          onToggle={() => setSheetExpanded(e => !e)}
          onPick={(id) => setSelected(id)}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// MAP CANVAS — stylized vector "Google-Maps-like" backdrop
// ═════════════════════════════════════════════════════════
function MapCanvas() {
  return (
    <svg
      viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      {/* Land base */}
      <rect width="400" height="800" fill="var(--map-land)" />

      {/* Faint heritage dots scattered as noise */}
      <g opacity="0.06" fill="var(--sadu-brown)">
        {Array.from({length: 30}).map((_, i) => {
          const x = (i * 53) % 400;
          const y = (i * 91) % 800;
          const r = 0.7 + (i % 3) * 0.3;
          return <circle key={i} cx={x} cy={y} r={r} />;
        })}
      </g>

      {/* Parks / green areas (irregular polygons) */}
      <g fill="var(--map-park)" opacity="0.85">
        <path d="M-20 130 Q 50 100, 95 140 Q 130 180, 80 220 Q 30 230, -20 200 Z" />
        <path d="M280 540 Q 340 520, 380 560 Q 420 600, 360 640 Q 310 650, 270 610 Z" />
        <path d="M180 700 Q 220 690, 240 720 Q 230 760, 200 770 Q 170 760, 170 730 Z" />
      </g>
      {/* Park labels */}
      <g fontFamily="IBM Plex Sans Arabic, sans-serif" fontSize="9" fill="#3e4830" opacity="0.55">
        <text x="40" y="170" textAnchor="middle">حديقة الملك سلمان</text>
        <text x="325" y="588" textAnchor="middle">منتزه الفلاح</text>
      </g>

      {/* Water (a soft river-ish blue strip in the corner) */}
      <path d="M380 0 Q 340 80, 380 160 L 400 160 L 400 0 Z" fill="#BCD4E6" opacity="0.6" />

      {/* Roads — drawn from widest to narrowest, road casing then surface */}
      {/* Main horizontal artery */}
      <g>
        <path d="M-10 360 Q 80 340, 180 360 Q 280 380, 410 350" stroke="#D8CCAD" strokeWidth="22" fill="none" strokeLinecap="round" />
        <path d="M-10 360 Q 80 340, 180 360 Q 280 380, 410 350" stroke="var(--map-road)" strokeWidth="18" fill="none" strokeLinecap="round" />
        <path d="M-10 360 Q 80 340, 180 360 Q 280 380, 410 350" stroke="#E8DCBB" strokeWidth="0.6" fill="none" strokeDasharray="4 6" />
      </g>

      {/* Secondary horizontal roads */}
      {[80, 220, 500, 640].map(y => (
        <g key={`h${y}`}>
          <path d={`M-10 ${y} L 410 ${y+ (y%50 ? 8 : 0)}`} stroke="#D8CCAD" strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d={`M-10 ${y} L 410 ${y+ (y%50 ? 8 : 0)}`} stroke="var(--map-road)" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* Vertical roads */}
      {[60, 160, 250, 340].map(x => (
        <g key={`v${x}`}>
          <path d={`M${x} -10 L ${x + (x%40 ? 6 : 0)} 810`} stroke="#D8CCAD" strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d={`M${x} -10 L ${x + (x%40 ? 6 : 0)} 810`} stroke="var(--map-road)" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* Diagonal road */}
      <g>
        <path d="M-10 720 L 410 460" stroke="#D8CCAD" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M-10 720 L 410 460" stroke="var(--map-road)" strokeWidth="10" fill="none" strokeLinecap="round" />
      </g>

      {/* Buildings / parcels — rounded rects scattered between roads */}
      <g fill="var(--map-block)" opacity="0.85">
        {[
          [12, 14, 38, 50], [54, 18, 36, 38], [98, 22, 50, 30], [168, 14, 70, 44],
          [12, 246, 40, 90], [62, 248, 80, 50], [156, 240, 80, 88], [254, 256, 70, 60], [340, 254, 60, 80],
          [12, 396, 36, 80], [60, 398, 80, 80], [170, 400, 60, 86], [248, 396, 80, 84], [346, 400, 50, 84],
          [12, 540, 40, 80], [62, 540, 80, 80], [160, 540, 80, 88],
          [254, 660, 70, 30], [12, 666, 36, 28],
        ].map(([x,y,w,h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="6" />
        ))}
      </g>

      {/* Tiny block labels (subtle) */}
      <g fontFamily="IBM Plex Sans Arabic, sans-serif" fontSize="7" fill="#7c6e4d" opacity="0.55">
        <text x="120" y="42">حي العليا</text>
        <text x="200" y="290">شارع التحلية</text>
        <text x="40" y="438">حي الورود</text>
      </g>

      {/* North indicator (top-left corner) */}
      <g transform="translate(28, 92)" opacity="0.45">
        <circle r="11" fill="#fff" />
        <path d="M0 -7 L 4 4 L 0 1 L -4 4 Z" fill="var(--najdi-red)" />
        <text y="-13" textAnchor="middle" fontFamily="IBM Plex Sans Arabic" fontSize="8" fill="var(--ink)">N</text>
      </g>
    </svg>
  );
}

// ─────────── Pin component ───────────
function Pin({ type, selected }) {
  const fill = type === 'current' ? 'var(--najdi-red)' : 'var(--green)';
  const scale = selected ? 1.2 : 1;
  return (
    <svg width={32} height={40} viewBox="0 0 32 40" style={{ transform: `scale(${scale})`, transformOrigin: '50% 100%', transition: 'transform 0.15s ease' }}>
      {/* Pin body */}
      <path d="M16 1 C 8 1, 2 7, 2 15 C 2 24, 16 38, 16 38 C 16 38, 30 24, 30 15 C 30 7, 24 1, 16 1 Z"
        fill={fill} stroke="#fff" strokeWidth="2" />
      {/* Inner dot */}
      <circle cx="16" cy="14" r="4.5" fill="#fff" />
      {/* Center indicator */}
      <circle cx="16" cy="14" r="2" fill={fill} />
      {/* Tiny mark on alt = check */}
      {type === 'alt' && (
        <path d="M13.2 14 L 15.6 16.2 L 19.2 12.4" stroke={fill} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════
// PIN DETAIL CARD — shown when user taps a pin
// ═════════════════════════════════════════════════════════
function PinDetailCard({ store, alt, close }) {
  const isCurrent = store.type === 'current';
  return (
    <div style={{
      position: 'absolute', left: 12, right: 12, bottom: 90,
      zIndex: 60,
      animation: 'slideUp 0.32s cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 12px 32px rgba(13,30,21,0.22)' }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px 12px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: isCurrent ? 'rgba(158,43,37,0.06)' : 'rgba(27,52,36,0.05)',
          borderBottom: '1px solid rgba(27,52,36,0.06)',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: isCurrent ? 'var(--najdi-red)' : 'var(--green)',
            color: 'var(--cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon.pin size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700,
              color: isCurrent ? 'var(--najdi-red)' : 'var(--green)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {isCurrent ? 'تصرف هنا حالياً' : 'بديل أوفر'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
              {store.name}
            </div>
          </div>
          <button onClick={close} style={{
            width: 30, height: 30, borderRadius: 10,
            background: 'rgba(27,52,36,0.08)', border: 'none',
            color: 'var(--ink)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.close size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          {isCurrent && alt ? (
            <>
              {/* Comparison row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>الحالي</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{store.name}</div>
                  <div className="num" style={{ fontSize: 17, color: 'var(--najdi-red)', fontWeight: 800, marginTop: 4 }}>
                    {fmt(store.avg)} <span style={{ fontSize: 10, fontWeight: 600 }}>{SAR}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>متوسّط الزيارة</div>
                </div>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--vanilla-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--sadu-brown)',
                }}>
                  <Icon.arrowLeft size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>البديل</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginTop: 2 }}>{alt.name}</div>
                  <div className="num" style={{ fontSize: 17, color: 'var(--green)', fontWeight: 800, marginTop: 4 }}>
                    {fmt(alt.avg)} <span style={{ fontSize: 10, fontWeight: 600 }}>{SAR}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>
                    على بُعد <span className="num">{alt.dist}</span>
                  </div>
                </div>
              </div>

              {/* Saving callout */}
              <div style={{
                marginTop: 14,
                background: 'var(--green)',
                color: 'var(--cream)',
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Sadu tick strip */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0, width: 4,
                  background: 'repeating-linear-gradient(180deg, var(--sadu-brown) 0 6px, var(--cream) 6px 9px, var(--najdi-red) 9px 14px, var(--cream) 14px 17px)',
                  opacity: 0.55,
                }} />
                <Icon.sparkle size={18} />
                <div style={{ flex: 1, fontSize: 12, lineHeight: 1.4 }}>
                  <div style={{ color: 'rgba(255,239,179,0.7)' }}>التوفير الشهري المتوقّع</div>
                  <div className="num" style={{ fontSize: 20, fontWeight: 800 }}>
                    +{fmt(store.save)} <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,239,179,0.7)' }}>{SAR}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" style={{ flex: 1, padding: '11px', fontSize: 12 }}>
                  أضِفه لقائمتي
                </button>
                <button className="btn btn-primary" style={{ flex: 1.4, padding: '11px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon.directions size={14} /> اتجاهات للبديل
                </button>
              </div>
            </>
          ) : (
            // Alt-only or current-without-alt: simpler card
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>متوسّط السعر</div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>
                    {fmt(store.avg)} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)' }}>{SAR}</span>
                  </div>
                </div>
                {store.dist && (
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>المسافة</div>
                    <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{store.dist}</div>
                  </div>
                )}
              </div>
              {isCurrent && (
                <div style={{
                  marginTop: 12, padding: '10px 12px',
                  background: 'rgba(168,117,74,0.10)',
                  borderRadius: 12,
                  fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5,
                }}>
                  ما لقينا بديل أرخص قريب — حافظ على استهلاكك المعتدل.
                </div>
              )}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '11px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <Icon.directions size={14} /> الاتجاهات
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// MAP BOTTOM SHEET — store list (collapsed/expanded)
// ═════════════════════════════════════════════════════════
function MapBottomSheet({ stores, expanded, onToggle, onPick }) {
  const sortedStores = [...stores].sort((a, b) => (a.type === 'current' ? -1 : 1));
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0,
      bottom: 74,
      background: 'var(--vanilla)',
      borderRadius: '22px 22px 0 0',
      boxShadow: '0 -8px 24px rgba(13,30,21,0.14)',
      zIndex: 20,
      maxHeight: expanded ? 460 : 240,
      transition: 'max-height 0.32s cubic-bezier(0.2,0.8,0.2,1)',
      paddingBottom: 10,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Drag handle (toggles) */}
      <button onClick={onToggle} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '10px 0 6px',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: 42, height: 4, borderRadius: 3, background: 'rgba(27,52,36,0.22)' }} />
      </button>

      {/* Header */}
      <div onClick={onToggle} style={{
        padding: '4px 18px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>المحلات القريبة منك</div>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
            <span className="num">{toArabicDigits(stores.length)}</span> نتيجة في حيّك
          </div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(27,52,36,0.06)',
          color: 'var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease',
        }}>
          <Icon.arrowUp size={14} />
        </div>
      </div>

      {/* Sadu divider */}
      <div style={{
        height: 3, marginInline: 18,
        background: 'repeating-linear-gradient(90deg, var(--sadu-brown) 0 6px, transparent 6px 10px, var(--najdi-red) 10px 14px, transparent 14px 18px)',
        opacity: 0.55,
      }} />

      {/* Store rows */}
      <div className="no-scrollbar" style={{
        overflowY: 'auto', flex: 1,
        padding: '8px 14px 12px',
      }}>
        {sortedStores.map((s) => (
          <div key={s.id} onClick={() => onPick(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: 11,
            padding: '10px 8px',
            borderRadius: 12,
            cursor: 'pointer',
            borderBottom: '1px dashed rgba(168,117,74,0.18)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: s.type === 'current' ? 'rgba(158,43,37,0.10)' : 'rgba(27,52,36,0.08)',
              color: s.type === 'current' ? 'var(--najdi-red)' : 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon.pin size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                <span>متوسط&nbsp;<span className="num" style={{ color: 'var(--green)', fontWeight: 700 }}>{fmt(s.avg)}</span>&nbsp;{SAR}</span>
                {s.dist && <span style={{ opacity: 0.7 }}>· <span className="num">{s.dist}</span></span>}
              </div>
            </div>
            {s.type === 'current' && s.save > 0 && (
              <span style={{
                background: 'rgba(27,52,36,0.08)',
                color: 'var(--green)',
                padding: '4px 8px', borderRadius: 8,
                fontSize: 10, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 3,
                whiteSpace: 'nowrap',
              }}>
                <Icon.sparkle size={9} /> بديل أوفر
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MapScreen });
