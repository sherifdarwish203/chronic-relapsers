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

CREATE TABLE IF NOT EXISTS activities (
  id           SERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  act_day      SMALLINT CHECK (act_day BETWEEN 1 AND 31),
  act_month    SMALLINT NOT NULL CHECK (act_month BETWEEN 1 AND 12),
  act_year     SMALLINT NOT NULL,
  type         VARCHAR(30) NOT NULL CHECK (type IN ('individual','group','community')),
  therapist    TEXT,
  summary      TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Tools: Therapeutic exercises (20 Reasons, Black Pictures, Daily Planner, Safety Map, Personal Triangle, Program Principles)
CREATE TABLE IF NOT EXISTS tools (
  id                      SERIAL PRIMARY KEY,
  patient_id              INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tool_type               VARCHAR(50) NOT NULL CHECK (tool_type IN ('twenty_reasons','black_pictures','daily_planner','safety_map','personal_triangle','program_principles','personality_problems','decision_matrix')),
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW(),
  shared_with_therapist   BOOLEAN DEFAULT FALSE,
  shared_at               TIMESTAMP
);

-- Tool 1: Twenty Reasons for Abstinence
CREATE TABLE IF NOT EXISTS twenty_reasons (
  id             SERIAL PRIMARY KEY,
  tool_id        INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  reason_number  SMALLINT NOT NULL CHECK (reason_number BETWEEN 1 AND 20),
  reason_text    TEXT NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(tool_id, reason_number)
);

-- Tool 2: Black Pictures (الصور السوداء) - Relapse Bottom Stories
CREATE TABLE IF NOT EXISTS black_pictures (
  id             SERIAL PRIMARY KEY,
  tool_id        INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  story_number   SMALLINT NOT NULL CHECK (story_number BETWEEN 1 AND 5),
  story_title    TEXT,
  story_text     TEXT NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(tool_id, story_number)
);

-- Tool 3: Daily Planner - Hourly Risk-Classified Schedule
CREATE TABLE IF NOT EXISTS daily_planner (
  id                    SERIAL PRIMARY KEY,
  tool_id               INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  plan_date             DATE NOT NULL,
  hour                  SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  activity_description  TEXT,
  risk_level            VARCHAR(10) NOT NULL CHECK (risk_level IN ('low','high')),
  location              TEXT,
  with_whom             TEXT,
  exact_time            TEXT,
  safety_plan           TEXT,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE(tool_id, plan_date, hour)
);

-- Tool 4: Safety Map (خريطة الأمان)
CREATE TABLE IF NOT EXISTS safety_map_triggers (
  id                    SERIAL PRIMARY KEY,
  tool_id               INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  category              VARCHAR(20) NOT NULL CHECK (category IN ('people','places','situations','habits','instruments','emotions','thoughts')),
  trigger_name          TEXT NOT NULL,
  trigger_description   TEXT,
  risk_score            SMALLINT DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
  risk_level            VARCHAR(10) DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high','critical')),
  notes                 TEXT,
  category_data         JSONB NOT NULL,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE(tool_id, category, trigger_name)
);

CREATE INDEX IF NOT EXISTS idx_safety_map_triggers_tool ON safety_map_triggers(tool_id);
CREATE INDEX IF NOT EXISTS idx_safety_map_triggers_category ON safety_map_triggers(tool_id, category);

-- Tool 5: Personal Triangle (المثلث الشخصي)
CREATE TABLE IF NOT EXISTS personal_triangle_messages (
  id                      SERIAL PRIMARY KEY,
  tool_id                 INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  from_persona            VARCHAR(20) NOT NULL CHECK (from_persona IN ('victim', 'abuser', 'bystander')),
  to_persona              VARCHAR(20) NOT NULL CHECK (to_persona IN ('victim', 'abuser', 'bystander')),
  message_text            TEXT NOT NULL,
  position_order          SMALLINT,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW(),
  UNIQUE(tool_id, from_persona, to_persona)
);

-- Recurring daily journal for abuser thought monitoring
CREATE TABLE IF NOT EXISTS abuser_thought_journal (
  id                      SERIAL PRIMARY KEY,
  tool_id                 INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  journal_date            DATE NOT NULL,
  abuser_thought          TEXT NOT NULL,
  intensity               SMALLINT DEFAULT 5 CHECK (intensity BETWEEN 1 AND 10),
  victim_response         TEXT,
  bystander_analysis      TEXT,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW(),
  UNIQUE(tool_id, journal_date)
);

CREATE INDEX IF NOT EXISTS idx_abuser_thought_journal_tool ON abuser_thought_journal(tool_id);
CREATE INDEX IF NOT EXISTS idx_abuser_thought_journal_date ON abuser_thought_journal(tool_id, journal_date);

-- Tool 6: Program Principles (مبادئ البرنامج)
CREATE TABLE IF NOT EXISTS program_principles (
  id                    SERIAL PRIMARY KEY,
  tool_id               INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  principle_name        TEXT NOT NULL,
  principle_description TEXT NOT NULL,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS principle_examples (
  id                    SERIAL PRIMARY KEY,
  principle_id          INTEGER NOT NULL REFERENCES program_principles(id) ON DELETE CASCADE,
  example_text          TEXT NOT NULL,
  example_date          DATE NOT NULL,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_principles_tool ON program_principles(tool_id);
CREATE INDEX IF NOT EXISTS idx_principle_examples_principle ON principle_examples(principle_id);
CREATE INDEX IF NOT EXISTS idx_principle_examples_date ON principle_examples(principle_id, example_date DESC);

-- Tool 7: Personality Problems (العيوب الشخصيه)
CREATE TABLE IF NOT EXISTS personality_problems (
  id                    SERIAL PRIMARY KEY,
  tool_id               INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  problem_name          TEXT NOT NULL,
  problem_description   TEXT NOT NULL,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personality_problem_examples (
  id                    SERIAL PRIMARY KEY,
  problem_id            INTEGER NOT NULL REFERENCES personality_problems(id) ON DELETE CASCADE,
  example_text          TEXT NOT NULL,
  example_date          DATE NOT NULL,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personality_problems_tool ON personality_problems(tool_id);
CREATE INDEX IF NOT EXISTS idx_personality_problem_examples_problem ON personality_problem_examples(problem_id);
CREATE INDEX IF NOT EXISTS idx_personality_problem_examples_date ON personality_problem_examples(problem_id, example_date DESC);

-- Tool 8: Decision Matrix (جدول الأرباح و الخسائر)
CREATE TABLE IF NOT EXISTS decision_matrix_items (
  id                    SERIAL PRIMARY KEY,
  tool_id               INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  category              VARCHAR(30) NOT NULL CHECK (category IN ('pros_using','cons_using','pros_abstinent','cons_abstinent')),
  item_text             TEXT NOT NULL,
  position_order        SMALLINT,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_matrix_tool ON decision_matrix_items(tool_id);
CREATE INDEX IF NOT EXISTS idx_decision_matrix_category ON decision_matrix_items(tool_id, category);

-- Idempotent column migrations: safe to run on existing databases.
-- Add new columns here whenever the schema evolves.
ALTER TABLE patients ADD COLUMN IF NOT EXISTS substances   TEXT[] DEFAULT '{}';
ALTER TABLE periods  ADD COLUMN IF NOT EXISTS substances   TEXT[] DEFAULT '{}';
ALTER TABLE periods  ADD COLUMN IF NOT EXISTS urge_data    JSONB DEFAULT NULL;
ALTER TABLE periods  ADD COLUMN IF NOT EXISTS sort_order   INTEGER;
ALTER TABLE periods  ADD COLUMN IF NOT EXISTS start_day    SMALLINT CHECK (start_day BETWEEN 1 AND 31);
