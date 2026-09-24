import React, { useState } from 'react';
import { Hero } from '../types/draft';
import { Shield, Zap, Sparkles, Crosshair, Heart, Swords } from 'lucide-react';

interface HeroAvatarProps {
  hero: Hero;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRoleBadge?: boolean;
}

const roleIconMap: Record<string, React.ElementType> = {
  Fighter: Swords,
  Assassin: Zap,
  Mage: Sparkles,
  Marksman: Crosshair,
  Support: Heart,
  Tank: Shield,
};

const roleGradients: Record<string, string> = {
  Fighter: 'from-amber-900/80 via-amber-700/50 to-amber-950/90 text-amber-300',
  Assassin: 'from-purple-900/80 via-purple-700/50 to-purple-950/90 text-purple-300',
  Mage: 'from-cyan-900/80 via-cyan-700/50 to-cyan-950/90 text-cyan-300',
  Marksman: 'from-yellow-900/80 via-yellow-700/50 to-yellow-950/90 text-yellow-300',
  Support: 'from-emerald-900/80 via-emerald-700/50 to-emerald-950/90 text-emerald-300',
  Tank: 'from-blue-900/80 via-blue-700/50 to-blue-950/90 text-blue-300',
};

export const HeroAvatar: React.FC<HeroAvatarProps> = ({
  hero,
  className = '',
  size = 'md',
  showRoleBadge = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const primaryRole = hero.roles[0] || 'Fighter';
  const RoleIcon = roleIconMap[primaryRole] || Swords;
  const gradient = roleGradients[primaryRole] || 'from-slate-800 to-slate-900 text-slate-300';

  // Extract initials (e.g. "Florentino" -> "FL", "Tel'Annas" -> "TA", "Lu Bu" -> "LB")
  const initials = hero.name
    .replace(/[^a-zA-Z]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeStyles = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-2xl',
  };

  return (
    <div
      className={`relative rounded-md overflow-hidden shrink-0 flex items-center justify-center select-none bg-slate-900 ${sizeStyles[size]} ${className}`}
    >
      {!imageError && hero.avatarUrl ? (
        <img
          src={hero.avatarUrl}
          alt={hero.name}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center relative p-1`}
        >
          <div className="absolute inset-0 bg-black/20" />
          <span className="font-bold tracking-wider relative z-10 font-mono">
            {initials}
          </span>
          <RoleIcon className="w-3.5 h-3.5 opacity-60 absolute bottom-1 right-1 z-10" />
        </div>
      )}

      {showRoleBadge && (
        <div className="absolute bottom-0.5 right-0.5 bg-black/80 rounded px-1 py-0.5 text-[9px] font-medium text-slate-300 backdrop-blur-sm border border-white/10 z-20">
          <RoleIcon className="w-2.5 h-2.5 inline mr-0.5" />
          {primaryRole[0]}
        </div>
      )}
    </div>
  );
};
