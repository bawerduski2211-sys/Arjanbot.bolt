-- ============================================================
-- ARJAN Platform Schema — Profiles, Bots, Messages Log
-- ============================================================
-- This migration has already been applied to the Supabase instance.
-- This file is provided as a reference copy of the full schema.
--
-- Tables:
--   1. profiles       — user profile/plan data (1:1 with auth.users)
--   2. bots           — bot configurations (WhatsApp/Telegram)
--   3. messages_log   — incoming/outgoing message records
--
-- Security:
--   - RLS enabled on all tables
--   - Owner-scoped CRUD policies (auth.uid() checks)
--   - messages_log scoped via subquery on bots.user_id
--
-- Automation:
--   - handle_new_user() trigger → auto-creates profile on signup
--   - enforce_bot_limit() trigger → prevents exceeding plan bot limit
--   - pg_cron job → daily cleanup of messages older than 90 days
--
-- Notes:
--   - api_token stores ONLY encrypted ciphertext (app-layer encryption)
--   - qr_code is written by an external worker service, not this app
--   - pg_cron extension is required for the scheduled cleanup job
-- ============================================================

-- ========================================================
-- profiles
-- ========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  plan text NOT NULL DEFAULT 'STARTER' CHECK (plan IN ('STARTER', 'PRO', 'ENTERPRISE')),
  bot_limit int NOT NULL DEFAULT 1,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ========================================================
-- bots
-- ========================================================
CREATE TABLE IF NOT EXISTS bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
  bot_name text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connected', 'qr_ready')),
  api_token text,
  webhook_url text,
  qr_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);

ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bots" ON bots;
CREATE POLICY "select_own_bots" ON bots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bots" ON bots;
CREATE POLICY "insert_own_bots" ON bots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bots" ON bots;
CREATE POLICY "update_own_bots" ON bots FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bots" ON bots;
CREATE POLICY "delete_own_bots" ON bots FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========================================================
-- messages_log
-- ========================================================
CREATE TABLE IF NOT EXISTS messages_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  sender text,
  message_text text,
  ai_response text,
  request_timestamp timestamptz NOT NULL DEFAULT now(),
  response_timestamp timestamptz,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_messages_log_bot_id ON messages_log(bot_id);
CREATE INDEX IF NOT EXISTS idx_messages_log_request_ts ON messages_log(request_timestamp);

ALTER TABLE messages_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages_log;
CREATE POLICY "select_own_messages" ON messages_log FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bots WHERE bots.id = messages_log.bot_id AND bots.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_messages" ON messages_log;
CREATE POLICY "insert_own_messages" ON messages_log FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM bots WHERE bots.id = messages_log.bot_id AND bots.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_messages" ON messages_log;
CREATE POLICY "update_own_messages" ON messages_log FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM bots WHERE bots.id = messages_log.bot_id AND bots.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM bots WHERE bots.id = messages_log.bot_id AND bots.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_messages" ON messages_log;
CREATE POLICY "delete_own_messages" ON messages_log FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bots WHERE bots.id = messages_log.bot_id AND bots.user_id = auth.uid())
  );

-- ========================================================
-- Trigger: handle_new_user — auto-create profile on signup
-- ========================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bot_limit int;
BEGIN
  v_bot_limit := CASE
    WHEN new.raw_app_meta_data->>'plan' = 'PRO' THEN 5
    WHEN new.raw_app_meta_data->>'plan' = 'ENTERPRISE' THEN 999
    ELSE 1
  END;

  INSERT INTO profiles (id, email, full_name, plan, bot_limit)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_app_meta_data->>'plan', 'STARTER'),
    v_bot_limit
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================================================
-- Trigger: enforce_bot_limit — prevent exceeding bot_limit
-- ========================================================
CREATE OR REPLACE FUNCTION enforce_bot_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
  v_count int;
BEGIN
  SELECT bot_limit INTO v_limit FROM profiles WHERE id = new.user_id;
  IF v_limit IS NULL THEN
    v_limit := 1;
  END IF;

  SELECT count(*) INTO v_count FROM bots WHERE user_id = new.user_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Bot limit reached (%). Upgrade your plan to add more bots.', v_limit;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_bot ON bots;
CREATE TRIGGER before_insert_bot
  BEFORE INSERT ON bots
  FOR EACH ROW EXECUTE FUNCTION enforce_bot_limit();

-- ========================================================
-- pg_cron: scheduled cleanup of old messages_log rows
-- Runs daily at 03:00 UTC, deletes rows older than 90 days
-- ========================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup_old_messages');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'cleanup_old_messages',
  '0 3 * * *',
  $$DELETE FROM messages_log WHERE request_timestamp < now() - interval '90 days'$$
);
