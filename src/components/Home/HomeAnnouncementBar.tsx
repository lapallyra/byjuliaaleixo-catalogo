import React from 'react';
import { Truck, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';

export const HomeAnnouncementBar: React.FC = () => {
  return (
    <div
      id="home-announcement-bar"
      className="w-full bg-[#F8F5EE] border-b border-[#E8DFC8]/50 text-[#4A332A] py-2.5 px-4 text-xs select-none"
    >
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px] md:text-[12px] font-medium tracking-wide">
        
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Sparkles size={13} strokeWidth={1.5} className="text-[#B38F4D] shrink-0" />
          <span className="text-[#3D261C]">Ateliê de Lembranças Afetivas & Personalizados Nobres</span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 sm:gap-x-8 gap-y-1 text-[#5C4033] mx-auto sm:mx-0">
          <div className="flex items-center gap-1.5">
            <HeartHandshake size={13} strokeWidth={1.5} className="text-[#B38F4D] shrink-0" />
            <span>Feito à mão sob demanda</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Truck size={13} strokeWidth={1.5} className="text-[#B38F4D] shrink-0" />
            <span>Envio com seguro para todo o Brasil</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} strokeWidth={1.5} className="text-[#B38F4D] shrink-0" />
            <span>Aprovação prévia da arte personalizada</span>
          </div>
        </div>

      </div>
    </div>
  );
};
