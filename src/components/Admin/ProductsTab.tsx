import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Phone,
  Calendar,
  Truck,
  CreditCard,
  Edit,
  Trash2,
  User,
  Clock,
  X,
  CheckCircle,
  Eye,
  Printer,
  Box,
  TrendingUp,
  Star,
  Info,
  Camera,
  Layers,
  Calculator,
  Maximize2,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageUpload } from "./ImageUpload";
import {
  uploadImage,
  compressImage,
} from "../../services/firebaseStorageService";
import { Product, CompanyId, Insumo, Variation } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { getSiteSettings, getGlobalSettings } from "../../services/firebaseService";

import { ImageWithFallback } from "../ImageWithFallback";

interface ProductsTabProps {
  products: Product[];
  insumos: Insumo[];
  companyId: CompanyId;
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  insumos,
  companyId,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (productToDelete) {
      await onDeleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(
    null,
  );
  const [selectedAtelier, setSelectedAtelier] = useState<CompanyId>(companyId);

  const atelieres = [
    { id: "pallyra", name: "La Pallyra", prefix: "LP" },
    { id: "guennita", name: "com amor, Guennita", prefix: "CG" },
    { id: "mimada", name: "Mimada Sim", prefix: "MS" },
  ];

  const generateProductCode = (prefix: string) => {
    const companyProducts = products.filter(
      (p) => p.company === selectedAtelier,
    );
    let max = 0;
    for (const p of companyProducts) {
      if (p.code && p.code.startsWith(prefix)) {
        const num = parseInt(p.code.replace(prefix + "-", ""), 10);
        if (!isNaN(num) && num > max) max = num;
      } else if (p.id && p.id.startsWith(prefix)) {
        const num = parseInt(p.id.replace(prefix + "-", ""), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    }
    return `${prefix}-${String(max + 1).padStart(4, "0")}`;
  };

  const [showAllInList, setShowAllInList] = useState(true);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAtelier = showAllInList || p.company === selectedAtelier;
    return matchesSearch && matchesAtelier;
  }).sort((a, b) => {
    // Assuming we have a createdAt or we rely on some id assuming it's sequential or we just reverse
    // The easiest is just to sort by id descending (assuming ids are time-based or generated sequentially)
    // Or if we don't have createdAt, we can reverse the list
    if ((b as any).createdAt && (a as any).createdAt) {
      const db = (b as any).createdAt.toMillis ? (b as any).createdAt.toMillis() : new Date((b as any).createdAt).getTime();
      const da = (a as any).createdAt.toMillis ? (a as any).createdAt.toMillis() : new Date((a as any).createdAt).getTime();
      return db - da;
    }
    return b.id.localeCompare(a.id);
  });

  const getCompanyColor = (compId: string) => {
    switch (compId) {
      case "pallyra":
        return "bg-amber-400";
      case "guennita":
        return "bg-[#801020]"; // Marsala
      case "mimada":
        return "bg-[#FF1493]"; // Pink
      default:
        return "bg-gray-400";
    }
  };

  const getCompanyBadge = (compId: string) => {
    switch (compId) {
      case "pallyra":
        return "LP";
      case "guennita":
        return "CG";
      case "mimada":
        return "MS";
      default:
        return "LP";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Search and Ateliers Bar Refined */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[2rem] border border-[#F0E6D2] shadow-[0_10px_40px_rgba(240,230,210,0.1)]">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D1CACA]"
              size={14}
            />
            <input
              type="text"
              placeholder="Buscar no catálogo..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF9F6] border border-[#F0E6D2] text-[10px] uppercase font-semibold tracking-widest outline-none focus:border-[#D48C8C] transition-all text-[#4A4444]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={showAllInList ? "all" : selectedAtelier}
            onChange={(e) => {
              if (e.target.value === "all") {
                setShowAllInList(true);
              } else {
                setShowAllInList(false);
                setSelectedAtelier(e.target.value as CompanyId);
              }
            }}
            className="hidden sm:block px-4 py-3 rounded-xl bg-[#FAF9F6] border border-[#F0E6D2] text-[10px] font-semibold uppercase tracking-widest text-[#A09898] outline-none cursor-pointer"
          >
            <option value="all">TODOS ATELIÊS</option>
            {atelieres.map((atl) => (
              <option key={atl.id} value={atl.id}>
                {atl.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center p-4 bg-[#FAF9F6] text-[#A09898] border border-[#F0E6D2] rounded-xl hover:text-[#D48C8C] hover:bg-white hover:border-[#D48C8C]/30 transition-all shadow-sm group"
            title="Exportar Relatório PDF"
          >
            <Printer size={18} className="group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={async () => {
              setEditingProduct({
                company: showAllInList ? companyId : selectedAtelier,
                isVisible: true,
                isFeatured: false,
              });
              setIsModalOpen(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#D48C8C] text-white font-semibold py-4 px-8 rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-[#D48C8C]/20 text-[9px] uppercase tracking-widest border border-[#D48C8C]/20"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Luxury Catalog List View */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="py-32 text-center bg-white/40 border border-dashed border-[#F0E6D2] rounded-[3rem] text-[#A09898] uppercase tracking-[0.3em] font-semibold text-[9px]">
            Nenhum produto encontrado neste ateliê.
          </div>
        )}
        {filtered.map((p, idx) => {
          const companyColor = getCompanyColor(p.company || "");
          const companyPrefix = getCompanyBadge(p.company || "");
          const oldPrice = p.original_price || (p.retail_price || 0) * 1.25;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="group bg-white rounded-2xl overflow-hidden border border-[#F0E6D2] flex flex-col md:flex-row md:items-center p-4 gap-6 hover:border-[#D48C8C]/50 transition-all shadow-sm hover:shadow-md"
            >
              {/* Small Image (not enormous anymore) */}
              <div className="w-full md:w-24 h-24 rounded-xl overflow-hidden bg-[#FAF9F6] shrink-0 border border-[#F0E6D2]">
                <ImageWithFallback
                  src={p.image || ""}
                  alt={p.product_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              </div>

              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white ${companyColor}`}
                    >
                      {companyPrefix}
                    </span>
                    <h3 className="text-[12px] font-semibold text-[#4A4444] uppercase tracking-tight group-hover:text-[#D48C8C] transition-colors">
                      {p.product_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-semibold text-[#A09898] uppercase tracking-widest">
                      REF: {p.code}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#F0E6D2]"></span>
                    <span className="text-[8px] font-bold text-[#D48C8C] uppercase tracking-widest">
                      {p.category} {p.subcategory ? `> ${p.subcategory}` : ""}
                    </span>
                    {p.isFeatured && (
                      <Star
                        size={10}
                        className="text-[#D48C8C]"
                        fill="currentColor"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                  <div className="text-right">
                    <p className="text-[8px] font-medium text-[#A09898] uppercase tracking-widest line-through">
                      De: {formatCurrency(oldPrice)}
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[9px] font-bold text-[#4A4444] uppercase">
                        Por:
                      </span>
                      <span className="text-sm font-semibold text-[#D48C8C]">
                        {formatCurrency(p.retail_price || 0)}
                      </span>
                    </div>
                    <p className="text-[7px] font-medium text-[#D48C8C] uppercase tracking-widest">
                      2x de {formatCurrency((p.retail_price || 0) / 2)} s/ juros
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setIsModalOpen(true);
                      }}
                      className="p-3 rounded-xl bg-[#FAF9F6] text-[#A09898] hover:text-[#D48C8C] hover:bg-white transition-all border border-[#F0E6D2]"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setProductToDelete(p.id)}
                      className="p-3 rounded-xl bg-slate-50 text-[#A09898] hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {isModalOpen && (
        <ProductFormModal
          editingProduct={editingProduct}
          existingProducts={products}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            const currentPrefix =
              atelieres.find((a) => a.id === (data.company || selectedAtelier))
                ?.prefix || "LP";
            await onSaveProduct({
              ...data,
              code: editingProduct?.id
                ? editingProduct.code
                : generateProductCode(currentPrefix),
            });
          }}
          companyId={selectedAtelier}
          atelieres={atelieres}
          insumos={insumos}
        />
      )}
      {productToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="glass-card max-w-md w-full p-10 text-center animate-in zoom-in-95 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/50"></div>
            <div className="w-20 h-20 bg-rose-500/10 text-slate-9000 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-rose-500/20 glow-border">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-sans font-black mb-3 uppercase tracking-tighter text-white">
              Excluir Produto?
            </h3>
            <p className="text-[10px] text-[#A09898] mb-10 font-bold uppercase tracking-[0.2em]">
              Esta operação é irreversível e removerá o item de todos os
              catálogos ativos.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-5 bg-white rounded-2xl font-black text-slate-500 uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all border border-[#F0E6D2]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-5 bg-rose-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-105 active:scale-95 transition-all border border-rose-400"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProductFormModalProps {
  editingProduct: Partial<Product> | null;
  insumos: Insumo[];
  onClose: () => void;
  onSave: (data: Partial<Product>) => Promise<void>;
  companyId: CompanyId;
  atelieres: { id: string; name: string; prefix: string }[];
}

const ProductFormModal: React.FC<
  ProductFormModalProps & { existingProducts: Product[] }
> = ({
  editingProduct,
  onClose,
  onSave,
  companyId,
  atelieres,
  existingProducts,
  insumos,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);

  const handleUploadStarted = () => setUploadsInProgress((prev) => prev + 1);
  const handleUploadFinished = () =>
    setUploadsInProgress((prev) => Math.max(0, prev - 1));

  const [activeSubTab, setActiveSubTab] = useState<
    "info" | "insumos" | "pricing" | "photos"
  >(editingProduct?.id ? "info" : "info");
  const [selectedAtelier, setSelectedAtelier] = useState<CompanyId>(
    (editingProduct?.company as CompanyId) || companyId,
  );
  const [images, setImages] = useState<string[]>(
    editingProduct?.images ||
      (editingProduct?.image ? [editingProduct.image] : []),
  );
  const [isFeatured, setIsFeatured] = useState(
    editingProduct?.isFeatured || false,
  );
  const [activeInCatalog, setActiveInCatalog] = useState(
    editingProduct?.activeInCatalog ?? true,
  );

  // Basic Info State
  const [productName, setProductName] = useState(
    editingProduct?.product_name || "",
  );
  const [description, setDescription] = useState(
    editingProduct?.description || "",
  );
  const [category, setCategory] = useState(editingProduct?.category || "");
  const [subcategory, setSubcategory] = useState(
    editingProduct?.subcategory || "",
  );
  const [newCat, setNewCat] = useState("");
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newSubcat, setNewSubcat] = useState("");
  const [showNewSubcatInput, setShowNewSubcatInput] = useState(false);

  const [addedInsumos, setAddedInsumos] = useState<
    { insumoId: string; quantity: number }[]
  >(editingProduct?.insumos || []);

  const [selectedInsumoId, setSelectedInsumoId] = useState("");
  const [insumoQty, setInsumoQty] = useState(1);

  // Image Transformation Settings
  const [imgScale, setImgScale] = useState(
    editingProduct?.imageSettings?.scale ?? 1,
  );
  const [imgX, setImgX] = useState(
    editingProduct?.imageSettings?.translateX ?? 0,
  );
  const [imgY, setImgY] = useState(
    editingProduct?.imageSettings?.translateY ?? 0,
  );
  const [imgRotate, setImgRotate] = useState(
    editingProduct?.imageSettings?.rotate ?? 0,
  );

  // Pricing Fields
  const [retailPrice, setRetailPrice] = useState(
    editingProduct?.retail_price || 0,
  );
  const [originalPrice, setOriginalPrice] = useState(
    editingProduct?.original_price || 0,
  );
  const [isWholesaleEnabled, setIsWholesaleEnabled] = useState(
    !!editingProduct?.wholesale_price,
  );
  const [wholesalePrice, setWholesalePrice] = useState(
    editingProduct?.wholesale_price || 0,
  );
  const [costPrice, setCostPrice] = useState(
    editingProduct?.estimatedCost || 0,
  );
  const [wholesaleMinQty, setWholesaleMinQty] = useState(
    editingProduct?.wholesale_min_qty || 12,
  );
  const [wholesaleMaxQty, setWholesaleMaxQty] = useState(
    editingProduct?.wholesale_max_qty || 100,
  );

  // Intelligent Pricing state
  const [laborHours, setLaborHours] = useState(0);
  const [globalCosts, setGlobalCosts] = useState({
    fixed: 0,
    labor: 0,
    tax: 0,
  });

  useEffect(() => {
    getGlobalSettings().then((settings) => {
      if (settings) {
        setGlobalCosts({
          fixed: settings.global_fixed_costs || 0,
          labor: settings.global_labor_cost_per_hour || 0,
          tax: settings.global_tax_rate || 0,
        });
      }
    });
  }, [companyId]);

  const intelligentRetailPrice = useMemo(() => {
    // Math logic based on user inputs
    const baseCost = costPrice; // Usually insumos cost + other variable items
    const labor = globalCosts.labor * (laborHours / 60);
    const taxesMultiplier = globalCosts.tax > 0 ? 1 - globalCosts.tax / 100 : 1;

    // We add a piece of the fixed costs? Since it's monthly, it's hard to pro-rata per product without volume.
    // Let's just add it as a margin overhead, or the user decides. Let's just sum it for now as a "overhead estimation" (dividing by 100 products maybe?), or just ignore and present the labor + cost / tax.
    const overhead = globalCosts.fixed / 100; // rough estimation

    const suggested = (baseCost + labor + overhead) / taxesMultiplier;
    return suggested * 1.5; // Adding 50% profit margin logic as suggestion
  }, [costPrice, laborHours, globalCosts]);

  const categories = Array.from(
    new Set(existingProducts.map((p) => p.category).filter(Boolean)),
  );
  const subcategories = Array.from(
    new Set(
      existingProducts
        .filter((p) => p.category === category)
        .map((p) => p.subcategory)
        .filter(Boolean),
    ),
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const [isPasting, setIsPasting] = useState(false);

  const generateProductCode = (prefix: string) => {
    return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setIsPasting(true);
          try {
            const compressedFile = await compressImage(file);
            const { promise } = uploadImage(
              compressedFile,
              `produtos/${selectedAtelier}`,
              () => {},
            );
            const url = await promise;
            setImages((prev) => (prev.length < 7 ? [...prev, url] : prev));
          } catch (err) {
            console.error("Error uploading pasted image:", err);
          } finally {
            setIsPasting(false);
          }
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const profit = retailPrice - costPrice;
  const profitMargin = retailPrice > 0 ? (profit / retailPrice) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#161616]/30 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#FAF9F6] w-full max-w-5xl h-[90vh] flex flex-col rounded-[2.5rem] border border-[#F0E6D2] overflow-hidden shadow-2xl relative"
      >
        {/* Modal Header */}
        <div className="p-8 md:p-10 border-b border-[#F0E6D2] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-sans font-semibold text-[#4A4444] uppercase tracking-tight">
              {editingProduct?.id ? "Configurações de Produto" : "Novo Produto"}
            </h2>
            <div className="flex gap-2 mt-4">
              {atelieres.map((atl) => (
                <button
                  key={atl.id}
                  type="button"
                  onClick={() => setSelectedAtelier(atl.id as CompanyId)}
                  className={`px-4 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-widest border transition-all ${selectedAtelier === atl.id ? "bg-[#D48C8C] border-[#D48C8C] text-white shadow-md shadow-[#D48C8C]/20" : "bg-[#FAF9F6] border-[#F0E6D2] text-[#A09898] hover:border-[#D48C8C]/30"}`}
                >
                  {atl.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-full hover:bg-red-50 text-[#A09898] hover:text-red-400 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex bg-[#FAF9F6] p-2 gap-2 border-b border-[#F0E6D2]">
          {[
            { id: "info", label: "Dados Básicos", icon: Info },
            { id: "photos", label: "Galeria", icon: Camera },
            { id: "insumos", label: "Ficha Técnica", icon: Layers },
            { id: "pricing", label: "Precificação", icon: Calculator },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[8px] font-semibold uppercase tracking-widest transition-all ${activeSubTab === tab.id ? "bg-white text-[#D48C8C] shadow-sm border border-[#F0E6D2]" : "text-[#A09898] hover:text-[#4A4444]"}`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide bg-white/30">
          {activeSubTab === "info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-500">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-semibold text-[#A09898] tracking-[0.2em] ml-2">
                    Título do Produto
                  </label>
                  <input
                    id="product-name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    type="text"
                    className="w-full bg-white border border-[#F0E6D2] rounded-xl px-6 py-4 text-[11px] font-semibold outline-none focus:border-[#D48C8C] transition-all text-[#4A4444]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-semibold text-[#A09898] tracking-[0.2em] ml-2">
                      Categoria
                    </label>
                    {!showNewCatInput ? (
                      <div className="flex gap-2">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="flex-1 bg-white border border-[#F0E6D2] rounded-xl px-4 py-4 text-[9px] font-semibold uppercase tracking-widest outline-none text-[#4A4444]"
                        >
                          <option value="">Selecionar...</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewCatInput(true)}
                          className="p-4 bg-[#FAF9F6] hover:bg-white text-[#D48C8C] border border-[#F0E6D2] rounded-xl transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          placeholder="Nova Categoria..."
                          value={newCat}
                          onChange={(e) => setNewCat(e.target.value)}
                          className="flex-1 bg-white border border-[#F0E6D2] rounded-xl px-4 py-4 text-[9px] font-semibold uppercase outline-none text-[#4A4444]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewCatInput(false)}
                          className="px-3 bg-red-50 text-red-400 rounded-xl"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-semibold text-[#A09898] tracking-[0.2em] ml-2">
                      Sub-Categoria
                    </label>
                    {!showNewSubcatInput ? (
                      <div className="flex gap-2">
                        <select
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                          className="flex-1 bg-white border border-[#F0E6D2] rounded-xl px-4 py-4 text-[9px] font-semibold uppercase tracking-widest outline-none text-[#4A4444]"
                        >
                          <option value="">Nenhuma</option>
                          {subcategories.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewSubcatInput(true)}
                          className="p-4 bg-[#FAF9F6] hover:bg-white text-[#D48C8C] border border-[#F0E6D2] rounded-xl transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          placeholder="Nova Sub-Categoria..."
                          value={newSubcat}
                          onChange={(e) => setNewSubcat(e.target.value)}
                          className="flex-1 bg-white border border-[#F0E6D2] rounded-xl px-4 py-4 text-[9px] font-semibold uppercase outline-none text-[#4A4444]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewSubcatInput(false)}
                          className="px-3 bg-red-50 text-red-400 rounded-xl"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-semibold text-[#A09898] tracking-[0.2em] ml-2">
                    Descrição de Venda
                  </label>
                  <textarea
                    id="product-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-[#F0E6D2] rounded-[1.5rem] px-6 py-4 text-[11px] font-medium outline-none h-32 text-[#4A4444] resize-none"
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div className="p-8 bg-white rounded-[2rem] border border-[#F0E6D2] shadow-sm">
                  <h3 className="text-[9px] font-semibold text-[#D48C8C] uppercase tracking-[0.3em] mb-6">
                    Mídia Principal
                  </h3>
                  <ImageUpload
                    label="Foto de Capa"
                    path={`produtos/${selectedAtelier}`}
                    currentUrl={images[0] || ""}
                    onUploadComplete={(url) => {
                      const newImages = [...images];
                      newImages[0] = url;
                      setImages(newImages);
                    }}
                    onRemove={() => {
                      const newImages = [...images];
                      newImages[0] = "";
                      setImages(newImages);
                    }}
                    onUploadStarted={handleUploadStarted}
                    onUploadFinished={handleUploadFinished}
                  />
                </div>

                <div className="p-8 rounded-[2rem] bg-[#FAF9F6] border border-[#F0E6D2]">
                  <h3 className="text-[9px] font-semibold text-[#A09898] uppercase tracking-[0.3em] mb-6">
                    Configurações de Exibição
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#F0E6D2] hover:border-[#D48C8C]/40 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2.5 rounded-lg transition-colors ${isFeatured ? "bg-[#D48C8C]/10 text-[#D48C8C]" : "bg-[#FAF9F6] text-[#D1CACA]"}`}
                        >
                          <Star
                            size={14}
                            fill={isFeatured ? "currentColor" : "none"}
                          />
                        </div>
                        <span className="text-[9px] font-semibold uppercase text-[#4A4444] tracking-widest">
                          Produto em Destaque
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="hidden"
                      />
                      <div
                        className={`w-10 h-5 rounded-full relative transition-all ${isFeatured ? "bg-[#D48C8C]" : "bg-[#F0E6D2]"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isFeatured ? "left-5.5" : "left-0.5"}`}
                        />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#F0E6D2] hover:border-[#D48C8C]/40 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2.5 rounded-lg transition-colors ${activeInCatalog ? "bg-emerald-50 text-emerald-500" : "bg-[#FAF9F6] text-[#D1CACA]"}`}
                        >
                          <Eye size={14} />
                        </div>
                        <span className="text-[9px] font-semibold uppercase text-[#4A4444] tracking-widest">
                          Ativo para Venda
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={activeInCatalog}
                        onChange={(e) => setActiveInCatalog(e.target.checked)}
                        className="hidden"
                      />
                      <div
                        className={`w-10 h-5 rounded-full relative transition-all ${activeInCatalog ? "bg-emerald-400" : "bg-[#F0E6D2]"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${activeInCatalog ? "left-5.5" : "left-0.5"}`}
                        />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "photos" && (
            <div className="animate-in fade-in duration-300 space-y-10">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Galeria do Produto
                </h3>
                <p className="text-[10px] text-[#A09898] uppercase font-black tracking-widest">
                  Selecione até 7 imagens para o catálogo. A primeira será a
                  principal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div key={`img-${idx}`}>
                    <ImageUpload
                      label={
                        idx === 0 ? "Imagem Principal" : `Destaque ${idx + 1}`
                      }
                      path={`produtos/${selectedAtelier}`}
                      currentUrl={images[idx]}
                      onUploadComplete={(url) => {
                        const newImages = [...images];
                        newImages[idx] = url;
                        setImages(newImages);
                      }}
                      onRemove={() => {
                        const newImages = [...images];
                        newImages[idx] = "";
                        setImages(newImages);
                      }}
                    />
                    {images[idx] && (
                      <>
                        <div
                          className="absolute top-[34px] left-4 px-2 py-1 bg-black/60 rounded-md backdrop-blur-md pointer-events-none z-10 shadow-sm border border-slate-200"
                          style={
                            idx === 0
                              ? { backgroundColor: "#FF007F", color: "#FFF" }
                              : {}
                          }
                        >
                          <span className="text-[7px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                            {idx === 0 ? (
                              <Star size={8} fill="currentColor" />
                            ) : null}{" "}
                            {idx === 0 ? "CAPA PRINCIPAL" : "EXTRA"}
                          </span>
                        </div>
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newImages = [...images];
                              const temp = newImages[0] || "";
                              newImages[0] = newImages[idx];
                              newImages[idx] = temp;
                              setImages(newImages);
                            }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 hover:bg-black text-white rounded-full text-[7px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl"
                          >
                            Tornar Capa
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {images[0] && (
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-[#F0E6D2] space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-lilac/10 text-lilac rounded-lg">
                      <Maximize2 size={18} />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                      Ajuste Fino da Imagem Principal
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-[#A09898] tracking-wider">
                          <span>Zoom / Escala</span>
                          <span>{imgScale.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="4"
                          step="0.05"
                          value={imgScale}
                          onChange={(e) => setImgScale(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lilac"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-[#A09898] tracking-wider">
                          <span>Rotação</span>
                          <span>{imgRotate}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="1"
                          value={imgRotate}
                          onChange={(e) => setImgRotate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lilac"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-[#A09898] tracking-wider">
                          <span>Deslocamento X</span>
                          <span>{imgX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-200"
                          max="200"
                          step="1"
                          value={imgX}
                          onChange={(e) => setImgX(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lilac"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-[#A09898] tracking-wider">
                          <span>Deslocamento Y</span>
                          <span>{imgY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-200"
                          max="200"
                          step="1"
                          value={imgY}
                          onChange={(e) => setImgY(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lilac"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-center bg-white rounded-3xl border border-slate-200 overflow-hidden relative group aspect-video md:aspect-auto">
                      <ImageWithFallback
                        src={images[0] || ""}
                        alt="Ajuste"
                        className="w-full h-full object-contain"
                        style={{
                          transform: `scale(${imgScale}) translate(${imgX}px, ${imgY}px) rotate(${imgRotate}deg)`,
                        }}
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-lilac/20 pointer-events-none" />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[7px] font-black text-white uppercase tracking-widest">
                        Preview de Ajuste
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === "insumos" && (
            <div className="animate-in fade-in duration-300 space-y-8">
              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <select
                    value={selectedInsumoId}
                    onChange={(e) => setSelectedInsumoId(e.target.value)}
                    className="flex-1 bg-white border border-lilac/20 rounded-2xl px-4 py-4 text-[10px] font-black uppercase outline-none text-slate-900"
                  >
                    <option value="">Selecionar Insumo do Estoque...</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} (R$ {i.unitValue}/unid)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={insumoQty}
                    onChange={(e) => setInsumoQty(Number(e.target.value))}
                    className="w-24 bg-white border border-lilac/20 rounded-2xl px-4 py-4 text-[10px] font-black uppercase outline-none text-slate-900"
                    placeholder="Qtd"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedInsumoId || insumoQty <= 0) return;
                      const ins = insumos.find(
                        (i) => i.id === selectedInsumoId,
                      );
                      if (!ins) return;
                      setAddedInsumos([
                        ...addedInsumos,
                        { insumoId: selectedInsumoId, quantity: insumoQty },
                      ]);
                      setCostPrice((prev) => prev + ins.unitValue * insumoQty);
                      setSelectedInsumoId("");
                      setInsumoQty(1);
                    }}
                    className="px-6 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] shadow-md hover:scale-105 transition-all"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="bg-white rounded-[2rem] p-6 space-y-2">
                  {addedInsumos.length === 0 && (
                    <p className="text-[10px] font-black text-[#A09898] uppercase text-center p-4">
                      Nenhum insumo adicionado
                    </p>
                  )}
                  {addedInsumos.map((ai, index) => {
                    const ins = insumos.find((i) => i.id === ai.insumoId);
                    if (!ins) return null;
                    return (
                      <div
                        key={`${ai.insumoId}-${index}`}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-lilac/10 flex-wrap gap-2"
                      >
                        <div>
                          <span className="font-bold text-xs uppercase text-slate-900">
                            {ins.name}
                          </span>
                          <span className="text-[10px] font-black text-lilac uppercase ml-2 bg-lilac/10 px-2 py-1 rounded-md">
                            Qtd: {ai.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-black text-sm text-[#A09898]">
                            R$ {(ins.unitValue * ai.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              setAddedInsumos(
                                addedInsumos.filter((_, i) => i !== index),
                              );
                              setCostPrice((prev) =>
                                Math.max(0, prev - ins.unitValue * ai.quantity),
                              );
                            }}
                            className="text-[#A09898] hover:text-slate-9000 bg-slate-50 p-2 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "pricing" && (
            <div className="animate-in fade-in duration-300 space-y-10">
              <div className="p-8 rounded-[2rem] bg-white border border-lilac/20 space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                    <Calculator size={24} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                    Precificação Inteligente
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                      Minutos dedicados ao produto
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={laborHours || ""}
                      onChange={(e) => setLaborHours(Number(e.target.value))}
                      className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-black outline-none tracking-widest focus:border-lilac shadow-sm"
                      placeholder="Ex: 30, 45, 120"
                    />
                  </div>
                  <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                    <p className="text-[9px] font-black uppercase text-amber-500 tracking-widest">
                      Base de Cálculo Automática
                    </p>
                    <ul className="text-[10px] space-y-1 font-bold text-[#A09898]">
                      <li>
                        Taxa Fixa/mês:{" "}
                        <span className="text-slate-900">
                          R$ {globalCosts.fixed.toFixed(2)}
                        </span>
                      </li>
                      <li>
                        Mão de Obra:{" "}
                        <span className="text-slate-900">
                          R$ {globalCosts.labor.toFixed(2)}/h
                        </span>
                      </li>
                      <li>
                        Impostos Venda:{" "}
                        <span className="text-slate-900">
                          {globalCosts.tax.toFixed(2)}%
                        </span>
                      </li>
                    </ul>
                    <div className="pt-2 mt-2 border-t border-amber-100">
                      <p className="text-[11px] font-black text-amber-600 uppercase">
                        Sugestão de Preço:{" "}
                        <span className="text-xl ml-2">
                          R$ {intelligentRetailPrice.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="p-8 rounded-[2rem] bg-[#FAF9F6] border border-[#F0E6D2]">
                  <p className="text-[9px] font-black text-[#A09898] uppercase tracking-widest mb-2 flex items-center gap-2">
                    Valor "De:"
                  </p>
                  <p className="text-[8px] font-bold text-[#D1CACA] mb-4">
                    (Preço Riscado)
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-[#D1CACA]">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={originalPrice || ""}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      className="bg-transparent border-b border-[#F0E6D2] outline-none text-2xl font-mono font-black text-[#A09898] w-full"
                    />
                  </div>
                </div>
                <div className="p-8 rounded-[2rem] bg-slate-50 border border-rose-100">
                  <p className="text-[9px] font-black text-[#D1CACA] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <TrendingUp size={14} /> Custo Variável Total
                  </p>
                  <p className="text-[8px] font-bold text-[#D1CACA] mb-4">
                    (Custo dos Insumos / Produção Direta)
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-[#A09898]">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice || ""}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="bg-transparent border-b border-rose-200 outline-none text-3xl font-mono font-black text-rose-600 w-full"
                    />
                  </div>
                </div>
                <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 relative">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <DollarSign size={14} /> Preço de Venda Varejo
                  </p>
                  <p className="text-[8px] font-bold text-emerald-400 mb-4">
                    (Valor final cobrado do cliente)
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setRetailPrice(Number(intelligentRetailPrice.toFixed(2)))
                    }
                    className="absolute top-8 right-8 text-[9px] px-3 py-2 bg-emerald-200/50 text-emerald-700 font-black uppercase tracking-widest rounded-lg hover:bg-emerald-200"
                  >
                    Usar Sugerido
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-emerald-300">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={retailPrice || ""}
                      onChange={(e) => setRetailPrice(Number(e.target.value))}
                      className="bg-transparent border-b border-emerald-200 outline-none text-3xl font-mono font-black text-emerald-600 w-full"
                    />
                  </div>
                </div>
                <div className="p-8 rounded-[2rem] bg-black border border-black shadow-xl">
                  <p className="text-[9px] font-black text-[#A09898] uppercase tracking-widest mb-2">
                    Margem Bruta (Varejo)
                  </p>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span
                      className={`text-4xl font-mono font-black ${retailPrice && costPrice ? (((retailPrice - costPrice) / retailPrice) * 100 > 30 ? "text-emerald-400" : "text-amber-400") : "text-[#A09898]"}`}
                    >
                      {retailPrice && costPrice
                        ? (
                            ((retailPrice - costPrice) / retailPrice) *
                            100
                          ).toFixed(0)
                        : "0"}
                    </span>
                    <span className="text-[#A09898] font-bold">%</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                    Líquido Bruto:{" "}
                    <span className="font-mono text-slate-800">
                      R$ {(retailPrice - costPrice).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-[2rem] bg-white border border-lilac/10 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isWholesaleEnabled}
                        onChange={(e) =>
                          setIsWholesaleEnabled(e.target.checked)
                        }
                        className="w-5 h-5 accent-black"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        Ativar Atacado
                      </span>
                    </label>
                  </div>

                  {isWholesaleEnabled && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-[#A09898] uppercase tracking-widest">
                          Valor Unitário
                        </label>
                        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-lilac/10">
                          <span className="text-[10px] font-black text-[#A09898]">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={wholesalePrice || ""}
                            onChange={(e) =>
                              setWholesalePrice(Number(e.target.value))
                            }
                            className="bg-transparent outline-none text-sm font-black text-slate-900 w-full"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-[#A09898] uppercase tracking-widest">
                          Margem Atacado
                        </label>
                        <div className="flex items-center justify-center h-[46px] px-4 bg-lilac/5 text-lilac rounded-xl border border-lilac/10 font-bold text-xs italic">
                          {costPrice > 0 && wholesalePrice > 0
                            ? (
                                ((wholesalePrice - costPrice) /
                                  wholesalePrice) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                  )}

                  {isWholesaleEnabled && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-[#A09898] uppercase tracking-widest">
                          Mínimo Produtos
                        </label>
                        <input
                          value={wholesaleMinQty}
                          onChange={(e) =>
                            setWholesaleMinQty(Number(e.target.value))
                          }
                          type="number"
                          className="w-full bg-white border border-lilac/20 rounded-xl px-4 py-3 text-sm font-black outline-none text-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-[#A09898] uppercase tracking-widest">
                          Máximo Produtos
                        </label>
                        <input
                          value={wholesaleMaxQty}
                          onChange={(e) =>
                            setWholesaleMaxQty(Number(e.target.value))
                          }
                          type="number"
                          className="w-full bg-white border border-lilac/20 rounded-xl px-4 py-3 text-sm font-black outline-none text-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 rounded-[2rem] bg-white/50 border border-transparent shadow-inner flex flex-col justify-center">
                  <div className="text-center space-y-2">
                    <Calculator size={32} className="text-lilac mx-auto mb-4" />
                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                      Simulação de Venda Varejo
                    </h5>
                    <p className="text-2xl font-mono font-black text-slate-900">
                      {formatCurrency(retailPrice)}
                    </p>
                    <p className="text-[9px] font-black text-[#A09898] uppercase tracking-widest leading-loose">
                      Custo: {formatCurrency(costPrice)} <br />
                      Impostos/Taxas (aprox):{" "}
                      {formatCurrency(retailPrice * 0.1)} <br />
                      <span className="text-emerald-500 font-bold">
                        LUCRO REAL ESTIMADO:{" "}
                        {formatCurrency(profit - retailPrice * 0.1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-[#F0E6D2] bg-white flex gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 rounded-xl bg-white border border-[#F0E6D2] text-[9px] uppercase font-semibold tracking-widest text-[#A09898] hover:text-[#4A4444] transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading || uploadsInProgress > 0}
            onClick={async () => {
              if (!productName) {
                alert("Campo Obrigatório: Escreva o nome do produto.");
                setActiveSubTab("info");
                return;
              }

              setLoading(true);
              const finalCode =
                editingProduct?.code ||
                generateProductCode(
                  atelieres.find((a) => a.id === selectedAtelier)?.prefix ||
                    "PRD",
                );

              try {
                await onSave({
                  id: editingProduct?.id,
                  code: finalCode,
                  product_name: productName,
                  description: description,
                  category: showNewCatInput ? newCat : category,
                  subcategory: showNewSubcatInput ? newSubcat : subcategory,
                  wholesale_price: isWholesaleEnabled ? wholesalePrice || 0 : 0,
                  wholesale_min_qty: isWholesaleEnabled
                    ? wholesaleMinQty || 1
                    : 0,
                  wholesale_max_qty: isWholesaleEnabled
                    ? wholesaleMaxQty || 0
                    : 0,
                  isWholesaleEnabled: isWholesaleEnabled,
                  retail_price: retailPrice || 0,
                  original_price: originalPrice || 0,
                  current_price: retailPrice || 0,
                  estimatedCost: costPrice || 0,
                  insumos: addedInsumos || [],
                  image:
                    images[0] ||
                    "https://via.placeholder.com/300?text=Sem+Foto",
                  images: images.filter((img) => img && img.trim() !== ""),
                  imageSettings: {
                    scale: imgScale,
                    translateX: imgX,
                    translateY: imgY,
                    rotate: imgRotate,
                  },
                  isFeatured: isFeatured || false,
                  activeInCatalog: activeInCatalog,
                  isVisible: activeInCatalog,
                  company: selectedAtelier,
                });
                onClose();
              } catch (err: any) {
                alert("Erro ao salvar produto: " + err.message);
              } finally {
                setLoading(false);
              }
            }}
            className="px-10 py-4 rounded-xl bg-[#D48C8C] text-white text-[9px] uppercase font-semibold tracking-widest shadow-lg shadow-[#C5A059]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading
              ? "Processando..."
              : editingProduct?.id
                ? "Salvar Produto"
                : "Criar Produto"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
