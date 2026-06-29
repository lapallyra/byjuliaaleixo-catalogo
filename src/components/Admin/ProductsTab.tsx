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
  LayoutGrid,
  List as ListIcon,
  Archive,
  Tag,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Copy,
  Globe,
  Sliders,
  Check,
  Image as ImageIcon,
  FileText
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
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCollection, setFilterCollection] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all"); 
  const [filterFeatured, setFilterFeatured] = useState<string>("all");
  const [filterExclusive, setFilterExclusive] = useState<string>("all");
  
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const saved = localStorage.getItem("productsViewMode");
    if (saved === "grid" || saved === "list") setViewMode(saved);
  }, []);

  const handleViewMode = (mode: "grid"|"list") => {
    setViewMode(mode);
    localStorage.setItem("productsViewMode", mode);
  };

  const categories = React.useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);
  const collections = React.useMemo(() => Array.from(new Set(products.map(p => p.subcategory).filter(Boolean))), [products]);

  const filteredProducts = React.useMemo(() => {
    let result = products.filter((p) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || 
        (p.product_name || "").toLowerCase().includes(s) ||
        (p.code || "").toLowerCase().includes(s) ||
        (p.category || "").toLowerCase().includes(s) ||
        (p.subcategory || "").toLowerCase().includes(s);
      
      const matchesCategory = filterCategory === "all" || p.category === filterCategory;
      const matchesCollection = filterCollection === "all" || p.subcategory === filterCollection;
      const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? p.isVisible !== false : p.isVisible === false);
      const matchesFeatured = filterFeatured === "all" || (filterFeatured === "yes" ? p.isFeatured : !p.isFeatured);
      const matchesExclusive = filterExclusive === "all" || (filterExclusive === "yes" ? (p as any).isExclusive : !(p as any).isExclusive);
      
      return matchesSearch && matchesCategory && matchesCollection && matchesStatus && matchesFeatured && matchesExclusive;
    });

    result.sort((a, b) => {
      switch(sortBy) {
        case "name_asc": return (a.product_name||"").localeCompare(b.product_name||"");
        case "name_desc": return (b.product_name||"").localeCompare(a.product_name||"");
        case "price_asc": return (a.retail_price||0) - (b.retail_price||0);
        case "price_desc": return (b.retail_price||0) - (a.retail_price||0);
        case "stock_asc": return (a.stock||0) - (b.stock||0);
        case "stock_desc": return (b.stock||0) - (a.stock||0);
        case "best_sellers": return ((b as any).soldCount||0) - ((a as any).soldCount||0);
        case "date_asc": {
          const tA = (a as any).createdAt?.toMillis?.() || new Date((a as any).createdAt).getTime() || 0;
          const tB = (b as any).createdAt?.toMillis?.() || new Date((b as any).createdAt).getTime() || 0;
          return tA - tB;
        }
        case "newest":
        default: {
          const tA = (a as any).createdAt?.toMillis?.() || new Date((a as any).createdAt).getTime() || 0;
          const tB = (b as any).createdAt?.toMillis?.() || new Date((b as any).createdAt).getTime() || 0;
          return tB - tA;
        }
      }
    });

    return result;
  }, [products, searchTerm, filterCategory, filterCollection, filterStatus, filterFeatured, filterExclusive, sortBy]);

  const confirmDelete = async () => {
    if (productToDelete) {
      await onDeleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  const isNewProduct = (p: any) => {
      if (!p.createdAt) return false;
      const t = p.createdAt.toMillis?.() || new Date(p.createdAt).getTime();
      return (Date.now() - t) < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[1.5rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Produtos</h1>
          <p className="text-sm font-medium text-[#8E8E93] mt-1">{filteredProducts.length} itens no catálogo</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64 xl:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] w-4 h-4" />
            <input
              type="text"
              placeholder="Nome, SKU, Categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:border-[#E5E5EA] focus:bg-white transition-all text-[#1C1C1E]"
            />
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1C1C1E] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#2C2C2E] transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="flex items-center gap-2 bg-[#F5F5F7] px-3 py-1.5 rounded-lg border border-[#E5E5EA]">
            <Filter size={14} className="text-[#8E8E93]" />
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Filtros</span>
          </div>

          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Todas as Categorias</option>
             {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterCollection} onChange={e => setFilterCollection(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Todas as Coleções</option>
             {collections.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Qualquer Status</option>
             <option value="active">Ativos</option>
             <option value="inactive">Inativos</option>
          </select>

          <select value={filterFeatured} onChange={e => setFilterFeatured(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Destaque: Todos</option>
             <option value="yes">Sim</option>
             <option value="no">Não</option>
          </select>

          <select value={filterExclusive} onChange={e => setFilterExclusive(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Exclusivo: Todos</option>
             <option value="yes">Sim</option>
             <option value="no">Não</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-4 py-2 text-[11px] font-bold text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="newest">Mais recentes</option>
             <option value="best_sellers">Mais vendidos</option>
             <option value="name_asc">Nome (A-Z)</option>
             <option value="name_desc">Nome (Z-A)</option>
             <option value="price_asc">Menor Preço</option>
             <option value="price_desc">Maior Preço</option>
             <option value="stock_asc">Menor Estoque</option>
             <option value="stock_desc">Maior Estoque</option>
          </select>
          
          <div className="flex bg-[#F5F5F7] p-1 rounded-xl border border-[#E5E5EA]">
            <button onClick={() => handleViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#1C1C1E]' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => handleViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1C1C1E]' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}>
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCTS DISPLAY */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[1.5rem] border border-[#E5E5EA] shadow-sm">
          <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center text-[#8E8E93] mb-4">
             <Box size={32} />
          </div>
          <p className="text-[#1C1C1E] font-semibold text-lg">Nenhum produto encontrado</p>
          <p className="text-[#8E8E93] text-sm mt-1">Tente ajustar seus filtros ou termos de pesquisa.</p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-[1.25rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden hover:shadow-lg transition-all group flex flex-col relative h-[360px]">
                {/* Indicators Layer */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
                  {isNewProduct(p) && <span className="bg-blue-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Novo</span>}
                  {p.isFeatured && <span className="bg-amber-400 text-amber-900 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Destaque</span>}
                  {(p as any).isExclusive && <span className="bg-purple-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Exclusivo</span>}
                  {p.stock !== undefined && p.stock <= 5 && <span className="bg-rose-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Estoque Baixo</span>}
                  {p.isVisible === false && <span className="bg-[#1C1C1E] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Inativo</span>}
                </div>

                <div className="relative w-full h-44 bg-[#F5F5F7] shrink-0 border-b border-[#E5E5EA]">
                  {p.image ? (
                    <img src={p.image} alt={p.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#D1D1D6]">
                      <Camera size={32} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider mt-2">Sem Imagem</span>
                    </div>
                  )}
                  {/* Quick Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="w-10 h-10 bg-white text-[#1C1C1E] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md" title="Editar">
                       <Edit size={16} />
                     </button>
                     <button onClick={() => setViewingProduct(p)} className="w-10 h-10 bg-white text-[#1C1C1E] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md" title="Visualizar">
                       <Eye size={16} />
                     </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[8px] font-bold text-[#8E8E93] bg-[#F5F5F7] px-1.5 py-0.5 rounded uppercase tracking-widest truncate max-w-[80px]">{p.category || "Sem Cat."}</span>
                    <span className="text-[8px] font-bold text-[#8E8E93] bg-[#F5F5F7] px-1.5 py-0.5 rounded uppercase tracking-widest truncate max-w-[80px]">{p.subcategory || "Sem Col."}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1C1C1E] leading-snug line-clamp-2" title={p.product_name}>{p.product_name}</h3>
                  <p className="text-[10px] font-mono text-[#8E8E93] mt-1">REF: {p.code}</p>
                  
                  <div className="mt-auto pt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-widest">Preço</p>
                      <p className="text-base font-bold text-[#1C1C1E] font-mono tracking-tight">{formatCurrency(p.retail_price || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-widest">Estoque</p>
                      <p className={`text-sm font-bold font-mono ${(p.stock||0) <= 5 ? 'text-rose-500' : 'text-[#1C1C1E]'}`}>{p.stock || 0} un</p>
                    </div>
                  </div>
                </div>

                {/* Footer Quick Actions */}
                <div className="px-3 py-2 bg-[#F5F5F7] border-t border-[#E5E5EA] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-1">
                      <button onClick={async () => {
                         const dup = {...p, id: undefined, product_name: p.product_name + " (Cópia)", code: p.code + "-COP"};
                         setEditingProduct(dup);
                         setIsModalOpen(true);
                      }} className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#E5E5EA] rounded-md transition-colors" title="Duplicar"><Copy size={14} /></button>
                      <button onClick={() => onSaveProduct({...p, isVisible: !p.isVisible})} className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#E5E5EA] rounded-md transition-colors" title={p.isVisible !== false ? "Arquivar" : "Desarquivar"}><Archive size={14} /></button>
                   </div>
                   <button onClick={() => setProductToDelete(p.id)} className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-md transition-colors" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[1.5rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest w-16">Foto</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Produto</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Categoria / Coleção</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-right">Preço</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-center">Estoque</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-center">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F7]">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-5 py-3">
                      <div className="w-12 h-12 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] overflow-hidden flex items-center justify-center shrink-0">
                        {p.image ? <img src={p.image} alt="Produto" className="w-full h-full object-cover" /> : <Camera size={16} className="text-[#D1D1D6]" />}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#1C1C1E]">{p.product_name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[#8E8E93]">REF: {p.code}</span>
                          {p.isFeatured && <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-1 rounded uppercase">Destaque</span>}
                          {isNewProduct(p) && <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1 rounded uppercase">Novo</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                       <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-[#1C1C1E]">{p.category || "-"}</span>
                          <span className="text-[10px] text-[#8E8E93]">{p.subcategory || "-"}</span>
                       </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                       <div className="flex flex-col items-end">
                         <span className="text-sm font-bold text-[#1C1C1E] font-mono">{formatCurrency(p.retail_price || 0)}</span>
                         <span className="text-[10px] text-[#8E8E93] font-mono">Custo: {formatCurrency((p as any).estimatedCost || 0)}</span>
                       </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                       <span className={`text-xs font-bold font-mono px-2 py-1 rounded-lg border ${(p.stock||0) <= 5 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                         {p.stock || 0} un
                       </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${p.isVisible !== false ? 'bg-white text-[#1C1C1E] border-[#1C1C1E]' : 'bg-[#F5F5F7] text-[#8E8E93] border-[#E5E5EA]'}`}>
                         {p.isVisible !== false ? 'Ativo' : 'Inativo'}
                       </span>
                    </td>
                    <td className="px-5 py-3">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setViewingProduct(p)} className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-colors" title="Visualizar"><Eye size={16} /></button>
                         <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                         <button onClick={async () => {
                             const dup = {...p, id: undefined, product_name: p.product_name + " (Cópia)", code: p.code + "-COP"};
                             setEditingProduct(dup);
                             setIsModalOpen(true);
                          }} className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-colors" title="Duplicar"><Copy size={16} /></button>
                         <button onClick={() => onSaveProduct({...p, isVisible: !p.isVisible})} className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-colors" title={p.isVisible !== false ? "Arquivar" : "Desarquivar"}><Archive size={16} /></button>
                         <button onClick={() => setProductToDelete(p.id)} className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full p-8 text-center rounded-3xl border border-[#E5E5EA] shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#1C1C1E] mb-2 tracking-tight">Excluir Produto?</h3>
            <p className="text-sm text-[#8E8E93] mb-8 font-medium">Esta ação é permanente e removerá o item de todos os catálogos.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-md active:scale-[0.98] transition-all">Sim, Excluir</button>
              <button onClick={() => setProductToDelete(null)} className="w-full py-4 bg-[#F5F5F7] text-[#1C1C1E] rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-[#E5E5EA] transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] border border-[#E5E5EA] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-[#F5F5F7] flex justify-between items-center bg-[#FAFAFA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center">
                  <Box size={20} />
                </div>
                <h3 className="text-lg font-bold text-[#1C1C1E] tracking-tight">Detalhes do Produto</h3>
              </div>
              <button onClick={() => setViewingProduct(null)} className="p-2.5 rounded-full hover:bg-[#F5F5F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-72 aspect-square rounded-[1.5rem] overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA] shrink-0">
                  {viewingProduct.image ? (
                    <img src={viewingProduct.image} alt={viewingProduct.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#D1D1D6]"><Camera size={48} /></div>
                  )}
                </div>
                
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                       <span className="px-2.5 py-1 bg-[#1C1C1E] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg">{viewingProduct.category || "Sem Categoria"}</span>
                       <span className="px-2.5 py-1 bg-[#F5F5F7] text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest rounded-lg">{viewingProduct.subcategory || "Sem Coleção"}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-[#1C1C1E] tracking-tight leading-tight mb-2">{viewingProduct.product_name}</h2>
                    <p className="text-sm font-mono font-medium text-[#8E8E93]">SKU: {viewingProduct.code}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-[#F5F5F7] rounded-[1.25rem] border border-[#E5E5EA]">
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Preço Varejo</p>
                      <p className="text-2xl font-mono font-bold text-[#1C1C1E]">{formatCurrency(viewingProduct.retail_price || 0)}</p>
                    </div>
                    <div className="p-5 bg-[#F5F5F7] rounded-[1.25rem] border border-[#E5E5EA]">
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Preço Atacado</p>
                      <p className="text-2xl font-mono font-bold text-[#1C1C1E]">{formatCurrency(viewingProduct.wholesale_price || 0)}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-emerald-50 rounded-[1.25rem] border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Lucro Estimado</p>
                      <p className="text-xl font-mono font-bold text-emerald-700">
                        {formatCurrency((viewingProduct.retail_price || 0) - ((viewingProduct as any).estimatedCost || 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Margem</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {viewingProduct.retail_price ? Math.round(((viewingProduct.retail_price - ((viewingProduct as any).estimatedCost || 0)) / viewingProduct.retail_price) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Estoque", value: `${viewingProduct.stock || 0} un`, color: "bg-[#F5F5F7]" },
                  { label: "Vendidos", value: (viewingProduct as any).soldCount || 0, color: "bg-[#F5F5F7]" },
                  { label: "Destaque", value: viewingProduct.isFeatured ? "Sim" : "Não", color: "bg-[#F5F5F7]" },
                  { label: "Status", value: viewingProduct.isVisible !== false ? "Ativo" : "Inativo", color: "bg-[#F5F5F7]" }
                ].map((stat, i) => (
                  <div key={i} className={`${stat.color} p-4 rounded-2xl border border-[#E5E5EA]`}>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#8E8E93] mb-1">{stat.label}</p>
                    <p className="text-lg font-bold text-[#1C1C1E] tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    setEditingProduct(viewingProduct);
                    setViewingProduct(null);
                    setIsModalOpen(true);
                  }}
                  className="flex-[2] py-4 bg-[#1C1C1E] text-white rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-md hover:bg-[#2C2C2E] transition-all flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Editar Produto
                </button>
                <button 
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 py-4 bg-[#F5F5F7] text-[#1C1C1E] border border-[#E5E5EA] rounded-xl font-bold uppercase text-[11px] tracking-wider hover:bg-[#E5E5EA] transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal (Integration) */}
      {isModalOpen && (
        <ProductFormModal
          editingProduct={editingProduct}
          existingProducts={products}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            const prefix = "LP"; // Simplified prefix logic
            await onSaveProduct({
              ...data,
              code: editingProduct?.id
                ? editingProduct.code
                : `${prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            });
            setIsModalOpen(false);
          }}
          companyId={companyId}
          atelieres={[{ id: "pallyra", name: "La Pallyra", prefix: "LP" }]}
          insumos={insumos}
        />
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
  const [showToast, setShowToast] = useState<string | null>(null);

  const handleUploadStarted = () => setUploadsInProgress((prev) => prev + 1);
  const handleUploadFinished = () =>
    setUploadsInProgress((prev) => Math.max(0, prev - 1));

  // Tab state
  const [activeSubTab, setActiveSubTab] = useState<
    "info" | "images" | "pricing" | "organization" | "personalization" | "seo"
  >("info");

  const [selectedAtelier, setSelectedAtelier] = useState<CompanyId>(
    (editingProduct?.company as CompanyId) || companyId,
  );

  // Informações Gerais State
  const [productName, setProductName] = useState(editingProduct?.product_name || "");
  const [description, setDescription] = useState(editingProduct?.description || "");
  const [category, setCategory] = useState(editingProduct?.category || "");
  const [subcategory, setSubcategory] = useState(editingProduct?.subcategory || "");
  const [collection, setCollection] = useState(editingProduct?.collection || "");
  const [sku, setSku] = useState(editingProduct?.code || "");
  const [brand, setBrand] = useState(editingProduct?.brand || "");
  const [activeInCatalog, setActiveInCatalog] = useState(editingProduct?.activeInCatalog ?? true);
  const [isFeatured, setIsFeatured] = useState(editingProduct?.isFeatured || false);
  const [isExclusive, setIsExclusive] = useState(editingProduct?.isExclusive || false);

  // New Category & Subcategory options
  const [newCat, setNewCat] = useState("");
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newSubcat, setNewSubcat] = useState("");
  const [showNewSubcatInput, setShowNewSubcatInput] = useState(false);

  // Imagens State
  const [images, setImages] = useState<string[]>(() => {
    const existingImgs = editingProduct?.images || [];
    const mainImg = editingProduct?.image;
    if (existingImgs.length > 0) return [...existingImgs];
    if (mainImg) return [mainImg];
    return [];
  });
  const [collectionCoverImage, setCollectionCoverImage] = useState(editingProduct?.collectionCoverImage || "");

  // Preços State
  const [retailPrice, setRetailPrice] = useState(editingProduct?.retail_price || 0);
  const [costPrice, setCostPrice] = useState(editingProduct?.estimatedCost || 0);
  const [originalPrice, setOriginalPrice] = useState(editingProduct?.original_price || 0);
  const [stock, setStock] = useState(editingProduct?.stock || 0);
  const [minStock, setMinStock] = useState(editingProduct?.minStock || 0);
  const [productionTime, setProductionTime] = useState<number>(editingProduct?.productionTime || 5);

  // Insumos association (preserving existing feature)
  const [addedInsumos, setAddedInsumos] = useState<
    { insumoId: string; quantity: number }[]
  >(editingProduct?.insumos || []);
  const [selectedInsumoId, setSelectedInsumoId] = useState("");
  const [insumoQty, setInsumoQty] = useState(1);

  // Organização State
  const [tagsString, setTagsString] = useState((editingProduct?.tags || []).join(", "));
  const [displayOrder, setDisplayOrder] = useState(editingProduct?.displayOrder || 0);
  const [relatedProductId, setRelatedProductId] = useState(editingProduct?.relatedProductId || "");
  const [recommendedProductIds, setRecommendedProductIds] = useState<string[]>(
    editingProduct?.recommendedProductIds || []
  );

  // Personalização State
  const [personalizationSettings, setPersonalizationSettings] = useState<any[]>(
    editingProduct?.personalizationSettings || []
  );

  // Variações State
  const [variations, setVariations] = useState<Variation[]>(
    editingProduct?.variations || []
  );

  // SEO State
  const [seoTitle, setSeoTitle] = useState(editingProduct?.seoTitle || "");
  const [slug, setSlug] = useState(editingProduct?.slug || "");
  const [seoDescription, setSeoDescription] = useState(editingProduct?.seoDescription || "");
  const [seoKeywords, setSeoKeywords] = useState(editingProduct?.seoKeywords || "");

  // Categories helper
  const defaultProductCategories = [
    "Agendas",
    "Cadernos",
    "Bloquinhos",
    "Planner",
    "Álbum de Fotos",
    "Papelaria Criativa",
    "Buquês",
    "Caixas e Embalagens",
    "Brindes e Mimos"
  ];
  const categories = Array.from(
    new Set([
      ...defaultProductCategories,
      ...existingProducts.map((p) => p.category).filter(Boolean)
    ]),
  );
  const subcategories = Array.from(
    new Set(
      existingProducts
        .filter((p) => p.category === category)
        .map((p) => p.subcategory)
        .filter(Boolean),
    ),
  );

  // Escape key close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [productName, description, category, subcategory, collection, sku, retailPrice, costPrice, images, collectionCoverImage, tagsString, displayOrder, personalizationSettings, variations, seoTitle, slug, seoDescription, seoKeywords]);

  // Auto-generate SEO values on title edit
  useEffect(() => {
    if (!editingProduct?.id && productName) {
      if (!seoTitle) setSeoTitle(productName);
      if (!slug) {
        const generatedSlug = productName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        setSlug(generatedSlug);
      }
    }
  }, [productName]);

  // Check for unsaved changes
  const hasUnsavedChanges = () => {
    if (productName !== (editingProduct?.product_name || "")) return true;
    if (description !== (editingProduct?.description || "")) return true;
    if (category !== (editingProduct?.category || "")) return true;
    if (subcategory !== (editingProduct?.subcategory || "")) return true;
    if (collection !== (editingProduct?.collection || "")) return true;
    if (sku !== (editingProduct?.code || "")) return true;
    if (brand !== (editingProduct?.brand || "")) return true;
    if (activeInCatalog !== (editingProduct?.activeInCatalog ?? true)) return true;
    if (isFeatured !== (editingProduct?.isFeatured || false)) return true;
    if (isExclusive !== (editingProduct?.isExclusive || false)) return true;

    const initialImages = editingProduct?.images || (editingProduct?.image ? [editingProduct.image] : []);
    if (images.filter(Boolean).join(",") !== initialImages.filter(Boolean).join(",")) return true;
    if (collectionCoverImage !== (editingProduct?.collectionCoverImage || "")) return true;

    if (retailPrice !== (editingProduct?.retail_price || 0)) return true;
    if (costPrice !== (editingProduct?.estimatedCost || 0)) return true;
    if (originalPrice !== (editingProduct?.original_price || 0)) return true;
    if (stock !== (editingProduct?.stock || 0)) return true;
    if (minStock !== (editingProduct?.minStock || 0)) return true;
    if (productionTime !== (editingProduct?.productionTime || 5)) return true;

    const initialTags = (editingProduct?.tags || []).join(", ");
    if (tagsString !== initialTags) return true;
    if (displayOrder !== (editingProduct?.displayOrder || 0)) return true;
    if (relatedProductId !== (editingProduct?.relatedProductId || "")) return true;
    if (recommendedProductIds.join(",") !== (editingProduct?.recommendedProductIds || []).join(",")) return true;

    if (JSON.stringify(personalizationSettings) !== JSON.stringify(editingProduct?.personalizationSettings || [])) return true;
    if (JSON.stringify(variations) !== JSON.stringify(editingProduct?.variations || [])) return true;

    if (seoTitle !== (editingProduct?.seoTitle || "")) return true;
    if (slug !== (editingProduct?.slug || "")) return true;
    if (seoDescription !== (editingProduct?.seoDescription || "")) return true;
    if (seoKeywords !== (editingProduct?.seoKeywords || "")) return true;

    return false;
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      const confirmClose = window.confirm(
        "Você tem alterações não salvas. Tem certeza de que deseja fechar sem salvar?"
      );
      if (confirmClose) onClose();
    } else {
      onClose();
    }
  };

  const handleSave = async (keepOpen = false) => {
    if (!productName.trim()) {
      alert("Campo Obrigatório: Escreva o nome do produto.");
      setActiveSubTab("info");
      return;
    }

    setLoading(true);
    const finalCode =
      sku.trim() ||
      editingProduct?.code ||
      `${atelieres.find((a) => a.id === selectedAtelier)?.prefix || "PRD"}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    try {
      const parsedTags = tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const productData: Partial<Product> = {
        id: editingProduct?.id,
        code: finalCode,
        product_name: productName,
        description: description,
        category: showNewCatInput ? newCat : category,
        subcategory: showNewSubcatInput ? newSubcat : subcategory,
        retail_price: retailPrice || 0,
        original_price: originalPrice || 0,
        current_price: retailPrice || 0,
        estimatedCost: costPrice || 0,
        stock: stock || 0,
        minStock: minStock || 0,
        productionTime: productionTime || 5,
        collection: collection,
        brand: brand,
        activeInCatalog: activeInCatalog,
        isVisible: activeInCatalog,
        isFeatured: isFeatured || false,
        isExclusive: isExclusive || false,
        collectionCoverImage: collectionCoverImage,
        tags: parsedTags,
        displayOrder: displayOrder || 0,
        relatedProductId: relatedProductId || undefined,
        recommendedProductIds: recommendedProductIds,
        personalizationSettings: personalizationSettings,
        variations: variations,
        seoTitle: seoTitle,
        slug: slug || productName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        seoDescription: seoDescription,
        seoKeywords: seoKeywords,
        company: selectedAtelier,
        images: images.filter((img) => img && img.trim() !== ""),
        image: images[0] || "https://via.placeholder.com/300?text=Sem+Foto",
        insumos: addedInsumos || [],
      };

      await onSave(productData);

      if (keepOpen) {
        setShowToast("Produto salvo com sucesso!");
        setTimeout(() => setShowToast(null), 3000);
      } else {
        onClose();
      }
    } catch (err: any) {
      alert("Erro ao salvar produto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Image manipulation helpers
  const handleImageUploadComplete = (url: string, index: number) => {
    const newImages = [...images];
    while (newImages.length <= index) {
      newImages.push("");
    }
    newImages[index] = url;
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const makeImagePrimary = (index: number) => {
    if (index <= 0 || index >= images.length) return;
    const newImages = [...images];
    const temp = newImages[0];
    newImages[0] = newImages[index];
    newImages[index] = temp;
    setImages(newImages);
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  // Personalization settings builder
  const addPersonalizationField = (type: "text" | "image" | "select") => {
    const newField = {
      id: `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      label: type === "text" ? "Nome para Gravação" : type === "image" ? "Envio do Logotipo" : "Escolha a Cor",
      placeholder: type === "text" ? "Escreva o nome..." : "",
      isRequired: false,
      charLimit: type === "text" ? 25 : undefined,
      options: type === "select" ? ["Dourado", "Prata", "Rosé"] : undefined,
    };
    setPersonalizationSettings([...personalizationSettings, newField]);
  };

  const updatePersonalizationField = (id: string, updates: any) => {
    setPersonalizationSettings(
      personalizationSettings.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removePersonalizationField = (id: string) => {
    setPersonalizationSettings(personalizationSettings.filter((f) => f.id !== id));
  };

  // Variations helper functions
  const addVariation = () => {
    const newVar: Variation = {
      id: `var_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: "Opção (ex: Cor, Tamanho)",
      type: "single",
      options: []
    };
    setVariations([...variations, newVar]);
  };

  const updateVariationName = (id: string, name: string) => {
    setVariations(variations.map(v => v.id === id ? { ...v, name } : v));
  };

  const updateVariationType = (id: string, type: 'single' | 'multiple') => {
    setVariations(variations.map(v => v.id === id ? { ...v, type } : v));
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const addVariationOption = (varId: string) => {
    setVariations(variations.map(v => {
      if (v.id === varId) {
        return {
          ...v,
          options: [
            ...v.options,
            {
              name: "Nova Opção",
              price: 0,
              sku: "",
              stock: 0,
              weight: 0,
              image: ""
            }
          ]
        };
      }
      return v;
    }));
  };

  const updateVariationOption = (varId: string, optIdx: number, updates: any) => {
    setVariations(variations.map(v => {
      if (v.id === varId) {
        const newOptions = [...v.options];
        newOptions[optIdx] = { ...newOptions[optIdx], ...updates };
        return { ...v, options: newOptions };
       }
       return v;
    }));
  };

  const removeVariationOption = (varId: string, optIdx: number) => {
    setVariations(variations.map(v => {
      if (v.id === varId) {
        return {
          ...v,
          options: v.options.filter((_, i) => i !== optIdx)
        };
      }
      return v;
    }));
  };

  // Profit calculations
  const profit = retailPrice - costPrice;
  const profitMargin = retailPrice > 0 ? (profit / retailPrice) * 100 : 0;

  // Render sub-tabs navigation items
  const tabsConfig = [
    { id: "info" as const, label: "Informações Gerais", icon: Info },
    { id: "images" as const, label: "Imagens", icon: ImageIcon },
    { id: "pricing" as const, label: "Formação de Preço", icon: DollarSign },
    { id: "organization" as const, label: "Organização", icon: Layers },
    { id: "personalization" as const, label: "Personalização", icon: Sliders },
    { id: "seo" as const, label: "SEO", icon: Globe },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#161616]/30 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#FAFAF9] w-full max-w-6xl h-[92vh] flex flex-col rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-2xl relative text-slate-800 font-sans"
      >
        {/* Toast Alert Success Banner */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white px-8 py-3.5 rounded-2xl shadow-xl text-xs font-semibold tracking-wider uppercase flex items-center gap-2 border border-emerald-500/50"
            >
              <CheckCircle size={15} />
              <span>{showToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-[#E5E5EA] flex items-center justify-between bg-white shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-sans font-black text-[#1C1C1E] uppercase tracking-wider">
                {editingProduct?.id ? "Editar Produto Premium" : "Novo Cadastro de Produto"}
              </h2>
              {isExclusive && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-black uppercase tracking-wider rounded">
                  Exclusivo
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Preencha os dados e configure a vitrine com perfeição visual
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all border border-slate-100 shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step-by-Step Sub-Tabs Row */}
        <div className="flex bg-slate-50/80 px-4 py-3 gap-2 border-b border-[#E5E5EA] overflow-x-auto scrollbar-hide shrink-0">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-white text-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#E5E5EA]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                }`}
              >
                <Icon size={13} className={isActive ? "text-[#1C1C1E]" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Multi-Step Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white/50 scrollbar-hide">
          {/* TAB 1: INFORMAÇÕES GERAIS */}
          {activeSubTab === "info" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Informações de Identificação
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none focus:border-pink-300 focus:bg-white transition-all text-slate-800 shadow-inner"
                    placeholder="Ex: Agenda Costurada Couro Soft"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                    Descrição Detalhada do Produto
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-4 text-xs font-medium outline-none h-28 text-slate-800 resize-none focus:border-pink-300 focus:bg-white transition-all shadow-inner"
                    placeholder="Forneça detalhes encantadores sobre acabamento, papéis, texturas e carinho..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Categoria do Produto
                    </label>
                    {!showNewCatInput ? (
                      <div className="flex gap-2">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 text-xs font-medium outline-none text-slate-800 focus:bg-white transition-all"
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
                          className="px-4 bg-slate-50 hover:bg-slate-100 text-[#1C1C1E] border border-slate-200 rounded-xl transition-all shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          placeholder="Nova Categoria..."
                          value={newCat}
                          onChange={(e) => setNewCat(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-medium outline-none text-slate-800 shadow-inner focus:bg-white focus:border-pink-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewCatInput(false)}
                          className="px-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors border border-red-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subcategory Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Sub-Categoria (Opcional)
                    </label>
                    {!showNewSubcatInput ? (
                      <div className="flex gap-2">
                        <select
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 text-xs font-medium outline-none text-slate-800 focus:bg-white transition-all"
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
                          className="px-4 bg-slate-50 hover:bg-slate-100 text-[#1C1C1E] border border-slate-200 rounded-xl transition-all shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          placeholder="Nova Sub-Categoria..."
                          value={newSubcat}
                          onChange={(e) => setNewSubcat(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-medium outline-none text-slate-800 shadow-inner focus:bg-white focus:border-pink-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewSubcatInput(false)}
                          className="px-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors border border-red-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* SKU */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      SKU (Código Interno)
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none focus:border-pink-300 focus:bg-white transition-all text-slate-800"
                      placeholder="Ex: AG-2026-COURO"
                    />
                  </div>

                  {/* Coleção */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Coleção do Ateliê
                    </label>
                    <input
                      type="text"
                      value={collection}
                      onChange={(e) => setCollection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none focus:border-pink-300 focus:bg-white transition-all text-slate-800"
                      placeholder="Ex: Florir da Primavera"
                    />
                  </div>

                  {/* Marca */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Marca (Opcional)
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none focus:border-pink-300 focus:bg-white transition-all text-slate-800"
                      placeholder="Ex: Handmade Originals"
                    />
                  </div>
                </div>
              </div>

              {/* Status and visibility switches */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Configurações de Exibição & Status
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Active Toggle */}
                  <label className="flex flex-col justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        Produto Ativo
                      </span>
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all ${
                          activeInCatalog ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                            activeInCatalog ? "left-4.5" : "left-0.5"
                          }`}
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">
                      Define se o produto está ativo e visível na vitrine para venda direta.
                    </p>
                    <input
                      type="checkbox"
                      checked={activeInCatalog}
                      onChange={(e) => setActiveInCatalog(e.target.checked)}
                      className="hidden"
                    />
                  </label>

                  {/* Featured Toggle */}
                  <label className="flex flex-col justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 hover:border-pink-300 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        Em Destaque
                      </span>
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all ${
                          isFeatured ? "bg-pink-600" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                            isFeatured ? "left-4.5" : "left-0.5"
                          }`}
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">
                      Exibe em carrosséis principais e banners em evidência na home.
                    </p>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="hidden"
                    />
                  </label>

                  {/* Exclusive Toggle */}
                  <label className="flex flex-col justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        Produto Exclusivo
                      </span>
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all ${
                          isExclusive ? "bg-amber-500" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                            isExclusive ? "left-4.5" : "left-0.5"
                          }`}
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">
                      Aplica selo de exclusividade e destaca a singularidade artesanal.
                    </p>
                    <input
                      type="checkbox"
                      checked={isExclusive}
                      onChange={(e) => setIsExclusive(e.target.checked)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMAGENS */}
          {activeSubTab === "images" && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                    Galeria de Imagens do Produto
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-2">
                    Cadastre até 7 fotos. A primeira imagem sempre será exibida como a capa principal da vitrine.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const isCover = idx === 0;
                    const hasUrl = !!images[idx];
                    return (
                      <div
                        key={`img-form-item-${idx}`}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 relative flex flex-col justify-between group"
                      >
                        <ImageUpload
                          label={isCover ? "Capa Principal" : `Imagem ${idx + 1}`}
                          path={`produtos/${selectedAtelier}`}
                          currentUrl={images[idx] || ""}
                          onUploadComplete={(url) => handleImageUploadComplete(url, idx)}
                          onRemove={() => removeImage(idx)}
                          onUploadStarted={handleUploadStarted}
                          onUploadFinished={handleUploadFinished}
                        />

                        {hasUrl && (
                          <div className="mt-3 flex flex-col gap-1.5 pt-2 border-t border-slate-200/50">
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase">
                              <span>Slot {idx + 1}</span>
                              {isCover && <span className="text-pink-600 font-black">Capa</span>}
                            </div>
                            <div className="flex gap-1 justify-center">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => makeImagePrimary(idx)}
                                  className="flex-1 py-1 bg-white hover:bg-pink-50 text-pink-600 border border-[#E5E5EA] rounded text-[8px] font-black uppercase tracking-wider shadow-xs transition-all"
                                  title="Tornar Capa Principal"
                                >
                                  Capa
                                </button>
                              )}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveImage(idx, "left")}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-[#E5E5EA] rounded text-[8px] transition-all"
                                  title="Mover para Esquerda"
                                >
                                  ←
                                </button>
                              )}
                              {idx < images.length - 1 && images[idx + 1] && (
                                <button
                                  type="button"
                                  onClick={() => moveImage(idx, "right")}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-[#E5E5EA] rounded text-[8px] transition-all"
                                  title="Mover para Direita"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Capa de Coleção Opcional */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Imagem de Capa da Coleção (Opcional)
                </h3>
                <div className="max-w-md">
                  <ImageUpload
                    label="Upload da Imagem de Capa da Coleção"
                    path={`colecoes/${selectedAtelier}`}
                    currentUrl={collectionCoverImage}
                    onUploadComplete={(url) => setCollectionCoverImage(url)}
                    onRemove={() => setCollectionCoverImage("")}
                    onUploadStarted={handleUploadStarted}
                    onUploadFinished={handleUploadFinished}
                  />
                  <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                    Se este produto fizer parte de uma coleção especial, você pode cadastrar a imagem de capa da coleção inteira.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREÇOS */}
          {activeSubTab === "pricing" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              {/* Pricing Cards Grid */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Formação de Preço e Controle de Estoque
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Preço de Venda */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Preço de Venda (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        R$
                      </span>
                      <input
                        type="number"
                        value={retailPrice || ""}
                        onChange={(e) => setRetailPrice(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-pink-300 focus:bg-white transition-all shadow-inner"
                        placeholder="0,00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Preço de Custo */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Preço de Custo (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        R$
                      </span>
                      <input
                        type="number"
                        value={costPrice || ""}
                        onChange={(e) => setCostPrice(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-pink-300 focus:bg-white transition-all shadow-inner"
                        placeholder="0,00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Preço Promocional (De) */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Preço Original / Promoção (De)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        R$
                      </span>
                      <input
                        type="number"
                        value={originalPrice || ""}
                        onChange={(e) => setOriginalPrice(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-pink-300 focus:bg-white transition-all shadow-inner"
                        placeholder="Ex: R$ 89.90 (mostra desconto)"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Calculated Profit Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600/80">
                        Lucro Líquido Estimado
                      </span>
                      <h4 className="text-xl font-black text-emerald-700 mt-1">
                        {formatCurrency(profit > 0 ? profit : 0)}
                      </h4>
                    </div>
                    <div className="p-3 bg-white/80 rounded-xl shadow-xs border border-emerald-100 text-emerald-600">
                      <TrendingUp size={18} />
                    </div>
                  </div>

                  <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-sky-600/80">
                        Margem de Lucro Estimada
                      </span>
                      <h4 className="text-xl font-black text-sky-700 mt-1">
                        {profitMargin > 0 ? profitMargin.toFixed(1) : "0.0"}%
                      </h4>
                    </div>
                    <div className="p-3 bg-white/80 rounded-xl shadow-xs border border-sky-100 text-sky-600">
                      <PercentageBadge value={profitMargin} />
                    </div>
                  </div>
                </div>

                {/* Inventory Stock Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Quantidade em Estoque
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-pink-300"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Estoque Mínimo (Alerta de Estoque Baixo)
                    </label>
                    <input
                      type="number"
                      value={minStock}
                      onChange={(e) => setMinStock(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-pink-300"
                      placeholder="Ex: 5"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Tempo de Produção (Dias Úteis)
                    </label>
                    <input
                      type="number"
                      value={productionTime}
                      onChange={(e) => setProductionTime(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-pink-300"
                      placeholder="Ex: 5"
                    />
                  </div>
                </div>
              </div>

              {/* Insumos Association Panel (Preserved Feature) */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                    Associação de Insumos (Ficha Técnica)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-2">
                    Associe insumos cadastrados para calcular o custo de produção do produto automaticamente.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-1">
                    <select
                      value={selectedInsumoId}
                      onChange={(e) => setSelectedInsumoId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none"
                    >
                      <option value="">Selecionar Insumo...</option>
                      {insumos.map((ins) => (
                        <option key={ins.id} value={ins.id}>
                          {ins.name} (Estoque: {ins.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 space-y-1">
                    <input
                      type="number"
                      min="1"
                      value={insumoQty}
                      onChange={(e) => setInsumoQty(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedInsumoId) return;
                      const existing = addedInsumos.find((i) => i.insumoId === selectedInsumoId);
                      if (existing) {
                        setAddedInsumos(
                          addedInsumos.map((i) =>
                            i.insumoId === selectedInsumoId
                              ? { ...i, quantity: i.quantity + insumoQty }
                              : i
                          )
                        );
                      } else {
                        setAddedInsumos([...addedInsumos, { insumoId: selectedInsumoId, quantity: insumoQty }]);
                      }
                      setSelectedInsumoId("");
                      setInsumoQty(1);
                    }}
                    className="px-6 py-3 bg-white border border-[#E5E5EA] hover:bg-[#FAFAF9] text-xs font-black uppercase tracking-wider text-slate-700 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all"
                  >
                    Vincular
                  </button>
                </div>

                {addedInsumos.length > 0 ? (
                  <div className="border border-slate-200/60 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {addedInsumos.map((item, idx) => {
                      const matchedInsumo = insumos.find((ins) => ins.id === item.insumoId);
                      return (
                        <div key={`added-ins-${idx}`} className="flex justify-between items-center p-3.5 bg-slate-50/50">
                          <div className="text-xs font-medium text-slate-800">
                            {matchedInsumo?.name || "Insumo Desconhecido"}
                            <span className="text-[10px] text-slate-400 ml-2">
                              Código: {matchedInsumo?.code || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-600">
                              Qtd: {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAddedInsumos(addedInsumos.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center py-4 border border-dashed border-slate-200 rounded-xl">
                    Nenhum insumo vinculado a este produto.
                  </p>
                )}
              </div>

              {/* Product Variations Panel */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Variações do Produto (Personalização & Opções)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
                      Cadastre variações de cor, tamanho ou outras escolhas para o cliente selecionar antes de adicionar ao carrinho.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariation}
                    className="px-4 py-2.5 bg-white border border-[#E5E5EA] text-[#1C1C1E] text-[9px] font-black uppercase tracking-wider rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-slate-50 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus size={12} /> Adicionar Variação
                  </button>
                </div>

                {variations.length > 0 ? (
                  <div className="space-y-6">
                    {variations.map((v, idx) => (
                      <div
                        key={v.id}
                        className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/80 relative space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 bg-white border border-[#E5E5EA] text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest">
                            Variação #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVariation(v.id)}
                            className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 rounded-lg shadow-sm transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Nome da Variação */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                              Nome da Variação (ex: Cor, Tamanho, Voltagem)
                            </label>
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => updateVariationName(v.id, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none"
                              placeholder="ex: Escolha a Cor"
                            />
                          </div>

                          {/* Tipo de Seleção */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                              Tipo de Seleção
                            </label>
                            <select
                              value={v.type}
                              onChange={(e) => updateVariationType(v.id, e.target.value as 'single' | 'multiple')}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none"
                            >
                              <option value="single">Seleção Única (Dropdown/Rádio)</option>
                              <option value="multiple">Seleção Múltipla (Checkboxes)</option>
                            </select>
                          </div>
                        </div>

                        {/* Options List */}
                        <div className="space-y-3 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">
                              Opções Disponíveis
                            </span>
                            <button
                              type="button"
                              onClick={() => addVariationOption(v.id)}
                              className="px-3 py-1.5 bg-white border border-[#E5E5EA] text-[#1C1C1E] text-[8px] font-black uppercase tracking-wider rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-slate-50 transition-all flex items-center gap-1"
                            >
                              <Plus size={10} /> Adicionar Opção
                            </button>
                          </div>

                          {v.options.length > 0 ? (
                            <div className="space-y-3">
                              {v.options.map((opt, optIdx) => (
                                <div
                                  key={`opt-${v.id}-${optIdx}`}
                                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3"
                                >
                                  {/* Row 1: Name and Price */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                                        Nome da Opção (ex: Azul, 32GB, G)
                                      </label>
                                      <input
                                        type="text"
                                        value={opt.name}
                                        onChange={(e) => updateVariationOption(v.id, optIdx, { name: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                                        placeholder="ex: Dourado"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                                        Valor Adicional (R$)
                                      </label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">
                                          R$
                                        </span>
                                        <input
                                          type="number"
                                          value={opt.price}
                                          onChange={(e) => updateVariationOption(v.id, optIdx, { price: Number(e.target.value) || 0 })}
                                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-bold outline-none"
                                          placeholder="0.00"
                                          step="0.01"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Row 2: Future structures (SKU, Stock, Weight, Image) */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/30 p-3 rounded-lg border border-slate-100">
                                    <div className="space-y-1">
                                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                                        SKU (futuro)
                                      </label>
                                      <input
                                        type="text"
                                        value={opt.sku || ""}
                                        onChange={(e) => updateVariationOption(v.id, optIdx, { sku: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-800 outline-none"
                                        placeholder="ex: SKU-CO-DO"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                                        Estoque (futuro)
                                      </label>
                                      <input
                                        type="number"
                                        value={opt.stock ?? 0}
                                        onChange={(e) => updateVariationOption(v.id, optIdx, { stock: Number(e.target.value) || 0 })}
                                        className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-800 outline-none"
                                        placeholder="0"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                                        Peso (g) (futuro)
                                      </label>
                                      <input
                                        type="number"
                                        value={opt.weight ?? 0}
                                        onChange={(e) => updateVariationOption(v.id, optIdx, { weight: Number(e.target.value) || 0 })}
                                        className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-800 outline-none"
                                        placeholder="0"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                                        Img URL (futuro)
                                      </label>
                                      <input
                                        type="text"
                                        value={opt.image || ""}
                                        onChange={(e) => updateVariationOption(v.id, optIdx, { image: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-800 outline-none"
                                        placeholder="https://..."
                                      />
                                    </div>
                                  </div>

                                  {/* Delete Option Button */}
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removeVariationOption(v.id, optIdx)}
                                      className="text-[9px] uppercase font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-all"
                                    >
                                      <Trash2 size={10} /> Remover Opção
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest text-center py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                              Nenhuma opção cadastrada para esta variação. Clique em "Adicionar Opção".
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Nenhuma variação de produto cadastrada.
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Variações permitem ao cliente selecionar tamanhos, cores ou outras opções antes de comprar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ORGANIZAÇÃO */}
          {activeSubTab === "organization" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Categorização, Tags & Exibição
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ordem de Exibição */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Ordem de Exibição (Filtro de Relevância)
                    </label>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none text-slate-800"
                      placeholder="Ex: 0 (quanto menor, mais no topo)"
                    />
                  </div>

                  {/* Coleção */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Coleção (Sincronizado)
                    </label>
                    <input
                      type="text"
                      value={collection}
                      onChange={(e) => setCollection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none text-slate-800"
                      placeholder="Coleção principal para agrupamentos..."
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                    Tags de Busca (Separadas por vírgula)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Tag size={13} />
                    </span>
                    <input
                      type="text"
                      value={tagsString}
                      onChange={(e) => setTagsString(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-5 py-3.5 text-xs font-medium outline-none text-slate-800"
                      placeholder="Ex: artesanal, delicado, batizado, luxo"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                    Tags ajudam clientes a localizarem o produto via campo de busca.
                  </p>
                </div>
              </div>

              {/* Relacionados e Recomendados */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Produtos Relacionados & Vitrine Cruzada
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Produto Relacionado */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Produto de Up-Sell Principal
                    </label>
                    <select
                      value={relatedProductId}
                      onChange={(e) => setRelatedProductId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 text-xs font-medium text-slate-800"
                    >
                      <option value="">Nenhum...</option>
                      {existingProducts
                        .filter((p) => p.id !== editingProduct?.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name} (#{p.code})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Produtos Recomendados (Checkbox list scrollable) */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Recomendar Produtos Complementares
                    </label>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 h-36 overflow-y-auto space-y-2">
                      {existingProducts
                        .filter((p) => p.id !== editingProduct?.id)
                        .map((p) => {
                          const isChecked = recommendedProductIds.includes(p.id);
                          return (
                            <label
                              key={`rec-item-${p.id}`}
                              className="flex items-center gap-3.5 hover:bg-slate-100 p-1.5 rounded transition-colors cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRecommendedProductIds([...recommendedProductIds, p.id]);
                                  } else {
                                    setRecommendedProductIds(recommendedProductIds.filter((id) => id !== p.id));
                                  }
                                }}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span className="text-[11px] font-medium text-slate-700">
                                {p.product_name}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PERSONALIZAÇÃO */}
          {activeSubTab === "personalization" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Formulário de Personalização Ativa
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
                      Configure quais campos de personalização o cliente verá na página do produto.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addPersonalizationField("text")}
                      className="px-4 py-2.5 bg-white border border-[#E5E5EA] text-[#1C1C1E] text-[9px] font-black uppercase tracking-wider rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-slate-50 transition-all flex items-center gap-1.5"
                    >
                      <Plus size={12} /> Texto
                    </button>
                    <button
                      type="button"
                      onClick={() => addPersonalizationField("image")}
                      className="px-4 py-2.5 bg-white border border-[#E5E5EA] text-[#1C1C1E] text-[9px] font-black uppercase tracking-wider rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-slate-50 transition-all flex items-center gap-1.5"
                    >
                      <Plus size={12} /> Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => addPersonalizationField("select")}
                      className="px-4 py-2.5 bg-white border border-[#E5E5EA] text-[#1C1C1E] text-[9px] font-black uppercase tracking-wider rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-slate-50 transition-all flex items-center gap-1.5"
                    >
                      <Plus size={12} /> Dropdown
                    </button>
                  </div>
                </div>

                {personalizationSettings.length > 0 ? (
                  <div className="space-y-6">
                    {personalizationSettings.map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/80 relative space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 bg-white border border-[#E5E5EA] text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest">
                            Campo #{idx + 1} - {field.type === "text" ? "Campo de Texto" : field.type === "image" ? "Upload de Imagem" : "Dropdown de Seleção"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePersonalizationField(field.id)}
                            className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 rounded-lg shadow-sm transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Label */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                              Título do Campo (Label)
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updatePersonalizationField(field.id, { label: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none"
                            />
                          </div>

                          {/* Placeholder (only for text fields) */}
                          {field.type === "text" && (
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                Placeholder (Instrução)
                              </label>
                              <input
                                type="text"
                                value={field.placeholder || ""}
                                onChange={(e) => updatePersonalizationField(field.id, { placeholder: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none"
                              />
                            </div>
                          )}

                          {/* Options list (only for select fields) */}
                          {field.type === "select" && (
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                Opções (Separadas por vírgula)
                              </label>
                              <input
                                type="text"
                                value={(field.options || []).join(", ")}
                                onChange={(e) =>
                                  updatePersonalizationField(field.id, {
                                    options: e.target.value.split(",").map((v) => v.trim()),
                                  })
                                }
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none"
                                placeholder="Dourado, Prata, Bronze"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2 items-center">
                          {/* Required Toggle */}
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.isRequired}
                              onChange={(e) => updatePersonalizationField(field.id, { isRequired: e.target.checked })}
                              className="rounded text-pink-600 focus:ring-pink-400"
                            />
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              Preenchimento Obrigatório
                            </span>
                          </label>

                          {/* Character limit (only for text fields) */}
                          {field.type === "text" && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                Limite Máximo de Caracteres:
                              </span>
                              <input
                                type="number"
                                value={field.charLimit || ""}
                                onChange={(e) => updatePersonalizationField(field.id, { charLimit: Number(e.target.value) || undefined })}
                                className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 text-center"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Sliders size={32} className="mx-auto text-slate-300 mb-3" />
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                      Nenhum Campo Adicionado
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                      Adicione campos como Gravação de Nome, Envio de Foto ou Dropdowns para que seus clientes configurem o produto sob medida.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SEO */}
          {activeSubTab === "seo" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Configurações de Mecanismos de Busca (SEO)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title SEO */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Título da Página (SEO Title)
                    </label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none text-slate-800"
                      placeholder="Ex: Agenda Personalizada Handmade | Ateliê"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Slug da URL (Endereço Amigável)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none text-slate-800"
                      placeholder="Ex: agenda-personalizada-couro"
                    />
                  </div>
                </div>

                {/* Meta descrição */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                    Meta Descrição SEO
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-4 text-xs font-medium outline-none h-20 text-slate-800 resize-none"
                    placeholder="Escreva um breve resumo de até 160 caracteres focado em converter cliques..."
                    maxLength={160}
                  />
                  <div className="text-right text-[8px] text-slate-400 uppercase font-semibold">
                    {seoDescription.length} / 160 caracteres
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                    Palavras-chave SEO (Separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 text-xs font-medium outline-none text-slate-800"
                    placeholder="agenda costurada, papelaria luxo, presente personalizado"
                  />
                </div>
              </div>

              {/* Google Snippet Search Preview */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5E5EA] shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Visualização Prévia no Google (Desktop Google Preview)
                </h3>

                <div className="bg-[#FFFFFF] border border-slate-100 rounded-xl p-5 shadow-sm max-w-2xl font-sans">
                  {/* Google site info line */}
                  <div className="flex items-center gap-1 text-[11px] text-[#202124] mb-1">
                    <span className="font-semibold text-slate-500">https://vitrine.com.br</span>
                    <span className="text-slate-400">› produto › {slug || "nome-do-produto"}</span>
                  </div>
                  {/* Title card */}
                  <h4 className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-sans leading-tight font-medium mb-1">
                    {seoTitle || productName || "Título do Produto - Vitrine Personalizada"}
                  </h4>
                  {/* Meta description */}
                  <p className="text-[11px] text-[#4d5156] leading-relaxed line-clamp-2">
                    {seoDescription || description || "Por favor, preencha as configurações de Meta Descrição acima para ver uma demonstração exata de como seu link artesanal performará nos buscadores orgânicos do Google."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-6 md:p-8 border-t border-[#E5E5EA] bg-white flex flex-col sm:flex-row sm:justify-between items-center gap-4 shrink-0 shadow-inner">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FAFAF9] border border-[#E5E5EA] text-[10px] uppercase font-black tracking-wider text-slate-500 hover:text-slate-700 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            Cancelar
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={loading || uploadsInProgress > 0}
              onClick={() => handleSave(true)}
              className="px-8 py-3.5 rounded-xl bg-white border border-[#E5E5EA] text-[#1C1C1E] text-[10px] uppercase font-black tracking-wider shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-[#FAFAF9] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar e Continuar"}
            </button>

            <button
              type="button"
              disabled={loading || uploadsInProgress > 0}
              onClick={() => handleSave(false)}
              className="px-10 py-3.5 rounded-xl bg-pink-700 border border-pink-800 text-white text-[10px] uppercase font-black tracking-wider shadow-[0_2px_8px_rgba(190,24,74,0.15),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-pink-800 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : editingProduct?.id ? "Salvar e Sair" : "Criar Produto"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Helper internal subcomponents
const PercentageBadge = ({ value }: { value: number }) => {
  return (
    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
      value > 50 ? "bg-emerald-100 text-emerald-800" : value > 25 ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
    }`}>
      {value > 50 ? "Excelente" : value > 25 ? "Boa" : "Baixa"}
    </div>
  );
};
