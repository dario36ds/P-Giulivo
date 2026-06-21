-- Schema Turso/libSQL — backend Giulivo
-- restaurant_slug è già previsto per un futuro backend condiviso multi-ristorante.

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_slug TEXT NOT NULL DEFAULT 'giulivo',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  reservation_date TEXT NOT NULL,
  reservation_time TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | declined | completed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_slug ON reservations(restaurant_slug);
