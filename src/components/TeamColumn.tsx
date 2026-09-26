import React from 'react';
import { Hero, LaneSelectKey, TeamSide } from '../types/draft';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import { getHeroImageUrl } from '../data/heroes';
import { X } from 'lucide-react';

interface TeamColumnProps {
  side: TeamSide;
  teamName: string;
  isUs: boolean;
  bans: (Hero | null)[];
  picks: PickSlotState[];
  currentTurnSlot: {
    team: TeamSide;
    phase: 'ban' | 'pick';
    index: number;
  } | null;
  onSlotClick: (phase: 'ban' | 'pick', index: number) => void;
  onClearSlot: (phase: 'ban' | 'pick', index: number) => void;
  onChangePickPos: (index: number, pos: LaneSelectKey) => void;
  onInspectHero?: (heroName: string) => void;
  inspectedHeroName?: string | null;
}

export const TeamColumn: React.FC<TeamColumnProps> = ({
  side,
  teamName,
  isUs,
  bans,
  picks,
  currentTurnSlot,
  onSlotClick,
  onClearSlot,
  onChangePickPos,
  onInspectHero,
  inspectedHeroName,
}) => {
  const isBlue = side === 'blue';
  const sideEmoji = isBlue ? '🔵' : '🔴';
  const sideTitle = isBlue ? 'BLUE SIDE' : 'RED SIDE';
  const banPrefix = isBlue ? 'B' : 'R';

  // Subtitle: only show if user entered a custom name different from default
  const isCustomName =
    teamName.trim().length > 0 &&
    teamName.trim().toUpperCase() !== 'BLUE SIDE' &&
    teamName.trim().toUpperCase() !== 'RED SIDE';

  return (
    <div
      className={`w-full lg:w-[250px] xl:w-[268px] flex-shrink-0 flex flex-col gap-3 p-3 rounded-2xl border-2 backdrop-blur-md transition-all shadow-2xl ${
        isBlue
          ? 'bg-[#071322]/95 border-[#0284c7]/60 shadow-[0_0_30px_rgba(2,132,199,0.2)]'
          : 'bg-[#200812]/95 border-[#e11d48]/60 shadow-[0_0_30px_rgba(225,29,72,0.2)]'
      }`}
    >
      {/* Header with High-Contrast Side Badge */}
      <div
        className={`flex flex-col items-center justify-center text-center p-2.5 rounded-xl border ${
          isBlue
            ? 'bg-[#0284c7]/20 border-[#38bdf8]/50 text-white'
            : 'bg-[#e11d48]/20 border-[#f43f5e]/50 text-white'
        }`}
      >
        <div className="flex items-center gap-2 font-['Orbitron'] font-black text-[13.5px] tracking-[2.5px] text-white">
          <span className="text-sm">{sideEmoji}</span>
          <span className={isBlue ? 'text-[#38bdf8]' : 'text-[#f43f5e]'}>{sideTitle}</span>
        </div>
        {isCustomName ? (
          <div className="text-[11.5px] font-['Barlow_Condensed'] font-black text-[#fbbf24] tracking-wider truncate max-w-[220px] mt-0.5">
            {teamName} ({isUs ? 'US' : 'OPP'})
          </div>
        ) : (
          <div className="text-[10px] font-['Barlow_Condensed'] font-extrabold text-slate-300 tracking-widest mt-0.5 uppercase">
            {isUs ? '— OUR LINEUP —' : '— OPPONENT —'}
          </div>
        )}
      </div>

      {/* BANS SECTION — Clearly Partitioned Box */}
      <div
        className={`p-2.5 rounded-xl border shadow-inner ${
          isBlue
            ? 'bg-black/50 border-[#0284c7]/30'
            : 'bg-black/50 border-[#e11d48]/30'
        }`}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <span
            className={`font-['Orbitron'] text-[9.5px] tracking-[2px] font-black uppercase ${
              isBlue ? 'text-[#38bdf8]' : 'text-[#f43f5e]'
            }`}
          >
            🚫 {sideTitle} BANS
          </span>
          <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-slate-400">
            4 SLOTS
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {bans.map((hero, idx) => {
            const isActive =
              currentTurnSlot?.team === side &&
              currentTurnSlot?.phase === 'ban' &&
              currentTurnSlot?.index === idx;

            return (
              <div
                key={`ban-${side}-${idx}`}
                onClick={() => {
                  if (hero && onInspectHero) onInspectHero(hero.name);
                  onSlotClick('ban', idx);
                }}
                className={`relative aspect-square rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${
                  isActive
                    ? isBlue
                      ? 'border-[#38bdf8] bg-[#0284c7]/30 anim-pulse-blue ring-2 ring-[#38bdf8]/50 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      : 'border-[#f43f5e] bg-[#e11d48]/30 anim-pulse-red ring-2 ring-[#f43f5e]/50 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                    : hero
                    ? hero.name.toLowerCase() === inspectedHeroName?.toLowerCase()
                      ? 'border-[#fbbf24] bg-red-950/60 ring-2 ring-[#fbbf24]/70 shadow-lg'
                      : 'border-red-600/70 bg-red-950/40 hover:border-red-400 shadow-sm'
                    : 'border-slate-700/80 border-dashed bg-black/60 hover:border-white/40'
                }`}
                title={hero ? `${hero.name} (คลิกดูสถิติ/เปลี่ยนฮีโร่)` : `Ban Slot ${banPrefix}${idx + 1}`}
              >
                {hero ? (
                  <>
                    <img
                      src={hero.avatarUrl || getHeroImageUrl(hero.name)}
                      alt={hero.name}
                      className="w-full h-full object-cover opacity-60 grayscale-[0.5] scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Red Cross Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-5 h-5 rounded-full bg-red-950/90 border border-red-500 flex items-center justify-center text-red-300 shadow-md">
                        <X size={13} strokeWidth={3} />
                      </div>
                    </div>
                    {/* Hero name bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/95 text-[8.5px] font-['Barlow_Condensed'] font-black text-center text-red-200 truncate px-0.5 py-0.5 leading-tight border-t border-red-900/60">
                      {hero.name}
                    </div>
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSlot('ban', idx);
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/90 hover:bg-red-600 rounded-full text-white flex items-center justify-center transition-all shadow-sm"
                      title="ลบตัวแบน"
                    >
                      <X size={10} />
                    </button>
                  </>
                ) : (
                  <span className="font-['Orbitron'] font-black text-[11px] tracking-wider text-slate-500">
                    {banPrefix}{idx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PICKS SECTION — Clearly Partitioned Box */}
      <div
        className={`flex flex-col gap-2 p-2.5 rounded-xl border shadow-inner flex-1 ${
          isBlue
            ? 'bg-black/50 border-[#0284c7]/30'
            : 'bg-black/50 border-[#e11d48]/30'
        }`}
      >
        <div className="flex items-center justify-between mb-0.5 px-1">
          <span
            className={`font-['Orbitron'] text-[9.5px] tracking-[2px] font-black uppercase ${
              isBlue ? 'text-[#38bdf8]' : 'text-[#f43f5e]'
            }`}
          >
            ⚔️ {sideTitle} PICKS
          </span>
          <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-slate-400">
            5 HEROES
          </span>
        </div>

        {picks.map((pick, idx) => {
          const isActive =
            currentTurnSlot?.team === side &&
            currentTurnSlot?.phase === 'pick' &&
            currentTurnSlot?.index === idx;

          // Role color for border & badge
          const posColorClass =
            pick.pos === 'DSL'
              ? 'border-[#f97316] text-[#f97316]'
              : pick.pos === 'JG'
              ? 'border-[#10b981] text-[#10b981]'
              : pick.pos === 'MID'
              ? 'border-[#a855f7] text-[#a855f7]'
              : pick.pos === 'ROAM'
              ? 'border-[#0ea5e9] text-[#0ea5e9]'
              : 'border-[#eab308] text-[#eab308]';

          const isInspected = pick.hero && inspectedHeroName?.toLowerCase() === pick.hero.name.toLowerCase();

          return (
            <div
              key={`pick-${side}-${idx}`}
              onClick={() => {
                if (pick.hero && onInspectHero) onInspectHero(pick.hero.name);
                onSlotClick('pick', idx);
              }}
              className={`relative flex items-center gap-2.5 p-2 rounded-xl border-2 cursor-pointer transition-all ${
                isBlue ? 'flex-row' : 'flex-row-reverse text-right'
              } ${
                isActive
                  ? isBlue
                    ? 'border-[#38bdf8] bg-[#0284c7]/25 anim-pulse-blue ring-2 ring-[#38bdf8]/50 shadow-[0_0_16px_rgba(56,189,248,0.4)]'
                    : 'border-[#f43f5e] bg-[#e11d48]/25 anim-pulse-red ring-2 ring-[#f43f5e]/50 shadow-[0_0_16px_rgba(244,63,94,0.4)]'
                  : isInspected
                  ? isBlue
                    ? 'border-[#38bdf8] bg-[#0284c7]/30 ring-2 ring-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : 'border-[#f43f5e] bg-[#e11d48]/30 ring-2 ring-[#f43f5e] shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : pick.hero
                  ? isBlue
                    ? 'border-sky-900/80 bg-[#0a1b30] hover:border-sky-400 shadow-md'
                    : 'border-rose-950/80 bg-[#2b0c16] hover:border-rose-400 shadow-md'
                  : 'border-slate-800 border-dashed bg-black/60 hover:border-slate-600'
              }`}
            >
              {/* Floating active badge */}
              {isActive && (
                <div
                  className={`absolute -top-2.5 ${
                    isBlue ? 'left-2' : 'right-2'
                  } bg-[#fbbf24] text-black font-['Orbitron'] font-black text-[8px] tracking-[1.5px] px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)] flex items-center gap-1 z-20 animate-bounce`}
                >
                  <span>▶</span>
                  <span>PICKING</span>
                </div>
              )}

              {/* Order number badge */}
              <div
                className={`absolute top-1.5 ${
                  isBlue ? 'right-2' : 'left-2'
                } font-['Orbitron'] font-black text-[9px] px-1.5 py-0.2 rounded bg-black/60 border border-slate-700 text-slate-400 pointer-events-none`}
              >
                #{pick.order}
              </div>

              {/* Avatar Box (44x44px square with high contrast border) */}
              <div
                className={`w-[44px] h-[44px] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-['Barlow_Condensed'] font-black text-[13px] bg-black/80 border-2 ${posColorClass.split(' ')[0]} relative shadow-sm`}
              >
                {pick.hero ? (
                  <img
                    src={pick.hero.avatarUrl || getHeroImageUrl(pick.hero.name)}
                    alt={pick.hero.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-slate-400">P{idx + 1}</span>
                )}
              </div>

              {/* Pick Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div
                  className={`font-['Barlow_Condensed'] text-[10px] font-black tracking-wider uppercase flex items-center gap-1 ${
                    isBlue ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.2 rounded bg-black/60 border text-[9px] ${posColorClass}`}
                  >
                    {pick.pos || 'POS'}
                  </span>
                </div>

                {pick.hero ? (
                  <>
                    <div className="font-['Barlow_Condensed'] text-[14px] font-extrabold text-white truncate flex items-center gap-1.5 mt-0.5">
                      <span className="truncate">{pick.hero.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectHero) onInspectHero(pick.hero!.name);
                        }}
                        title={`ดูสถิติ ${pick.hero.name}`}
                        className="text-[9.5px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-[#0284c7] text-white transition-colors cursor-pointer flex-shrink-0 border border-white/20"
                      >
                        📊
                      </button>
                    </div>

                    <div className="text-[10.5px] font-['Kanit'] text-slate-400 truncate">
                      {pick.hero.nameTh}
                    </div>
                  </>
                ) : (
                  <div className="h-5" />
                )}
              </div>

              {/* Position Select Dropdown */}
              <select
                value={pick.pos}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onChangePickPos(idx, e.target.value as LaneSelectKey)}
                className={`absolute bottom-1.5 ${
                  isBlue ? 'right-2' : 'left-2'
                } bg-[#0e1017] border border-slate-700 hover:border-white/40 text-slate-200 font-['Barlow_Condensed'] font-black text-[9.5px] px-1.5 py-0.5 rounded-md outline-none cursor-pointer tracking-wider shadow-sm`}
              >
                <option value="DSL" className="bg-[#12141c] text-[#f97316]">DSL (Dark Slayer)</option>
                <option value="JG" className="bg-[#12141c] text-[#10b981]">JG (Jungle)</option>
                <option value="MID" className="bg-[#12141c] text-[#a855f7]">MID (Mage)</option>
                <option value="ROAM" className="bg-[#12141c] text-[#0ea5e9]">ROAM (Support)</option>
                <option value="ADL" className="bg-[#12141c] text-[#eab308]">ADL (Carry)</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
