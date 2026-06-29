import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Search,
  Trash2,
  Edit2,
  Copy,
  Archive,
  Eye,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  Sparkles,
  Layout,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Megaphone,
  Clock,
  Tag,
  AlertCircle,
  FolderMinus,
  CheckSquare,
  Square
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../../types";
import {
  subscribeToCampaigns,
  saveCampaign,
  deleteCampaign,
  subscribeToProducts,
} from "../../services/firebaseService";
import { ImageUpload } from "./ImageUpload";
import { ImageWithFallback } from "../ImageWithFallback";

export const CampaignsTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals / Editors
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<any | null>(null);

  // Search query inside product selector
  const [prodSearchQuery, setProdSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Load Campaigns and Products
  useEffect(() => {
    const unsubCamp = subscribeToCampaigns((data) => {
      // Sort newest first by default
      const sorted = [...data].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setCampaigns(sorted);
      setLoading(false);
    });

    const unsubProd = subscribeToProducts((data) => {
      setProducts(data);
    });

    return () => {
      unsubCamp();
      unsubProd();
    };
  }, []);

  // Generate slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
      .replace(/[\s_-]+/g, "-") // replace spaces/underscores with hyphen
      .replace(/^-+|-+$/g, ""); // trim hyphens
  };

  const handleOpenNewForm = () => {
    setEditingCampaign({
      name: "",
      slug: "",
      slogan: "",
      description: "",
      bannerDesktop: "",
      bannerMobile: "",
      startDate: "",
      endDate: "",
      status: "Rascunho", // Rascunho, Agendada, Ativa, Finalizada, Arquivada
      productIds: [],
      featuredProductId: "",
    });
    setProdSearchQuery("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (camp: any) => {
    setEditingCampaign({ ...camp });
    setProdSearchQuery("");
    setIsFormOpen(true);
  };

  const handleDuplicate = async (camp: any) => {
    try {
      const duplicated = {
        ...camp,
        id: undefined,
        name: `${camp.name} (Cópia)`,
        slug: `${camp.slug}-copia-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date(),
      };
      await saveCampaign(duplicated);
    } catch (err) {
      console.error(err);
      alert("Erro ao duplicar campanha.");
    }
  };

  const handleArchive = async (camp: any) => {
    try {
      await saveCampaign({
        ...camp,
        status: "Arquivada",
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao arquivar campanha.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta campanha? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteCampaign(id);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir campanha.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign?.name || !editingCampaign?.slug) {
      alert("Nome e Slug são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      await saveCampaign(editingCampaign);
      setIsFormOpen(false);
      setEditingCampaign(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar campanha.");
    } finally {
      setSaving(false);
    }
  };

  // Move product up/down in the campaign order
  const handleMoveProduct = (index: number, direction: "up" | "down") => {
    if (!editingCampaign) return;
    const list = [...editingCampaign.productIds];
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setEditingCampaign({ ...editingCampaign, productIds: list });
  };

  // Add/remove product from the campaign list
  const handleToggleProduct = (productId: string) => {
    if (!editingCampaign) return;
    const list = [...editingCampaign.productIds];
    const idx = list.indexOf(productId);
    if (idx > -1) {
      list.splice(idx, 1);
      // Clear featured if removed
      let featured = editingCampaign.featuredProductId;
      if (featured === productId) {
        featured = "";
      }
      setEditingCampaign({ ...editingCampaign, productIds: list, featuredProductId: featured });
    } else {
      list.push(productId);
      setEditingCampaign({ ...editingCampaign, productIds: list });
    }
  };

  // Set as featured
  const handleSetFeatured = (productId: string) => {
    if (!editingCampaign) return;
    setEditingCampaign({
      ...editingCampaign,
      featuredProductId: editingCampaign.featuredProductId === productId ? "" : productId,
    });
  };

  // Get status badge styles and translation
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Rascunho":
        return {
          bg: "bg-slate-100 border-slate-300 text-slate-700",
          dot: "bg-slate-400",
          label: "Rascunho"
        };
      case "Agendada":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-700",
          dot: "bg-amber-500",
          label: "Agendada"
        };
      case "Ativa":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
          dot: "bg-emerald-500",
          label: "Ativa"
        };
      case "Finalizada":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-700",
          dot: "bg-rose-500",
          label: "Finalizada"
        };
      case "Arquivada":
        return {
          bg: "bg-purple-50 border-purple-200 text-purple-700",
          dot: "bg-purple-500",
          label: "Arquivada"
        };
      default:
        return {
          bg: "bg-slate-100 border-slate-300 text-slate-700",
          dot: "bg-slate-400",
          label: status
        };
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camp.slogan && camp.slogan.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 select-none">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5EA] text-[#1C1C1E] shadow-sm">
            <Megaphone size={24} className="text-[#cca062]" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight">
              Campanhas
            </h3>
            <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mt-1">
              Vitrine de Campanhas Sazonais e Promocionais
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={handleOpenNewForm}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] text-[#1C1C1E] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer border-b-[3px] border-b-[#E5E5EA] hover:border-b-[#1C1C1E] active:border-b-0"
          >
            <Plus size={16} /> Nova Campanha
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5EA] shadow-xs max-w-full">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
          <input
            type="text"
            placeholder="PESQUISAR CAMPANHA PELO NOME OU SLOGAN..."
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-12 pr-4 py-3 text-xs font-semibold uppercase tracking-wider outline-none focus:border-[#1C1C1E] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* CAMPAIGNS LIST */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1C1C1E] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 bg-white border border-[#E5E5EA] rounded-3xl shadow-xs">
          <Megaphone size={48} className="text-[#D1D1D6] mb-4" />
          <h4 className="text-sm font-bold text-[#1C1C1E]">Nenhuma Campanha Ativa</h4>
          <p className="text-xs text-[#8E8E93] max-w-sm mt-1">
            Clique no botão "Nova Campanha" para criar sua primeira campanha sazonal ou promocional.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const badge = getStatusBadge(camp.status);
            const featuredProd = products.find((p) => p.id === camp.featuredProductId);

            return (
              <div
                key={camp.id}
                className="group bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Banner Header Area */}
                <div className="relative aspect-[21/9] bg-[#F5F5F7] border-b border-[#E5E5EA] overflow-hidden">
                  {camp.bannerDesktop ? (
                    <ImageWithFallback
                      src={camp.bannerDesktop}
                      alt={camp.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#D1D1D6] p-4">
                      <Megaphone size={32} />
                      <span className="text-[10px] font-bold uppercase tracking-wider mt-2">Sem Banner</span>
                    </div>
                  )}

                  {/* Status Badge overlay */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border flex items-center gap-1.5 bg-white/95 backdrop-blur-md shadow-xs ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-[#1C1C1E] tracking-tight truncate">
                      {camp.name}
                    </h4>
                    {camp.slogan && (
                      <p className="text-xs text-[#8E8E93] italic font-medium line-clamp-1">
                        "{camp.slogan}"
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3.5 border-y border-[#F2F2F7]">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1">
                        <Clock size={10} /> Início
                      </span>
                      <span className="text-xs font-bold text-[#1C1C1E]">
                        {camp.startDate ? new Date(camp.startDate).toLocaleDateString("pt-BR") : "Não definida"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1">
                        <Clock size={10} /> Término
                      </span>
                      <span className="text-xs font-bold text-[#1C1C1E]">
                        {camp.endDate ? new Date(camp.endDate).toLocaleDateString("pt-BR") : "Não definida"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E8E93]">Produtos</span>
                    <span className="font-extrabold text-[#1C1C1E] bg-[#F5F5F7] px-2 py-0.5 rounded-md border border-[#E5E5EA]">
                      {camp.productIds?.length || 0} un.
                    </span>
                  </div>

                  {featuredProd && (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E5E5EA] shrink-0 bg-white">
                        <ImageWithFallback
                          src={featuredProd.image}
                          alt={featuredProd.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] font-extrabold text-[#cca062] uppercase tracking-widest block">Destaque</span>
                        <p className="text-[11px] font-bold text-[#1C1C1E] truncate">{featuredProd.product_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operations footer */}
                <div className="px-5 py-4 bg-[#F5F5F7] border-t border-[#E5E5EA] flex items-center justify-between gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setViewingCampaign(camp);
                        setIsPreviewOpen(true);
                      }}
                      className="p-2 bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Prévia na Vitrine"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEditForm(camp)}
                      className="p-2 bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Editar Campanha"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(camp)}
                      className="p-2 bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Duplicar"
                    >
                      <Copy size={14} />
                    </button>
                    {camp.status !== "Arquivada" && (
                      <button
                        onClick={() => handleArchive(camp)}
                        className="p-2 bg-white hover:bg-purple-50 border border-[#E5E5EA] hover:border-purple-300 rounded-xl text-[#8E8E93] hover:text-purple-600 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Arquivar"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(camp.id)}
                    className="p-2 bg-white hover:bg-rose-50 border border-[#E5E5EA] hover:border-rose-300 rounded-xl text-[#8E8E93] hover:text-[#FF3B30] transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {isFormOpen && editingCampaign && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[150] flex items-center justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-4xl bg-[#fffdfa] h-full shadow-2xl overflow-y-auto flex flex-col border-l border-[#E5E5EA]"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-[#E5E5EA] flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-[#1C1C1E]">
                    <Megaphone size={18} className="text-[#cca062]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1C1C1E]">
                      {editingCampaign.id ? "Editar Campanha" : "Nova Campanha Sazonal"}
                    </h4>
                    <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider">
                      Configure os detalhes e os produtos da sua campanha
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingCampaign(null);
                  }}
                  className="p-2 hover:bg-[#F5F5F7] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer border border-[#E5E5EA] active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left side: campaign metadata fields */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-[#E5E5EA]">
                  <h5 className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-widest border-b border-[#E5E5EA] pb-2">
                    Informações Gerais
                  </h5>

                  <div className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Nome da Campanha *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                        placeholder="Ex: Campanha Dia dos Namorados"
                        value={editingCampaign.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setEditingCampaign({
                            ...editingCampaign,
                            name,
                            slug: editingCampaign.id ? editingCampaign.slug : generateSlug(name)
                          });
                        }}
                      />
                    </div>

                    {/* Slug */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Slug de URL *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                        placeholder="campanha-dia-dos-namorados"
                        value={editingCampaign.slug}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, slug: generateSlug(e.target.value) })}
                      />
                    </div>

                    {/* Slogan */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Slogan Promocional</label>
                      <input
                        type="text"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                        placeholder="Ex: O amor em cada detalhe premium."
                        value={editingCampaign.slogan || ""}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, slogan: e.target.value })}
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Descrição Curta</label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all resize-none"
                        placeholder="Descreva o propósito da campanha..."
                        value={editingCampaign.description || ""}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Data de Início</label>
                        <input
                          type="date"
                          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                          value={editingCampaign.startDate || ""}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Data de Término</label>
                        <input
                          type="date"
                          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                          value={editingCampaign.endDate || ""}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Status da Campanha</label>
                      <select
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                        value={editingCampaign.status}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value })}
                      >
                        <option value="Rascunho">Rascunho</option>
                        <option value="Agendada">Agendada</option>
                        <option value="Ativa">Ativa</option>
                        <option value="Finalizada">Finalizada</option>
                        <option value="Arquivada">Arquivada</option>
                      </select>
                    </div>
                  </div>

                  {/* Banners */}
                  <h5 className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-widest border-b border-[#E5E5EA] pb-2 pt-4">
                    Banners da Campanha
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Desktop banner */}
                    <div className="space-y-2">
                      <ImageUpload
                        label="Banner Desktop (Recomendado: 1920x600)"
                        path={`campaigns/${editingCampaign.slug || "temp"}/desktop`}
                        currentUrl={editingCampaign.bannerDesktop}
                        onUploadComplete={(url) => setEditingCampaign({ ...editingCampaign, bannerDesktop: url })}
                        onRemove={() => setEditingCampaign({ ...editingCampaign, bannerDesktop: "" })}
                      />
                    </div>

                    {/* Mobile banner */}
                    <div className="space-y-2">
                      <ImageUpload
                        label="Banner Mobile (Recomendado: 600x800)"
                        path={`campaigns/${editingCampaign.slug || "temp"}/mobile`}
                        currentUrl={editingCampaign.bannerMobile}
                        onUploadComplete={(url) => setEditingCampaign({ ...editingCampaign, bannerMobile: url })}
                        onRemove={() => setEditingCampaign({ ...editingCampaign, bannerMobile: "" })}
                      />
                    </div>
                  </div>
                </div>

                {/* Right side: product participation list with priority ordering */}
                <div className="w-full lg:w-[420px] bg-white p-6 space-y-6 flex flex-col justify-between overflow-hidden shrink-0">
                  <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                    <div className="border-b border-[#E5E5EA] pb-2 shrink-0">
                      <h5 className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-widest">
                        Produtos Participantes ({editingCampaign.productIds?.length || 0})
                      </h5>
                      <p className="text-[9px] text-[#8E8E93] font-semibold mt-0.5 uppercase tracking-wider">
                        Selecione, ordene e escolha o produto de destaque
                      </p>
                    </div>

                    {/* Search inside selector */}
                    <div className="relative shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={14} />
                      <input
                        type="text"
                        placeholder="Buscar produto para adicionar..."
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold uppercase tracking-wider outline-none focus:border-[#1C1C1E]"
                        value={prodSearchQuery}
                        onChange={(e) => setProdSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Dual pane list inside scroll box */}
                    <div className="flex-1 overflow-y-auto space-y-4 min-h-[250px] pr-1.5">
                      {/* Participating Products List */}
                      {editingCampaign.productIds?.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#cca062] block">Participantes Ordenados:</span>
                          <div className="space-y-1.5">
                            {editingCampaign.productIds.map((pid: string, index: number) => {
                              const p = products.find((prod) => prod.id === pid);
                              if (!p) return null;
                              const isFeatured = editingCampaign.featuredProductId === pid;

                              return (
                                <div
                                  key={`part-${pid}`}
                                  className={`p-2.5 bg-[#fffdfa] border rounded-xl flex items-center justify-between gap-2.5 transition-all shadow-2xs ${
                                    isFeatured ? "border-[#cca062] bg-[#fffdfa]" : "border-[#E5E5EA]"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E5E5EA] shrink-0 bg-[#F5F5F7]">
                                      <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-[#1C1C1E] truncate">{p.product_name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => handleSetFeatured(pid)}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all border ${
                                            isFeatured
                                              ? "bg-[#cca062] text-white border-[#cca062]"
                                              : "bg-white text-[#8E8E93] border-[#E5E5EA] hover:border-[#cca062] hover:text-[#cca062]"
                                          }`}
                                        >
                                          {isFeatured ? "★ Destaque" : "☆ Marcar Destaque"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Ordering & deletion panel */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveProduct(index, "up")}
                                      disabled={index === 0}
                                      className="p-1.5 hover:bg-[#F5F5F7] rounded text-[#8E8E93] disabled:opacity-30 cursor-pointer"
                                      title="Mover para cima"
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveProduct(index, "down")}
                                      disabled={index === editingCampaign.productIds.length - 1}
                                      className="p-1.5 hover:bg-[#F5F5F7] rounded text-[#8E8E93] disabled:opacity-30 cursor-pointer"
                                      title="Mover para baixo"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleProduct(pid)}
                                      className="p-1.5 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"
                                      title="Remover"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Add available products pane */}
                      <div className="space-y-2 pt-2 border-t border-[#F2F2F7]">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block">Adicionar mais Produtos:</span>
                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                          {products
                            .filter((p) => {
                              const matchesSearch = p.product_name.toLowerCase().includes(prodSearchQuery.toLowerCase());
                              const isAlreadyAdded = editingCampaign.productIds?.includes(p.id);
                              return matchesSearch && !isAlreadyAdded;
                            })
                            .slice(0, 10)
                            .map((p) => (
                              <div
                                key={`av-${p.id}`}
                                className="p-2 border border-[#E5E5EA] hover:border-[#1C1C1E] bg-white rounded-xl flex items-center justify-between gap-3 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-md overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7] shrink-0">
                                    <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-cover" />
                                  </div>
                                  <p className="text-xs font-bold text-[#1C1C1E] truncate">{p.product_name}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleProduct(p.id)}
                                  className="px-2.5 py-1.5 bg-[#F5F5F7] hover:bg-[#1C1C1E] hover:text-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer"
                                >
                                  Adicionar
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Drawer footer */}
                  <div className="pt-4 border-t border-[#E5E5EA] flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingCampaign(null);
                      }}
                      className="px-5 py-2.5 border border-[#E5E5EA] rounded-xl text-xs font-bold text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-[#1C1C1E] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer border-b-[3px] border-b-black hover:border-b-black active:border-b-0"
                    >
                      {saving ? "Salvando..." : editingCampaign.id ? "Salvar Alterações" : "Criar Campanha"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW MODAL (VIRTUAL STOREFRONT) */}
      <AnimatePresence>
        {isPreviewOpen && viewingCampaign && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden w-full max-w-5xl border border-[#E5E5EA] shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F5F5F7] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white border border-[#E5E5EA] rounded-lg text-[#1C1C1E]">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1C1C1E]">
                      Prévia da Campanha na Vitrine
                    </h4>
                    <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider">
                      Simulação em Tempo Real do Design Responsivo da Vitrine
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setViewingCampaign(null);
                  }}
                  className="p-1.5 hover:bg-white rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer border border-transparent hover:border-[#E5E5EA]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Viewport simulation */}
              <div className="flex-1 overflow-y-auto bg-[#F5F5F7] p-6 space-y-8">
                {/* Simulated Desktop Banner */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block ml-1">Mockup Banner Desktop (Banner Superior)</span>
                  <div className="relative aspect-[21/9] bg-slate-900 rounded-2xl overflow-hidden shadow-md flex items-center justify-center">
                    {viewingCampaign.bannerDesktop ? (
                      <>
                        <ImageWithFallback
                          src={viewingCampaign.bannerDesktop}
                          alt={viewingCampaign.name}
                          className="w-full h-full object-cover opacity-85"
                          referrerPolicy="no-referrer"
                        />
                        {/* Elegant overlay text */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                          <span className="text-[10px] font-bold tracking-widest text-[#cca062] uppercase mb-1.5">Campanha Especial</span>
                          <h2 className="text-3xl font-extrabold tracking-tight">{viewingCampaign.name}</h2>
                          {viewingCampaign.slogan && <p className="text-sm text-slate-200 mt-1 italic font-light">"{viewingCampaign.slogan}"</p>}
                        </div>
                      </>
                    ) : (
                      <div className="text-white flex flex-col items-center justify-center p-8">
                        <Megaphone size={40} className="text-[#cca062] mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">Nenhum Banner Desktop Cadastrado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated Mobile Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block ml-1">Mockup Banner Mobile</span>
                    <div className="relative aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-md flex items-center justify-center max-w-xs mx-auto md:mx-0">
                      {viewingCampaign.bannerMobile ? (
                        <>
                          <ImageWithFallback
                            src={viewingCampaign.bannerMobile}
                            alt={viewingCampaign.name}
                            className="w-full h-full object-cover opacity-85"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                            <span className="text-[8px] font-bold tracking-widest text-[#cca062] uppercase mb-1">Campanha</span>
                            <h3 className="text-lg font-extrabold tracking-tight leading-tight">{viewingCampaign.name}</h3>
                          </div>
                        </>
                      ) : (
                        <div className="text-white flex flex-col items-center justify-center p-6 text-center">
                          <Megaphone size={32} className="text-[#cca062] mb-2" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Nenhum Banner Mobile Cadastrado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slogan and Description content display block */}
                  <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-xs space-y-4">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#F2F2F7] pb-2">Informações de Campanha</h4>
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-[#1C1C1E]">{viewingCampaign.name}</h3>
                        {viewingCampaign.slogan && <p className="text-sm text-slate-600 italic">"{viewingCampaign.slogan}"</p>}
                        {viewingCampaign.description ? (
                          <p className="text-xs text-[#8E8E93] leading-relaxed">{viewingCampaign.description}</p>
                        ) : (
                          <p className="text-xs text-slate-300 italic">Sem descrição disponível.</p>
                        )}
                      </div>
                    </div>

                    {/* Featured Product Block */}
                    {viewingCampaign.featuredProductId && (
                      (() => {
                        const fp = products.find((p) => p.id === viewingCampaign.featuredProductId);
                        if (!fp) return null;
                        return (
                          <div className="bg-amber-50/50 p-5 rounded-2xl border border-[#cca062]/20 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-white rounded-xl border border-[#E5E5EA] overflow-hidden shrink-0">
                                <ImageWithFallback src={fp.image} alt={fp.product_name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <span className="bg-[#cca062] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest">★ Destaque da Campanha</span>
                                <h4 className="text-sm font-bold text-[#1C1C1E] mt-1.5">{fp.product_name}</h4>
                                <p className="text-xs font-semibold text-[#8E8E93] mt-0.5">R$ {fp.price?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>

                            <button className="px-4 py-2 bg-[#1C1C1E] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-xs cursor-default">
                              Ver Produto
                            </button>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Simulated Grid of Products */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-widest block ml-1">Grid de Produtos Participantes ({viewingCampaign.productIds?.length || 0})</h4>
                  {viewingCampaign.productIds?.length === 0 ? (
                    <div className="p-8 bg-white border border-[#E5E5EA] rounded-2xl text-center text-xs text-[#8E8E93]">
                      Nenhum produto cadastrado para esta campanha ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {viewingCampaign.productIds.map((pid: string) => {
                        const p = products.find((prod) => prod.id === pid);
                        if (!p) return null;

                        return (
                          <div key={`sim-grid-${pid}`} className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden p-3 space-y-2 flex flex-col justify-between">
                            <div className="aspect-square bg-[#F5F5F7] rounded-lg overflow-hidden border border-[#E5E5EA]">
                              <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-bold text-[#1C1C1E] truncate">{p.product_name}</p>
                              <p className="text-xs font-bold text-[#cca062]">R$ {p.price?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Close footer */}
              <div className="px-6 py-4 bg-[#F5F5F7] border-t border-[#E5E5EA] flex items-center justify-end shrink-0">
                <button
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setViewingCampaign(null);
                  }}
                  className="px-5 py-2.5 bg-[#1C1C1E] text-white hover:bg-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  Fechar Prévia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
