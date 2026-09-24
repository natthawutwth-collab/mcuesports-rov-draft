import React from 'react';

export const Breadcrumb: React.FC = () => {
  return (
    <div className="flex items-center gap-2 text-[11px] font-['Barlow_Condensed'] font-semibold tracking-wider text-[#a0a0a8] px-1">
      <span className="cursor-pointer hover:text-white transition-colors">🏠 HOME</span>
      <span>›</span>
      <span className="cursor-pointer hover:text-white transition-colors">TOOLS</span>
      <span>›</span>
      <span className="text-[#a82844] font-bold">DRAFT SIMULATOR</span>
    </div>
  );
};
