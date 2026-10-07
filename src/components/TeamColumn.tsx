import React, { useState } from 'react';
import { Hero, LaneSelectKey, TeamSide } from '../types/draft';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import { Player, TeamCategory } from '../types/player';
import { getHeroImageUrl } from '../data/heroes';
import { X, UserPlus, UserCheck, Star, Sparkles } from 'lucide-react';

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
  onChangePickPos?: (index: number, pos: LaneSelectKey) => void;
  onInspectHero?: (heroName: string) => void;
  inspectedHeroName?: string | null;
  players?: Player[];
  onAssignPlayer?: (slotIndex: number, player: Player | null) => void;
  teamCategory?: TeamCategory;
  compact?: boolean;
  className?: string;
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
  players = [],
  onAssignPlayer,
  teamCategory = 'all',
  compact = false,
  className,
}) => {
  const isBlue = side === 'blue';
  const sideEmoji = isBlue ? '🔵' : '🔴';
  const sideTitle = isBlue ? 'BLUE SIDE' : 'RED SIDE';
  const banPrefix = isBlue ? 'B' : 'R';

  // State to track which slot has the player picker popover open
  const [activePlayerPickerSlot, setActivePlayerPickerSlot] = useState<number | null>(null);

  // Filter players by team category
  const filteredPlayers = React.useMemo(() => {
    if (teamCategory === 'all') return players;
    return players.filter((p) => {
      const cats = p.categories || [p.category || 'male'];
      return cats.includes(teamCategory);
    });
  }, [players, teamCategory]);

  // Subtitle: only show if user entered a custom name different from default
  const isCustomName =
    teamName.trim().length > 0 &&
    teamName.trim().toUpperCase() !== 'BLUE SIDE' &&
    teamName.trim().toUpperCase() !== 'RED SIDE';

  const containerWidthClass = className || (compact
    ? 'w-full min-w-0'
    : 'w-[195px] md:w-[215px] lg:w-[240px] xl:w-[260px] flex-shrink-0');

  return (
    <div
      className={`${containerWidthClass} flex flex-col ${
        compact ? 'gap-2 p-2 rounded-xl' : 'gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl'
      } border-2 backdrop-blur-md transition-all shadow-md ${
        isBlue
          ? 'bg-[#F0F9FF] border-[#BAE6FD] shadow-[0_4px_20px_rgba(2,132,199,0.08)]'
          : 'bg-[#FFF1F2] border-[#FECDD3] shadow-[0_4px_20px_rgba(225,29,72,0.08)]'
      }`}
    >
      {/* Header with High-Contrast Side Badge */}
      <div
        className={`flex flex-col items-center justify-center text-center ${
          compact ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'
        } border shadow-xs ${
          isBlue
            ? 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0284C7]'
            : 'bg-[#FFE4E6] border-[#FDA4AF] text-[#E11D48]'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 font-['Orbitron'] font-black ${
            compact ? 'text-[11px] tracking-[1.5px]' : 'text-[12.5px] sm:text-[13.5px] tracking-[2px]'
          }`}
        >
          <span className={compact ? 'text-xs' : 'text-sm'}>{sideEmoji}</span>
          <span className={isBlue ? 'text-[#0284C7]' : 'text-[#E11D48]'}>{sideTitle}</span>
        </div>
        {isCustomName ? (
          <div
            className={`${
              compact ? 'text-[10px]' : 'text-[11px] sm:text-[11.5px]'
            } font-['Prompt'] font-bold text-[#1F2937] tracking-wider truncate max-w-[200px] mt-0.5`}
          >
            {teamName} ({isUs ? 'US' : 'OPP'})
          </div>
        ) : (
          <div
            className={`${
              compact ? 'text-[9px]' : 'text-[9.5px] sm:text-[10px]'
            } font-['Prompt'] font-bold text-slate-500 tracking-widest mt-0.5 uppercase`}
          >
            {isUs ? '— OUR LINEUP —' : '— OPPONENT —'}
          </div>
        )}
      </div>

      {/* BANS SECTION — Clearly Partitioned Box */}
      <div
        className={`${compact ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'} border shadow-xs ${
          isBlue
            ? 'bg-white/90 border-[#BAE6FD]'
            : 'bg-white/90 border-[#FECDD3]'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span
            className={`font-['Orbitron'] ${
              compact ? 'text-[8.5px] tracking-[1px]' : 'text-[9px] sm:text-[9.5px] tracking-[1.5px]'
            } font-black uppercase ${
              isBlue ? 'text-[#0284C7]' : 'text-[#E11D48]'
            }`}
          >
            🚫 {sideTitle} BANS
          </span>
          <span
            className={`${
              compact ? 'text-[8px]' : 'text-[8.5px] sm:text-[9px]'
            } font-['Prompt'] font-bold text-slate-500`}
          >
            4 SLOTS
          </span>
        </div>

        <div className={`grid grid-cols-4 ${compact ? 'gap-1' : 'gap-1 sm:gap-1.5'}`}>
          {bans.map((hero, idx) => {
            const isActive =
              currentTurnSlot?.team === side &&
              currentTurnSlot?.phase === 'ban' &&
              currentTurnSlot?.index === idx;

            return (
              <div
                key={`ban-${side}-${idx}`}
                onClick={() => {
                  onSlotClick('ban', idx);
                }}
                className={`relative aspect-square rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${
                  isActive
                    ? isBlue
                      ? 'border-[#0284c7] bg-[#E0F2FE] anim-pulse-blue ring-2 ring-[#0284c7]/50 shadow-[0_0_12px_rgba(2,132,199,0.35)]'
                      : 'border-[#e11d48] bg-[#FFE4E6] anim-pulse-red ring-2 ring-[#e11d48]/50 shadow-[0_0_12px_rgba(225,29,72,0.35)]'
                    : hero
                    ? hero.name.toLowerCase() === inspectedHeroName?.toLowerCase()
                      ? 'border-[#E91E63] bg-rose-50 ring-2 ring-[#E91E63]/60 shadow-md'
                      : 'border-red-400 bg-white hover:border-red-600 shadow-xs'
                    : isBlue
                    ? 'border-2 border-dashed border-[#7DD3FC] bg-white hover:border-[#0284C7] shadow-xs'
                    : 'border-2 border-dashed border-[#FDA4AF] bg-white hover:border-[#E11D48] shadow-xs'
                }`}
                title={hero ? `${hero.name} (คลิกดูสถิติ/เปลี่ยนฮีโร่)` : `Ban Slot ${banPrefix}${idx + 1}`}
              >
                {hero ? (
                  <>
                    <img
                      src={hero.avatarUrl || getHeroImageUrl(hero.name)}
                      alt={hero.name}
                      className="w-full h-full object-cover opacity-65 grayscale-[0.35] scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Red Cross Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-5 h-5 rounded-full bg-red-600/90 border border-white flex items-center justify-center text-white shadow-sm">
                        <X size={13} strokeWidth={3} />
                      </div>
                    </div>
                    {/* Hero name bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-white/95 text-[8.5px] font-['Prompt'] font-bold text-center text-red-600 truncate px-0.5 py-0.5 leading-tight border-t border-red-200">
                      {hero.name}
                    </div>
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSlot('ban', idx);
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-slate-800/90 hover:bg-red-600 rounded-full text-white flex items-center justify-center transition-all shadow-xs"
                      title="ลบตัวแบน"
                    >
                      <X size={10} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className={`font-['Orbitron'] font-black text-[11px] tracking-wider ${isBlue ? 'text-[#0284C7]' : 'text-[#E11D48]'}`}>
                      {banPrefix}{idx + 1}
                    </span>
                    <span className="text-[7.5px] font-['Prompt'] font-bold text-slate-400 uppercase tracking-tighter">
                      ว่าง
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PICKS SECTION — Clearly Partitioned Box */}
      <div
        className={`flex flex-col ${compact ? 'gap-1.5 p-1.5 rounded-lg' : 'gap-2 p-2 sm:p-2.5 rounded-xl'} border shadow-xs flex-1 ${
          isBlue
            ? 'bg-white/90 border-[#BAE6FD]'
            : 'bg-white/90 border-[#FECDD3]'
        }`}
      >
        <div className="flex items-center justify-between mb-0.5 px-0.5">
          <span
            className={`font-['Orbitron'] ${
              compact ? 'text-[8.5px] tracking-[1px]' : 'text-[9px] sm:text-[9.5px] tracking-[1.5px]'
            } font-black uppercase ${
              isBlue ? 'text-[#0284C7]' : 'text-[#E11D48]'
            }`}
          >
            ⚔️ {sideTitle} PICKS
          </span>
          <span
            className={`${
              compact ? 'text-[8px]' : 'text-[8.5px] sm:text-[9px]'
            } font-['Prompt'] font-bold text-slate-500`}
          >
            5 HEROES
          </span>
        </div>

        {picks.map((pick, idx) => {
          const isActive =
            currentTurnSlot?.team === side &&
            currentTurnSlot?.phase === 'pick' &&
            currentTurnSlot?.index === idx;

          // If hero is picked, use the hero's actual primary position, otherwise neutral slot styling
          const heroPos = pick.hero ? pick.hero.primaryPos.toUpperCase() : null;
          const posColorClass =
            heroPos === 'DSL'
              ? 'border-[#f97316] text-[#f97316] bg-orange-50'
              : heroPos === 'JG'
              ? 'border-[#10b981] text-[#10b981] bg-emerald-50'
              : heroPos === 'MID'
              ? 'border-[#a855f7] text-[#a855f7] bg-purple-50'
              : heroPos === 'ROAM'
              ? 'border-[#0ea5e9] text-[#0ea5e9] bg-sky-50'
              : heroPos === 'ADL'
              ? 'border-[#eab308] text-[#eab308] bg-amber-50'
              : isBlue
              ? 'border-sky-300 text-[#0284C7] bg-sky-50/50'
              : 'border-rose-300 text-[#E11D48] bg-rose-50/50';

          const isInspected = pick.hero && inspectedHeroName?.toLowerCase() === pick.hero.name.toLowerCase();

          return (
            <div
              key={`pick-${side}-${idx}`}
              onClick={() => {
                onSlotClick('pick', idx);
              }}
              className={`relative flex items-center ${compact ? 'gap-1.5 p-1.5' : 'gap-2 sm:gap-2.5 p-2'} rounded-xl border-2 cursor-pointer transition-all ${
                isBlue ? 'flex-row' : 'flex-row-reverse text-right'
              } ${
                isActive
                  ? isBlue
                    ? 'border-[#0284c7] bg-[#E0F2FE] anim-pulse-blue ring-2 ring-[#0284c7]/50 shadow-[0_0_16px_rgba(2,132,199,0.35)]'
                    : 'border-[#e11d48] bg-[#FFE4E6] anim-pulse-red ring-2 ring-[#e11d48]/50 shadow-[0_0_16px_rgba(225,29,72,0.35)]'
                  : isInspected
                  ? isBlue
                    ? 'border-[#0284c7] bg-[#E0F2FE]/70 ring-2 ring-[#0284c7] shadow-sm'
                    : 'border-[#e11d48] bg-[#FFE4E6]/70 ring-2 ring-[#e11d48] shadow-sm'
                  : pick.hero
                  ? isBlue
                    ? 'border-sky-200 bg-white hover:border-sky-400 shadow-xs'
                    : 'border-rose-200 bg-white hover:border-rose-400 shadow-xs'
                  : isBlue
                  ? 'border-2 border-dashed border-[#7DD3FC] bg-white hover:border-[#0284C7] shadow-xs'
                  : 'border-2 border-dashed border-[#FDA4AF] bg-white hover:border-[#E11D48] shadow-xs'
              }`}
            >
              {/* Floating active badge */}
              {isActive && (
                <div
                  className={`absolute -top-2.5 ${
                    isBlue ? 'left-2' : 'right-2'
                  } bg-[#E91E63] text-white font-['Orbitron'] font-black ${
                    compact ? 'text-[7.5px] px-2 py-0.5 tracking-[1px]' : 'text-[8.5px] px-2.5 py-0.5 tracking-[1.5px]'
                  } rounded-full shadow-[0_2px_8px_rgba(233,30,99,0.4)] flex items-center gap-1 z-20 animate-bounce`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>PICKING</span>
                </div>
              )}

              {/* Order number badge */}
              <div
                className={`absolute top-1.5 ${
                  isBlue ? 'right-2' : 'left-2'
                } font-['Orbitron'] font-black ${
                  compact ? 'text-[8px] px-1.5 py-0.2' : 'text-[9px] px-2 py-0.5'
                } rounded-md ${
                  isBlue
                    ? 'bg-sky-100 border border-sky-300 text-sky-800'
                    : 'bg-rose-100 border border-rose-300 text-rose-800'
                } pointer-events-none shadow-2xs`}
              >
                #{pick.order}
              </div>

              {/* Avatar Box with high contrast role border */}
              <div
                className={`${
                  compact ? 'w-[34px] h-[34px] text-[11px]' : 'w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] text-[13px]'
                } rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-['Prompt'] font-bold ${
                  pick.hero ? `bg-slate-50 border-2 ${posColorClass.split(' ')[0]}` : 'bg-slate-50/80 border-2 border-dashed border-slate-300'
                } relative shadow-xs`}
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
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span className="font-['Orbitron'] font-black text-xs text-slate-400">
                      P{idx + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Pick Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div
                  className={`font-['Barlow_Condensed'] text-[10px] font-black tracking-wider uppercase flex items-center gap-1 ${
                    isBlue ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {pick.hero ? (
                    <span
                      className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${posColorClass.split(' ')[0]} ${posColorClass.split(' ')[1]} ${posColorClass.split(' ')[2]}`}
                    >
                      {heroPos || 'FLEX'}
                    </span>
                  ) : (
                    <span
                      className={`px-1.5 py-0.2 rounded border text-[8.5px] font-bold ${
                        isBlue
                          ? 'border-sky-200 text-[#0284C7] bg-sky-50'
                          : 'border-rose-200 text-[#E11D48] bg-rose-50'
                      }`}
                    >
                      PICK #{idx + 1}
                    </span>
                  )}
                </div>

                {pick.hero ? (
                  <>
                    <div
                      className={`font-['Prompt'] ${
                        compact ? 'text-[12px]' : 'text-[13px] sm:text-[13.5px]'
                      } font-bold text-[#1F2937] truncate flex items-center gap-1 mt-0.5`}
                    >
                      <span className="truncate">{pick.hero.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectHero) onInspectHero(pick.hero!.name);
                        }}
                        title={`ดูสถิติ ${pick.hero.name}`}
                        className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 hover:bg-[#0284c7] hover:text-white text-slate-600 transition-colors cursor-pointer flex-shrink-0 border border-slate-300 shadow-2xs"
                      >
                        📊
                      </button>
                    </div>

                    {!compact && (
                      <div className="text-[10px] sm:text-[10.5px] font-['Prompt'] text-slate-500 truncate">
                        {pick.hero.nameTh}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col mt-0.5">
                    <span className="text-[11.5px] sm:text-[12px] font-['Prompt'] font-bold text-slate-700 truncate">
                      {isBlue ? 'Blue' : 'Red'} Pick {idx + 1}
                    </span>
                    <span className="text-[9.5px] font-['Prompt'] text-slate-400 flex items-center gap-0.5 font-medium">
                      <span className="text-amber-500 font-bold">+</span>
                      <span>เลือกฮีโร่</span>
                    </span>
                  </div>
                )}

                {/* Assigned Player Strip */}
                <div
                  className={`mt-1 pt-1 border-t border-slate-200/80 flex items-center gap-1 ${
                    isBlue ? 'justify-start' : 'justify-end'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {pick.playerId && pick.playerNickname ? (
                    <div className="flex items-center gap-1 min-w-0 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-300">
                      {pick.playerAvatar ? (
                        <img
                          src={pick.playerAvatar}
                          alt={pick.playerNickname}
                          className="w-3.5 h-3.5 rounded-full object-cover border border-white flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span className={`font-['Orbitron'] font-black ${compact ? 'text-[8.5px] max-w-[50px]' : 'text-[9.5px] max-w-[70px]'} text-[#E91E63] truncate`}>
                        {pick.playerNickname}
                      </span>

                      {/* Proficiency badge if hero is picked */}
                      {pick.hero && (() => {
                        const assignedP = players.find((p) => p.id === pick.playerId);
                        const matchHero = assignedP?.heroPool.find(
                          (h) => h.heroName.toLowerCase() === pick.hero!.name.toLowerCase()
                        );
                        if (matchHero?.tier === 'signature') {
                          return (
                            <span className="text-[8px] font-['Prompt'] font-bold px-1 py-0.1 rounded bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                              ⭐ SIG
                            </span>
                          );
                        }
                        if (matchHero?.tier === 'comfortable') {
                          return (
                            <span className="text-[8px] font-['Prompt'] font-bold px-1 py-0.1 rounded bg-sky-100 text-sky-800 border border-sky-300 whitespace-nowrap">
                              ★ COM
                            </span>
                          );
                        }
                        return null;
                      })()}

                      {/* Change / Unassign button */}
                      {onAssignPlayer && (
                        <button
                          type="button"
                          onClick={() => onAssignPlayer(idx, null)}
                          title="ลบนักแข่งออกจากช่องนี้"
                          className="text-slate-400 hover:text-red-500 ml-0.5 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ) : (
                    onAssignPlayer && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePlayerPickerSlot((prev) => (prev === idx ? null : idx))
                          }
                          className="text-[9px] font-['Prompt'] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="คลิกเพื่อกำหนดนักแข่งประจำช่องนี้"
                        >
                          <UserPlus size={10} className="text-[#E91E63]" />
                          <span>+ นักแข่ง</span>
                        </button>

                        {/* Player Picker Dropdown Popover */}
                        {activePlayerPickerSlot === idx && (
                          <div className="absolute bottom-full mb-1 left-0 z-50 w-44 p-1.5 bg-white border border-[#F3D5E2] rounded-xl shadow-xl flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                            <div className="text-[9px] font-['Prompt'] font-bold text-slate-700 px-1.5 py-0.5 border-b border-[#F3D5E2] flex items-center justify-between">
                              <span>เลือกนักแข่ง</span>
                              <button
                                type="button"
                                onClick={() => setActivePlayerPickerSlot(null)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </div>
                            {filteredPlayers.length === 0 ? (
                              <div className="text-[9.5px] text-slate-500 p-1 text-center font-['Prompt']">
                                ไม่มีนักแข่งในหมวดหมู่นี้
                              </div>
                            ) : (
                              filteredPlayers.map((p) => {
                                const isPosMatch =
                                  (pick.pos === 'DSL' && p.position === 'DSL') ||
                                  (pick.pos === 'JG' && p.position === 'Jungle') ||
                                  (pick.pos === 'MID' && p.position === 'Mid') ||
                                  (pick.pos === 'ROAM' && p.position === 'Support') ||
                                  (pick.pos === 'ADL' && p.position === 'ADL');

                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      onAssignPlayer(idx, p);
                                      setActivePlayerPickerSlot(null);
                                    }}
                                    className={`w-full flex items-center gap-1.5 p-1 rounded-lg text-left transition-colors cursor-pointer ${
                                      isPosMatch
                                        ? 'bg-[#FCE4EC] hover:bg-[#F8BBD0] text-slate-900 font-bold'
                                        : 'hover:bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {p.avatarUrl ? (
                                      <img
                                        src={p.avatarUrl}
                                        alt={p.nickname}
                                        className="w-4 h-4 rounded-full object-cover flex-shrink-0 border border-slate-300"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full bg-[#E91E63] text-[8px] font-bold text-white flex items-center justify-center flex-shrink-0">
                                        {p.nickname.slice(0, 1).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-['Prompt'] font-bold text-[10px] truncate">
                                          {p.nickname}
                                        </span>
                                        <span className="text-[8px] font-['Prompt'] text-slate-500">
                                          {p.position}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
