import React, { useState, useEffect } from "react";
import {
  Layers,
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
  Calendar,
  Sparkles,
  Palette,
  Layout,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, CompanyId } from "../../types";
import {
  subscribeToCollections,
  saveCollection,
  deleteCollection,
  subscribeToProducts,
} from "../../services/firebaseService";
import { ImageUpload } from "./ImageUpload";
import { ImageWithFallback } from "../ImageWithFallback";
import { matchesAtelierScope } from "../../services/atelierScopePolicy";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface CollectionsTabProps {
  products: Product[];
  companyId?: CompanyId;
}

export const CollectionsTab: React.FC<CollectionsTabProps> = React.memo(({ products, companyId }) => {
  const orchestrator = useAdminOrchestrator();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Current collection being edited or viewed
  const [editingCollection, setEditingCollection] = useState<any | null>(null);
  const [viewingCollection, setViewingCollection] = useState<any | null>(null);
  
  // Product search in side-form
  const [prodSearchQuery, setProdSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Load Collections & Products
  useEffect(() => {
    const unsubCol = subscribeToCollections((data) => {
      // Sort collections by order
      const sorted = [...data].sort((a, b) => (a.order || 0) - (b.order || 0));
      setCollections(sorted);
      setLoading(false);
    });

    return () => {
      unsubCol();
      };
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "") // remove invalid characters
      .replace(/[\s_-]+/g, "-") // replace spaces and underscores with a single hyphen
      .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
  };

  const handleOpenNewForm = () => {
    setEditingCollection({
      name: "",
      slug: "",
      description: "",
      image: "",
      banner: "",
      color: "#cca062",
      order: (collections.length + 1) * 10,
      active: true,
      productIds: [],
    });
    setProdSearchQuery("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (col: any) => {
    setEditingCollection({ ...col });
    setProdSearchQuery("");
    setIsFormOpen(true);
  };

  const handleDuplicate = async (col: any) => {
    try {
      const duplicated = {
        ...col,
        id: undefined, // remove id to create a new document
        name: `${col.name} (Cópia)`,
        slug: `${col.slug}-copia-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date(),
      };
      await saveCollection(duplicated);
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao duplicar coleção",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    }
  };

  const handleToggleArchive = async (col: any) => {
    try {
      await saveCollection({
        ...col,
        active: !col.active,
      });
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao alterar status da coleção",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta coleção? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteCollection(id);
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao excluir coleção",
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
    if (!editingCollection?.name || !editingCollection?.slug) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Nome e Slug são obrigatórios.",
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
      await saveCollection(editingCollection);
      setIsFormOpen(false);
      setEditingCollection(null);
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao salvar coleção",
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

  // Add product to edited collection
  const addProductToCollection = (productId: string) => {
    if (!editingCollection) return;
    const currentIds = editingCollection.productIds || [];
    if (currentIds.includes(productId)) return;
    setEditingCollection({
      ...editingCollection,
      productIds: [...currentIds, productId],
    });
  };

  // Remove product from edited collection
  const removeProductFromCollection = (productId: string) => {
    if (!editingCollection) return;
    const currentIds = editingCollection.productIds || [];
    setEditingCollection({
      ...editingCollection,
      productIds: currentIds.filter((id: string) => id !== productId),
    });
  };

  // Reorder product in collection: move up
  const moveProductUp = (index: number) => {
    if (!editingCollection || index === 0) return;
    const currentIds = [...(editingCollection.productIds || [])];
    const temp = currentIds[index];
    currentIds[index] = currentIds[index - 1];
    currentIds[index - 1] = temp;
    setEditingCollection({
      ...editingCollection,
      productIds: currentIds,
    });
  };

  // Reorder product in collection: move down
  const moveProductDown = (index: number) => {
    if (!editingCollection) return;
    const currentIds = [...(editingCollection.productIds || [])];
    if (index === currentIds.length - 1) return;
    const temp = currentIds[index];
    currentIds[index] = currentIds[index + 1];
    currentIds[index + 1] = temp;
    setEditingCollection({
      ...editingCollection,
      productIds: currentIds,
    });
  };

  // Filter collections
  const filteredCollections = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Available products for selection (not already added)
  const availableProducts = products.filter((p) => {
    if (companyId && !matchesAtelierScope(p, companyId, 'produtos')) {
      return false;
    }
    const isAlreadyInCollection = editingCollection?.productIds?.includes(p.id);
    const matchesSearch = (p.product_name || "").toLowerCase().includes(prodSearchQuery.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(prodSearchQuery.toLowerCase());
    return !isAlreadyInCollection && matchesSearch;
  });

  // Get full products lists based on selected IDs
  const getSelectedProducts = () => {
    if (!editingCollection) return [];
    return (editingCollection.productIds || [])
      .map((id: string) => products.find((p) => p.id === id))
      .filter((p: any) => !!p) as Product[];
  };

  const getViewingProducts = () => {
    if (!viewingCollection) return [];
    return (viewingCollection.productIds || [])
      .map((id: string) => products.find((p) => p.id === id))
      .filter((p: any) => !!p) as Product[];
  };

  // Format Date safely
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white border border-[#E5E5EA] text-[#1C1C1E] shadow-sm">
            <Layers size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1C1C1E] tracking-tight">
              Coleções de Produtos
            </h3>
            <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mt-1">
              Agrupamentos Permanentes • Catálogo da Vitrine
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewForm}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] text-[#1C1C1E] rounded-xl font-semibold text-xs tracking-wide transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
        >
          <Plus size={16} /> Nova Coleção
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
          size={16}
        />
        <input
          type="text"
          placeholder="PESQUISAR COLEÇÃO..."
          className="w-full bg-white border border-[#E5E5EA] rounded-xl pl-12 pr-4 py-3.5 text-xs font-semibold uppercase tracking-wider outline-none focus:border-[#1C1C1E] transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* COLLECTIONS LIST (CARDS) */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1C1C1E] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="h-64 bg-white border border-[#E5E5EA] rounded-3xl flex flex-col items-center justify-center text-center p-8 shadow-sm">
          <Layers size={40} className="text-[#8E8E93] mb-4" />
          <h4 className="text-sm font-semibold text-[#1C1C1E] mb-1">
            Nenhuma Coleção Encontrada
          </h4>
          <p className="text-xs text-[#8E8E93] max-w-sm">
            Crie sua primeira coleção permanente para agrupar e destacar seus produtos de forma elegante no catálogo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((col) => (
            <motion.div
              layout
              key={col.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden hover:shadow-lg hover:border-dark-gray/30 transition-all flex flex-col group relative"
            >
              {/* Cover Image */}
              <div className="relative aspect-[16/10] bg-[#F5F5F7] overflow-hidden border-b border-[#E5E5EA]">
                {col.image ? (
                  <ImageWithFallback
                    src={col.image}
                    alt={col.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
                    <Layers size={32} strokeWidth={1.5} />
                  </div>
                )}
                {/* Accent Highlight Bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: col.color || "#cca062" }}
                />
                
                {/* Active/Inactive Status LED */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-[#E5E5EA] shadow-xs">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      col.active
                        ? "bg-[#34C759] shadow-[0_0_8px_#34C759]"
                        : "bg-[#8E8E93]"
                    }`}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#1C1C1E]">
                    {col.active ? "Ativa" : "Inativa"}
                  </span>
                </div>

                {/* Products Count Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-[#E5E5EA] shadow-xs">
                  <span className="text-[10px] font-black text-[#1C1C1E]">
                    {(col.productIds || []).length}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#8E8E93]">
                    Prods
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-[#1C1C1E] tracking-tight truncate">
                      {col.name}
                    </h4>
                    <span className="text-[9px] font-mono font-bold bg-[#F5F5F7] text-[#8E8E93] px-2 py-0.5 rounded border border-[#E5E5EA]">
                      Ordem: {col.order ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] line-clamp-2 leading-relaxed">
                    {col.description || "Nenhuma descrição informada."}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-[#8E8E93] font-semibold tracking-wider uppercase pt-1">
                    <Calendar size={12} />
                    Criada em: {formatDate(col.createdAt)}
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-5 gap-1.5 pt-6 border-t border-[#E5E5EA] mt-6">
                  {/* Visualizar */}
                  <button
                    onClick={() => {
                      setViewingCollection(col);
                      setIsPreviewOpen(true);
                    }}
                    title="Visualizar Prévia"
                    className="p-2.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <Eye size={14} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditForm(col)}
                    title="Editar Coleção"
                    className="p-2.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <Edit2 size={14} />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(col)}
                    title="Duplicar Coleção"
                    className="p-2.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <Copy size={14} />
                  </button>

                  {/* Toggle Active / Archive */}
                  <button
                    onClick={() => handleToggleArchive(col)}
                    title={col.active ? "Arquivar Coleção" : "Ativar Coleção"}
                    className="p-2.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <Archive size={14} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(col.id)}
                    title="Excluir Coleção"
                    className="p-2.5 bg-white border border-[#E5E5EA] hover:border-[#FF3B30] hover:bg-rose-50 rounded-xl text-[#8E8E93] hover:text-[#FF3B30] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FORM MODAL (CREATE / EDIT) */}
      <AnimatePresence>
        {isFormOpen && editingCollection && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-xs z-[100] flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-4xl bg-[#F5F5F7] h-full flex flex-col shadow-2xl overflow-hidden border-l border-[#E5E5EA]"
            >
              {/* Form Header */}
              <div className="px-6 py-5 bg-white border-b border-[#E5E5EA] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1C1E]">
                      {editingCollection.id ? "Editar Coleção" : "Nova Coleção"}
                    </h3>
                    <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider">
                      Configure os campos permanentes e produtos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingCollection(null);
                  }}
                  className="p-2 hover:bg-[#F5F5F7] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <form
                onSubmit={handleSave}
                className="flex-1 overflow-y-auto p-6 space-y-8"
              >
                {/* 2-Column fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-6 bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#1C1C1E] border-b border-[#E5E5EA] pb-3 mb-2 flex items-center gap-2">
                      <Layout size={14} /> Dados Básicos
                    </h4>

                    {/* Nome */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#8E8E93] ml-1">
                        Nome da Coleção
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Primavera Premium, Linha Casamento"
                        className="w-full bg-white border border-[#E5E5EA] rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                        value={editingCollection.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingCollection({
                            ...editingCollection,
                            name: val,
                            // auto-generate slug if not editing existing
                            slug: editingCollection.id ? editingCollection.slug : generateSlug(val),
                          });
                        }}
                      />
                    </div>

                    {/* Slug */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#8E8E93] ml-1">
                        Slug (URL Amigável)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ex-primavera-premium"
                        className="w-full bg-white border border-[#E5E5EA] rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                        value={editingCollection.slug}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            slug: generateSlug(e.target.value),
                          })
                        }
                      />
                    </div>

                    {/* Descrição */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#8E8E93] ml-1">
                        Descrição Curta
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Descreva brevemente o conceito desta coleção..."
                        className="w-full bg-white border border-[#E5E5EA] rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all resize-none"
                        value={editingCollection.description || ""}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Cor de Destaque & Ordem & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-[#8E8E93] ml-1 flex items-center gap-1">
                          <Palette size={10} /> Cor de Destaque
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                            value={editingCollection.color || "#cca062"}
                            onChange={(e) =>
                              setEditingCollection({
                                ...editingCollection,
                                color: e.target.value,
                              })
                            }
                          />
                          <input
                            type="text"
                            className="w-full bg-white border border-[#E5E5EA] rounded-xl px-2 py-1.5 text-xs font-mono outline-none focus:border-[#1C1C1E]"
                            value={editingCollection.color || ""}
                            onChange={(e) =>
                              setEditingCollection({
                                ...editingCollection,
                                color: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-[#8E8E93] ml-1">
                          Ordem de Exibição
                        </label>
                        <input
                          type="number"
                          placeholder="10, 20, 30..."
                          className="w-full bg-white border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E] transition-all"
                          value={editingCollection.order || ""}
                          onChange={(e) =>
                            setEditingCollection({
                              ...editingCollection,
                              order: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Status Active Switch */}
                    <div className="flex items-center justify-between p-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#1C1C1E]">
                          Status de Exibição
                        </span>
                        <span className="text-[9px] text-[#8E8E93]">
                          Define se a coleção ficará visível na vitrine
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCollection({
                            ...editingCollection,
                            active: !editingCollection.active,
                          })
                        }
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 outline-none ${
                          editingCollection.active ? "bg-[#34C759]" : "bg-[#D1D1D6]"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            editingCollection.active ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Visuals (Uploads) */}
                  <div className="space-y-6 bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#1C1C1E] border-b border-[#E5E5EA] pb-3 mb-2 flex items-center gap-2">
                      <Sparkles size={14} /> Mídias & Banners
                    </h4>

                    {/* Cover Image Upload */}
                    <ImageUpload
                      label="Imagem de Capa (Card)"
                      path="collections/covers"
                      currentUrl={editingCollection.image}
                      onUploadComplete={(url) =>
                        setEditingCollection({ ...editingCollection, image: url })
                      }
                      onRemove={() =>
                        setEditingCollection({ ...editingCollection, image: "" })
                      }
                    />

                    {/* Banner Image Upload */}
                    <ImageUpload
                      label="Banner de Destaque (Opcional)"
                      path="collections/banners"
                      currentUrl={editingCollection.banner}
                      onUploadComplete={(url) =>
                        setEditingCollection({ ...editingCollection, banner: url })
                      }
                      onRemove={() =>
                        setEditingCollection({ ...editingCollection, banner: "" })
                      }
                    />
                  </div>
                </div>

                {/* PRODUCTS LINKING & MANAGE SECTION */}
                <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-xs space-y-6">
                  <div className="border-b border-[#E5E5EA] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#1C1C1E] flex items-center gap-2">
                        <Layers size={14} /> Seleção de Produtos
                      </h4>
                      <p className="text-[10px] text-[#8E8E93] mt-0.5">
                        Associe e ordene manualmente os produtos que pertencem a esta coleção.
                      </p>
                    </div>
                    <div className="px-3 py-1.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-full text-xs font-black text-[#1C1C1E] shrink-0 self-start sm:self-auto flex items-center gap-2">
                      <span>{editingCollection.productIds?.length || 0}</span>
                      <span className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-widest">
                        Produtos Vinculados
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Coluna de Adicionar Produtos */}
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black text-[#1C1C1E] tracking-wider block">
                        Pesquisar & Adicionar Produtos
                      </label>
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]"
                          size={14}
                        />
                        <input
                          type="text"
                          placeholder="Buscar por nome ou categoria..."
                          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                          value={prodSearchQuery}
                          onChange={(e) => setProdSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Available products list */}
                      <div className="border border-[#E5E5EA] rounded-xl divide-y divide-[#E5E5EA] max-h-80 overflow-y-auto bg-[#F5F5F7]">
                        {availableProducts.length === 0 ? (
                          <div className="p-6 text-center text-xs text-[#8E8E93]">
                            Nenhum produto disponível encontrado.
                          </div>
                        ) : (
                          availableProducts.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 flex items-center justify-between gap-4 hover:bg-white transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E5EA] overflow-hidden flex-shrink-0">
                                  <ImageWithFallback
                                    src={p.image}
                                    alt={p.product_name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#1C1C1E] truncate">
                                    {p.product_name}
                                  </p>
                                  <p className="text-[9px] uppercase font-semibold text-[#8E8E93] tracking-wider">
                                    {p.category} • R$ {p.retail_price?.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => addProductToCollection(p.id)}
                                className="px-3 py-1.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] text-xs font-semibold rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all text-[#1C1C1E]"
                              >
                                Adicionar
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Selected Products (with Ordering and deletion) */}
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black text-[#1C1C1E] tracking-wider block">
                        Produtos na Coleção (Reordene Manualmente)
                      </label>

                      <div className="border border-[#E5E5EA] rounded-xl divide-y divide-[#E5E5EA] max-h-80 overflow-y-auto bg-white shadow-xs">
                        {getSelectedProducts().length === 0 ? (
                          <div className="p-8 text-center text-xs text-[#8E8E93]">
                            Adicione produtos ao lado para compor a coleção.
                          </div>
                        ) : (
                          getSelectedProducts().map((p, index) => (
                            <div
                              key={p.id}
                              className="p-3 flex items-center justify-between gap-4 group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="text-xs font-mono text-[#8E8E93] w-5 text-center">
                                  #{index + 1}
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] overflow-hidden flex-shrink-0">
                                  <ImageWithFallback
                                    src={p.image}
                                    alt={p.product_name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#1C1C1E] truncate">
                                    {p.product_name}
                                  </p>
                                  <p className="text-[9px] uppercase font-semibold text-[#8E8E93] tracking-wider">
                                    R$ {p.retail_price?.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Move Up */}
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => moveProductUp(index)}
                                  className="p-1.5 border border-[#E5E5EA] rounded-md hover:border-[#1C1C1E] disabled:opacity-30 disabled:pointer-events-none hover:text-[#1C1C1E] text-[#8E8E93]"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                {/* Move Down */}
                                <button
                                  type="button"
                                  disabled={index === getSelectedProducts().length - 1}
                                  onClick={() => moveProductDown(index)}
                                  className="p-1.5 border border-[#E5E5EA] rounded-md hover:border-[#1C1C1E] disabled:opacity-30 disabled:pointer-events-none hover:text-[#1C1C1E] text-[#8E8E93]"
                                >
                                  <ChevronDown size={14} />
                                </button>
                                {/* Remove */}
                                <button
                                  type="button"
                                  onClick={() => removeProductFromCollection(p.id)}
                                  className="p-1.5 border border-transparent rounded-md text-[#8E8E93] hover:text-[#FF3B30] hover:bg-rose-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* LIVE PREVIEW PORTLET */}
                <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#1C1C1E] flex items-center gap-2">
                    <Eye size={14} /> Prévia Rápida da Coleção na Vitrine
                  </h4>
                  
                  <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden bg-[#fffdfa] p-6 max-w-3xl mx-auto space-y-6">
                    {/* Live Banner */}
                    {editingCollection.banner ? (
                      <div className="w-full h-32 bg-slate-200 rounded-xl overflow-hidden relative shadow-inner border border-[#E5E5EA]">
                        <ImageWithFallback
                          src={editingCollection.banner}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-20 bg-slate-50 border border-dashed border-[#E5E5EA] rounded-xl flex items-center justify-center text-[10px] text-[#8E8E93] uppercase tracking-wider font-bold">
                        [Sem Banner Adicionado]
                      </div>
                    )}

                    {/* Name & Desc */}
                    <div className="text-center space-y-2">
                      <h2
                        className="text-2xl font-serif tracking-widest uppercase font-medium"
                        style={{ color: editingCollection.color || "#6d5443" }}
                      >
                        {editingCollection.name || "NOME DA COLEÇÃO"}
                      </h2>
                      <p className="text-xs text-[#8E8E93] max-w-md mx-auto italic">
                        {editingCollection.description || "Descrição curta e conceito da coleção."}
                      </p>
                    </div>

                    {/* Linked Products Carousel / List Preview */}
                    <div className="grid grid-cols-4 gap-3">
                      {getSelectedProducts().length === 0 ? (
                        [1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="aspect-square bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[8px] text-[#8E8E93] text-center p-2 font-bold uppercase"
                          >
                            Produto em Breve
                          </div>
                        ))
                      ) : (
                        getSelectedProducts().slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className="bg-white border border-[#E5E5EA] rounded-xl p-2 flex flex-col gap-1.5 shadow-xs"
                          >
                            <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-[#E5E5EA]">
                              <ImageWithFallback
                                src={p.image}
                                alt={p.product_name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-[#1C1C1E] truncate">
                                {p.product_name}
                              </p>
                              <p className="text-[9px] text-[#8E8E93] font-semibold">
                                R$ {p.retail_price?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {/* Form Actions Footer */}
              <div className="px-6 py-4 bg-white border-t border-[#E5E5EA] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingCollection(null);
                  }}
                  className="px-5 py-2.5 border border-[#E5E5EA] hover:border-[#1C1C1E] text-xs font-semibold rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#1C1C1E] text-white hover:bg-black text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} /> {saving ? "Salvando..." : "Salvar Coleção"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW / PREVIEW MODAL (FULL SCREEN VITRINE PREVIEW) */}
      <AnimatePresence>
        {isPreviewOpen && viewingCollection && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fffdfa] w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative border border-[#e8dcc8]"
            >
              {/* Close Button overlay */}
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  setViewingCollection(null);
                }}
                className="absolute top-6 right-6 p-3 bg-white/95 backdrop-blur-md text-[#cca062] border border-[#e8dcc8] hover:text-[#1C1C1E] rounded-full shadow-lg transition-all z-20 cursor-pointer active:scale-95"
              >
                <X size={18} />
              </button>

              {/* Vitrine Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 select-none">
                {/* Back to catalog mockup label */}
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#cca062]">
                  <Layers size={14} /> Prévia Oficial de Exibição
                </div>

                {/* Live Banner banner section */}
                {viewingCollection.banner ? (
                  <div className="w-full aspect-[21/9] rounded-[2rem] overflow-hidden shadow-md border border-[#e8dcc8] relative bg-slate-100">
                    <ImageWithFallback
                      src={viewingCollection.banner}
                      alt={viewingCollection.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[21/9] rounded-[2rem] border border-dashed border-[#e8dcc8] flex flex-col items-center justify-center bg-[#faf8f5] text-center p-6 text-[#8E8E93]">
                    <Layers size={36} className="text-[#cca062]/40 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#cca062]">
                      Coleção Sem Banner Customizado
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Apenas a imagem de capa e o título serão exibidos nos cards.
                    </p>
                  </div>
                )}

                {/* Heading */}
                <div className="text-center space-y-3">
                  <h1
                    className="font-serif text-3xl md:text-4xl uppercase tracking-[0.2em] font-normal"
                    style={{ color: viewingCollection.color || "#6d5443" }}
                  >
                    {viewingCollection.name}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#cca062]">
                    Coleção Permanente
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                    {viewingCollection.description || "Esta coleção permanente agrupa itens costurados e criados à mão para encantar seu evento."}
                  </p>
                </div>

                {/* Grid of Products in collection */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#cca062] border-b border-[#e8dcc8]/60 pb-3">
                    Produtos Vinculados ({(viewingCollection.productIds || []).length})
                  </h3>

                  {getViewingProducts().length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400 italic">
                      Esta coleção não possui nenhum produto vinculado no momento.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {getViewingProducts().map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white rounded-3xl border border-[#e8dcc8]/40 overflow-hidden flex flex-col p-4 space-y-3 shadow-xs hover:shadow transition-all"
                        >
                          <div className="aspect-square bg-slate-50 border border-[#e8dcc8]/20 rounded-2xl overflow-hidden relative">
                            <ImageWithFallback
                              src={prod.image}
                              alt={prod.product_name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-serif text-xs text-[#6d5443] tracking-wide truncate">
                              {prod.product_name}
                            </h5>
                            <p className="text-[10px] uppercase font-bold text-[#cca062] tracking-wider">
                              R$ {prod.retail_price?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer brand standard */}
                <div className="pt-12 text-center border-t border-dashed border-[#e8dcc8]/60 text-gray-400">
                  <p className="font-cursive text-2xl text-[#6d5443]">
                    Amor em forma de pormenores
                  </p>
                  <p className="text-[8px] uppercase tracking-widest font-bold mt-1 text-gray-500">
                    Coleções permanentes • Vitrine Premium
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
