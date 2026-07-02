// seed.js — populates data/waffer.db with a realistic single-user dataset.
// Idempotent: does nothing if a user already exists (safe to re-run via `npm run seed`).
const db = require('./db');

const CATS_META = [
  { id: 'food', label: 'مطاعم وكافيهات', icon: 'cafe', color: '#1B3424' },
  { id: 'car', label: 'بنزين ومواصلات', icon: 'car2', color: '#A8754A' },
  { id: 'shop', label: 'تسوّق', icon: 'bag', color: '#898F65' },
  { id: 'bills', label: 'فواتير وخدمات', icon: 'bolt', color: '#013E37' },
  { id: 'home', label: 'بقالة وبيت', icon: 'home2', color: '#9E2B25' },
  { id: 'other', label: 'أخرى', icon: 'bag', color: '#BCD4E6' },
];

const CATEGORY_BUDGETS = { food: 1400, car: 900, shop: 650, bills: 850, home: 1000, other: 500 };

// 12 months of category totals (ر.س) — same story ai-data.js told, now backed by
// individual generated transaction rows instead of being the raw data itself.
const MONTHLY_TOTALS = [
  { id: 'jan', month: 'يناير', num: '2026-01', food: 1380, car: 820, shop: 520, bills: 760, home: 940, other: 380 },
  { id: 'feb', month: 'فبراير', num: '2026-02', food: 1290, car: 790, shop: 480, bills: 740, home: 910, other: 360 },
  { id: 'mar', month: 'مارس', num: '2026-03', food: 1620, car: 860, shop: 1450, bills: 770, home: 980, other: 420, note: 'تسوّق العيد رفع صرفك هالشهر' },
  { id: 'apr', month: 'أبريل', num: '2026-04', food: 1480, car: 840, shop: 720, bills: 760, home: 960, other: 400 },
  { id: 'may', month: 'مايو', num: '2026-05', food: 1410, car: 870, shop: 600, bills: 790, home: 950, other: 410 },
  { id: 'jun', month: 'يونيو', num: '2026-06', food: 1550, car: 900, shop: 680, bills: 980, home: 990, other: 520, note: 'فاتورة الكهرباء زادت مع الحر' },
  { id: 'jul', month: 'يوليو', num: '2026-07', food: 1820, car: 950, shop: 760, bills: 1050, home: 1010, other: 890, note: 'رحلة الصيف + تكييف — أعلى شهر صرف هذا العام' },
  { id: 'aug', month: 'أغسطس', num: '2026-08', food: 1690, car: 930, shop: 700, bills: 1020, home: 1000, other: 650 },
  { id: 'sep', month: 'سبتمبر', num: '2026-09', food: 1450, car: 880, shop: 650, bills: 820, home: 970, other: 420 },
  { id: 'oct', month: 'أكتوبر', num: '2026-10', food: 1390, car: 850, shop: 520, bills: 790, home: 950, other: 390 },
  { id: 'nov', month: 'نوفمبر', num: '2026-11', food: 1460, car: 870, shop: 540, bills: 800, home: 960, other: 400 },
  { id: 'dec', month: 'ديسمبر', num: '2026-12', food: 1840, car: 900, shop: 980, bills: 830, home: 1020, other: 600, note: 'تسوّق المناسبات ونهاية السنة' },
];

// Purely generic placeholder labels — no invented brand names either, just
// "مكان أ/ب/ج..." (place A/B/C), letters scoped per category for variety.
const MERCHANTS = {
  food: ['مكان أ', 'مكان ب', 'مكان ج', 'مكان د', 'مكان هـ'],
  car: ['مكان أ', 'مكان ب', 'مكان ج', 'مكان د'],
  shop: ['مكان أ', 'مكان ب', 'مكان ج', 'مكان د'],
  bills: ['مكان أ', 'مكان ب', 'مكان ج', 'مكان د'],
  home: ['مكان أ', 'مكان ب', 'مكان ج'],
  other: ['مكان أ', 'مكان ب', 'مكان ج', 'مكان د'],
};

const EID_SHOP_MERCHANTS = ['مكان أ — تسوّق العيد', 'مكان ب — ملابس العيد', 'مكان ج — تشكيلة العيد'];
const SUMMER_MERCHANTS = { other: ['مكان أ — رحلة الصيف', 'فندق — حجز صيفي'], bills: ['مكان أ — فاتورة التكييف'] };
const YEAR_END_MERCHANTS = ['مكان أ — عروض نهاية السنة', 'مكان ب — هدايا نهاية السنة'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

// Split an integer total into `count` positive integer parts (roughly plausible sizes).
function splitAmount(total, count, minPart = 8) {
  if (count <= 1) return [total];
  const cuts = new Set();
  while (cuts.size < count - 1) {
    const c = rand(1, total - 1);
    if (c > 0 && c < total) cuts.add(c);
  }
  const sorted = [0, ...Array.from(cuts).sort((a, b) => a - b), total];
  const parts = [];
  for (let i = 1; i < sorted.length; i++) parts.push(sorted[i] - sorted[i - 1]);
  // Nudge away from zero/too-small parts by borrowing from the largest part.
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] < minPart) {
      const biggest = parts.indexOf(Math.max(...parts));
      const need = minPart - parts[i];
      if (parts[biggest] - need >= minPart) {
        parts[biggest] -= need;
        parts[i] += need;
      }
    }
  }
  return parts;
}

