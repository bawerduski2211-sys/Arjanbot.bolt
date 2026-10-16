/*
# ARJAN Platform Schema — Profiles, Bots, Messages Log

## Overview
Creates the core data model for the ARJAN AI-powered WhatsApp & Telegram bot
management platform. Three tables (profiles, bots, messages_log) with full
Row Level Security, automated triggers for new-user provisioning and bot-limit
enforcement, and a scheduled cleanup job for old message logs.

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per authenticated user
- `email` (text, not null) — cached email from auth.users
- `full_name` (text, nullable) — display name
- `plan` (text, default 'STARTER') — subscription tier; CHECK STARTER/PRO/ENTERPRISE
- `bot_limit` (int, default 1) — max bots the user can create
- `stripe_customer_id` (text, nullable) — Stripe customer reference
- `stripe_subscription_id` (text, nullable) — Stripe subscription reference
- `created_at` (timestamptz, default now())

### bots
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, FK → profiles.id ON DELETE CASCADE)
- `platform` (text) — CHECK 'whatsapp'/'telegram'
- `bot_name` (text, not null)
- `status` (text, default 'disconnected') — CHECK disconnected/connected/qr_ready
- `api_token` (text) — stores encrypted ciphertext only (app layer encrypts before insert)
- `webhook_url` (text, nullable)
- `qr_code` (text, nullable) — base64 QR image pushed by external worker
- `created_at` (timestamptz, default now())

### messages_log
- `id` (uuid, PK, default gen_random_uuid())
- `bot_id` (uuid, FK → bots.id ON DELETE CASCADE)
- `sender` (text)
- `message_text` (text)
- `ai_response` (text)
- `request_timestamp` (timestamptz)
- `response_timestamp` (timestamptz, nullable)
- `status` (text, default 'success') — CHECK success/failed

## Security (RLS)
- RLS enabled on all three tables.
- profiles: owner-scoped CRUD (id = auth.uid()).
- bots: owner-scoped CRUD (user_id = auth.uid()).
- messages_log: owner-scoped CRUD via subquery on bots (bot's user_id = auth.uid()).

## Triggers / Functions
- `handle_new_user()`: AFTER INSERT on auth.users → creates a matching profiles row.
- `enforce_bot_limit()`: BEFORE INSERT on bots → raises exception if user's bot
  count >= their profiles.bot_limit.

## Scheduled Jobs
- pg_cron job `cleanup_old_messages` deletes messages_log rows older than 90 days,
  scheduled daily at 03:00 UTC. Requires the pg_cron extension.

## Important Notes
1. The `api_token` column stores ONLY encrypted ciphertext. The application layer
   is responsible for encrypting the token before inserting. The database never
   sees plaintext tokens.
2. The `qr_code` column is written by an external worker service (not this app)
   after a WhatsApp bot is created with status 'qr_ready'. The frontend subscribes
   via Supabase Realtime to display the QR when it arrives.
3. pg_cron extension must be enabled. The migration enables it and schedules the job.
*/

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