-- Waffer (وفّر) database schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  monthly_income INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  bank_name TEXT NOT NULL,
  masked_number TEXT NOT NULL,
  kind TEXT NOT NULL,
  balance INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  user_id INTEGER NOT NULL REFERENCES users(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  monthly_cap INTEGER NOT NULL,
  PRIMARY KEY (user_id, category_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  merchant TEXT NOT NULL,
  amount INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, occurred_at);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  accent TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  saved_amount INTEGER NOT NULL DEFAULT 0,
  monthly_contribution INTEGER NOT NULL,
  tag TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jamiya_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  monthly_amount INTEGER NOT NULL,
  current_round INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS jamiya_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES jamiya_groups(id),
  full_name TEXT NOT NULL,
  initial TEXT NOT NULL,
  tone INTEGER NOT NULL,
  status TEXT NOT NULL,
  payout_month TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_me INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS saving_alternatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  type TEXT NOT NULL,
  from_label TEXT NOT NULL,
  from_amount INTEGER NOT NULL,
  to_label TEXT NOT NULL,
  to_amount INTEGER NOT NULL,
  save_amount INTEGER NOT NULL,
  period TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_alternatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  match_merchant TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  alt_label TEXT NOT NULL,
  distance_label TEXT NOT NULL,
  save_amount INTEGER NOT NULL
);

-- NOTE: map_cat is the Map screen's own finer-grained taxonomy
-- (cafe/food/grocery/delivery/pharmacy), distinct from categories(id)
-- (food/car/shop/bills/home/other) used everywhere else — not an FK.
CREATE TABLE IF NOT EXISTS map_stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  type TEXT NOT NULL,
  map_cat TEXT NOT NULL,
  name TEXT NOT NULL,
  avg_amount INTEGER NOT NULL,
  monthly_amount INTEGER,
  alt_store_id INTEGER,
  save_amount INTEGER,
  distance_label TEXT
);
