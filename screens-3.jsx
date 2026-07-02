// screens-3.jsx — "بدائل أوفر لك": every way to save, not just nearby
// merchants — budget/behavior swaps (subscriptions, cooking at home, a
// shopping list) sit alongside location-based ones. The map underneath only
// plots pins for alternatives that actually have a place; it doesn't gate
// the list — cards without a location just don't get a pin.

const MAP_SAR = 'ر.س';

// Location-based swaps: a current merchant with a real cheaper alternative
// (and thus a real pin pair on the map). Budget-based swaps: behavior/plan
// changes from window.SAVING_ALTS with no map location at all. Both are
// normalized to one shape so a single card component renders either.
function useAllAlternatives() {
  const stores = window.MAP_STORES;
  const locationAlts = stores
    .filter(s => s.type === 'current' && s.alt)
    .map(s => {
      const alt = stores.find(a => a.id === s.alt);
      if (!alt) return null;
      return {
        id: 'loc-' + s.id,
        kind: 'location',
        fromLabel: s.name, fromAmt: s.avg,
        toLabel: alt.name, toAmt: alt.avg,
        dist: alt.dist, save: s.save,
        pinIds: [s.id, alt.id],
      };
    })
    .filter(Boolean);

  const budgetAlts = window.SAVING_ALTS.map(a => ({
    id: a.id,
    kind: 'budget',
    fromLabel: a.from, fromAmt: a.fromAmt,
    toLabel: a.to, toAmt: a.toAmt,
    dist: null, save: a.save,
    pinIds: null,
  }));

  return [...locationAlts, ...budgetAlts];
}

// ─────────── list card: current thing → cheaper alternative ───────────
// Works for both location-based (has a map pin, shows distance) and
// budget-based (behavior/plan change, no map pin) alternatives.
function SwapCard({ alt, selected, onSelect }) {
  return (
    <div
      className="card"
      onClick={alt.pinIds ? onSelect : undefined}
      style={{
        padding: 14, marginBottom: 10, position: 'relative',
        cursor: alt.pinIds ? 'pointer' : 'default',
        border: selected ? '1.5px solid var(--green)' : undefined,
      }}
    >
      {alt.kind === 'location' && (
        <div style={{
          position: 'absolute', top: -9, right: 14,
          background: 'var(--sadu-brown)', color: 'var(--cream)',
          fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}><Icon.pin size={9} /> {alt.dist || 'على الخريطة'}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>الحالي</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{alt.fromLabel}</div>
          <div className="num" style={{ fontSize: 13, color: 'var(--najdi-red)', fontWeight: 700, marginTop: 4 }}>{fmt(alt.fromAmt)} {MAP_SAR}</div>
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: 'var(--vanilla)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sadu-brown)',
        }}>
          <Icon.arrowLeft size={14} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>البديل</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginTop: 2 }}>{alt.toLabel}</div>
          <div className="num" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>{fmt(alt.toAmt)} {MAP_SAR}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed rgba(168,117,74,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>توفير شهري متوقع</div>
        <div className="num" style={{ background: 'var(--green)', color: 'var(--cream)', padding: '4px 10px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
          +{fmt(alt.save)} {MAP_SAR}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// MAP SCREEN — بدائل list on top (all kinds of savings), map preview below
// (only for the ones that have an actual place)
// ═════════════════════════════════════════════════════════
function MapScreen({ goto }) {
  const alts = useAllAlternatives();
  const locationAlts = alts.filter(a => a.kind === 'location');
  const [selectedId, setSelectedId] = useState(locationAlts[0] ? locationAlts[0].id : null);

  const totalSaving = alts.reduce((s, a) => s + (a.save || 0), 0);
  const selected = alts.find(a => a.id === selectedId);
  const highlightIds = selected && selected.pinIds ? selected.pinIds : [];

  const pinStoreIds = new Set(locationAlts.flatMap(a => a.pinIds));
  const pins = window.MAP_STORES.filter(s => pinStoreIds.has(s.id));

  return (
    <div className="screen-enter" style={{ paddingBottom: 130 }}>
      {/* Header */}
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', fontFamily: 'Rubik, sans-serif' }}>
          بدائل أوفر لك
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>بدّل واستفد — ريالك يقترح لك، مو بس محلات قريبة</div>
      </div>

      {/* Total saving strip */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{
          background: 'var(--green)', color: 'var(--cream)', borderRadius: 14,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: 'rgba(255,239,179,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon.sparkle size={16} />
          </div>
          <div style={{ flex: 1, fontSize: 11, lineHeight: 1.4 }}>
            <div style={{ color: 'rgba(255,239,179,0.7)' }}>توفير محتمل من كل البدائل</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}><span className="num">{fmt(totalSaving)}</span> {MAP_SAR} شهرياً</div>
          </div>
          <span className="badge" style={{ background: 'var(--cream)', color: 'var(--green)' }}>
            <span className="num">{toArabicDigits(alts.length)}</span> فرصة
          </span>
        </div>
      </div>

      {/* بدائل list — location-based and budget-based, mixed together */}
      <div style={{ padding: '16px 14px 0' }}>
        {alts.map(alt => (
          <SwapCard
            key={alt.id}
            alt={alt}
            selected={alt.id === selectedId}
            onSelect={() => setSelectedId(alt.id)}
          />
        ))}
      </div>

      {/* Map preview — only the بدائل above that actually have a place */}
      <div style={{ padding: '6px 14px 0' }}>
        <SectionTitle hint="بس البدائل اللي لها مكان تظهر هنا">موقعهم على الخريطة</SectionTitle>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: 260 }}>
            <MapCanvas />
            {pins.map(s => (
              <div key={s.id} style={{
                position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
                transform: 'translate(-50%, -100%)',
                filter: highlightIds.includes(s.id) ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
              }}>
                <Pin type={s.type} selected={highlightIds.includes(s.id)} />
              </div>
            ))}
          </div>
        </div>
      </div>
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

Object.assign(window, { MapScreen });
