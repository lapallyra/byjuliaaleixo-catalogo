import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Copy,
  Archive,
  Eye,
  X,
  Megaphone,
  Clock,
  ChevronUp,
  ChevronDown,
  Layout,
  Layers,
  Palette,
  Flag,
  Monitor,
  Smartphone,
  AppWindow,
  Type,
  ListFilter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Campaign, CompanyId } from "../../types";
import {
  subscribeToCampaigns,
  saveCampaign,
  deleteCampaign,
  subscribeToProducts,
} from "../../services/firebaseService";
import { ImageUpload } from "./ImageUpload";
import { ImageWithFallback } from "../ImageWithFallback";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface CampaignsTabProps { products: Product[]; }
export const CampaignsTab: React.FC<CampaignsTabProps> = React.memo(({ products }) => {
  const orchestrator = useAdminOrchestrator();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals / Editors
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  // Search query inside product selector
  const [prodSearchQuery, setProdSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Load Campaigns and Products
  useEffect(() => {
    const unsubCamp = subscribeToCampaigns((data) => {
      setCampaigns(data);
      setLoading(false);
    });

    return () => {
      unsubCamp();
      };
  }, []);

  const handleOpenNewForm = () => {
    setEditingCampaign({
      internalName: "",
      title: "",
      subtitle: "",
      description: "",
      type: "seasonal_campaign",
      active: true,
      startDate: "",
      endDate: "",
      priority: 0,
      companyId: "all",
      items: [],
      targetPages: ["home"],
      highlightProductId: "",
      imageUrl: "",
      mobileImageUrl: "",
      colorTheme: "",
      linkUrl: "",
    });
    setProdSearchQuery("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (camp: Campaign) => {
    setEditingCampaign({ ...camp });
    setProdSearchQuery("");
    setIsFormOpen(true);
  };

  const handleDuplicate = async (camp: Campaign) => {
    try {
      const duplicated: Partial<Campaign> = {
        ...camp,
        id: undefined,
        title: `${camp.title} (Cópia)`,
        createdAt: new Date(),
      };
      await saveCampaign(duplicated);
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao duplicar campanha.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    }
  };

  const handleToggleActive = async (camp: Campaign) => {
    try {
      await saveCampaign({
        ...camp,
        active: !camp.active,
      });
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao alterar status da campanha.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    }
  };

  const handleReorderCampaign = async (index: number, direction: 'up' | 'down') => {
    const list = [...filteredCampaigns];
    if (direction === 'up' && index > 0) {
      const current = list[index];
      const previous = list[index - 1];
      const currentPrio = current.priority ?? 0;
      const prevPrio = previous.priority ?? 0;

      if (currentPrio === prevPrio) {
        current.priority = prevPrio + 1;
      } else {
        current.priority = prevPrio;
        previous.priority = currentPrio;
      }
      await saveCampaign(current);
      await saveCampaign(previous);
    } else if (direction === 'down' && index < list.length - 1) {
      const current = list[index];
      const next = list[index + 1];
      const currentPrio = current.priority ?? 0;
      const nextPrio = next.priority ?? 0;

      if (currentPrio === nextPrio) {
        current.priority = Math.max(0, nextPrio - 1);
      } else {
        current.priority = nextPrio;
        next.priority = currentPrio;
      }
      await saveCampaign(current);
      await saveCampaign(next);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta campanha? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteCampaign(id);
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao excluir campanha.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign?.title || !editingCampaign?.type) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Título e Tipo são obrigatórios.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Aviso' }
    });
      return;
    }

    setSaving(true);
    try {
      await saveCampaign(editingCampaign);
      setIsFormOpen(false);
      setEditingCampaign(null);
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao salvar campanha.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    } finally {
      setSaving(false);
    }
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    if (!editingCampaign || !editingCampaign.items) return;
    const list = [...editingCampaign.items];
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setEditingCampaign({ ...editingCampaign, items: list });
  };

  const handleToggleProduct = (productId: string) => {
    if (!editingCampaign) return;
    const list = [...(editingCampaign.items || [])];
    const idx = list.indexOf(productId);
    if (idx > -1) {
      list.splice(idx, 1);
      let highlight = editingCampaign.highlightProductId;
      if (highlight === productId) highlight = "";
      setEditingCampaign({ ...editingCampaign, items: list, highlightProductId: highlight });
    } else {
      list.push(productId);
      setEditingCampaign({ ...editingCampaign, items: list });
    }
  };

  const handleSetHighlight = (productId: string) => {
    if (!editingCampaign) return;
    setEditingCampaign({
      ...editingCampaign,
      highlightProductId: editingCampaign.highlightProductId === productId ? "" : productId,
    });
  };

  const handleToggleTargetPage = (page: 'home' | 'catalog' | 'product') => {
    if (!editingCampaign) return;
    const targetPages = [...(editingCampaign.targetPages || [])];
    const idx = targetPages.indexOf(page);
    if (idx > -1) {
      targetPages.splice(idx, 1);
    } else {
      targetPages.push(page);
    }
    setEditingCampaign({ ...editingCampaign, targetPages: targetPages as any });
  };

  const campaignTypes = [
    { value: "banner", label: "Banner Principal", icon: <Monitor size={14} /> },
    { value: "carousel", label: "Carrossel de Produtos", icon: <Layers size={14} /> },
    { value: "product_highlight", label: "Destaque de Produto", icon: <Flag size={14} /> },
    { value: "seasonal_campaign", label: "Campanha Sazonal", icon: <Palette size={14} /> },
  ];

  const filteredCampaigns = campaigns.filter((camp) =>
    camp.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5EA] text-[#1C1C1E] shadow-sm">
            <Megaphone size={24} className="text-[#cca062]" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight">Marketing & Campanhas</h3>
            <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mt-1">Motor de Vitrine Dinâmica</p>
          </div>
        </div>

        <button
          onClick={handleOpenNewForm}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] text-[#1C1C1E] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer border-b-[3px] border-b-[#E5E5EA] hover:border-b-[#1C1C1E] active:border-b-0"
        >
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E5E5EA] shadow-xs max-w-full">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
          <input
            type="text"
            placeholder="PESQUISAR CAMPANHA..."
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-12 pr-4 py-3 text-xs font-semibold uppercase tracking-wider outline-none focus:border-[#1C1C1E] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1C1C1E] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 bg-white border border-[#E5E5EA] rounded-3xl shadow-xs">
          <Megaphone size={48} className="text-[#D1D1D6] mb-4" />
          <h4 className="text-sm font-bold text-[#1C1C1E]">Nenhuma Campanha Encontrada</h4>
          <button onClick={handleOpenNewForm} className="mt-4 text-[#cca062] font-bold text-xs uppercase tracking-wider hover:underline">Criar agora</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp, idx) => (
            <div key={camp.id} className="group bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5">
              <div className="relative aspect-[21/9] bg-[#F5F5F7] border-b border-[#E5E5EA] overflow-hidden">
                {camp.imageUrl ? (
                  <ImageWithFallback src={camp.imageUrl} alt={camp.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#D1D1D6] p-4">
                    <Megaphone size={32} />
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-2">Sem Banner</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border flex items-center gap-1.5 bg-white/95 backdrop-blur-md shadow-xs ${camp.active ? "text-emerald-600 border-emerald-200" : "text-slate-500 border-slate-200"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${camp.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {camp.active ? "Ativa" : "Pausada"}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-extrabold text-[#cca062] uppercase tracking-widest bg-[#fffdfa] border border-[#f5e6d3] px-2 py-0.5 rounded-md">
                      {campaignTypes.find(t => t.value === camp.type)?.label || camp.type}
                    </span>
                    <span className="text-[10px] font-bold text-[#8E8E93]">Prio: {camp.priority}</span>
                  </div>
                  <h4 className="text-base font-bold text-[#1C1C1E] mt-2 truncate">{camp.title}</h4>
                  {camp.internalName && (
                    <span className="text-[10px] text-[#cca062] font-mono font-semibold block mt-0.5">Ref: {camp.internalName}</span>
                  )}
                  {camp.subtitle && (
                    <p className="text-xs text-neutral-500 font-medium line-clamp-1 mt-1">{camp.subtitle}</p>
                  )}
                  {camp.description && <p className="text-xs text-[#8E8E93] line-clamp-1 mt-1">{camp.description}</p>}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {camp.targetPages?.map(page => (
                    <span key={page} className="px-2 py-0.5 bg-[#F5F5F7] text-[#1C1C1E] rounded-md text-[9px] font-bold uppercase tracking-wider border border-[#E5E5EA]">
                      {page}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#F2F2F7]">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1"><Clock size={10} /> Início</span>
                    <span className="text-xs font-bold text-[#1C1C1E]">{camp.startDate || "-"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1"><Clock size={10} /> Fim</span>
                    <span className="text-xs font-bold text-[#1C1C1E]">{camp.endDate || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-[#F5F5F7] border-t border-[#E5E5EA] flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => { setViewingCampaign(camp); setIsPreviewOpen(true); }} className="p-2 bg-white border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all" title="Visualizar"><Eye size={14} /></button>
                  <button type="button" onClick={() => handleOpenEditForm(camp)} className="p-2 bg-white border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all" title="Editar"><Edit2 size={14} /></button>
                  <button type="button" onClick={() => handleDuplicate(camp)} className="p-2 bg-white border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all" title="Duplicar"><Copy size={14} /></button>
                  <div className="flex items-center gap-1 border-l border-neutral-200 pl-1.5 ml-0.5">
                    <button type="button" onClick={() => handleReorderCampaign(idx, 'up')} disabled={idx === 0} className="p-1.5 bg-white border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] disabled:opacity-30 transition-all" title="Mover para cima"><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => handleReorderCampaign(idx, 'down')} disabled={idx === filteredCampaigns.length - 1} className="p-1.5 bg-white border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] disabled:opacity-30 transition-all" title="Mover para baixo"><ChevronDown size={14} /></button>
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(camp.id)} className="p-2 bg-white border border-[#E5E5EA] rounded-xl text-rose-500 hover:bg-rose-50 transition-all" title="Excluir"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isFormOpen && editingCampaign && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[150] flex items-center justify-end">
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="w-full max-w-4xl bg-[#fffdfa] h-full shadow-2xl overflow-y-auto flex flex-col border-l border-[#E5E5EA]">
              <div className="px-6 py-5 border-b border-[#E5E5EA] flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl"><Megaphone size={18} className="text-[#cca062]" /></div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1C1C1E]">{editingCampaign.id ? "Editar Campanha" : "Nova Campanha de Marketing"}</h4>
                    <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider">Configure o motor de vitrine dinâmica</p>
                  </div>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-[#F5F5F7] rounded-xl text-[#8E8E93] border border-[#E5E5EA]"><X size={16} /></button>
              </div>

              <form onSubmit={handleSave} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-[#E5E5EA]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Nome Interno (Administrativo) *</label>
                        <input type="text" required className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]" value={editingCampaign.internalName || ""} onChange={e => setEditingCampaign({...editingCampaign, internalName: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Título da Campanha (Público) *</label>
                        <input type="text" required className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]" value={editingCampaign.title} onChange={e => setEditingCampaign({...editingCampaign, title: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Subtítulo</label>
                        <input type="text" className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]" value={editingCampaign.subtitle || ""} onChange={e => setEditingCampaign({...editingCampaign, subtitle: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Link de Destino</label>
                        <input type="text" placeholder="Ex: /lapallyra?category=Maternidade" className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]" value={editingCampaign.linkUrl || ""} onChange={e => setEditingCampaign({...editingCampaign, linkUrl: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Tipo de Campanha *</label>
                        <select required className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]" value={editingCampaign.type} onChange={e => setEditingCampaign({...editingCampaign, type: e.target.value as any})}>
                          {campaignTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Prioridade</label>
                        <input type="number" className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]" value={editingCampaign.priority} onChange={e => setEditingCampaign({...editingCampaign, priority: parseInt(e.target.value)})} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Páginas de Destino</label>
                      <div className="flex gap-4">
                        {['home', 'catalog', 'product'].map(page => (
                          <label key={page} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editingCampaign.targetPages?.includes(page as any)} onChange={() => handleToggleTargetPage(page as any)} className="w-4 h-4 rounded border-[#E5E5EA] text-[#1C1C1E]" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#1C1C1E]">{page}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Data Início</label>
                        <input type="date" className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]" value={editingCampaign.startDate} onChange={e => setEditingCampaign({...editingCampaign, startDate: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Data Fim</label>
                        <input type="date" className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]" value={editingCampaign.endDate} onChange={e => setEditingCampaign({...editingCampaign, endDate: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editingCampaign.active} onChange={e => setEditingCampaign({...editingCampaign, active: e.target.checked})} className="w-4 h-4" />
                        <span className="text-xs font-bold text-[#1C1C1E]">CAMPANHA ATIVA</span>
                      </label>
                      <div className="flex-1 flex items-center gap-2">
                         <Palette size={14} className="text-[#8E8E93]" />
                         <input type="text" placeholder="Tema de cor (ex: #cca062)" className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-1.5 text-xs outline-none" value={editingCampaign.colorTheme} onChange={e => setEditingCampaign({...editingCampaign, colorTheme: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <ImageUpload label="Banner Desktop" path="campaigns/desktop" currentUrl={editingCampaign.imageUrl} onUploadComplete={url => setEditingCampaign({...editingCampaign, imageUrl: url})} onRemove={() => setEditingCampaign({...editingCampaign, imageUrl: ""})} />
                       <ImageUpload label="Banner Mobile" path="campaigns/mobile" currentUrl={editingCampaign.mobileImageUrl} onUploadComplete={url => setEditingCampaign({...editingCampaign, mobileImageUrl: url})} onRemove={() => setEditingCampaign({...editingCampaign, mobileImageUrl: ""})} />
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-[420px] bg-white p-6 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5">
                    <h5 className="text-[10px] uppercase font-bold text-[#8E8E93]">Itens da Campanha ({editingCampaign.items?.length || 0})</h5>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={14} />
                      <input type="text" placeholder="Buscar produto..." className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-9 pr-4 py-2 text-xs" value={prodSearchQuery} onChange={e => setProdSearchQuery(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      {editingCampaign.items?.map((itemId, idx) => {
                        const p = products.find(prod => prod.id === itemId);
                        if (!p) return null;
                        const isHigh = editingCampaign.highlightProductId === itemId;
                        return (
                          <div key={itemId} className={`p-2 border rounded-xl flex items-center justify-between gap-2 ${isHigh ? "border-[#cca062] bg-[#fffdfa]" : "border-[#E5E5EA]"}`}>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                               <img src={p.image} className="w-8 h-8 rounded object-cover border" />
                               <div className="min-w-0">
                                 <p className="text-[11px] font-bold truncate">{p.product_name}</p>
                                 <button type="button" onClick={() => handleSetHighlight(itemId)} className={`text-[8px] font-bold uppercase tracking-widest ${isHigh ? "text-[#cca062]" : "text-[#8E8E93] hover:text-[#1C1C1E]"}`}>{isHigh ? "★ Destaque" : "☆ Marcar Destaque"}</button>
                               </div>
                            </div>
                            <div className="flex items-center gap-1">
                               <button type="button" onClick={() => handleMoveItem(idx, 'up')} disabled={idx === 0} className="p-1 disabled:opacity-30"><ChevronUp size={14}/></button>
                               <button type="button" onClick={() => handleMoveItem(idx, 'down')} disabled={idx === (editingCampaign.items?.length || 0) - 1} className="p-1 disabled:opacity-30"><ChevronDown size={14}/></button>
                               <button type="button" onClick={() => handleToggleProduct(itemId)} className="p-1 text-rose-500"><Trash2 size={13}/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <span className="text-[9px] font-bold text-[#8E8E93] uppercase">Disponíveis:</span>
                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                        {products.filter(p => p.product_name.toLowerCase().includes(prodSearchQuery.toLowerCase()) && !editingCampaign.items?.includes(p.id)).slice(0, 10).map(p => (
                          <div key={p.id} className="p-2 border rounded-xl flex items-center justify-between gap-2 hover:border-[#1C1C1E]">
                             <div className="flex items-center gap-2 min-w-0 flex-1">
                               <img src={p.image} className="w-6 h-6 rounded object-cover" />
                               <p className="text-[11px] font-bold truncate">{p.product_name}</p>
                             </div>
                             <button type="button" onClick={() => handleToggleProduct(p.id)} className="px-2 py-1 bg-[#F5F5F7] rounded text-[9px] font-bold uppercase">Add</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-xs font-bold text-[#8E8E93]">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-6 py-2 bg-[#1C1C1E] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-50">
                      {saving ? "Salvando..." : "Salvar"}
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
});
