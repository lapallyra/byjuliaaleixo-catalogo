import React from 'react';
import { Star, MessageSquare } from 'lucide-react';

interface FeedbacksTabProps {
  feedbacks: any[];
}

export const FeedbacksTab: React.FC<FeedbacksTabProps> = ({ feedbacks = [] }) => {
  const totalCount = feedbacks.length;
  
  const averageStars = totalCount > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.stars || 5), 0) / totalCount).toFixed(1)
    : "5.0";

  const getFormattedDate = (createdAt?: any) => {
    if (!createdAt) return "Data não disponível";
    try {
      if (createdAt.toDate) {
        return createdAt.toDate().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      if (createdAt.seconds) {
        return new Date(createdAt.seconds * 1000).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return new Date(createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return "Data não disponível";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
            <Star className="text-amber-500 fill-amber-500" size={24} />
            Feedback de Clientes
          </h2>
          <p className="text-[10px] uppercase font-black text-[#A09898] tracking-widest mt-1">
            Parede de Amor - Todos os feedbacks enviados no início da loja
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#F0E6D2] rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500">
            <Star className="fill-amber-500" size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A09898] tracking-widest block">Média Geral</span>
            <span className="text-2xl font-black text-slate-900">{averageStars} / 5.0</span>
          </div>
        </div>

        <div className="bg-white border border-[#F0E6D2] rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D48C8C]/15 flex items-center justify-center text-[#D48C8C]">
            <MessageSquare size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A09898] tracking-widest block font-medium">Total de Avaliações</span>
            <span className="text-2xl font-black text-slate-900">{totalCount} avaliações</span>
          </div>
        </div>
      </div>

      {/* Grid of Feedbacks */}
      {feedbacks.length === 0 ? (
        <div className="bg-white border border-[#F0E6D2] rounded-3xl p-12 text-center">
          <p className="text-xs uppercase font-black text-[#A09898] tracking-widest">Nenhum feedback recebido ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedbacks.map((fb, idx) => (
            <div 
              key={fb.id || idx}
              className="bg-white border border-[#F0E6D2] rounded-3xl p-6 shadow-xs relative overflow-hidden transition-all hover:shadow-md"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  {fb.name || "Anônimo"}
                </span>
                <span className="text-[9px] uppercase font-black text-[#A09898] tracking-widest">
                  {getFormattedDate(fb.createdAt)}
                </span>
              </div>

              {/* Star Rating Display */}
              <div className="flex gap-1 mb-3 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    fill={i < (fb.stars || 5) ? "#cca062" : "none"} 
                    className={i < (fb.stars || 5) ? "text-[#cca062]" : "text-gray-200"} 
                  />
                ))}
              </div>

              {/* Message */}
              <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line bg-slate-50/50 rounded-2xl p-4 border border-dashed border-[#F0E6D2]/60">
                "{fb.text}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
