import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Megaphone,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PromotionalCampaign, Product } from "../../types";
import { promotionalCampaignService } from "../../services/promotionalCampaignService";
import { ImageUpload } from "./ImageUpload";

interface PromotionalCampaignsTabProps {
  products: Product[];
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

type CampaignStatus = "ativa" | "agendada" | "expirada" | "pausada";

function getCampaignStatus(campaign: PromotionalCampaign): CampaignStatus {
  if (!campaign.active) return "pausada";
  
  const now = new Date();
  
  if (campaign.startDate && new Date(campaign.startDate) > now) {
    return "agendada";
  }
  
  if (campaign.endDate && new Date(campaign.endDate) < now) {
    return "expirada";
  }
  
  return "ativa";
}

const statusConfig: Record<CampaignStatus, { label: string; color: string; icon: any; bgColor: string }> = {
  ativa: { label: "Ativa", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: CheckCircle2 },
  agendada: { label: "Agendada", color: "text-blue-600", bgColor: "bg-blue-50", icon: Clock },
  expirada: { label: "Expirada", color: "text-rose-600", bgColor: "bg-rose-50", icon: XCircle },
  pausada: { label: "Pausada", color: "text-amber-600", bgColor: "bg-amber-50", icon: PauseCircle },
};

export function PromotionalCampaignsTab({ products }: PromotionalCampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<PromotionalCampaign> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [productSearchTerm, setProductSearchTerm] = useState("");

  useEffect(() => {
    const unsub = promotionalCampaignService.subscribe(setCampaigns);
    return () => unsub();
  }, []);

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableProductsForSearch = products.filter(
    (product) =>
      product.product_name.toLowerCase().includes(productSearchTerm.toLowerCase()) &&
      !editingCampaign?.products?.includes(product.id)
  );

  const toggleProduct = (productId: string) => {
    if (!editingCampaign) return;
    
    const currentProducts = editingCampaign.products || [];
    if (currentProducts.includes(productId)) {
      setEditingCampaign({
        ...editingCampaign,
        products: currentProducts.filter(id => id !== productId)
      });
    } else {
      setEditingCampaign({
        ...editingCampaign,
        products: [...currentProducts, productId]
      });
    }
  };

  const openModal = (campaign: Partial<PromotionalCampaign> | null) => {
    setEditingCampaign(campaign);
    setFormError(null);
    setProductSearchTerm("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
    setFormError(null);
    setProductSearchTerm("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!editingCampaign?.name) return;

    if (editingCampaign.startDate && editingCampaign.endDate) {
      if (new Date(editingCampaign.endDate) <= new Date(editingCampaign.startDate)) {
        setFormError("A data de término deve ser posterior à data de início.");
        return;
      }
    }

    const currentSlug = slugify(editingCampaign.name);
    const isDuplicateSlug = campaigns.some(
      (c) => c.id !== editingCampaign.id && slugify(c.name) === currentSlug
    );

    if (isDuplicateSlug) {
      setFormError(`Já existe outra campanha promocional com um nome que gera o mesmo endereço/slug ("${currentSlug}").`);
      return;
    }

    const data = {
      ...editingCampaign,
      slug: currentSlug,
      priority: Number(editingCampaign.priority || 1),
      active: editingCampaign.active ?? true,
      products: editingCampaign.products || [],
    } as Omit<PromotionalCampaign, "id" | "createdAt" | "updatedAt">;

    try {
      if (editingCampaign.id) {
        await promotionalCampaignService.update(editingCampaign.id, data);
      } else {
        await promotionalCampaignService.create(data);
      }
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar a campanha promocional.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta campanha promocional?")) {
      await promotionalCampaignService.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <Megaphone className="text-indigo-600" size={24} />
            Campanhas Promocionais
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie campanhas independentes com regras de período e produtos
          </p>
        </div>
        <button
          onClick={() => {
            openModal({
              active: true,
              priority: 1,
              products: [],
            });
          }}
          className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/10 active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} />
          <span>Nova Campanha</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl text-sm focus:bg-white transition-colors outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const status = getCampaignStatus(campaign);
            const { label, color, icon: StatusIcon, bgColor } = statusConfig[status];
            
            return (
            <div
              key={campaign.id}
              className="group relative bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl transition-all duration-300 hover:border-indigo-100 flex flex-col"
            >
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => openModal(campaign)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {campaign.banner && (
                <div className="mb-4 -mx-6 -mt-6 overflow-hidden rounded-t-3xl h-32 relative">
                  <img src={campaign.banner} alt={campaign.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}

              <div className={`flex items-center gap-4 mb-6 ${campaign.banner ? '-mt-10 relative z-10' : ''}`}>
                <div 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm border-2 border-white`}
                  style={{ backgroundColor: campaign.theme_color || '#3b82f6' }}
                >
                  <Megaphone size={24} />
                </div>
                <div className={campaign.banner ? 'pt-6' : ''}>
                  <h3 className="font-bold text-slate-900 line-clamp-1">{campaign.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${bgColor} ${color}`}>
                      <StatusIcon size={10} />
                      {label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Produtos Vinculados</span>
                  <span className="font-medium text-slate-900">
                    {campaign.products.length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Prioridade</span>
                  <span className="font-medium text-slate-900">
                    {campaign.priority}
                  </span>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-400" size={24} />
            </div>
            <p className="text-slate-500">Nenhuma campanha encontrada</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <form onSubmit={handleSave} className="flex flex-col h-full">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-xl sticky top-0 z-10">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {editingCampaign?.id ? "Editar Campanha" : "Nova Campanha"}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Configure os detalhes da campanha promocional
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                      Nome da Campanha
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCampaign?.name || ""}
                      onChange={(e) =>
                        setEditingCampaign({
                          ...editingCampaign,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ex: Black Friday 2024"
                      className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm focus:bg-white transition-colors outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                      Descrição
                    </label>
                    <textarea
                      value={editingCampaign?.description || ""}
                      onChange={(e) =>
                        setEditingCampaign({
                          ...editingCampaign,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descrição da campanha..."
                      className="w-full bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 py-4 text-sm focus:bg-white transition-colors outline-none resize-none min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                      Frase de Marketing
                    </label>
                    <input
                      type="text"
                      value={editingCampaign?.marketing_phrase || ""}
                      onChange={(e) =>
                        setEditingCampaign({
                          ...editingCampaign,
                          marketing_phrase: e.target.value,
                        })
                      }
                      placeholder="Ex: Aproveite nossos descontos!"
                      className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm focus:bg-white transition-colors outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                        Data de Início
                      </label>
                      <input
                        type="datetime-local"
                        value={editingCampaign?.startDate || ""}
                        onChange={(e) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm focus:bg-white transition-colors outline-none"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                        Data de Término
                      </label>
                      <input
                        type="datetime-local"
                        value={editingCampaign?.endDate || ""}
                        onChange={(e) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm focus:bg-white transition-colors outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-8 space-y-6">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900">
                      Configurações Adicionais
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                          Banner Desktop (opcional)
                        </label>
                        <ImageUpload
                          label="Upload do Banner"
                          path="promotional_campaigns"
                          currentUrl={editingCampaign?.banner || undefined}
                          onUploadComplete={(url) => setEditingCampaign({ ...editingCampaign, banner: url })}
                          onRemove={() => setEditingCampaign({ ...editingCampaign, banner: "" })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                          Banner Mobile (opcional)
                        </label>
                        <ImageUpload
                          label="Upload do Banner Mobile"
                          path="promotional_campaigns"
                          currentUrl={editingCampaign?.bannerMobile || undefined}
                          onUploadComplete={(url) => setEditingCampaign({ ...editingCampaign, bannerMobile: url })}
                          onRemove={() => setEditingCampaign({ ...editingCampaign, bannerMobile: "" })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                          Cor Temática
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editingCampaign?.theme_color || "#3b82f6"}
                            onChange={(e) =>
                              setEditingCampaign({
                                ...editingCampaign,
                                theme_color: e.target.value,
                              })
                            }
                            className="w-14 h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl p-1.5 cursor-pointer focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                          />
                          <input
                            type="text"
                            value={editingCampaign?.theme_color || "#3b82f6"}
                            onChange={(e) =>
                              setEditingCampaign({
                                ...editingCampaign,
                                theme_color: e.target.value,
                              })
                            }
                            placeholder="#3b82f6"
                            className="flex-1 h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm font-bold uppercase focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                          Prioridade (Menor = Mais importante)
                        </label>
                        <input
                          type="number"
                          value={editingCampaign?.priority || 1}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              priority: parseInt(e.target.value) || 1,
                            })
                          }
                          min="1"
                          className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm focus:bg-white transition-colors outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-8 space-y-6">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900 flex items-center justify-between">
                      Produtos Vinculados
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-[10px]">
                        {editingCampaign?.products?.length || 0} selecionados
                      </span>
                    </h4>

                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar produtos para vincular..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 transition-colors outline-none"
                        />
                      </div>

                      {editingCampaign?.products && editingCampaign.products.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editingCampaign.products.map(productId => {
                            const product = products.find(p => p.id === productId);
                            if (!product) return null;
                            return (
                              <div key={productId} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm border border-indigo-100">
                                <span className="max-w-[200px] truncate">{product.product_name}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleProduct(productId)}
                                  className="text-indigo-400 hover:text-indigo-700 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {productSearchTerm && availableProductsForSearch.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto shadow-sm">
                          {availableProductsForSearch.map(product => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                toggleProduct(product.id);
                                setProductSearchTerm("");
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-sm flex items-center justify-between group"
                            >
                              <span className="text-slate-700 group-hover:text-slate-900 truncate pr-4">{product.product_name}</span>
                              <Plus size={16} className="text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {productSearchTerm && availableProductsForSearch.length === 0 && (
                        <div className="text-center py-4 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                          Nenhum produto disponível encontrado.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center min-h-[72px]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${editingCampaign?.active ?? true ? "bg-emerald-500" : "bg-slate-200"}`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${editingCampaign?.active ?? true ? "ml-6" : "ml-0"}`}
                        />
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={editingCampaign?.active ?? true}
                        onChange={(e) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            active: e.target.checked,
                          })
                        }
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900">
                        Status Ativa
                      </span>
                    </label>
                  </div>

                  {formError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-xs font-medium flex items-center gap-3 animate-in fade-in duration-300">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-8 py-4 rounded-2xl text-[10px] font-medium tracking-normal text-[#8E8E93] hover:text-slate-900 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-black text-white px-8 py-4 rounded-2xl text-sm font-medium hover:scale-105 transition-all shadow-xl shadow-black/10 active:scale-95"
                    >
                      Salvar Campanha
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
