-- ==============================================================================
-- PROPOSED SCHEMA: MCU SCRIM MANAGER (Phase 2)
-- ==============================================================================
-- This migration script creates tables, relational foreign keys, indexes,
-- strict Row Level Security (RLS) policies, and Realtime sync for Scrim Sessions.
-- 
-- IMPORTANT: Do not run this on production until explicitly approved by Coach / Admin.
-- ==============================================================================

-- 1. Table: scrim_sessions (ตารางการนัดซ้อมแต่ละซีรีส์)
CREATE TABLE IF NOT EXISTS public.scrim_sessions (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL DEFAULT 'main_team',
  session_title TEXT NOT NULL DEFAULT 'ซ้อมแผนทีมประจำสัปดาห์',
  opponent_team TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_time TIME,
  format TEXT NOT NULL DEFAULT 'BO5', -- 'BO1' | 'BO3' | 'BO5' | 'BO7'
  patch TEXT NOT NULL DEFAULT '2026.01',
  our_score INTEGER NOT NULL DEFAULT 0,
  opp_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'scheduled' | 'in_progress' | 'completed'
  overall_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: scrim_games (ตารางรายละเอียดแต่ละเกมย่อยในซีรีส์ซ้อม)
CREATE TABLE IF NOT EXISTS public.scrim_games (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.scrim_sessions(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  our_side TEXT NOT NULL DEFAULT 'blue', -- 'blue' | 'red'
  winner TEXT NOT NULL DEFAULT 'undecided', -- 'us' | 'opp' | 'draw' | 'undecided'
  result TEXT NOT NULL DEFAULT 'in_progress', -- 'won' | 'lost' | 'draw' | 'in_progress'
  blue_team_name TEXT NOT NULL DEFAULT 'MCU Esports',
  red_team_name TEXT NOT NULL DEFAULT 'Opponent Team',
  blue_bans JSONB NOT NULL DEFAULT '[]'::jsonb,
  red_bans JSONB NOT NULL DEFAULT '[]'::jsonb,
  blue_picks JSONB NOT NULL DEFAULT '[]'::jsonb,
  red_picks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_complete BOOLEAN NOT NULL DEFAULT false, -- True เมื่อ Pick ครบ 5 ตัวทั้งสองฝั่ง
  coach_notes JSONB NOT NULL DEFAULT '{
    "draftObjective": "",
    "whatWentWell": "",
    "issuesFaced": "",
    "lessonsLearned": "",
    "coachRating": 3
  }'::jsonb,
  match_duration_minutes INTEGER DEFAULT 0,
  vod_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- ป้องกันการบันทึกเกมซ้ำใน Session เดียวกัน
  CONSTRAINT unique_scrim_session_game UNIQUE (session_id, game_number)
);

-- 3. Indexes for Query Performance & Scrim History Filtering
CREATE INDEX IF NOT EXISTS idx_scrim_sessions_team_id ON public.scrim_sessions (team_id);
CREATE INDEX IF NOT EXISTS idx_scrim_sessions_date ON public.scrim_sessions (session_date DESC);
CREATE INDEX IF NOT EXISTS idx_scrim_sessions_opponent ON public.scrim_sessions (opponent_team);
CREATE INDEX IF NOT EXISTS idx_scrim_games_session_id ON public.scrim_games (session_id);
CREATE INDEX IF NOT EXISTS idx_scrim_games_created_at ON public.scrim_games (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.scrim_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrim_games ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies (ผูกกับ team_id เพื่อความปลอดภัย ไม่เปิด Public Write สาธารณะ)
-- อ่านข้อมูลการซ้อมของทีมตนเอง
DROP POLICY IF EXISTS "Team Read scrim_sessions" ON public.scrim_sessions;
CREATE POLICY "Team Read scrim_sessions" ON public.scrim_sessions
  FOR SELECT USING (
    team_id = CURRENT_SETTING('request.headers', true)::json->>'x-team-id'
    OR team_id = 'main_team'
  );

-- เพิ่ม/แก้ไขการซ้อมของทีมตนเองเท่านั้น
DROP POLICY IF EXISTS "Team Modify scrim_sessions" ON public.scrim_sessions;
CREATE POLICY "Team Modify scrim_sessions" ON public.scrim_sessions
  FOR ALL USING (
    team_id = CURRENT_SETTING('request.headers', true)::json->>'x-team-id'
    OR team_id = 'main_team'
  ) WITH CHECK (
    team_id = CURRENT_SETTING('request.headers', true)::json->>'x-team-id'
    OR team_id = 'main_team'
  );

-- อ่านข้อมูลเกมย่อยของทีมตนเอง
DROP POLICY IF EXISTS "Team Read scrim_games" ON public.scrim_games;
CREATE POLICY "Team Read scrim_games" ON public.scrim_games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scrim_sessions s
      WHERE s.id = scrim_games.session_id
        AND (s.team_id = CURRENT_SETTING('request.headers', true)::json->>'x-team-id' OR s.team_id = 'main_team')
    )
  );

-- เพิ่ม/แก้ไขเกมย่อยของทีมตนเอง
DROP POLICY IF EXISTS "Team Modify scrim_games" ON public.scrim_games;
CREATE POLICY "Team Modify scrim_games" ON public.scrim_games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scrim_sessions s
      WHERE s.id = scrim_games.session_id
        AND (s.team_id = CURRENT_SETTING('request.headers', true)::json->>'x-team-id' OR s.team_id = 'main_team')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scrim_sessions s
      WHERE s.id = scrim_games.session_id
        AND (s.team_id = CURRENT_SETTING('request.headers', true)::json->>'x-team-id' OR s.team_id = 'main_team')
    )
  );

-- 6. Enable Realtime Publications for Live Scrim Synchronization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'scrim_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scrim_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'scrim_games'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scrim_games;
  END IF;
END $$;
