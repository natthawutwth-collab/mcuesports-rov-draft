import React from 'react';

export const Breadcrumb: React.FC = () => {
  return (
    <div className="flex items-center gap-2 text-[11.5px] font-['Prompt'] font-medium text-[#64748B] px-1">
      <span className="cursor-pointer hover:text-[#E91E63] transition-colors">หน้าหลัก (Home)</span>
      <span className="text-[#CBD5E1]">/</span>
      <span className="cursor-pointer hover:text-[#E91E63] transition-colors">เครื่องมือแข่งขัน</span>
      <span className="text-[#CBD5E1]">/</span>
      <span className="text-[#E91E63] font-semibold">ห้องดราฟต์ฮีโร่ (RoV Draft Arena)</span>
    </div>
  );
};
