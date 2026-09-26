import React, { useState } from 'react';
import {
  getCustomSupabaseCredentials,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
  isSupabaseConfigured,
  SUPABASE_URL,
} from '../services/supabase';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, X, RefreshCw } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: 'supabase' | 'firebase' | 'local';
}

const SQL_SCHEMA_SNIPPET = `-- Run this in your Supabase SQL Editor:
create table if not exists public.team_rosters (
  id text primary key,
  team_name text default 'MCU Esports',
  players jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.shared_drafts (
  id text primary key,
  tournament text not null,
  match text not null,
  game_number integer default 1,
  patch text,
  blue_team jsonb not null,
  red_team jsonb not null,
  winner text default 'undecided',
  notes text default '',
  tags text[] default '{}',
  duration_seconds integer default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.team_rosters enable row level security;
alter table public.shared_drafts enable row level security;

create policy "Public read team_rosters" on public.team_rosters for select using (true);
create policy "Public upsert team_rosters" on public.team_rosters for all using (true);

create policy "Public read shared_drafts" on public.shared_drafts for select using (true);
create policy "Public upsert shared_drafts" on public.shared_drafts for all using (true);

alter publication supabase_realtime add table public.team_rosters;
alter publication supabase_realtime add table public.shared_drafts;`;

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  activeProvider,
}) => {
  const currentCreds = getCustomSupabaseCredentials();
  const [urlInput, setUrlInput] = useState(currentCreds.url || SUPABASE_URL);
  const [keyInput, setKeyInput] = useState(currentCreds.key);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(urlInput, keyInput);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'การเชื่อมต่อขัดข้อง' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseCredentials(urlInput.trim(), keyInput.trim());
    setTestResult({
      success: true,
      message: 'บันทึกการตั้งค่า Supabase เรียบร้อยแล้ว ระบบเริ่มซิงค์ทันที!',
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    clearCustomSupabaseCredentials();
    setUrlInput('');
    setKeyInput('');
    setTestResult({
      success: true,
      message: 'ล้างการตั้งค่าแล้ว ระบบจะสลับไปใช้ Firebase Cloud หรือ LocalStorage อัตโนมัติ',
    });
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e0e14] border border-white/20 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 font-['Kanit'] text-white max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-emerald-400" />
            <h3 className="font-['Orbitron'] font-bold text-base tracking-wider text-white">
              ตั้งค่า Backend & Supabase
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Current Active Backend Status */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">สถานะ Backend ปัจจุบัน:</span>
            {activeProvider === 'supabase' && isSupabaseConfigured ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase (Realtime Sync)
              </span>
            ) : activeProvider === 'firebase' ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-950/80 text-sky-300 border border-sky-500/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Firebase Cloud (Firestore Live)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
                LocalStorage (Offline Mode)
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-white/75 leading-relaxed">
          คุณสามารถกรอก <strong>Project URL</strong> และ <strong>anon public key</strong> ของโปรเจกต์ Supabase ของคุณด้านล่าง เพื่อบันทึกและซิงค์ข้อมูลผู้เล่นและประวัติดราฟขึ้น Supabase ของคุณได้ทันที (หากเว้นว่างไว้ ระบบจะซิงค์ผ่าน Cloud อัตโนมัติโดยข้อมูลไม่สูญหาย)
        </p>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-white/80 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              className="w-full bg-black/60 border border-white/20 focus:border-emerald-400 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-white/80 mb-1">
              Supabase Anon Public Key
            </label>
            <textarea
              rows={2}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-black/60 border border-white/20 focus:border-emerald-400 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none transition-colors resize-none"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/50 text-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !urlInput.trim() || !keyInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
                <span>{testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
              </button>

              {(urlInput || keyInput) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 rounded-lg text-white/50 hover:text-red-300 font-['Barlow_Condensed'] text-xs hover:bg-white/5"
                >
                  ล้างค่า
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-['Barlow_Condensed'] font-bold text-xs"
              >
                ปิด
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-['Barlow_Condensed'] font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>บันทึกและเชื่อมต่อ</span>
              </button>
            </div>
          </div>
        </form>

        {/* Collapsible Supabase SQL schema copy section */}
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className="text-[11px] text-white/60 hover:text-white flex items-center justify-between w-full font-['Barlow_Condensed'] font-bold uppercase tracking-wider py-1"
          >
            <span>📜 ดูโค้ดสร้างตารางใน Supabase (SQL Schema)</span>
            <span>{showSql ? '▲ ซ่อน' : '▼ แสดง'}</span>
          </button>

          {showSql && (
            <div className="mt-2 p-3 bg-black/80 border border-white/15 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-white/70">
                <span className="font-mono text-[10px]">supabase/schema.sql</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-['Barlow_Condensed'] text-[11px] flex items-center gap-1 font-bold"
                >
                  {copiedSql ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedSql ? 'คัดลอกแล้ว' : 'คัดลอก SQL'}</span>
                </button>
              </div>
              <pre className="p-2 bg-black/60 rounded border border-white/5 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-44 custom-scrollbar whitespace-pre">
                {SQL_SCHEMA_SNIPPET}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
