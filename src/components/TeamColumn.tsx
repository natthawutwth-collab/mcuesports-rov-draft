import React from 'react';
import { Hero, LaneSelectKey, TeamSide } from '../types/draft';
import { PickSlotState } from '../hooks/useDraconmindDraft';
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
      className={`w-full lg:w-[245px] xl:w-[260px] flex-shrink-0 flex flex-col gap-2.5 p-3 rounded-xl border backdrop-blur-md transition-all ${
        isBlue
          ? 'bg-[linear-gradient(180deg,rgba(16,24,44,0.7)_0%,rgba(12,18,32,0.85)_100%)] border-[#6b8fb8]/30 shadow-[0_4px_24px_rgba(15,35,70,0.25)]'
          : 'bg-[linear-gradient(180deg,rgba(44,16,24,0.7)_0%,rgba(32,12,18,0.85)_100%)] border-[#a82844]/30 shadow-[0_4px_24px_rgba(70,15,25,0.25)]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center pb-1 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-['Orbitron'] font-extrabold text-[13.5px] tracking-[2.5px] text-white">
          <span>{sideEmoji}</span>
          <span className={isBlue ? 'text-[#7daaca]' : 'text-[#e05672]'}>{sideTitle}</span>
        </div>
        {isCustomName ? (
          <div className="text-[11px] font-['Barlow_Condensed'] font-bold text-[#d4a857] tracking-wider truncate max-w-[210px] mt-0.5">
            {teamName} ({isUs ? 'US' : 'OPP'})
          </div>
        ) : (
          <div className="text-[9.5px] font-['Barlow_Condensed'] font-semibold text-white/40 tracking-widest mt-0.5">
            {isUs ? '— OUR TEAM —' : '— OPPONENT —'}
          </div>
        )}
      </div>

      {/* BANS SECTION */}
      <div>
        <div className="font-['Barlow_Condensed'] text-[9px] tracking-[2.5px] text-[#a0a0a8] uppercase text-center font-bold mb-1.5">
          BANS
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
                className={`relative aspect-square rounded-md overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all border ${
                  isActive
                    ? isBlue
                      ? 'border-[#6b8fb8] bg-[#6b8fb8]/20 anim-pulse-blue ring-2 ring-[#6b8fb8]/40'
                      : 'border-[#a82844] bg-[#a82844]/20 anim-pulse-red ring-2 ring-[#a82844]/40'
                    : hero
                    ? hero.name.toLowerCase() === inspectedHeroName?.toLowerCase()
                      ? 'border-[#ff7b95] bg-red-950/40 ring-2 ring-[#ff7b95]/60'
                      : 'border-red-500/40 bg-red-950/20 hover:border-red-400'
                    : 'border-white/10 border-dashed bg-black/40 hover:border-white/30'
                }`}
                title={hero ? `${hero.name} (คลิกดูสถิติ/เลือกใหม่)` : `Ban Slot ${banPrefix}${idx + 1}`}
              >
                {hero ? (
                  <>
                    <img
                      src={hero.avatarUrl}
                      alt={hero.name}
                      className="w-full h-full object-cover opacity-60 grayscale-[0.6] scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Red Cross Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-6 h-6 rounded-full bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-md">
                        <X size={14} strokeWidth={3} />
                      </div>
                    </div>
                    {/* Hero name bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/85 text-[8px] font-['Barlow_Condensed'] font-bold text-center text-red-200 truncate px-0.5 py-0.2 leading-tight">
                      {hero.name}
                    </div>
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSlot('ban', idx);
                      }}
                      className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-black/80 hover:bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={9} />
                    </button>
                  </>
                ) : (
                  <span className="font-['Barlow_Condensed'] font-bold text-[10.5px] tracking-wider text-[#6a6a72]">
                    {banPrefix}{idx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PICKS SECTION */}
      <div className="flex flex-col gap-1.5 flex-1 mt-1">
        <div className="font-['Barlow_Condensed'] text-[9px] tracking-[2.5px] text-[#a0a0a8] uppercase text-center font-bold mb-0.5">
          PICKS
        </div>

        {picks.map((pick, idx) => {
          const isActive =
            currentTurnSlot?.team === side &&
            currentTurnSlot?.phase === 'pick' &&
            currentTurnSlot?.index === idx;

          // Role color for border
          const posColorClass =
            pick.pos === 'DSL'
              ? 'border-[#c47842]'
              : pick.pos === 'JG'
              ? 'border-[#5a8a6a]'
              : pick.pos === 'MID'
              ? 'border-[#9b6da8]'
              : pick.pos === 'ROAM'
              ? 'border-[#6b8fb8]'
              : 'border-[#d4a857]';

          const isInspected = pick.hero && inspectedHeroName?.toLowerCase() === pick.hero.name.toLowerCase();

          return (
            <div
              key={`pick-${side}-${idx}`}
              onClick={() => {
                if (pick.hero && onInspectHero) onInspectHero(pick.hero.name);
                onSlotClick('pick', idx);
              }}
              className={`relative flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all ${
                isBlue ? 'flex-row' : 'flex-row-reverse text-right'
              } ${
                isActive
                  ? isBlue
                    ? 'border-[#6b8fb8] bg-[#6b8fb8]/15 anim-pulse-blue ring-2 ring-[#6b8fb8]/40'
                    : 'border-[#a82844] bg-[#a82844]/15 anim-pulse-red ring-2 ring-[#a82844]/40'
                  : isInspected
                  ? isBlue
                    ? 'border-[#7daaca] bg-[#6b8fb8]/20 ring-1 ring-[#7daaca] shadow-[0_0_10px_rgba(107,143,184,0.3)]'
                    : 'border-[#ff7b95] bg-[#a82844]/20 ring-1 ring-[#ff7b95] shadow-[0_0_10px_rgba(168,40,68,0.3)]'
                  : pick.hero
                  ? 'border-white/15 bg-white/[0.04] hover:border-white/30'
                  : 'border-white/10 border-dashed bg-black/30 hover:border-white/20'
              }`}
            >
              {/* Floating active badge */}
              {isActive && (
                <div
                  className={`absolute -top-2.5 ${
                    isBlue ? 'left-2' : 'right-2'
                  } bg-[#d4a857] text-black font-['Orbitron'] font-black text-[8px] tracking-[1.5px] px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-10 animate-bounce`}
                >
                  <span>▶</span>
                  <span>PICKING</span>
                </div>
              )}

              {/* Order number */}
              <div
                className={`absolute top-1 ${
                  isBlue ? 'right-2' : 'left-2'
                } font-['Orbitron'] font-extrabold text-[9.5px] text-[#6a6a72] pointer-events-none`}
              >
                #{pick.order}
              </div>

              {/* Avatar Box (42x42px square) */}
              <div
                className={`w-[42px] h-[42px] rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center font-['Barlow_Condensed'] font-black text-[12px] text-[#a0a0a8] bg-black/60 border ${posColorClass} relative`}
              >
                {pick.hero ? (
                  <img
                    src={pick.hero.avatarUrl}
                    alt={pick.hero.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>P{idx + 1}</span>
                )}
              </div>

              {/* Pick Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="font-['Barlow_Condensed'] text-[9.5px] font-bold tracking-wider text-[#a0a0a8] uppercase">
                  {pick.pos || 'POSITION'}
                </div>
                <div className="font-['Barlow_Condensed'] text-[13.5px] font-bold text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{pick.hero ? pick.hero.name : '—'}</span>
                  {pick.hero && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInspectHero) onInspectHero(pick.hero!.name);
                      }}
                      title={`ดูสถิติ ${pick.hero.name}`}
                      className="text-[9.5px] px-1 py-0.5 rounded bg-white/10 hover:bg-[#a82844] text-white/70 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                    >
                      📊
                    </button>
                  )}
                </div>
                {pick.hero && (
                  <div className="text-[10px] font-['Kanit'] text-[#a0a0a8] truncate">
                    {pick.hero.nameTh}
                  </div>
                )}
              </div>

              {/* Position Select Dropdown */}
              <select
                value={pick.pos}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onChangePickPos(idx, e.target.value as LaneSelectKey)}
                className={`absolute bottom-1 ${
                  isBlue ? 'right-2' : 'left-2'
                } bg-[rgba(20,20,26,0.85)] border border-white/10 hover:border-white/30 text-[#e5e5e8] font-['Barlow_Condensed'] font-bold text-[9px] px-1.5 py-0.5 rounded outline-none cursor-pointer tracking-wider`}
              >
                <option value="DSL" className="bg-[#13131a] text-[#c47842]">DSL</option>
                <option value="JG" className="bg-[#13131a] text-[#5a8a6a]">JG</option>
                <option value="MID" className="bg-[#13131a] text-[#9b6da8]">MID</option>
                <option value="ROAM" className="bg-[#13131a] text-[#6b8fb8]">ROAM</option>
                <option value="ADL" className="bg-[#13131a] text-[#d4a857]">ADL</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
