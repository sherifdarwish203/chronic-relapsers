-- Recovery Journey Database Schema

CREATE TABLE IF NOT EXISTS patients (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(20) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  substances   TEXT[] DEFAULT '{}',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS periods (
  id               SERIAL PRIMARY KEY,
  patient_id       INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  type             VARCHAR(20) NOT NULL CHECK (type IN ('abstinent','relapse','reduced')),
  start_month      SMALLINT NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  start_year       SMALLINT NOT NULL,
  end_month        SMALLINT CHECK (end_month BETWEEN 1 AND 12),
  end_year         SMALLINT,
  duration_months  INTEGER,
  note             TEXT,
  substances       TEXT[] DEFAULT '{}',
  urge_data        JSONB DEFAULT NULL,
  sort_order       INTEGER,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id                 SERIAL PRIMARY KEY,
  period_id          INTEGER REFERENCES periods(id) ON DELETE CASCADE,
  patient_id         INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  description        TEXT NOT NULL,
  timeframe          VARCHAR(20) CHECK (timeframe IN ('same_day','days','weeks','months')),
  feelings           TEXT[] DEFAULT '{}',
  external_triggers  TEXT[] DEFAULT '{}',
  internal_triggers  TEXT[] DEFAULT '{}',
  classification     VARCHAR(5) CHECK (classification IN ('i','x','b')),
  saw_it_coming      VARCHAR(5) CHECK (saw_it_coming IN ('y','p','n')),
  created_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facilitators (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Updated_at trigger for patients
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Idempotent column migrations: safe to run on existing databases.
-- Add new columns here whenever the schema evolves.
ALTER TABLE patients ADD COLUMN IF NOT EXISTS substances   TEXT[] DEFAULT '{}';
ALTER TABLE periods  ADD COLUMN IF NOT EXISTS substances   TEXT[] DEFAULT '{}';
ALTER TABLE periods  ADD COLUMN IF NOT EXISTS urge_data    JSONB DEFAULT NULL;
ALTER TABLE periods  ADD COLUMN IF NOT EXISTS sort_order   INTEGER;
