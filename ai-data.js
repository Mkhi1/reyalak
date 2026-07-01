// ai-data.js — fake (mock) 12-month spending data for وفّر's AI insights screen.
// All numbers are sample/demo data for the prototype only.

const CATS_META = [
  { id: 'food',  label: 'مطاعم وكافيهات', icon: 'cafe',  color: '#1B3424' },
  { id: 'car',   label: 'بنزين ومواصلات', icon: 'car2',  color: '#A8754A' },
  { id: 'shop',  label: 'تسوّق',           icon: 'bag',   color: '#898F65' },
  { id: 'bills', label: 'فواتير وخدمات',   icon: 'bolt',  color: '#013E37' },
  { id: 'home',  label: 'بقالة وبيت',      icon: 'home2', color: '#9E2B25' },
  { id: 'other', label: 'أخرى',            icon: 'bag',   color: '#BCD4E6' },
];

// Monthly budget cap per category (ر.س)
const CATEGORY_BUDGETS = { food: 1400, car: 900, shop: 650, bills: 850, home: 1000, other: 500 };

// 12 months of mock spending, by category (ر.س)
const MONTHLY_SPEND = [
  { id: 'jan', month: 'يناير',   food: 1380, car: 820, shop: 520,  bills: 760,  home: 940,  other: 380 },
  { id: 'feb', month: 'فبراير',  food: 1290, car: 790, shop: 480,  bills: 740,  home: 910,  other: 360 },
  { id: 'mar', month: 'مارس',    food: 1620, car: 860, shop: 1450, bills: 770,  home: 980,  other: 420, note: 'تسوّق العيد رفع صرفك هالشهر' },
  { id: 'apr', month: 'أبريل',   food: 1480, car: 840, shop: 720,  bills: 760,  home: 960,  other: 400 },
  { id: 'may', month: 'مايو',    food: 1410, car: 870, shop: 600,  bills: 790,  home: 950,  other: 410 },
  { id: 'jun', month: 'يونيو',   food: 1550, car: 900, shop: 680,  bills: 980,  home: 990,  other: 520, note: 'فاتورة الكهرباء زادت مع الحر' },
  { id: 'jul', month: 'يوليو',   food: 1820, car: 950, shop: 760,  bills: 1050, home: 1010, other: 890, note: 'رحلة الصيف + تكييف — أعلى شهر صرف هذا العام' },
  { id: 'aug', month: 'أغسطس',   food: 1690, car: 930, shop: 700,  bills: 1020, home: 1000, other: 650 },
  { id: 'sep', month: 'سبتمبر',  food: 1450, car: 880, shop: 650,  bills: 820,  home: 970,  other: 420 },
  { id: 'oct', month: 'أكتوبر',  food: 1390, car: 850, shop: 520,  bills: 790,  home: 950,  other: 390 },
  { id: 'nov', month: 'نوفمبر',  food: 1460, car: 870, shop: 540,  bills: 800,  home: 960,  other: 400 },
  { id: 'dec', month: 'ديسمبر',  food: 1840, car: 900, shop: 980,  bills: 830,  home: 1020, other: 600, note: 'تسوّق المناسبات ونهاية السنة' },
];

// Cheaper-alternative suggestions, tagged by category — mirrors the
// "بدائل أوفر لك" cards on the regular Analysis screen so the AI can
// surface the ones that match whichever category is over budget.
const SAVING_ALTS = [
  { id: 'cafe',     cat: 'food',  type: 'budget_match', from: 'كافيه يومي • ستارز',          fromAmt: 28,  to: 'قهوة بيت + ترمس',            toAmt: 6,  save: 660, period: 'بالشهر' },
  { id: 'delivery', cat: 'food',  type: 'budget_match', from: 'هنقرستيشن (٤ مرات/أسبوع)',     fromAmt: 65,  to: 'طبخ بيت + مرة وحدة',          toAmt: 30, save: 560, period: 'بالشهر' },
  { id: 'shop',     cat: 'shop',  type: 'budget_match', from: 'تسوّق عشوائي بدون قائمة',      fromAmt: 95,  to: 'قائمة محدّدة + يوم تخفيضات', toAmt: 40, save: 420, period: 'بالشهر' },
  { id: 'stream',   cat: 'bills', type: 'budget_match', from: 'اشتراكات ستريمنق ×٤',          fromAmt: 220, to: 'باقة عائلية مشتركة',          toAmt: 70, save: 150, period: 'بالشهر' },
];

// Mock "live bank feed" — merchant + category + amount, cycled to simulate
// fresh transactions streaming in on the Live AI screen.
const LIVE_FEED = [
  { merchant: 'ستاربكس — الأندلس مول',   cat: 'food',  amount: 27 },
  { merchant: 'كودو',                     cat: 'food',  amount: 19 },
  { merchant: 'أرامكو — محطة وقود',       cat: 'car',   amount: 90 },
  { merchant: 'نمشي',                     cat: 'shop',  amount: 210 },
  { merchant: 'STC — فاتورة الجوال',      cat: 'bills', amount: 120 },
  { merchant: 'بنده',                     cat: 'home',  amount: 165 },
  { merchant: 'ستاربكس — العليا',          cat: 'food',  amount: 31 },
  { merchant: 'هنقرستيشن',                cat: 'food',  amount: 58 },
  { merchant: 'نون',                      cat: 'shop',  amount: 145 },
  { merchant: 'سينما VOX',                cat: 'other', amount: 95 },
];

// Merchant → nearby cheaper alternative, used both for the contextual
// "just spent there" tip and the map-alternatives summary card.
const MERCHANT_MAP_ALTS = [
  { id: 'starbucks', match: 'ستاربكس',    cat: 'food', type: 'nearby', alt: 'دانكن دونتس',          dist: '٢٥٠ م', save: 18 },
  { id: 'hunger',    match: 'هنقرستيشن',  cat: 'food', type: 'nearby', alt: 'طبخ بيت بدل التوصيل',  dist: '—',     save: 35 },
];

// Mock monthly income, used to derive the auto-rebalance "savings goal" slider.
const MONTHLY_INCOME = 7200;

Object.assign(window, { CATS_META, CATEGORY_BUDGETS, MONTHLY_SPEND, SAVING_ALTS, LIVE_FEED, MERCHANT_MAP_ALTS, MONTHLY_INCOME });
