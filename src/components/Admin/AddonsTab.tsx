import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Save,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CompanyId, CheckoutAddon } from "../../types";
import {
  subscribeToAddons,
  saveAddon,
  deleteAddon,
} from "../../services/firebaseService";
import { ImageUpload } from "./ImageUpload";
import { formatCurrency } from "../../lib/currencyUtils";

interface AddonsTabProps {
  companyId: CompanyId;
}

export const AddonsTab: React.FC<AddonsTabProps> = ({ companyId }) => {
  const [addons, setAddons] = useState<CheckoutAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingAddon, setEditingAddon] =
    useState<Partial<CheckoutAddon> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAddons((data) => {
      setAddons(data as CheckoutAddon[]);
      setLoading(false);
    }, companyId);
    return () => unsub();
  }, [companyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddon?.name || !editingAddon?.price) return;
    setSaving(true);
    try {
      await saveAddon({
        ...editingAddon,
        companyId,
        active: editingAddon.active ?? true,
      });
      setIsModalOpen(false);
      setEditingAddon(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar adicional");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este adicional?")) return;
    try {
      await deleteAddon(id);
    } catch (err) {
      alert("Erro ao excluir");
    }
  };

  const filteredAddons = addons.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );

  const createDefaultAddons = async () => {
    const defaults = [
      { name: "Cartão com Mensagem Especial", price: 10, image: "✉️" },
      { name: "Mini Ferrero Rocher 03", price: 15, image: "🍫" },
      { name: "Laço Grande", price: 5, image: "🎗️" },
      { name: "Borboletas Douradas 02", price: 8, image: "🦋" },
      { name: "Urso Pelúcia P 01", price: 45, image: "🧸" },
      { name: "Coração Pelúcia P 01", price: 35, image: "❤️" },
    ];

    for (const item of defaults) {
      await saveAddon({ ...item, companyId, active: true });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-lilac/10 text-lilac shadow-lg shadow-lilac/5">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
              Toque Final
            </h3>
            <p className="text-[10px] text-lilac font-bold uppercase tracking-[0.2em] mt-1">
              Gestão de Adicionais Premium
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {addons.length === 0 && (
            <button
              onClick={createDefaultAddons}
              className="px-6 py-4 bg-white border border-lilac/30 text-lilac rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-lilac/5 transition-all"
            >
              Criar Padrões
            </button>
          )}
          <button
            onClick={() => {
              setEditingAddon({ name: "", price: 0, image: "", active: true });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10"
          >
            <Plus size={16} /> Novo Adicional
          </button>
        </div>
      </div>

      <div className="relative">
        <Search
          className="absolute left-6 top-1/2 -translate-y-1/2 text-[#A09898]"
          size={18}
        />
        <input
          type="text"
          placeholder="BUSCAR ADICIONAL..."
          className="w-full bg-white border border-[#F0E6D2] rounded-2xl pl-16 pr-6 py-5 text-[10px] uppercase font-black tracking-widest outline-none focus:border-lilac transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-lilac border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAddons.map((addon, idx) => (
            <motion.div
              layout
              key={addon.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-2xl border border-[#F0E6D2] p-4 flex flex-col md:flex-row md:items-center gap-6 hover:border-lilac/30 hover:shadow-lg transition-all group relative"
            >
              {/* Small Thumnail (not enormous anymore) */}
              <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-50">
                {addon.image.length > 5 ? (
                  <img
                    src={addon.image}
                    alt={addon.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-tr from-lilac/5 to-white">
                    {addon.image || "✨"}
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-900 line-clamp-1 group-hover:text-lilac transition-colors">
                    {addon.name}
                  </h4>
                  <p
                    className={`text-[8px] font-black uppercase tracking-widest mt-1 ${addon.active ? "text-emerald-500" : "text-[#D1CACA]"}`}
                  >
                    {addon.active ? "Ativo na Loja" : "Pausado"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-[#D1CACA] uppercase tracking-widest">
                      Valor Adicional
                    </p>
                    <p className="text-lg font-elegant text-lilac leading-tight">
                      {formatCurrency(addon.price)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setEditingAddon(addon);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-[#A09898] rounded-xl hover:bg-lilac hover:text-white transition-all border border-transparent shadow-sm text-[9px] font-black uppercase tracking-widest"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(addon.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-[#A09898] rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-transparent shadow-sm text-[9px] font-black uppercase tracking-widest"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredAddons.length === 0 && (
            <div className="py-20 text-center rounded-3xl bg-white border-2 border-dashed border-[#F0E6D2] flex flex-col items-center justify-center opacity-40">
              <Sparkles size={40} className="mb-4 text-lilac" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                Nenhum adicional encontrado
              </p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                  {editingAddon?.id ? "Editar Adicional" : "Novo Adicional"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-[#A09898]"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <ImageUpload
                  label="Foto ou Ícone"
                  path={`addons/${companyId}`}
                  currentUrl={editingAddon?.image}
                  onUploadComplete={(url) =>
                    setEditingAddon((prev) => ({ ...prev, image: url }))
                  }
                  onRemove={() =>
                    setEditingAddon((prev) => ({ ...prev, image: "" }))
                  }
                />

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#A09898] uppercase tracking-widest ml-2">
                    Nome do Adicional
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-50 border border-[#F0E6D2] rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all"
                    value={editingAddon?.name || ""}
                    onChange={(e) =>
                      setEditingAddon((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#A09898] uppercase tracking-widest ml-2">
                      Valor (R$)
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-50 border border-[#F0E6D2] rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all"
                      value={editingAddon?.price || 0}
                      onChange={(e) =>
                        setEditingAddon((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#A09898] uppercase tracking-widest ml-2">
                      Status
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingAddon((prev) => ({
                          ...prev,
                          active: !prev?.active,
                        }))
                      }
                      className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${editingAddon?.active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-rose-600"}`}
                    >
                      {editingAddon?.active ? "Ativo" : "Inativo"}
                    </button>
                  </div>
                </div>

                <button
                  disabled={saving}
                  type="submit"
                  className="w-full py-6 bg-black text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all mt-4"
                >
                  {saving ? "Gravando..." : "Salvar Adicional"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
