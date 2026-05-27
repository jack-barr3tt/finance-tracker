CREATE TYPE period_unit AS ENUM ('day', 'week', 'month', 'year');
CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  master_key VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "bank" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  fixed_products BOOLEAN DEFAULT FALSE,
  csv_import_enabled BOOLEAN DEFAULT TRUE,
  api_import_enabled BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS "account" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  bank_id UUID NOT NULL REFERENCES "bank"(id),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "category" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "category_rule" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES "account"(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES "category"(id) ON DELETE CASCADE,
  description TEXT,
  rule_regex TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "file" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  file_hash TEXT NOT NULL,
  ready BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "transaction" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES "account"(id) ON DELETE CASCADE,
  category_id UUID REFERENCES "category"(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  file_id UUID REFERENCES "file"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  txn_hash TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS "budget_transaction" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES "category"(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  repeat_until period_unit NOT NULL,
  repeat_every DECIMAL(4, 1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "category_budget" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES "category"(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  repeat_every DECIMAL(4, 1) NOT NULL,
  repeat_until period_unit NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS category_budget_active_category_idx ON category_budget (category_id)
WHERE deleted_at IS NULL;
CREATE OR REPLACE FUNCTION update_txn_hash() RETURNS TRIGGER AS $$ BEGIN NEW.txn_hash := encode(
    digest(
      NEW.account_id::text || NEW.amount::text || NEW.description || NEW.date::text,
      'sha256'
    ),
    'hex'
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_update_txn_hash BEFORE
INSERT
  OR
UPDATE ON transaction FOR EACH ROW EXECUTE FUNCTION update_txn_hash();