import React, { useState } from 'react';
import { Star, MessageSquare, Plus, X, Trash2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { addFeedback, deleteFeedback, updateFeedbackStatus } from '../../services/firebaseService';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbacksTabProps {
  feedbacks: any[];
}

export const FeedbacksTab: React.FC<FeedbacksTabProps> = ({ feedbacks = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ name: '', text: '', stars: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      await updateFeedbackStatus(id, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.name || !newFeedback.text) return;
    
    setIsSubmitting(true);
    try {
      await addFeedback(newFeedback.name, newFeedback.text, newFeedback.stars);
      setNewFeedback({ name: '', text: '', stars: 5 });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este depoimento?")) return;
    try {
      await deleteFeedback(id);
    } catch (error) {
      console.error("Error deleting feedback:", error);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
            <Star className="text-amber-500 fill-amber-500" size={24} />
            Feedback de Clientes
          </h2>
          <p className="text-[10px] uppercase font-black text-[#A09898] tracking-widest mt-1">
            Parede de Amor - Todos os feedbacks e depoimentos do WhatsApp
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Plus size={16} />
          Novo Depoimento (WhatsApp)
        </button>
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
                <div className="flex items-center gap-3">
                  <span className="font-serif text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    {fb.name || "Anônimo"}
                  </span>
                  
                  <button
                    onClick={() => toggleStatus(fb.id, fb.status)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                      fb.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {fb.status === 'approved' ? (
                      <>
                        <CheckCircle2 size={10} />
                        Validado
                      </>
                    ) : (
                      <>
                        <AlertCircle size={10} />
                        Pendente
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-black text-[#A09898] tracking-widest">
                    {getFormattedDate(fb.createdAt)}
                  </span>
                  <button 
                    onClick={() => handleDelete(fb.id)}
                    className="p-1.5 text-slate-200 hover:text-red-500 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
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

      {/* Modal for adding feedback */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-amber-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-amber-50/30">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Novo Depoimento</h2>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Cadastrar feedback do WhatsApp</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-2xl bg-white border border-amber-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome do Cliente</label>
                  <input
                    type="text"
                    required
                    value={newFeedback.name}
                    onChange={(e) => setNewFeedback({ ...newFeedback, name: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:border-amber-300 focus:bg-white transition-all shadow-inner"
                    placeholder="Ex: Maria Oliveira"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Avaliação (Estrelas)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewFeedback({ ...newFeedback, stars: star })}
                        className={`p-3 rounded-xl border transition-all ${
                          newFeedback.stars >= star 
                            ? "bg-amber-50 border-amber-200 text-amber-500 shadow-sm scale-105" 
                            : "bg-slate-50 border-slate-100 text-slate-300"
                        }`}
                      >
                        <Star size={20} fill={newFeedback.stars >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Depoimento</label>
                  <textarea
                    required
                    value={newFeedback.text}
                    onChange={(e) => setNewFeedback({ ...newFeedback, text: e.target.value })}
                    className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:border-amber-300 focus:bg-white transition-all shadow-inner resize-none"
                    placeholder="Cole aqui o depoimento enviado pelo cliente..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/30 flex items-center justify-center gap-3 transition-all hover:bg-amber-600 active:scale-95 ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      Salvar Depoimento
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
