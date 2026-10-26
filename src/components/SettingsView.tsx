import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Swords, 
  Trophy, 
  Search, 
  Cpu, 
  BarChart3, 
  Scale, 
  FileText, 
  LayoutDashboard, 
  ExternalLink, 
  Lock, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AppView } from './BrandBar';

interface SettingsViewProps {
  onSelectView: (view: AppView) => void;
  teamId: string;
  onChangeTeamId: (newId: string) => void;
  isCloudConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onForceSync: () => Promise<boolean>;
  onReloadCloud: () => Promise<boolean>;
  onOpenDataModal: () => void;
  draftsCount?: number;
  playersCount?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onSelectView,
  teamId,
  onChangeTeamId,
  isCloudConnected,
  isSyncing,
  lastSyncedAt,
  onForceSync,
  onReloadCloud,
  onOpenDataModal,
  draftsCount = 0,
  playersCount = 0,
}) => {
  const [editingTeamId, setEditingTeamId] = useState(teamId);
  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleSaveTeamId = () => {
    if (editingTeamId.trim()) {
      onChangeTeamId(editingTeamId.trim());
      setIsChangingTeam(false);
    }
  };

  const handleManualSync = async () => {
    setSyncStatusMsg('กำลังส่งข้อมูลขึ้น Cloud...');
    const ok = await onForceSync();
    if (ok) {
      setSyncStatusMsg('✅ ซิงค์ข้อมูลกับ Cloud สำเร็จ');
    } else {
      setSyncStatusMsg('⚠️ ซิงค์ข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ');
    }
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleManualReload = async () => {
    setSyncStatusMsg('กำลังดึงข้อมูลล่าสุดจาก Cloud...');
    const ok = await onReloadCloud();
    if (ok) {
      setSyncStatusMsg('✅ ดึงข้อมูลล่าสุดสำเร็จ');
    } else {
      setSyncStatusMsg('⚠️ ไม่สามารถดึงข้อมูลได้');
    }
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const coachModules = [
    {
      id: 'match_prep' as AppView,
      title: 'รายงานเตรียมแข่ง (Match Prep)',
      desc: 'วิเคราะห์คู่แข่ง แผน A/B สถิติ Head-to-Head และชุดคำแนะนำโค้ชก่อนเริ่มแข่ง',
      icon: <FileText className="text-[#E91E63]" size={18} />,
      badge: 'แนะนำก่อนแข่ง',
      badgeColor: 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1]',
    },
    {
      id: 'series_prep' as AppView,
      title: 'แผนซีรีส์ (BO3 / BO5 / BO7)',
      desc: 'จำลอง Global Ban/Pick วางแผนฮีโร่ล่วงหน้าข้ามหลายเกมในแมตช์เดียว',
      icon: <Trophy className="text-amber-500" size={18} />,
      badge: 'ทัวร์นาเมนต์',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'scouting' as AppView,
      title: 'สเกาต์คู่แข่ง (Scouting Database)',
      desc: 'วิเคราะห์ Pool ฮีโร่ทีมตรงข้าม Win Rate และจัดทำ Directives รับมือ',
      icon: <Search className="text-sky-500" size={18} />,
      badge: 'ฐานข้อมูล',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'simulator' as AppView,
      title: 'ดราฟต์ซิมูเลเตอร์ (Draft Simulator)',
      desc: 'ห้องทดลอง Sandbox ดราฟต์จำลองสถานการณ์ Ban/Pick แบบไม่กระทบแมตช์จริง',
      icon: <Cpu className="text-purple-500" size={18} />,
      badge: 'Sandbox',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'scrim' as AppView,
      title: 'ผลงานทีมซ้อม Scrim (Scrim Analytics)',
      desc: 'บันทึกแมตช์ซ้อม วินเรทคอมโบ และประเมินจุดแข็ง-จุดอ่อนทีม MCU',
      icon: <BarChart3 className="text-emerald-500" size={18} />,
      badge: 'ซ้อมทีม',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'calibration' as AppView,
      title: 'ปรับแต่งสูตรคำนวณ (Formula Calibration)',
      desc: 'ตรวจสอบความแม่นยำ AI ปรับค่าน้ำหนัก Synergies และคะแนนความถนัดนักแข่ง',
      icon: <Scale className="text-indigo-500" size={18} />,
      badge: 'สำหรับโค้ช',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'dashboard' as AppView,
      title: 'แดชบอร์ดภาพรวมผู้บริหาร (Overview)',
      desc: 'สรุปภาพรวมทีม ผลงานสถิติย้อนหลัง และสถานะความพร้อมนักแข่งแบบ All-in-One',
      icon: <LayoutDashboard className="text-rose-500" size={18} />,
      badge: 'ภาพรวม',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-12 font-['Prompt']">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-white via-[#FFF0F5] to-white border border-[#F3D5E2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#E91E63] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/20 flex-shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>ตั้งค่า & เครื่องมือขั้นสูง</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]">
                MCU Esports v2.6
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              จัดการการเชื่อมต่อ Cloud, ฐานข้อมูล และเครื่องมือเตรียมทีมสำหรับโค้ช
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectView('draft')}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F3D5E2] text-[#E91E63] text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Swords size={14} />
          <span>กลับไปหน้าดราฟต์</span>
        </button>
      </div>

      {/* Grid: 1. Cloud & Data Layer (Left), 2. Quick Actions & Status (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Cloud & Database Status */}
        <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Cloud size={16} className="text-[#E91E63]" />
                <span>การเชื่อมต่อ Cloud Supabase</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                isCloudConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isCloudConnected ? (
                  <>
                    <CheckCircle2 size={11} />
                    <span>เชื่อมต่อแล้ว</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={11} />
                    <span>โหมดออฟไลน์ (Local)</span>
                  </>
                )}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-700 block text-[11.5px]">รหัสทีม (Team ID):</span>
                  {isChangingTeam ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        value={editingTeamId}
                        onChange={(e) => setEditingTeamId(e.target.value)}
                        className="px-2 py-0.5 bg-white border border-[#E91E63] rounded text-xs font-mono font-bold text-slate-800 outline-none w-28"
                      />
                      <button
                        onClick={handleSaveTeamId}
                        className="px-2 py-0.5 bg-[#E91E63] text-white rounded text-[11px] font-bold hover:bg-[#D81B60] cursor-pointer"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => {
                          setEditingTeamId(teamId);
                          setIsChangingTeam(false);
                        }}
                        className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] hover:bg-slate-300 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-[#E91E63] text-xs">{teamId}</span>
                  )}
                </div>
                {!isChangingTeam && (
                  <button
                    onClick={() => setIsChangingTeam(true)}
                    className="text-[11px] text-[#E91E63] font-semibold hover:underline cursor-pointer"
                  >
                    เปลี่ยนรหัส
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed">
                ระบบจะซิงค์รายชื่อนักแข่งและบันทึกดราฟต์ไปยัง Cloud อัตโนมัติ เพื่อให้โค้ชและนักแข่งในทีมเข้าถึงข้อมูลชุดเดียวกันได้จากทุกเครื่อง
              </div>

              {lastSyncedAt && (
                <div className="text-[10px] text-slate-400">
                  ซิงค์ล่าสุด: {new Date(lastSyncedAt).toLocaleTimeString('th-TH')} ({new Date(lastSyncedAt).toLocaleDateString('th-TH')})
                </div>
              )}

              {syncStatusMsg && (
                <div className="p-2 rounded-lg bg-[#FCE4EC] border border-[#F8BBD0] text-[11px] text-[#E91E63] font-semibold">
                  {syncStatusMsg}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex-1 py-1.5 px-3 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>ส่งข้อมูลขึ้น Cloud</span>
            </button>
            <button
              onClick={handleManualReload}
              disabled={isSyncing}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Cloud size={12} />
              <span>ดึงข้อมูลล่าสุด</span>
            </button>
          </div>
        </div>

        {/* Section 2: Data Import/Export & Stats Layer */}
        <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Database size={16} className="text-[#0284C7]" />
                <span>ฐานข้อมูลสถิติฮีโร่ (Data Layer)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Liquipedia 2026
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="leading-relaxed">
                สถิติฮีโร่และ Meta Tier List ถูกรวมจากทัวร์นาเมนต์ทางการ RoV Pro League 2026 (Winter + Summer) โดยมีฮีโร่ในระบบ 123 ตัว
              </p>

              <div className="grid grid-cols-2 gap-2 my-2">
                <div className="p-2.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-center">
                  <div className="text-base font-bold text-[#0284C7]">{playersCount} คน</div>
                  <div className="text-[10.5px] text-slate-500">นักแข่งในไลน์อัป</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFF0F5] border border-[#F8BBD0] text-center">
                  <div className="text-base font-bold text-[#E91E63]">{draftsCount} แมตช์</div>
                  <div className="text-[10.5px] text-slate-500">ประวัติดราฟต์ที่บันทึก</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                สามารถนำเข้าสถิติชุดใหม่ผ่านไฟล์ JSON หรือส่งออกข้อมูลสถิติเพื่อนำไปวิเคราะห์ต่อได้
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onOpenDataModal}
              className="w-full py-1.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0284C7] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Database size={13} />
              <span>เปิดตัวจัดการข้อมูลฮีโร่ (Import / Export JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Advanced Coaching Tools (Progressive Disclosure) */}
      <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#E91E63]" />
            <h2 className="text-sm font-bold text-slate-800">
              เครื่องมือวิเคราะห์และเตรียมทีมสำหรับโค้ช
            </h2>
          </div>
          <span className="text-[10px] text-slate-400">
            คลิกเพื่อเปิดโมดูลขั้นสูง
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {coachModules.map((module) => (
            <div
              key={module.id}
              onClick={() => onSelectView(module.id)}
              className="group p-3 rounded-xl border border-slate-200 hover:border-[#E91E63] hover:bg-[#FFF0F5]/50 transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center border border-slate-200 group-hover:border-[#F48FB1] transition-colors">
                    {module.icon}
                  </div>
                  <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${module.badgeColor}`}>
                    {module.badge}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 group-hover:text-[#E91E63] transition-colors">
                  {module.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  {module.desc}
                </p>
              </div>

              <div className="flex items-center justify-end gap-1 text-[10.5px] font-bold text-[#E91E63] mt-3 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                <span>เปิดใช้งาน</span>
                <ArrowRight size={11} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
