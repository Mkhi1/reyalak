// ui.jsx — shared components for ريالك app
// Heritage: Sadu pattern strips (simple triangles/diamonds), avatars (initials),
// progress bars, donut chart, line chart, badges, bottom-nav, etc.

const { useState, useEffect, useRef, useMemo, Fragment } = React;

// ─────────── Arabic-Indic numerals ───────────
const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const toArabicDigits = (n) => String(n).replace(/\d/g, d => AR_DIGITS[+d]);
const fmt = (n, dec = 0) => {
  const s = Number(n).toFixed(dec);
  // add thousands sep
  const [int, frac] = s.split('.');
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toArabicDigits(frac ? `${withSep}.${frac}` : withSep);
};

// ─────────── Tiny icon set (mostly geometric / line) ───────────
// Stroke-based icons; never faces or complex motifs.
const Icon = {
  home: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9z"/>
    </svg>
  ),
  chart: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-6M22 20H2"/>
    </svg>
  ),
  target: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.8}>
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
    </svg>
  ),
  users: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.4"/>
      <path d="M2.5 20c.6-3.4 3.3-5.6 6.5-5.6s5.9 2.2 6.5 5.6"/>
      <circle cx="17" cy="7" r="2.6"/>
      <path d="M16 14.4c2.6.2 4.6 2.1 5.2 4.9"/>
    </svg>
  ),
  bell: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7z"/>
      <path d="M10 19a2 2 0 004 0"/>
    </svg>
  ),
  sparkle: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="currentColor">
      <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2zM19 14l.8 2.7L22.5 18l-2.7.8L19 21.5l-.8-2.7L15.5 18l2.7-.8L19 14zM5 14l.6 2L7.5 16.5l-2 .6L5 19l-.6-1.9L2.5 16.5l2-.6L5 14z"/>
    </svg>
  ),
  arrowUp: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.w||2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
  ),
  arrowDown: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.w||2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7"/>
    </svg>
  ),
  arrowLeft: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  arrowRight: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  chevron: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.w||2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  check: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.w||2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6"/>
    </svg>
  ),
  plus: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.w||2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  upload: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v13"/>
    </svg>
  ),
  bank: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-6 9 6"/>
      <path d="M5 10v9M9 10v9M15 10v9M19 10v9"/>
      <path d="M3 20h18"/>
    </svg>
  ),
  shield: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  clock: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  ),
  // Category icons (simple geometric)
  food: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h18l-1.5 9a2 2 0 01-2 2H6.5a2 2 0 01-2-2L3 11z"/>
      <path d="M7 11V6a5 5 0 0110 0v5"/>
    </svg>
  ),
  car: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15v-3l2-5a2 2 0 012-1.5h10a2 2 0 012 1.5l2 5v3"/>
      <rect x="2" y="15" width="20" height="4" rx="1"/>
      <circle cx="7" cy="18.5" r="1.4" fill="currentColor"/>
      <circle cx="17" cy="18.5" r="1.4" fill="currentColor"/>
    </svg>
  ),
  bag: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h16l-1 13a1 1 0 01-1 1H6a1 1 0 01-1-1L4 8z"/>
      <path d="M9 8V6a3 3 0 016 0v2"/>
    </svg>
  ),
  bolt: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>
  ),
  cafe: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h13v6a4 4 0 01-4 4H8a4 4 0 01-4-4V9z"/>
      <path d="M17 11h2a2 2 0 010 4h-2"/>
      <path d="M8 6V3M12 6V3"/>
    </svg>
  ),
  home2: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9z"/>
    </svg>
  ),
  hajj: (p={}) => (
    // Mosque/Kaaba-ish: simple cube + arch
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="9" width="14" height="11" rx="1"/>
      <path d="M5 13h14"/>
      <path d="M12 5v4M10 6h4"/>
    </svg>
  ),
  car2: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14v-3l2-5a2 2 0 012-1.5h10a2 2 0 012 1.5l2 5v3"/>
      <rect x="2" y="14" width="20" height="5" rx="1"/>
      <circle cx="7" cy="19" r="1.6" fill="currentColor"/>
      <circle cx="17" cy="19" r="1.6" fill="currentColor"/>
    </svg>
  ),
  laptop: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="11" rx="1.5"/>
      <path d="M2 19h20"/>
    </svg>
  ),
  ring: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="15" r="5"/>
      <path d="M9 9l3-6 3 6"/>
    </svg>
  ),
  doc: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"/>
      <path d="M14 3v6h6M9 14h6M9 17h4"/>
    </svg>
  ),
  search: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/>
      <path d="M20 20l-3.5-3.5"/>
    </svg>
  ),
  map: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/>
      <path d="M9 4v14M15 6v14"/>
    </svg>
  ),
  locate: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.w||1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.5"/>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
    </svg>
  ),
  directions: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l10 10-10 10L2 12 12 2z"/>
      <path d="M8 12h6v-3l4 4-4 4v-3H8v-2z"/>
    </svg>
  ),
  pin: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s-7-7-7-13a7 7 0 0114 0c0 6-7 13-7 13z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  close: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.w||2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  chat: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z"/>
      <path d="M8 10h8M8 13h5" strokeWidth={p.w ? p.w*0.85 : 1.5}/>
    </svg>
  ),
  send: (p={}) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.w||1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11l16-7-6 16-2.5-6.5L4 11z"/>
    </svg>
  ),
};

