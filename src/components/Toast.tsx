import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="px-4 py-2.5 rounded-full bg-[#14141a]/95 border border-[#a82844]/60 text-white font-['Barlow_Condensed'] font-bold text-sm tracking-wider shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-2">
        <span className="text-[#d4a857]">◉</span>
        <span>{message}</span>
      </div>
    </div>
  );
};
