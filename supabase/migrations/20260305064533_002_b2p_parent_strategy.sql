-- ============================================================
-- Proctor Mind — Migration 002: B2P Parent Strategy
-- Run AFTER the original migration in Supabase SQL Editor
-- ============================================================

-- ── 1. ALTER profiles — add new columns ─────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_count          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date      DATE,
  ADD COLUMN IF NOT EXISTS onboarding_complete   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS target_college        TEXT,
  ADD COLUMN IF NOT EXISTS weak_subjects         TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS study_hours_per_day   INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS city                  TEXT,
  ADD COLUMN IF NOT EXISTS parent_invite_token   TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  ADD COLUMN IF NOT EXISTS parent_linked         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dismiss_parent_cta_at TIMESTAMPTZ;

-- ── 2. parent_links ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship     TEXT DEFAULT 'parent',
  linked_at        TIMESTAMPTZ DEFAULT NOW(),
  is_active        BOOLEAN DEFAULT TRUE,
  whatsapp_number  TEXT,
  digest_opt_in    BOOLEAN DEFAULT TRUE,
  nudge_opt_in     BOOLEAN DEFAULT TRUE,
  UNIQUE(parent_id, student_id)
);

ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_view_own_links"
  ON parent_links FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "students_view_their_trackers"
  ON parent_links FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "parents_insert_links"
  ON parent_links FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "parents_update_links"
  ON parent_links FOR UPDATE USING (auth.uid() = parent_id);

-- ── 3. user_subscriptions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'free',
  price_paid           INTEGER DEFAULT 0,
  started_at           TIMESTAMPTZ DEFAULT NOW(),
  expires_at           TIMESTAMPTZ,
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  status               TEXT DEFAULT 'active',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_subs"
  ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_subs"
  ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 4. whatsapp_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number     TEXT NOT NULL,
  message_type     TEXT NOT NULL,
  content          JSONB DEFAULT '{}',
  sent_at          TIMESTAMPTZ DEFAULT NOW(),
  wati_message_id  TEXT,
  status           TEXT DEFAULT 'sent'
);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_wa_logs"
  ON whatsapp_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ── 5. college_predictor_data ───────────────────────────────
CREATE TABLE IF NOT EXISTS college_predictor_data (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name  TEXT NOT NULL,
  city          TEXT NOT NULL,
  branch        TEXT NOT NULL,
  cutoff_2024   INTEGER,
  cutoff_2023   INTEGER,
  cutoff_2022   INTEGER,
  type          TEXT DEFAULT 'government'
);

-- No RLS needed — this is public reference data
ALTER TABLE college_predictor_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_reads_colleges"
  ON college_predictor_data FOR SELECT USING (TRUE);

-- ── 6. Seed college predictor data ──────────────────────────
INSERT INTO college_predictor_data (college_name, city, branch, cutoff_2024, cutoff_2023, cutoff_2022, type) VALUES
  ('COEP Pune',                   'Pune',    'Computer Engineering',      99, 98, 97, 'government'),
  ('COEP Pune',                   'Pune',    'Mechanical Engineering',     96, 95, 94, 'government'),
  ('COEP Pune',                   'Pune',    'Civil Engineering',          92, 91, 90, 'government'),
  ('VJTI Mumbai',                 'Mumbai',  'Computer Engineering',       98, 97, 97, 'government'),
  ('VJTI Mumbai',                 'Mumbai',  'Electronics Engineering',    96, 95, 94, 'government'),
  ('VJTI Mumbai',                 'Mumbai',  'Mechanical Engineering',     94, 93, 92, 'government'),
  ('ICT Mumbai',                  'Mumbai',  'Chemical Engineering',       97, 96, 95, 'government'),
  ('PICT Pune',                   'Pune',    'Computer Engineering',       95, 94, 93, 'aided'),
  ('PICT Pune',                   'Pune',    'Electronics Engineering',    91, 90, 89, 'aided'),
  ('MIT Pune',                    'Pune',    'Computer Engineering',       88, 87, 86, 'private'),
  ('MIT Pune',                    'Pune',    'Mechanical Engineering',     82, 81, 80, 'private'),
  ('VIT Pune',                    'Pune',    'Computer Engineering',       87, 86, 85, 'private'),
  ('Symbiosis Institute',         'Pune',    'Computer Engineering',       85, 84, 83, 'private'),
  ('SPIT Mumbai',                 'Mumbai',  'Computer Engineering',       93, 92, 91, 'aided'),
  ('SPIT Mumbai',                 'Mumbai',  'Electronics Engineering',    89, 88, 87, 'aided'),
  ('KJ Somaiya Mumbai',           'Mumbai',  'Computer Engineering',       88, 87, 86, 'private'),
  ('GCOE Nashik',                 'Nashik',  'Computer Engineering',       84, 83, 82, 'government'),
  ('GCOE Nashik',                 'Nashik',  'Mechanical Engineering',     78, 77, 76, 'government'),
  ('MGM Aurangabad',              'Aurangabad', 'Computer Engineering',    76, 75, 74, 'private'),
  ('RCOEM Nagpur',                'Nagpur',  'Computer Engineering',       82, 81, 80, 'private'),
  ('YCCE Nagpur',                 'Nagpur',  'Computer Engineering',       78, 77, 76, 'private'),
  ('Walchand Sangli',             'Sangli',  'Computer Engineering',       83, 82, 81, 'government'),
  ('Walchand Sangli',             'Sangli',  'Mechanical Engineering',     77, 76, 75, 'government'),
  ('BVDU Pune',                   'Pune',    'Computer Engineering',       83, 82, 81, 'private'),
  ('DY Patil Pune',               'Pune',    'Computer Engineering',       79, 78, 77, 'private')