// ─────────── Avatar (initials, brand-colored) ───────────
function Avatar({ name = "ع", size = 38, tone = 0 }) {
  const tones = [
    { bg: '#1B3424', fg: '#FFEFB3' },
    { bg: '#A8754A', fg: '#FFEFB3' },
    { bg: '#898F65', fg: '#FFEFB3' },
    { bg: '#013E37', fg: '#FFEFB3' },
    { bg: '#9E2B25', fg: '#FFEFB3' },
    { bg: '#FFEFB3', fg: '#1B3424' },
  ];
  const t = tones[tone % tones.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: t.bg, color: t.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Rubik, sans-serif', fontWeight: 700,
      fontSize: size * 0.42, flexShrink: 0,
      letterSpacing: '-0.02em',
      border: '2px solid rgba(255,239,179,0.4)',
    }}>{name}</div>
  );
}

// ─────────── Sadu strip components ───────────
function SaduStrip({ variant = "tri", style = {} }) {
  if (variant === "tri") {
    return <div className="sadu-band" style={style} />;
  }
  if (variant === "rule") {
    return <div className="sadu-rule" style={style} />;
  }
  if (variant === "diamonds") {
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center', padding: '6px 0', ...style }}>
        {Array.from({length: 13}).map((_, i) => (
          <i key={i} style={{
            width: 8, height: 8, transform: 'rotate(45deg)',
            background: i % 3 === 1 ? 'var(--najdi-red)' : 'var(--sadu-brown)',
            display: 'inline-block',
          }} />
        ))}
      </div>
    );
  }
  if (variant === "kilim") {
    // alternating triangles, kilim-style
    return (
      <svg viewBox="0 0 200 14" width="100%" height="14" preserveAspectRatio="none" style={style}>
        {Array.from({length: 20}).map((_, i) => (
          <polygon key={i} points={`${i*10},14 ${i*10+5},2 ${i*10+10},14`} fill={i % 2 === 0 ? 'var(--sadu-brown)' : 'var(--najdi-red)'} opacity={i % 2 === 0 ? 0.85 : 0.7} />
        ))}
      </svg>
    );
  }
  return null;
}

// ─────────── Linear progress ───────────
function LinearProgress({ value, total, height = 8, color = 'var(--green)', track = 'rgba(27,52,36,0.10)', showShimmer = false }) {
  const pct = Math.min(100, (value / total) * 100);
  return (
    <div style={{ height, background: track, borderRadius: height/2, overflow: 'hidden', width: '100%' }}>
      <div className={showShimmer ? "progress-fill" : ""} style={{
        height: '100%', width: `${pct}%`, background: color, borderRadius: height/2,
        transition: 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }} />
    </div>
  );
}

// ─────────── Circular progress ───────────
function CircularProgress({ value, total, size = 130, stroke = 12, color = 'var(--green)', track = 'rgba(27,52,36,0.10)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / total);
  const offset = c * (1 - pct);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}>{children}</div>
    </div>
  );
}

// ─────────── Stacked horizontal distribution bar ───────────
function StackedBar({ items, height = 22, gap = 2 }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div style={{
      display: 'flex', height, borderRadius: height/2, overflow: 'hidden', gap,
      background: 'rgba(27,52,36,0.06)',
    }}>
      {items.map((it, i) => (
        <div key={i} title={it.label} style={{
          flex: it.value, background: it.color,
          transition: 'flex 0.6s ease',
        }} />
      ))}
    </div>
  );
}

