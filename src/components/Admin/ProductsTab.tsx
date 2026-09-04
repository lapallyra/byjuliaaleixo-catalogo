import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Box,
  TrendingUp,
  Filter,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Archive,
  Tag,
  Copy,
  Layout,
  Calendar,
  DollarSign,
  AlertTriangle,
  ArrowUpDown,
  MoreVertical,
  Activity,
  Eye,
  Settings,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NewProductForm } from "./NewProductForm";
import { ProductDetailsView } from "./ProductDetailsView";
import { Product, CompanyId, Insumo, Order, AuditLog } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { calculateProductCost } from "../../lib/finance";
import { ImageWithFallback } from "../ImageWithFallback";
import { useAdminOrchestrator } from "../AdminOrchestratorSystem";
import { matchesAtelierScope } from "../../services/atelierScopePolicy";

interface ProductsTabProps {
  products: Product[];
  insumos: Insumo[];
  orders: Order[];
  auditLogs: AuditLog[];
  companyId: CompanyId;
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export const ProductsTab: React.FC<ProductsTabProps> = React.memo(({
  products,
  insumos,
  orders,
  auditLogs,
  companyId,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all"); // all, fabricado, revenda, kit
  const [filterStatus, setFilterStatus] = useState<string>("all"); // all, active, inactive
  const [sortBy, setSortBy] = useState<string>("name"); // name, date, price, margin, best_sellers, last_update
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const activeProduct = useMemo(() => products.find(p => p.id === selectedProduct?.id) || selectedProduct, [products, selectedProduct]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { filteredProducts, paginatedProducts, totalPages } = useMemo(() => {
    let result = products.filter(p => {
      // Atelier scope filter
      if (!matchesAtelierScope(p, companyId, 'produtos')) {
        return false;
      }

      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || 
        (p.product_name || "").toLowerCase().includes(s) ||
        (p.code || "").toLowerCase().includes(s) ||
        (p.category || "").toLowerCase().includes(s);
      
      const matchesType = filterType === "all" || p.type === filterType;
      const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? p.isVisible !== false : p.isVisible === false);
      
      return matchesSearch && matchesType && matchesStatus;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name": return (a.product_name || "").localeCompare(b.product_name || "");
        case "date": {
          const tA = (a as any).createdAt?.toMillis?.() || new Date((a as any).createdAt).getTime() || 0;
          const tB = (b as any).createdAt?.toMillis?.() || new Date((b as any).createdAt).getTime() || 0;
          return tB - tA;
        }
        case "price": return (b.retail_price || 0) - (a.retail_price || 0);
        case "margin": {
          const costA = calculateProductCost(a, insumos);
          const marginA = a.retail_price ? ((a.retail_price - costA) / a.retail_price) : 0;
          const costB = calculateProductCost(b, insumos);
          const marginB = b.retail_price ? ((b.retail_price - costB) / b.retail_price) : 0;
          return marginB - marginA;
        }
        case "best_sellers": return ((b as any).soldCount || 0) - ((a as any).soldCount || 0);
        case "last_update": {
          const tA = (a as any).updatedAt?.toMillis?.() || new Date((a as any).updatedAt).getTime() || 0;
          const tB = (b as any).updatedAt?.toMillis?.() || new Date((b as any).updatedAt).getTime() || 0;
          return tB - tA;
        }
        default: return 0;
      }
    });

    const totalPages = Math.ceil(result.length / rowsPerPage);
    const paginatedProducts = result.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return { filteredProducts: result, paginatedProducts, totalPages };
  }, [products, searchTerm, filterType, filterStatus, sortBy, insumos, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus, sortBy]);

  const handleOpenDetails = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleDuplicate = async (product: Product) => {
    const { id, ...data } = product;
    await onSaveProduct({
      ...data,
      company: companyId,
      companyId: companyId,
      product_name: `${product.product_name} (Cópia)`,
      code: `${product.code}-COPY`,
      createdAt: new Date(),
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-[#E5E5EA] shadow-3d-soft elevated-3d">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1C1C1E] rounded-2xl flex items-center justify-center text-white shadow-3d-deep elevated-3d">
            <Package size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1C1C1E] tracking-tighter uppercase italic">Módulo de Produtos</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest bg-[#F5F5F7] px-2 py-0.5 rounded-md">ERP Gestão Premium</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{filteredProducts.length} Itens Ativos</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] w-4 h-4 group-focus-within:text-[#1C1C1E] transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome, código ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-[#F5F5F7] border border-transparent rounded-2xl text-[11px] font-bold outline-none focus:bg-white focus:border-[#1C1C1E]/20 transition-all text-[#1C1C1E] shadow-inner"
            />
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1C1C1E] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-3d-deep hover:shadow-3d-soft elevated-3d active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> Novo Cadastro
          </button>
        </div>
      </div>

      {/* FILTER & SORT BAR */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 px-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Todos', icon: <Layers size={14} /> },
            { id: 'fabricado', label: 'Fabricados', icon: <Settings size={14} /> },
            { id: 'revenda', label: 'Revenda', icon: <Package size={14} /> },
            { id: 'kit', label: 'Kits', icon: <Box size={14} /> },
            { id: 'active', label: 'Ativos', icon: <CheckCircle2 size={14} /> },
            { id: 'inactive', label: 'Inativos', icon: <XCircle size={14} /> }
          ].map((f) => {
            const isActive = f.id === filterType || (f.id === 'active' && filterStatus === 'active') || (f.id === 'inactive' && filterStatus === 'inactive');
            return (
              <button
                key={f.id}
                onClick={() => {
                  if (f.id === 'active' || f.id === 'inactive') {
                    setFilterStatus(f.id);
                    setFilterType('all');
                  } else {
                    setFilterType(f.id);
                    setFilterStatus('all');
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-[#1C1C1E] text-white shadow-3d-soft elevated-3d' 
                    : 'bg-white text-[#8E8E93] border border-[#E5E5EA] hover:border-[#1C1C1E]/20'
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-[#E5E5EA] rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-[#1C1C1E] text-white shadow-3d-soft" : "text-[#8E8E93] hover:bg-[#F5F5F7]"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-[#1C1C1E] text-white shadow-3d-soft" : "text-[#8E8E93] hover:bg-[#F5F5F7]"}`}
            >
              <ListIcon size={16} />
            </button>
          </div>

          <div className="relative group">
            <div className="flex items-center gap-2 bg-white border border-[#E5E5EA] px-4 py-2.5 rounded-2xl shadow-sm cursor-pointer hover:border-[#1C1C1E]/20 transition-all">
              <ArrowUpDown size={14} className="text-[#8E8E93]" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none pr-6"
              >
                <option value="name">Ordenar por Nome</option>
                <option value="date">Data de Cadastro</option>
                <option value="price">Preço</option>
                <option value="margin">Margem de Lucro</option>
                <option value="best_sellers">Mais Vendidos</option>
                <option value="last_update">Última Atualização</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 text-[#8E8E93]" />
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS DISPLAY */}
      {filteredProducts.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 px-4">
            <AnimatePresence mode="popLayout">
              {paginatedProducts.map((product) => {
                const cost = calculateProductCost(product, insumos);
                const marginVal = product.retail_price ? ((product.retail_price - cost) / product.retail_price) * 100 : 0;
                
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleOpenDetails(product)}
                    className="group bg-white rounded-[2.5rem] border border-[#E5E5EA] overflow-hidden hover:shadow-3d-deep transition-all duration-500 cursor-pointer elevated-3d flex flex-col h-full relative"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm elevated-3d ${product.isVisible !== false ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {product.isVisible !== false ? 'Ativo' : 'Inativo'}
                       </span>
                       <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#E5E5EA] text-[8px] font-black text-[#1C1C1E] uppercase tracking-[0.2em] shadow-sm elevated-3d">
                        {product.type || 'fabricado'}
                       </span>
                    </div>

                    {/* Image Section */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-[#F5F5F7]">
                       <ImageWithFallback 
                         src={product.main_image} 
                         alt={product.product_name}
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Info Section */}
                    <div className="p-8 flex flex-col flex-1 space-y-6">
                       <div>
                         <div className="flex items-center justify-between gap-2 mb-1">
                           <span className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">{product.category}</span>
                           <span className="text-[9px] font-mono font-bold text-[#AEAEB2] uppercase">#{product.code}</span>
                         </div>
                         <h3 className="text-sm font-black text-[#1C1C1E] uppercase leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{product.product_name}</h3>
                       </div>

                       <div className="grid grid-cols-2 gap-4 border-t border-[#F5F5F7] pt-6">
                         <div className="space-y-1">
                           <p className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-widest">Preço Venda</p>
                           <p className="text-base font-black text-[#1C1C1E] tracking-tighter">{formatCurrency(product.retail_price)}</p>
                         </div>
                         <div className="space-y-1 text-right">
                           <p className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-widest">Margem</p>
                           <p className={`text-sm font-black ${marginVal > 40 ? 'text-emerald-500' : 'text-amber-500'}`}>
                             {Math.round(marginVal)}%
                           </p>
                         </div>
                       </div>

                       <div className="flex items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93] group-hover:bg-[#1C1C1E] group-hover:text-white transition-all shadow-inner">
                               <TrendingUp size={14} />
                             </div>
                             <span className="text-[10px] font-black text-[#1C1C1E] uppercase tracking-widest">{(product as any).soldCount || 0} Vendas</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Eye size={14} className="text-[#8E8E93]" />
                             <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Ver Detalhes</span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {/* Pagination Controls */}
            <div className="col-span-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5E5EA]">
              <div className="text-xs text-[#8E8E93]">
                Exibindo {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, filteredProducts.length)} de {filteredProducts.length}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-xs border rounded-lg"
                >
                  {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v} por página</option>)}
                </select>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50">Anterior</button>
                <span className="text-xs font-bold">{currentPage} de {Math.max(1, totalPages)}</span>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50">Próximo</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 overflow-hidden">
            <div className="bg-white rounded-[2.5rem] border border-[#E5E5EA] overflow-hidden elevated-3d shadow-3d-soft">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                    <th className="px-8 py-5 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Produto</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Tipo/Categoria</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Comercial</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Métricas</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em] text-center">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F7]">
                  {paginatedProducts.map((product) => {
                    const cost = calculateProductCost(product, insumos);
                    const marginVal = product.retail_price ? ((product.retail_price - cost) / product.retail_price) * 100 : 0;
                    
                    return (
                      <tr 
                        key={product.id} 
                        onClick={() => handleOpenDetails(product)}
                        className="hover:bg-[#FAFAFA] transition-all cursor-pointer group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] overflow-hidden border border-[#E5E5EA] shadow-inner group-hover:scale-105 transition-transform">
                              <ImageWithFallback src={product.main_image} alt={product.product_name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-[10px] font-mono text-[#AEAEB2] uppercase tracking-widest mb-0.5">#{product.code}</p>
                              <p className="text-xs font-black text-[#1C1C1E] uppercase">{product.product_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-[#1C1C1E] uppercase tracking-widest">{product.type || 'Fabricado'}</p>
                            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">{product.category}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-[#1C1C1E] tracking-tighter">{formatCurrency(product.retail_price)}</p>
                            <p className="text-[9px] font-bold text-[#AEAEB2] uppercase">Custo: {formatCurrency(cost)}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${marginVal > 40 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {Math.round(marginVal)}% Margem
                            </div>
                            <div className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">
                               {(product as any).soldCount || 0} Vendas
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${product.isVisible !== false ? 'bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500 text-white shadow-[0_2px_10px_rgba(244,63,94,0.3)]'}`}>
                            {product.isVisible !== false ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDuplicate(product); }}
                                className="p-2.5 bg-white border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E]/20 transition-all shadow-sm"
                              >
                                <Copy size={14} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setIsFormOpen(true); }}
                                className="p-2.5 bg-white border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E]/20 transition-all shadow-sm"
                              >
                                <Edit size={14} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between p-4 bg-white border-t border-[#E5E5EA]">
                <div className="text-xs text-[#8E8E93]">
                  Exibindo {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, filteredProducts.length)} de {filteredProducts.length}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 text-xs border rounded-lg"
                  >
                    {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v} por página</option>)}
                  </select>
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50">Anterior</button>
                  <span className="text-xs font-bold">{currentPage} de {Math.max(1, totalPages)}</span>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50">Próximo</button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="py-24 text-center">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-[#E5E5EA] flex items-center justify-center mx-auto mb-8 elevated-3d shadow-3d-soft">
             <AlertTriangle size={40} className="text-[#AEAEB2]" />
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] uppercase tracking-tighter italic">Nenhum produto encontrado</h3>
          <p className="text-[#8E8E93] text-sm mt-3 font-medium max-w-sm mx-auto">Tente ajustar seus filtros ou busca para localizar o item desejado.</p>
          <button 
            onClick={() => { setSearchTerm(""); setFilterType("all"); setFilterStatus("all"); }}
            className="mt-8 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}

      {/* MODALS */}
      {isFormOpen && (
        <NewProductForm
          companyId={companyId}
          components={insumos}
          onSave={onSaveProduct}
          onClose={() => setIsFormOpen(false)}
          existingProducts={products}
          editingProduct={editingProduct || undefined}
        />
      )}

      {activeProduct && (
        <ProductDetailsView
          product={activeProduct}
          insumos={insumos}
          onClose={() => setSelectedProduct(null)}
          onEdit={(p) => {
            setEditingProduct(p);
            setIsFormOpen(true);
            setSelectedProduct(null);
          }}
          onDuplicate={handleDuplicate}
          onStatusToggle={async (id, status) => {
            await onSaveProduct({ id, isVisible: status });
            setSelectedProduct(prev => prev ? { ...prev, isVisible: status } : null);
          }}
          orders={orders}
          auditLogs={auditLogs.filter(log => log.resourceId === activeProduct.id)}
        />
      )}

      {/* Delete Confirmation Modal (Optional but good practice) */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center elevated-3d shadow-3d-deep"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-base font-black text-[#1C1C1E] uppercase tracking-tight mb-2">Confirmar Exclusão</h3>
              <p className="text-xs text-[#8E8E93] font-medium leading-relaxed mb-8">
                Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-4 bg-[#F5F5F7] text-[#8E8E93] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E5E5EA] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    await onDeleteProduct(productToDelete);
                    setProductToDelete(null);
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
