-- ==============================================================================
-- MCU ROV DRAFT ASSISTANT - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- to create the required tables, Row Level Security (RLS) policies, and Realtime sync.

-- 1. Table: team_rosters (Player Roster & Hero Pool per Team)
CREATE TABLE IF NOT EXISTS public.team_rosters (
  id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL DEFAULT 'MCU Esports',
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: shared_drafts (Draft Simulator Matches & History)
CREATE TABLE IF NOT EXISTS public.shared_drafts (
  id TEXT PRIMARY KEY,
  tournament TEXT NOT NULL DEFAULT 'RoV Tournament',
  match TEXT NOT NULL DEFAULT 'Match',
  game_number INTEGER NOT NULL DEFAULT 1,
  patch TEXT NOT NULL DEFAULT 'Patch 1.56',
  blue_team JSONB NOT NULL DEFAULT '{}'::jsonb,
  red_team JSONB NOT NULL DEFAULT '{}'::jsonb,
  winner TEXT NOT NULL DEFAULT 'undecided',
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  duration_seconds INTEGER DEFAULT 0,
  data JSONB, -- Full record payload for future-proof compatibility
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.team_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_drafts ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Public Access (Read, Insert, Update, Delete)
DROP POLICY IF EXISTS "Public read team_rosters" ON public.team_rosters;
CREATE POLICY "Public read team_rosters" ON public.team_rosters
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public modify team_rosters" ON public.team_rosters;
CREATE POLICY "Public modify team_rosters" ON public.team_rosters
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read shared_drafts" ON public.shared_drafts;
CREATE POLICY "Public read shared_drafts" ON public.shared_drafts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public modify shared_drafts" ON public.shared_drafts;
CREATE POLICY "Public modify shared_drafts" ON public.shared_drafts
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable Realtime Publications for live cross-device sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'team_rosters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_rosters;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'shared_drafts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_drafts;
  END IF;
END $$;