ON CONFLICT DO NOTHING;

-- ── 7. Helper function: update streak on exam submission ─────
CREATE OR REPLACE FUNCTION update_student_streak(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    streak_count = CASE
      WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day'
        THEN streak_count + 1
      WHEN last_active_date = CURRENT_DATE
        THEN streak_count
      ELSE 1
    END,
    last_active_date = CURRENT_DATE
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. Helper function: get student stats for parent digest ──
CREATE OR REPLACE FUNCTION get_student_stats_for_parent(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'name',             p.name,
    'city',             p.city,
    'streak',           p.streak_count,
    'target_college',   p.target_college,
    'last_active',      p.last_active_date,
    'questions_today',  COALESCE((
      SELECT COUNT(*) FROM exam_results er
      WHERE er.user_id = p_student_id
        AND er.submitted_at::DATE = CURRENT_DATE
    ), 0),
    'accuracy_today',   COALESCE((
      SELECT ROUND(AVG(
        (er.scores->>'percentage')::NUMERIC
      ), 1)
      FROM exam_results er
      WHERE er.user_id = p_student_id
        AND er.submitted_at::DATE >= CURRENT_DATE - INTERVAL '7 days'
    ), 0)
  )
  INTO v_result
  FROM profiles p
  WHERE p.user_id = p_student_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. View: parent_student_overview ────────────────────────
CREATE OR REPLACE VIEW parent_student_overview AS
SELECT
  pl.parent_id,
  pl.student_id,
  pl.whatsapp_number,
  pl.digest_opt_in,
  pl.nudge_opt_in,
  p.name                AS student_name,
  p.email               AS student_email,
  p.city                AS student_city,
  p.streak_count,
  p.last_active_date,
  p.target_college,
  p.weak_subjects,
  p.onboarding_complete,
  us.plan               AS subscription_plan
FROM parent_links pl
JOIN profiles p ON p.user_id = pl.student_id
LEFT JOIN user_subscriptions us
  ON us.user_id = pl.parent_id
  AND us.status = 'active'
  AND us.plan = 'parent_pass'
WHERE pl.is_active = TRUE;

-- ── 10. pg_cron jobs (run separately if pg_cron is enabled) ──
-- SELECT cron.schedule('nightly-parent-digest', '30 15 * * *',
--   $$SELECT net.http_post('https://YOUR_PROJECT.supabase.co/functions/v1/whatsapp-digest',
--     '{}', 'application/json',
--     '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}')$$
-- );
--
-- SELECT cron.schedule('inactivity-nudge-check', '0 */6 * * *',
--   $$SELECT net.http_post('https://YOUR_PROJECT.supabase.co/functions/v1/parent-nudge',
--     '{}', 'application/json',
--     '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}')$$
-- );