const TX_COUNT_RANGE = { food: [10, 16], car: [4, 7], shop: [3, 7], bills: [3, 5], home: [6, 10], other: [2, 5] };

function seed() {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (existing.n > 0) {
    console.log('Database already seeded — skipping. Delete server/data/waffer.db to reseed.');
    return;
  }

  function insertAll() {
    const userId = db.prepare(
      'INSERT INTO users (name, phone, monthly_income) VALUES (?, ?, ?)'
    ).run('فيصل', '05xxxxxxxx', 8500).lastInsertRowid;

    const accStmt = db.prepare(
      'INSERT INTO accounts (user_id, bank_name, masked_number, kind, balance) VALUES (?, ?, ?, ?, ?)'
    );
    const checkingId = accStmt.run(userId, 'بنك أ', '××٤٤٢١', 'checking', 6120).lastInsertRowid;
    accStmt.run(userId, 'محفظة أ', '××٠٩١٢', 'wallet', 340);
    accStmt.run(userId, 'بنك ب', '××٧٧٠٥', 'savings', 14750);

    const catStmt = db.prepare('INSERT INTO categories (id, label, icon, color) VALUES (?, ?, ?, ?)');
    for (const c of CATS_META) catStmt.run(c.id, c.label, c.icon, c.color);

    const budgetStmt = db.prepare('INSERT INTO budgets (user_id, category_id, monthly_cap) VALUES (?, ?, ?)');
    for (const [catId, cap] of Object.entries(CATEGORY_BUDGETS)) budgetStmt.run(userId, catId, cap);

    // ─── Transactions: generate line-items per month/category that sum to the
    // target totals above, using generic placeholder merchant labels. ───
    const txStmt = db.prepare(
      'INSERT INTO transactions (user_id, account_id, category_id, merchant, amount, occurred_at, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const daysInMonth = (ym) => new Date(+ym.split('-')[0], +ym.split('-')[1], 0).getDate();

    for (const m of MONTHLY_TOTALS) {
      for (const cat of CATS_META) {
        const total = m[cat.id];
        const [minC, maxC] = TX_COUNT_RANGE[cat.id];
        const count = rand(minC, maxC);
        const parts = splitAmount(total, count);
        for (const amount of parts) {
          let merchant = pick(MERCHANTS[cat.id]);
          let note = null;
          if (m.id === 'mar' && cat.id === 'shop' && Math.random() < 0.4) {
            merchant = pick(EID_SHOP_MERCHANTS);
            note = 'تسوّق العيد';
          } else if (m.id === 'jun' && cat.id === 'bills' && Math.random() < 0.5) {
            merchant = SUMMER_MERCHANTS.bills[0];
            note = 'فاتورة تكييف الصيف';
          } else if (m.id === 'jul' && cat.id === 'other' && Math.random() < 0.5) {
            merchant = pick(SUMMER_MERCHANTS.other);
            note = 'رحلة الصيف';
          } else if (m.id === 'dec' && cat.id === 'shop' && Math.random() < 0.4) {
            merchant = pick(YEAR_END_MERCHANTS);
            note = 'تسوّق نهاية السنة';
          }
          const day = String(rand(1, daysInMonth(m.num))).padStart(2, '0');
          const accountId = cat.id === 'food' && Math.random() < 0.3 ? checkingId + 1 /* wallet for small food buys */ : checkingId;
          txStmt.run(userId, accountId, cat.id, merchant, amount, `${m.num}-${day}`, note);
        }
      }
    }

    // ─── Goals ───
    const goalStmt = db.prepare(
      'INSERT INTO goals (user_id, title, icon_key, accent, target_amount, saved_amount, monthly_contribution, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    goalStmt.run(userId, 'رحلة العمرة ١٤٤٧', 'hajj', '#1B3424', 25000, 14750, 1200, 'الهدف الرئيسي');
    goalStmt.run(userId, 'دفعة أولى — سيّارة', 'car2', '#A8754A', 18000, 6800, 850, null);
    goalStmt.run(userId, 'صندوق الزواج', 'ring', '#9E2B25', 80000, 22000, 1500, null);
    goalStmt.run(userId, 'لابتوب جديد', 'laptop', '#898F65', 7500, 4200, 500, null);

    // ─── Jam'iya ───
    const groupId = db.prepare(
      'INSERT INTO jamiya_groups (user_id, name, monthly_amount, current_round) VALUES (?, ?, ?, ?)'
    ).run(userId, 'جمعية الشلّة 🌴', 8000, 5).lastInsertRowid;

    const memberStmt = db.prepare(
      'INSERT INTO jamiya_members (group_id, full_name, initial, tone, status, payout_month, order_index, is_me) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const members = [
      ['فيصل (أنت)', 'ف', 0, 'paid', 'ديسمبر', 5, 1],
      ['محمد العتيبي', 'م', 1, 'paid', 'نوفمبر', 4, 0],
      ['سلطان القحطاني', 'س', 2, 'paid', 'أكتوبر', 3, 0],
      ['نواف الحربي', 'ن', 3, 'paid', 'سبتمبر', 2, 0],
      ['عبدالله الزهراني', 'ع', 4, 'paid', 'أغسطس', 1, 0],
      ['خالد العنزي', 'خ', 5, 'pending', 'يناير', 6, 0],
      ['تركي السبيعي', 'ت', 1, 'late', 'فبراير', 7, 0],
      ['راكان الدوسري', 'ر', 2, 'pending', 'مارس', 8, 0],
    ];
    for (const mem of members) memberStmt.run(groupId, ...mem);

    // ─── Saving alternatives (budget_match) ───
    const altStmt = db.prepare(
      'INSERT INTO saving_alternatives (user_id, category_id, type, from_label, from_amount, to_label, to_amount, save_amount, period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    altStmt.run(userId, 'food', 'budget_match', 'مكان أ (يومي)', 28, 'قهوة بيت + ترمس', 6, 660, 'بالشهر');
    altStmt.run(userId, 'food', 'budget_match', 'مكان ب (٤ مرات/أسبوع)', 65, 'طبخ بيت + مرة وحدة', 30, 560, 'بالشهر');
    altStmt.run(userId, 'shop', 'budget_match', 'تسوّق عشوائي بدون قائمة', 95, 'قائمة محدّدة + يوم تخفيضات', 40, 420, 'بالشهر');
    altStmt.run(userId, 'bills', 'budget_match', 'اشتراكات ستريمنق ×٤', 220, 'باقة عائلية مشتركة', 70, 150, 'بالشهر');

    // ─── Merchant map alternatives (nearby) ───
    const merchAltStmt = db.prepare(
      'INSERT INTO merchant_alternatives (user_id, match_merchant, category_id, alt_label, distance_label, save_amount) VALUES (?, ?, ?, ?, ?, ?)'
    );
    merchAltStmt.run(userId, 'مكان أ', 'food', 'مكان ب', '٢٥٠ م', 18);
    merchAltStmt.run(userId, 'مكان ج', 'food', 'طبخ بيت بدل التوصيل', '—', 35);

    // ─── Map stores (stylized canvas pins) ───
    const storeStmt = db.prepare(
      'INSERT INTO map_stores (user_id, x, y, type, map_cat, name, avg_amount, monthly_amount, alt_store_id, save_amount, distance_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const s1 = storeStmt.run(userId, 32, 26, 'current', 'cafe', 'مكان أ', 28, 560, null, 300, null).lastInsertRowid;
    const s2 = storeStmt.run(userId, 44, 30, 'alt', 'cafe', 'مكان ب', 12, null, null, null, '٤٠٠ م').lastInsertRowid;
    db.prepare('UPDATE map_stores SET alt_store_id = ? WHERE id = ?').run(s2, s1);
    const s3 = storeStmt.run(userId, 62, 42, 'current', 'food', 'مكان أ', 65, 1300, null, 560, null).lastInsertRowid;
    const s4 = storeStmt.run(userId, 52, 50, 'alt', 'food', 'مكان ب', 35, null, null, null, '٧٠٠ م').lastInsertRowid;
    db.prepare('UPDATE map_stores SET alt_store_id = ? WHERE id = ?').run(s4, s3);
    const s5 = storeStmt.run(userId, 24, 62, 'current', 'grocery', 'مكان أ', 320, 1280, null, 180, null).lastInsertRowid;
    const s6 = storeStmt.run(userId, 32, 70, 'alt', 'grocery', 'مكان ب', 240, null, null, null, '١.٢ كم').lastInsertRowid;
    db.prepare('UPDATE map_stores SET alt_store_id = ? WHERE id = ?').run(s6, s5);
    storeStmt.run(userId, 72, 22, 'current', 'food', 'مكان ج', 110, 880, null, 0, null);
    storeStmt.run(userId, 78, 58, 'alt', 'pharmacy', 'مكان د', 90, null, null, null, '٩٠٠ م');

    return userId;
  }

  db.exec('BEGIN');
  let userId;
  try {
    userId = insertAll();
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const counts = {
    users: db.prepare('SELECT COUNT(*) n FROM users').get().n,
    accounts: db.prepare('SELECT COUNT(*) n FROM accounts').get().n,
    transactions: db.prepare('SELECT COUNT(*) n FROM transactions').get().n,
    goals: db.prepare('SELECT COUNT(*) n FROM goals').get().n,
    jamiya_members: db.prepare('SELECT COUNT(*) n FROM jamiya_members').get().n,
    map_stores: db.prepare('SELECT COUNT(*) n FROM map_stores').get().n,
  };
  console.log(`Seeded user #${userId} (فيصل).`, counts);
}

seed();
