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
import { CSVHandler } from "./CSVHandler";
import { ImageUpload } from "./ImageUpload";
import {
  uploadImage,
  compressImage,
} from "../../services/firebaseStorageService";
import { Product, CompanyId, Insumo, Variation } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { getSiteSettings, getGlobalSettings } from "../../services/firebaseService";

import { ImageWithFallback } from "../ImageWithFallback";
import { exportGenericReportPDF } from "../../utils/pdfGenerator";

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
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

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
    { id: "tuttymimo", name: "Tutty Mimo", prefix: "TM" },
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
      case "tuttymimo":
        return "bg-[#D4BDA1]"; // Warm neutral
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
      case "tuttymimo":
        return "TM";
      default:
        return "LP";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Search and Ateliers Bar Refined */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={14}
            />
            <input
              type="text"
              placeholder="Buscar no catálogo..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] uppercase font-black tracking-widest outline-none focus:border-pink-300 transition-all text-slate-700"
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
            className="hidden sm:block px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:bg-white transition-all"
          >
            <option value="all">TODOS ATELIÊS</option>
            {atelieres.map((atl) => (
              <option key={atl.id} value={atl.id}>
                {atl.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 w-full lg:w-auto items-center justify-end">
          <CSVHandler 
            moduleName="Produtos" 
            data={filtered} 
            fields={['product_name', 'code', 'category', 'subcategory', 'retail_price', 'original_price', 'wholesale_price', 'stock', 'description']}
            onImport={async (newData) => {
              for (const item of newData) {
                await onSaveProduct({
                    ...item,
                    retail_price: parseFloat(item.retail_price) || 0,
                    original_price: parseFloat(item.original_price) || 0,
                    wholesale_price: parseFloat(item.wholesale_price) || 0,
                    stock: parseInt(item.stock) || 0,
                    company: showAllInList ? companyId : selectedAtelier,
                    isVisible: true,
                    isFeatured: false,
                });
              }
            }}
          />
          <button
            onClick={() => {
              const rows = filtered.map(p => [
                p.product_name || "Sem Nome",
                p.category || "---",
                p.subcategory || "---",
                `R$ ${(p.retail_price || 0).toFixed(2)}`,
                (p.stock || 0).toString()
              ]);
              exportGenericReportPDF({
                title: "Relatório de Produtos",
                columns: ["Produto", "Categoria", "Subcat.", "Preço (Varejo)", "Est."],
                rows,
                filters: `Ateliê: ${selectedAtelier} | Cat: ${selectedTab}`
              });
            }}
            className="flex items-center justify-center px-6 py-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl hover:text-pink-600 hover:bg-white hover:border-pink-200 transition-all shadow-sm group text-[9px] font-black uppercase tracking-widest gap-2"
          >
            <Printer size={16} className="group-hover:scale-110 transition-transform" /> Abrir PDF
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
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-pink-700 text-white font-black py-4 px-8 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-pink-900/10 text-[9px] uppercase tracking-widest border border-pink-600/20"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Luxury Catalog List View */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="py-32 text-center bg-white/40 border border-dashed border-slate-200 rounded-[3rem] text-slate-400 uppercase tracking-[0.3em] font-black text-[9px]">
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
              onClick={() => setViewingProduct(p)}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row md:items-center p-4 gap-6 hover:border-pink-300 transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              {/* Small Image (not enormous anymore) */}
              <div className="w-full md:w-24 h-24 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
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
                    <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-tight group-hover:text-pink-700 transition-colors">
                      {p.product_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      REF: {p.code}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-100"></span>
                    <span className="text-[8px] font-black text-pink-600 uppercase tracking-widest">
                      {p.category} {p.subcategory ? `> ${p.subcategory}` : ""}
                    </span>
                    {p.isFeatured && (
                      <Star
                        size={10}
                        className="text-pink-500"
                        fill="currentColor"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest line-through">
                      De: {formatCurrency(oldPrice)}
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[9px] font-black text-slate-500 uppercase">
                        Por:
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {formatCurrency(p.retail_price || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingProduct(p)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-400 hover:bg-pink-700 hover:text-white transition-all border border-slate-100 text-[10px] font-bold uppercase tracking-widest"
                      title="Ver Detalhes"
                    >
                      <Eye size={14} /> Ver
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-white hover:bg-pink-700 transition-all border border-slate-100 text-[10px] font-bold uppercase tracking-widest"
                      title="Editar"
                    >
                      <Edit size={14} /> Editar
                    </button>
                    <button
                      onClick={() => setProductToDelete(p.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-400 hover:bg-red-500 hover:text-white transition-all border border-slate-100 text-[10px] font-bold uppercase tracking-widest"
                      title="Excluir"
                    >
                      <Trash2 size={14} /> Excluir
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

      {viewingProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-3xl rounded-[3rem] border border-slate-200 overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-y-auto max-h-[95vh]"
          >
            {/* Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-700">
                  <Box size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Ficha Técnica do Produto</h3>
              </div>
              <button 
                onClick={() => setViewingProduct(null)}
                className="p-3 rounded-full hover:bg-white hover:shadow-md text-slate-400 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="flex flex-col md:flex-row gap-12">
                {/* Product Image */}
                <div className="w-full md:w-64 h-64 rounded-[2.5rem] overflow-hidden bg-slate-50 border border-slate-100 shrink-0 shadow-inner group relative">
                  <ImageWithFallback 
                    src={viewingProduct.image || ""} 
                    alt={viewingProduct.product_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-2 py-1 bg-pink-50 text-pink-700 text-[8px] font-black uppercase tracking-widest rounded-md">
                         {viewingProduct.category}
                       </span>
                       {viewingProduct.subcategory && (
                         <span className="text-slate-300 text-xs">/</span>
                       )}
                       {viewingProduct.subcategory && (
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                           {viewingProduct.subcategory}
                         </span>
                       )}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight">{viewingProduct.product_name}</h2>
                    <p className="text-[10px] font-mono font-black text-slate-400 mt-2 uppercase tracking-widest bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200/50">REF: {viewingProduct.code}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Varejo</p>
                      <p className="text-xl font-black text-slate-900">{formatCurrency(viewingProduct.retail_price || 0)}</p>
                    </div>
                    <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Atacado</p>
                      <p className="text-xl font-black text-slate-900">{formatCurrency(viewingProduct.wholesale_price || 0)}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Lucro Estimado</p>
                      <p className="text-2xl font-black text-emerald-700">
                        {formatCurrency((viewingProduct.retail_price || 0) - (viewingProduct.estimatedCost || 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Margem Real</p>
                      <div className="flex items-center gap-2 justify-end">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <p className="text-lg font-black text-emerald-700">
                          {viewingProduct.retail_price ? Math.round(((viewingProduct.retail_price - (viewingProduct.estimatedCost || 0)) / viewingProduct.retail_price) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Estoque", value: `${viewingProduct.stock || 0} unid`, icon: Box, color: "text-slate-600", bg: "bg-slate-50" },
                  { label: "Vendidos", value: (viewingProduct as any).soldCount || 0, icon: TrendingUp, color: "text-pink-600", bg: "bg-pink-50" },
                  { label: "Insumos", value: `${viewingProduct.insumos?.length || 0} itens`, icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Criado em", value: viewingProduct.createdAt ? ((viewingProduct.createdAt as any).toDate ? (viewingProduct.createdAt as any).toDate().toLocaleDateString('pt-BR') : new Date(viewingProduct.createdAt as any).toLocaleDateString('pt-BR')) : 'N/A', icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" }
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} p-5 rounded-3xl border border-white/20 shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2 opacity-60">
                      <stat.icon size={12} className={stat.color} />
                      <p className={`text-[8px] font-black uppercase tracking-widest ${stat.color}`}>{stat.label}</p>
                    </div>
                    <p className="text-sm font-black text-slate-800 tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <DollarSign size={80} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400 mb-2">Faturamento Gerado</p>
                  <p className="text-4xl font-black tracking-tighter">{formatCurrency(((viewingProduct as any).soldCount || 0) * (viewingProduct.retail_price || 0))}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-4">Cálculo baseado no Valor Varejo Atual</p>
                </div>
                
                <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Audiência</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">{(viewingProduct as any).viewCount || '1.2k'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visualizações Únicas</p>
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
                      <Eye size={24} />
                    </div>
                  </div>
                  <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-3/4 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => {
                    setEditingProduct(viewingProduct);
                    setViewingProduct(null);
                    setIsModalOpen(true);
                  }}
                  className="flex-[3] py-6 bg-pink-700 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-pink-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Editar Produto
                </button>
                <button 
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {productToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-md w-full p-10 text-center rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_rgba(0,0,0,0.2)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-pink-700" />
            <div className="w-24 h-24 bg-pink-50 text-pink-700 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-pink-100 shadow-inner">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter">
              Excluir Produto?
            </h3>
            <p className="text-[10px] text-slate-400 mb-10 font-black uppercase tracking-[0.2em] leading-relaxed">
              Esta operação é irreversível e removerá o item permanentemente de todos os seus catálogos.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-5 bg-slate-50 rounded-2xl font-black text-slate-400 uppercase text-[9px] tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-5 bg-pink-700 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl shadow-pink-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all border border-pink-600"
              >
                Confirmar Exclusão
              </button>
            </div>
          </motion.div>
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
    "info" | "pricing" | "photos"
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

  const [hasGlobalPricing, setHasGlobalPricing] = useState(false);

  useEffect(() => {
    getGlobalSettings().then((settings) => {
      if (settings) {
        setGlobalCosts({
          fixed: settings.global_fixed_costs || 0,
          labor: settings.global_labor_cost_per_hour || 0,
          tax: settings.global_tax_rate || 0,
        });
        if (settings.global_labor_cost_per_hour || settings.global_fixed_costs) {
          setHasGlobalPricing(true);
        }
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
        <div className="flex bg-slate-50 p-2 gap-2 border-b border-slate-100">
          {[
            { id: "info", label: "Dados Básicos", icon: Info },
            { id: "photos", label: "Galeria", icon: Camera },
            { id: "pricing", label: "Preços & Lucro", icon: Calculator },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === tab.id 
                  ? "bg-white text-pink-700 shadow-sm border border-slate-100" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-white/30 scrollbar-hide">
            {activeSubTab === "info" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-10 animate-in fade-in duration-500">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] ml-2">
                      Título do Produto
                    </label>
                    <input
                      id="product-name"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-[11px] font-black outline-none focus:border-pink-300 focus:bg-white transition-all text-slate-700 shadow-inner"
                      placeholder="Ex: Laço Boutique Cetim"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] ml-2">
                        Categoria
                      </label>
                      {!showNewCatInput ? (
                        <div className="flex gap-2">
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-5 text-[9px] font-black uppercase tracking-widest outline-none text-slate-700 focus:bg-white transition-all shadow-inner"
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
                            className="p-4 bg-slate-50 hover:bg-white text-pink-700 border border-slate-100 rounded-2xl transition-all shadow-sm"
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
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-5 text-[9px] font-black uppercase outline-none text-slate-700 shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewCatInput(false)}
                            className="px-3 bg-red-50 text-red-500 rounded-2xl"
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
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
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

              {/* Ajuste Automático Message */}
              {images[0] && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-pink-100 text-pink-700 rounded-2xl">
                    <Maximize2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Enquadramento Automático</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-80">O sistema realiza o crop inteligente e centralização proporcional automaticamente para vitrines e catálogos.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content Logic for Pricing was already here */}

          {activeSubTab === "pricing" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10 p-10">
              <div className="max-w-2xl mx-auto space-y-10">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-emerald-100 text-emerald-700 rounded-full shadow-inner">
                    <Calculator size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                      Definição de Preços
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Os custos operacionais já estão integrados globalmente
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-4">
                      Valor de Venda (Varejo)
                    </label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</div>
                      <input
                        type="number"
                        value={retailPrice || ""}
                        onChange={(e) => setRetailPrice(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] pl-14 pr-8 py-6 text-2xl font-black text-slate-900 outline-none focus:border-pink-500 focus:bg-white transition-all shadow-inner"
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-4">
                      Valor de Venda (Atacado)
                    </label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</div>
                      <input
                        type="number"
                        value={wholesalePrice || ""}
                        onChange={(e) => setWholesalePrice(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] pl-14 pr-8 py-6 text-2xl font-black text-slate-900 outline-none focus:border-pink-500 focus:bg-white transition-all shadow-inner"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics Visualization */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-[2.5rem] p-8 text-center space-y-1">
                    <p className="text-[8px] font-black text-emerald-600/70 uppercase tracking-[0.2em]">Lucro Líquido</p>
                    <p className="text-2xl font-black text-emerald-700">{formatCurrency(profit)}</p>
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                       <TrendingUp size={12} className="text-emerald-400" />
                       <p className="text-[9px] font-black text-emerald-600 uppercase">Margem: {profitMargin.toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100/50 rounded-[2.5rem] p-8 text-center space-y-1">
                    <p className="text-[8px] font-black text-blue-600/70 uppercase tracking-[0.2em]">Diferença</p>
                    <p className="text-2xl font-black text-blue-700">{formatCurrency(retailPrice - (wholesalePrice || 0))}</p>
                    <p className="text-[9px] font-black text-blue-600 uppercase pt-2">Varejo vs Atacado</p>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100/50 rounded-[2.5rem] p-8 text-center space-y-1">
                    <p className="text-[8px] font-black text-amber-600/70 uppercase tracking-[0.2em]">Desconto</p>
                    <p className="text-2xl font-black text-amber-700">
                      {retailPrice > 0 ? ((1 - (wholesalePrice || 0) / retailPrice) * 100).toFixed(0) : 0}%
                    </p>
                    <p className="text-[9px] font-black text-amber-600 uppercase pt-2">Aplicado no Atacado</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                   <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                     <Info size={16} />
                   </div>
                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                     Esta precificação simplificada utiliza os custos de produção e despesas fixas definidos no painel de Configurações Gerais para calcular sua lucratividade real.
                   </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-slate-100 bg-white flex gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-5 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-slate-600 transition-all"
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
            className="px-12 py-5 rounded-2xl bg-pink-700 text-white text-[10px] uppercase font-black tracking-widest shadow-xl shadow-pink-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 border border-pink-600"
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
