import React from 'react';

interface AtelierBadgeProps {
  companyId?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  showDot?: boolean;
}

const ATELIER_CONFIG: Record<string, { name: string; bg: string; text: string; border: string; dot: string }> = {
  pallyra: {
    name: 'Pallyra',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500'
  },
  guennita: {
    name: 'Guennita',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-600'
  },
  mimada: {
    name: 'Mimada',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    dot: 'bg-pink-500'
  },
  tuttymimo: {
    name: 'Tuttymimo',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  madrinha: {
    name: 'Madrinha',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  }
};

export const AtelierBadge: React.FC<AtelierBadgeProps> = ({
  companyId,
  className = '',
  size = 'xs',
  showDot = true
}) => {
  if (!companyId || companyId === 'all') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200/80 ${className}`}>
        {showDot && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />}
        Consolidado
      </span>
    );
  }

  const key = companyId.toLowerCase();
  const conf = ATELIER_CONFIG[key] || {
    name: companyId,
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-[10px]' 
    : size === 'sm' 
    ? 'px-2.5 py-1 text-xs' 
    : 'px-3 py-1 text-xs font-bold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-bold tracking-wider uppercase border shrink-0 ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses} ${className}`}
      title={`Ateliê de Origem: ${conf.name}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} shrink-0`} />}
      {conf.name}
    </span>
  );
};
