import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Store } from 'lucide-react';
import { CompanyId } from '../../types';

export interface AdminAtelierInfo {
  id: CompanyId;
  name: string;
  shortCode: string;
  subtitle: string;
  badgeBg: string;
  accentText: string;
  activeBorder: string;
}

export const ADMIN_ATELIERS: AdminAtelierInfo[] = [
  {
    id: 'pallyra',
    name: 'Pallyra',
    shortCode: 'LP',
    subtitle: 'Papelaria & Encadernação',
    badgeBg: 'bg-sky-500 text-white',
    accentText: 'text-sky-600',
    activeBorder: 'border-sky-300 bg-sky-50/70',
  },
  {
    id: 'guennita',
    name: 'Guennita',
    shortCode: 'CG',
    subtitle: 'Maternidade & Bebê',
    badgeBg: 'bg-slate-700 text-white',
    accentText: 'text-slate-700',
    activeBorder: 'border-slate-300 bg-slate-50/70',
  },
  {
    id: 'mimada',
    name: 'Mimada',
    shortCode: 'MS',
    subtitle: 'Presentes Afetivos & Luxo',
    badgeBg: 'bg-pink-500 text-white',
    accentText: 'text-pink-600',
    activeBorder: 'border-pink-300 bg-pink-50/70',
  },
  {
    id: 'tuttymimo',
    name: 'Tuttymimo',
    shortCode: 'TM',
    subtitle: 'Mimos & Lembrancinhas',
    badgeBg: 'bg-amber-500 text-white',
    accentText: 'text-amber-600',
    activeBorder: 'border-amber-300 bg-amber-50/70',
  },
  {
    id: 'madrinha',
    name: 'Madrinha',
    shortCode: 'MD',
    subtitle: 'dos personalizados',
    badgeBg: 'bg-rose-500 text-white',
    accentText: 'text-rose-600',
    activeBorder: 'border-rose-300 bg-rose-50/70',
  },
];

interface AtelierSelectorProps {
  selectedCompanyId: CompanyId;
  onSelectCompany: (companyId: CompanyId) => void;
  variant?: 'sidebar' | 'header' | 'mobile';
  isCollapsed?: boolean;
}

export const AtelierSelector: React.FC<AtelierSelectorProps> = ({
  selectedCompanyId,
  onSelectCompany,
  variant = 'sidebar',
  isCollapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeAtelier =
    ADMIN_ATELIERS.find((a) => a.id === selectedCompanyId) || ADMIN_ATELIERS[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Variant: Collapsed Sidebar
  if (variant === 'sidebar' && isCollapsed) {
    return (
      <div ref={containerRef} className="relative w-full flex justify-center mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`Ateliê Ativo: ${activeAtelier.name} (${activeAtelier.shortCode})`}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center relative hover:border-pink-300 hover:shadow transition-all group"
        >
          <span
            className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center shadow-xs ${activeAtelier.badgeBg}`}
          >
            {activeAtelier.shortCode}
          </span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        </button>

        {isOpen && (
          <div className="absolute left-14 top-0 z-[120] w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Alternar Ateliê
              </span>
              <Store size={12} className="text-slate-400" />
            </div>
            <div className="mt-1 space-y-1">
              {ADMIN_ATELIERS.map((atelier) => {
                const isSelected = atelier.id === selectedCompanyId;
                return (
                  <button
                    key={atelier.id}
                    type="button"
                    onClick={() => {
                      onSelectCompany(atelier.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? atelier.activeBorder + ' font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${atelier.badgeBg}`}
                      >
                        {atelier.shortCode}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-900 leading-tight">
                          {atelier.name}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate leading-tight">
                          {atelier.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} className={atelier.accentText} strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant: Expanded Sidebar
  if (variant === 'sidebar') {
    return (
      <div ref={containerRef} className="relative mb-5 px-1">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Store size={11} className="text-slate-400" /> Operação Ativa
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
            Multi-Ateliê
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white/90 hover:bg-white border border-slate-200/90 hover:border-pink-300 rounded-2xl p-2.5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all text-left group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-8 h-8 rounded-xl text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs ${activeAtelier.badgeBg}`}
            >
              {activeAtelier.shortCode}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>{activeAtelier.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                {activeAtelier.subtitle}
              </div>
            </div>
          </div>
          <ChevronDown
            size={15}
            className={`text-slate-400 group-hover:text-pink-600 transition-transform duration-200 shrink-0 ml-1 ${
              isOpen ? 'rotate-180 text-pink-600' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-1 right-1 top-full mt-1.5 z-[120] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 mb-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
              Selecione o Ateliê
            </div>
            <div className="space-y-1">
              {ADMIN_ATELIERS.map((atelier) => {
                const isSelected = atelier.id === selectedCompanyId;
                return (
                  <button
                    key={atelier.id}
                    type="button"
                    onClick={() => {
                      onSelectCompany(atelier.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? atelier.activeBorder + ' font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${atelier.badgeBg}`}
                      >
                        {atelier.shortCode}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-900 leading-tight">
                          {atelier.name}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate leading-tight">
                          {atelier.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} className={atelier.accentText} strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant: Top Header Pill
  if (variant === 'header') {
    return (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-pink-200 shadow-xs"
        >
          <span
            className={`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center ${activeAtelier.badgeBg}`}
          >
            {activeAtelier.shortCode}
          </span>
          <span className="hidden sm:inline text-slate-800 font-bold">
            {activeAtelier.name}
          </span>
          <span className="text-[10px] text-slate-400 hidden md:inline">
            ({activeAtelier.subtitle})
          </span>
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-pink-600' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 z-[120] w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 mb-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
              Alternar Ateliê Ativo
            </div>
            <div className="space-y-1">
              {ADMIN_ATELIERS.map((atelier) => {
                const isSelected = atelier.id === selectedCompanyId;
                return (
                  <button
                    key={atelier.id}
                    type="button"
                    onClick={() => {
                      onSelectCompany(atelier.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? atelier.activeBorder + ' font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${atelier.badgeBg}`}
                      >
                        {atelier.shortCode}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-900 leading-tight">
                          {atelier.name}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate leading-tight">
                          {atelier.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} className={atelier.accentText} strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant: Mobile Drawer
  return (
    <div className="mb-4 bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Store size={11} /> Ateliê Ativo
        </span>
        <span
          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeAtelier.badgeBg}`}
        >
          {activeAtelier.shortCode}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {ADMIN_ATELIERS.map((atelier) => {
          const isSelected = atelier.id === selectedCompanyId;
          return (
            <button
              key={atelier.id}
              type="button"
              onClick={() => onSelectCompany(atelier.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                isSelected
                  ? atelier.activeBorder + ' font-bold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center shrink-0 ${atelier.badgeBg}`}
                >
                  {atelier.shortCode}
                </span>
                <div className="min-w-0">
                  <span className="text-xs text-slate-900">{atelier.name}</span>
                  <span className="text-[9px] text-slate-400 ml-1.5">
                    {atelier.subtitle}
                  </span>
                </div>
              </div>
              {isSelected && (
                <Check size={14} className={atelier.accentText} strokeWidth={2.5} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