// ─────────── Donut chart ───────────
function Donut({ items, size = 180, stroke = 28 }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let cumul = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(27,52,36,0.06)" strokeWidth={stroke} />
      {items.map((it, i) => {
        const frac = it.value / total;
        const dash = c * frac;
        const offset = c * (1 - cumul);
        cumul += frac;
        return (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={it.color} strokeWidth={stroke}
            strokeDasharray={`${dash - 2} ${c}`}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}

// ─────────── Line chart ───────────
function LineChart({ data, width = 320, height = 120, color = 'var(--green)', fillColor = 'rgba(27,52,36,0.10)' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 8;
  const stepX = (width - pad*2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad*2);
    return [x, y];
  });
  // Smooth curve via cubic-bezier
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i-1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    path += ` C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
  }
  const areaPath = path + ` L ${points.at(-1)[0]} ${height - pad} L ${pad} ${height - pad} Z`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B3424" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1B3424" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lcg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4 : 2.5}
          fill={i === points.length - 1 ? 'var(--cream)' : '#fff'}
          stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
}

// ─────────── Bottom Nav ───────────
function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: Icon.home },
    { id: 'analysis', label: 'التحليل', icon: Icon.chart },
    { id: 'map', label: 'بدائل', icon: Icon.map },
    { id: 'goals', label: 'الأهداف', icon: Icon.target },
    { id: 'ai-chat', label: 'المساعد', icon: Icon.chat },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 28, paddingTop: 6,
      background: 'rgba(250,247,240,0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(168,117,74,0.18)',
      zIndex: 100,
    }}>
      {/* tiny sadu rule at top */}
      <div style={{
        position: 'absolute', top: -1, left: 16, right: 16, height: 2,
        background: 'repeating-linear-gradient(90deg, var(--sadu-brown) 0 6px, transparent 6px 10px, var(--najdi-red) 10px 14px, transparent 14px 18px)',
        opacity: 0.5,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 6px' }}>
        {tabs.map(t => {
          const isActive = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? 'var(--green)' : 'rgba(27,52,36,0.45)',
                padding: '6px 8px', borderRadius: 12,
                transition: 'color 0.2s ease',
                position: 'relative',
              }}>
              <t.icon size={20} w={isActive ? 2.0 : 1.7} />
              <span style={{
                fontSize: 9.5, fontWeight: isActive ? 700 : 500,
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              }}>{t.label}</span>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: -2, width: 4, height: 4,
                  borderRadius: '50%', background: 'var(--green)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────── Top Header ───────────
function TopHeader({ name = "محمد", onAccount, onNotif, hasNotif = true }) {
  return (
    <div style={{
      padding: '18px 18px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={name[0]} size={42} tone={0} />
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500 }}>مرحباً 👋🏼</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>أبو {name}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onNotif} style={{
          width: 42, height: 42, borderRadius: 14,
          background: '#fff', border: '1px solid rgba(27,52,36,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--green)', cursor: 'pointer', position: 'relative',
        }}>
          <Icon.bell />
          {hasNotif && <div style={{
            position: 'absolute', top: 9, right: 11, width: 8, height: 8,
            borderRadius: '50%', background: 'var(--najdi-red)',
            border: '2px solid #fff',
          }} />}
        </button>
      </div>
    </div>
  );
}

// ─────────── Section header ───────────
function SectionTitle({ children, action, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 4px 8px' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{children}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{hint}</div>}
      </div>
      {action && <div style={{ fontSize: 12, color: 'var(--sadu-brown)', fontWeight: 600, cursor: 'pointer' }}>{action}</div>}
    </div>
  );
}

// ─────────── Wordmark (logo) ───────────
// logo.png is a calligraphic وفّر mark (kept as-is from the app's earlier
// name — no calligraphy asset exists for ريالك yet) with a transparent
// background, safe to use directly on any surface, light or dark.
const LOGO_ASPECT = 1384 / 813;
function Wordmark({ size = 32 }) {
  return (
    <img src="logo.png" alt="وفّر" style={{
      height: size, width: size * LOGO_ASPECT, objectFit: 'contain', display: 'inline-block',
    }} />
  );
}

// Maps the icon_key strings the backend sends for goals (e.g. 'hajj', 'car2')
// to the actual Icon.* components — goals used to carry a literal component
// reference in local mock arrays; now they carry a string key over JSON.
const GOAL_ICONS = { hajj: Icon.hajj, car2: Icon.car2, ring: Icon.ring, laptop: Icon.laptop, target: Icon.target };

Object.assign(window, {
  Icon, Avatar, SaduStrip, LinearProgress, CircularProgress,
  StackedBar, Donut, LineChart, BottomNav, TopHeader, SectionTitle, Wordmark,
  toArabicDigits, fmt, AR_DIGITS, GOAL_ICONS,
});
