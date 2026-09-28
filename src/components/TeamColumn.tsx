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
  onChangePickPos: (index: number, pos: LaneSelectKey) => void;
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
    return players.filter((p) => (p.category || 'male') === teamCategory);
  }, [players, teamCategory]);

  // Subtitle: only show if user entered a custom name different from default
  const isCustomName =
    teamName.trim().length > 0 &&
    teamName.trim().toUpperCase() !== 'BLUE SIDE' &&
    teamName.trim().toUpperCase() !== 'RED SIDE';

  const containerWidthClass = compact
    ? 'w-full min-w-0'
    : className || 'w-[195px] md:w-[215px] lg:w-[240px] xl:w-[260px] flex-shrink-0';

  return (
    <div
      className={`${containerWidthClass} flex flex-col ${
        compact ? 'gap-2 p-2 rounded-xl' : 'gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl'
      } border-2 backdrop-blur-md transition-all shadow-2xl ${
        isBlue
          ? 'bg-[#071322]/95 border-[#0284c7]/60 shadow-[0_0_30px_rgba(2,132,199,0.2)]'
          : 'bg-[#200812]/95 border-[#e11d48]/60 shadow-[0_0_30px_rgba(225,29,72,0.2)]'
      }`}
    >
      {/* Header with High-Contrast Side Badge */}
      <div
        className={`flex flex-col items-center justify-center text-center ${
          compact ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'
        } border ${
          isBlue
            ? 'bg-[#0284c7]/20 border-[#38bdf8]/50 text-white'
            : 'bg-[#e11d48]/20 border-[#f43f5e]/50 text-white'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 font-['Orbitron'] font-black ${
            compact ? 'text-[11px] tracking-[1.5px]' : 'text-[12.5px] sm:text-[13.5px] tracking-[2px]'
          } text-white`}
        >
          <span className={compact ? 'text-xs' : 'text-sm'}>{sideEmoji}</span>
          <span className={isBlue ? 'text-[#38bdf8]' : 'text-[#f43f5e]'}>{sideTitle}</span>
        </div>
        {isCustomName ? (
          <div
            className={`${
              compact ? 'text-[10px]' : 'text-[11px] sm:text-[11.5px]'
            } font-['Barlow_Condensed'] font-black text-[#fbbf24] tracking-wider truncate max-w-[200px] mt-0.5`}
          >
            {teamName} ({isUs ? 'US' : 'OPP'})
          </div>
        ) : (
          <div
            className={`${
              compact ? 'text-[9px]' : 'text-[9.5px] sm:text-[10px]'
            } font-['Barlow_Condensed'] font-extrabold text-slate-300 tracking-widest mt-0.5 uppercase`}
          >
            {isUs ? '— OUR LINEUP —' : '— OPPONENT —'}
          </div>
        )}
      </div>

      {/* BANS SECTION — Clearly Partitioned Box */}
      <div
        className={`${compact ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'} border shadow-inner ${
          isBlue
            ? 'bg-black/50 border-[#0284c7]/30'
            : 'bg-black/50 border-[#e11d48]/30'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span
            className={`font-['Orbitron'] ${
              compact ? 'text-[8.5px] tracking-[1px]' : 'text-[9px] sm:text-[9.5px] tracking-[1.5px]'
            } font-black uppercase ${
              isBlue ? 'text-[#38bdf8]' : 'text-[#f43f5e]'
            }`}
          >
            🚫 {sideTitle} BANS
          </span>
          <span
            className={`${
              compact ? 'text-[8px]' : 'text-[8.5px] sm:text-[9px]'
            } font-['Barlow_Condensed'] font-bold text-slate-400`}
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
        className={`flex flex-col ${compact ? 'gap-1.5 p-1.5 rounded-lg' : 'gap-2 p-2 sm:p-2.5 rounded-xl'} border shadow-inner flex-1 ${
          isBlue
            ? 'bg-black/50 border-[#0284c7]/30'
            : 'bg-black/50 border-[#e11d48]/30'
        }`}
      >
        <div className="flex items-center justify-between mb-0.5 px-0.5">
          <span
            className={`font-['Orbitron'] ${
              compact ? 'text-[8.5px] tracking-[1px]' : 'text-[9px] sm:text-[9.5px] tracking-[1.5px]'
            } font-black uppercase ${
              isBlue ? 'text-[#38bdf8]' : 'text-[#f43f5e]'
            }`}
          >
            ⚔️ {sideTitle} PICKS
          </span>
          <span
            className={`${
              compact ? 'text-[8px]' : 'text-[8.5px] sm:text-[9px]'
            } font-['Barlow_Condensed'] font-bold text-slate-400`}
          >
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
              className={`relative flex items-center ${compact ? 'gap-1.5 p-1.5' : 'gap-2 sm:gap-2.5 p-2'} rounded-xl border-2 cursor-pointer transition-all ${
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
                  className={`absolute -top-2 ${
                    isBlue ? 'left-1.5' : 'right-1.5'
                  } bg-[#fbbf24] text-black font-['Orbitron'] font-black ${
                    compact ? 'text-[7px] px-1.5 py-0.2 tracking-[1px]' : 'text-[8px] px-2.5 py-0.5 tracking-[1.5px]'
                  } rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)] flex items-center gap-1 z-20 animate-bounce`}
                >
                  <span>▶</span>
                  <span>PICKING</span>
                </div>
              )}

              {/* Order number badge */}
              <div
                className={`absolute top-1 ${
                  isBlue ? 'right-1.5' : 'left-1.5'
                } font-['Orbitron'] font-black ${
                  compact ? 'text-[8px] px-1 py-0.1' : 'text-[9px] px-1.5 py-0.2'
                } rounded bg-black/60 border border-slate-700 text-slate-400 pointer-events-none`}
              >
                #{pick.order}
              </div>

              {/* Avatar Box with high contrast border */}
              <div
                className={`${
                  compact ? 'w-[32px] h-[32px] text-[11px]' : 'w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] text-[13px]'
                } rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-['Barlow_Condensed'] font-black bg-black/80 border-2 ${posColorClass.split(' ')[0]} relative shadow-sm`}
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
                    <div
                      className={`font-['Barlow_Condensed'] ${
                        compact ? 'text-[12px]' : 'text-[13.5px] sm:text-[14px]'
                      } font-extrabold text-white truncate flex items-center gap-1 mt-0.5`}
                    >
                      <span className="truncate">{pick.hero.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectHero) onInspectHero(pick.hero!.name);
                        }}
                        title={`ดูสถิติ ${pick.hero.name}`}
                        className="text-[9px] px-1 py-0.2 rounded bg-white/10 hover:bg-[#0284c7] text-white transition-colors cursor-pointer flex-shrink-0 border border-white/20"
                      >
                        📊
                      </button>
                    </div>

                    {!compact && (
                      <div className="text-[10px] sm:text-[10.5px] font-['Kanit'] text-slate-400 truncate">
                        {pick.hero.nameTh}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={compact ? 'h-3.5' : 'h-5'} />
                )}

                {/* Assigned Player Strip */}
                <div
                  className={`mt-1 pt-1 border-t border-white/5 flex items-center gap-1 ${
                    isBlue ? 'justify-start' : 'justify-end'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {pick.playerId && pick.playerNickname ? (
                    <div className="flex items-center gap-1 min-w-0 bg-black/60 px-1.5 py-0.5 rounded-md border border-slate-700/80">
                      {pick.playerAvatar ? (
                        <img
                          src={pick.playerAvatar}
                          alt={pick.playerNickname}
                          className="w-3.5 h-3.5 rounded-full object-cover border border-white/30 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span className={`font-['Orbitron'] font-black ${compact ? 'text-[8.5px] max-w-[50px]' : 'text-[9.5px] max-w-[70px]'} text-[#fbbf24] truncate`}>
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
                            <span className="text-[8px] font-['Barlow_Condensed'] font-black px-1 py-0.1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                              ⭐ SIG
                            </span>
                          );
                        }
                        if (matchHero?.tier === 'comfortable') {
                          return (
                            <span className="text-[8px] font-['Barlow_Condensed'] font-black px-1 py-0.1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 whitespace-nowrap">
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
                          className="text-slate-400 hover:text-red-400 ml-0.5"
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
                          className="text-[9px] font-['Kanit'] text-slate-400 hover:text-white bg-black/40 hover:bg-slate-800 border border-slate-700/80 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                          title="คลิกเพื่อกำหนดนักแข่งประจำช่องนี้"
                        >
                          <UserPlus size={10} className="text-[#fbbf24]" />
                          <span>+ นักแข่ง</span>
                        </button>

                        {/* Player Picker Dropdown Popover */}
                        {activePlayerPickerSlot === idx && (
                          <div className="absolute bottom-full mb-1 left-0 z-50 w-44 p-1.5 bg-[#0e111a] border border-slate-600 rounded-xl shadow-2xl backdrop-blur-md flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                            <div className="text-[9px] font-['Orbitron'] font-bold text-slate-400 px-1.5 py-0.5 border-b border-slate-800 flex items-center justify-between">
                              <span>เลือกนักแข่ง</span>
                              <button
                                type="button"
                                onClick={() => setActivePlayerPickerSlot(null)}
                                className="text-slate-400 hover:text-white"
                              >
                                <X size={10} />
                              </button>
                            </div>
                            {filteredPlayers.length === 0 ? (
                              <div className="text-[9.5px] text-slate-400 p-1 text-center font-['Kanit']">
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
                                        ? 'bg-slate-800/80 hover:bg-slate-700 text-white'
                                        : 'hover:bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    {p.avatarUrl ? (
                                      <img
                                        src={p.avatarUrl}
                                        alt={p.nickname}
                                        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full bg-slate-700 text-[8px] font-bold text-white flex items-center justify-center flex-shrink-0">
                                        {p.nickname.slice(0, 1).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-['Orbitron'] font-bold text-[10px] truncate">
                                          {p.nickname}
                                        </span>
                                        <span className="text-[8px] font-['Barlow_Condensed'] text-slate-400">
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
