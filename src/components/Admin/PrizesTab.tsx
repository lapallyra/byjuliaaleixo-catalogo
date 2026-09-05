import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gift,
  Plus,
  Trash2,
  Save,
  Loader2,
  Image as ImageIcon,
  Percent,
  Sparkles,
  X,
  Edit,
} from "lucide-react";
import {
  subscribeToPrizes,
  savePrize,
  deletePrize,
} from "../../services/firebaseService";
import { CompanyId } from "../../types";
import { ImageWithFallback } from "../ImageWithFallback";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface Prize {
  id: string;
  name: string;
  type: "discount" | "special" | "product";
  value: string;
  image: string;
  weight: number;
  companyId: string;
}

export const PrizesTab: React.FC<{ companyId?: CompanyId }> = React.memo(({
  companyId: propCompanyId,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [selectedAtelier, setSelectedAtelier] = useState<CompanyId>(propCompanyId || "pallyra");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Partial<Prize> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToPrizes(setPrizes, selectedAtelier);
    setLoading(false);
    return () => unsub();
  }, [selectedAtelier]);

  const handleSave = async () => {
    if (
      !editingPrize?.name ||
      !editingPrize?.type ||
      (prizes.length >= 7 && !editingPrize.id)
    ) {
      if (prizes.length >= 7 && !editingPrize?.id) {
        orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Limite máximo de 7 brindes atingido.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: selectedAtelier as any,
      data: { success: true, title: 'Sucesso' }
    });
      } else {
        orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Preencha os campos obrigatórios.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: selectedAtelier as any,
      data: { success: false, title: 'Aviso' }
    });
      }
      return;
    }

    setIsSaving(true);
    try {
      await savePrize({
        ...editingPrize,
        companyId: selectedAtelier,
        weight: editingPrize.weight || 1,
        image: editingPrize.image || "🎁",
      });
      setIsModalOpen(false);
      setEditingPrize(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja excluir este brinde?")) {
      await deletePrize(id);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-lilac" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic">
            Brindes da Roleta
          </h2>
          <p className="text-[10px] text-slate-9000 font-bold uppercase tracking-[0.2em] mt-2">
            Configure os prêmios que aparecem na roleta pós-pagamento (+R$300)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Ateliê / Loja:</span>
            <select
              value={selectedAtelier}
              onChange={(e) => setSelectedAtelier(e.target.value as CompanyId)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="pallyra">La Pallyra</option>
              <option value="guennita">Guennita</option>
              <option value="mimada">Mimada</option>
              <option value="tuttymimo">Tutty Mimo</option>
              <option value="madrinha">Madrinha</option>
            </select>
          </div>

          <button
            onClick={() => {
              if (prizes.length >= 7) {
                orchestrator.dispatchEvent({
        type: 'FEEDBACK',
        message: "O sistema permite no máximo 7 brindes para a roleta.",
        priority: 'HIGH',
        customerName: '',
        productName: '',
        companyId: selectedAtelier as any,
        data: { success: true, title: 'Sucesso' }
      });
                return;
              }
              setEditingPrize({ type: "special", weight: 1 });
              setIsModalOpen(true);
            }}
            disabled={prizes.length >= 7}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${prizes.length >= 7 ? "bg-slate-100 text-[#A09898] cursor-not-allowed" : "bg-black text-white hover:scale-105 active:scale-95 shadow-xl shadow-black/10"}`}
          >
            <Plus size={16} /> Novo Brinde ({prizes.length}/7)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prizes.map((prize) => (
          <motion.div
            layout
            key={prize.id}
            className="bg-white border border-rose-50 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingPrize(prize);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-rose-100 rounded-xl text-[#A09898] hover:text-slate-900 transition-all text-[9px] font-black uppercase tracking-widest"
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(prize.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-rose-100 rounded-xl text-rose-300 hover:text-white hover:bg-rose-500 transition-all text-[9px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-rose-100 flex items-center justify-center text-4xl shrink-0 overflow-hidden shadow-inner">
                {prize.image.length > 5 ? (
                  <ImageWithFallback
                    src={prize.image}
                    alt={prize.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  prize.image || "🎁"
                )}
              </div>
              <div>
                <span
                  className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-block ${
                    prize.type === "discount"
                      ? "bg-emerald-50 text-emerald-500"
                      : prize.type === "product"
                        ? "bg-blue-50 text-blue-500"
                        : "bg-lilac/10 text-lilac"
                  }`}
                >
                  {prize.type === "discount"
                    ? "Desconto"
                    : prize.type === "product"
                      ? "Produto"
                      : "Especial"}
                </span>
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
                  {prize.name}
                </h3>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-rose-50/50">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-[#A09898]">Valor/Texto</span>
                <span className="text-slate-900">{prize.value}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-[#A09898]">Peso (Probabilidade)</span>
                <span className="text-slate-900">{prize.weight}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {prizes.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-[#D1CACA] border-2 border-dashed border-rose-50 rounded-3xl">
            <Gift size={48} className="mb-4 opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
              Nenhum brinde cadastrado
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-3xl overflow-hidden flex flex-col"
            >
              <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF007F]/10 text-[#FF007F] flex items-center justify-center border border-[#FF007F]/20">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-base italic">
                      Configurar Brinde
                    </h3>
                    <p className="text-[9px] text-[#FF007F] font-bold uppercase tracking-widest mt-1">
                      Roleta de Prêmios Premium
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-slate-50 text-[#A09898] rounded-2xl hover:text-slate-9000 transition-all"
                >
                  <X size={24} />
                </button>
              </header>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#FF007F] ml-4">
                    Nome do Brinde
                  </label>
                  <input
                    className="w-full bg-slate-50/30 border-2 border-transparent focus:border-rose-100 rounded-[2rem] px-8 py-4 outline-none text-sm font-bold text-slate-800 transition-all"
                    placeholder="Ex: 10% de Desconto"
                    value={editingPrize?.name || ""}
                    onChange={(e) =>
                      setEditingPrize({ ...editingPrize, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#FF007F] ml-4">
                    Peso (Sorte)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-50/30 border-2 border-transparent focus:border-rose-100 rounded-[2rem] px-8 py-4 outline-none text-sm font-bold text-slate-800 transition-all"
                    placeholder="1"
                    value={editingPrize?.weight || 1}
                    onChange={(e) =>
                      setEditingPrize({
                        ...editingPrize,
                        weight: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="pt-4 border-t border-rose-50 opacity-40 hover:opacity-100 transition-opacity">
                  <p className="text-[8px] font-black uppercase tracking-widest text-center mb-4">
                    Configurações Avançadas
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      className="w-full bg-slate-50/20 border border-rose-100 rounded-xl px-4 py-2 outline-none text-[10px] font-bold text-slate-800"
                      value={editingPrize?.type || "special"}
                      onChange={(e) =>
                        setEditingPrize({
                          ...editingPrize,
                          type: e.target.value as any,
                        })
                      }
                    >
                      <option value="discount">💰 Desconto</option>
                      <option value="product">🎁 Produto</option>
                      <option value="special">✨ Especial</option>
                    </select>
                    <input
                      className="w-full bg-slate-50/20 border border-rose-100 rounded-xl px-4 py-2 outline-none text-[10px] font-bold text-slate-800"
                      placeholder="Valor/Código"
                      value={editingPrize?.value || ""}
                      onChange={(e) =>
                        setEditingPrize({
                          ...editingPrize,
                          value: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      {" "}
                      <Save size={18} /> Salvar Brinde{" "}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
