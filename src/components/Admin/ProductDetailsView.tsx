import React, { useState, useEffect } from "react";
import { 
  X, 
  Box, 
  Tag, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  History, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Clock,
  Edit,
  Copy,
  Archive,
  ArrowUpRight,
  Calculator,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Insumo, AuditLog, Order } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { safeFormatISO } from "../../lib/dateUtils";
import { calculateProductCost } from "../../lib/finance";

interface ProductDetailsViewProps {
  product: Product;
  insumos: Insumo[];
  orders: Order[];
  auditLogs: AuditLog[];
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onStatusToggle: (id: string, status: boolean) => Promise<void>;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  insumos,
  orders,
  auditLogs,
  onClose,
  onEdit,
  onDuplicate,
  onStatusToggle
}) => {
  const [activeTab, setActiveTab] = useState<"geral" | "producao" | "historico" | "vendas">("geral");

  const productLogs = auditLogs.filter(log => log.resourceId === product.id).sort((a, b) => {
    const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
    const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
    return tB - tA;
  });

  const productOrders = orders.filter(order => 
    order.items.some(item => (item.id === product.id) || (item.productId === product.id))
  ).sort((a, b) => {
    const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
    const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
    return tB - tA;
  });

  const cost = calculateProductCost(product, insumos);
  const profit = (product.retail_price || 0) - cost;
  const margin = product.retail_price > 0 ? (profit / product.retail_price) * 100 : 0;

  const totalSold = productOrders.reduce((acc, order) => {
    const item = order.items.find(i => (i.id === product.id) || (i.productId === product.id));
    return acc + (item?.quantity || 0);
  }, 0);

  const totalRevenue = productOrders.reduce((acc, order) => {
    const item = order.items.find(i => (i.id === product.id) || (i.productId === product.id));
    return acc + ((item?.retail_price || 0) * (item?.quantity || 0));
  }, 0);

  const totalProfit = totalRevenue - (cost * totalSold);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-4xl h-full bg-[#F5F5F7] shadow-3d-deep flex flex-col relative overflow-hidden"
      >
        {/* Header Actions */}
        <div className="absolute top-6 left-6 flex items-center gap-2 z-50">
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-[#E5E5EA] shadow-3d-soft flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] transition-all elevated-3d">
             <X size={20} />
           </button>
        </div>

        <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
          <button 
            onClick={() => onEdit(product)}
            className="flex items-center gap-2 bg-white border border-[#E5E5EA] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1C1C1E] shadow-3d-soft elevated-3d hover:bg-[#F5F5F7] transition-all"
          >
            <Edit size={14} strokeWidth={2.5} /> Editar
          </button>
          <button 
            onClick={() => onDuplicate(product)}
            className="flex items-center gap-2 bg-white border border-[#E5E5EA] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1C1C1E] shadow-3d-soft elevated-3d hover:bg-[#F5F5F7] transition-all"
          >
            <Copy size={14} strokeWidth={2.5} /> Duplicar
          </button>
          <button 
            onClick={() => onStatusToggle(product.id, !(product.isVisible !== false))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-3d-soft elevated-3d transition-all ${
              product.isVisible !== false 
                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}
          >
            <Archive size={14} strokeWidth={2.5} /> {product.isVisible !== false ? 'Desativar' : 'Ativar'}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Top Banner / Hero */}
          <div className="h-64 bg-[#1C1C1E] relative overflow-hidden flex items-end p-10">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] -ml-32 -mb-32" />
            </div>

            <div className="flex items-center gap-8 relative z-10 w-full">
              <div className="w-40 h-40 rounded-[2.5rem] bg-white border-4 border-white shadow-3d-deep overflow-hidden shrink-0 elevated-3d">
                {product.image ? (
                  <img src={product.image} alt={product.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#F5F5F7] flex items-center justify-center text-[#AEAEB2]">
                    <Box size={48} strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/10">
                    {product.category || "Sem Categoria"}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white/40">#{product.code}</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-1">
                  {product.product_name}
                </h1>
                <p className="text-sm font-bold text-white/50 uppercase tracking-widest">{product.subcategory || "Linha Padrão"}</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-[#E5E5EA] px-10 sticky top-0 z-40">
            <div className="flex gap-10">
              {[
                { id: "geral", label: "Visão Geral", icon: <Layers size={14} /> },
                { id: "producao", label: "Produção & Custos", icon: <Calculator size={14} /> },
                { id: "vendas", label: "Vendas & Performance", icon: <TrendingUp size={14} /> },
                { id: "historico", label: "Rastreabilidade", icon: <History size={14} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${
                    activeTab === tab.id ? 'text-[#1C1C1E]' : 'text-[#AEAEB2] hover:text-[#1C1C1E]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabProduct"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-[#1C1C1E] rounded-t-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Panels */}
          <div className="p-10">
            <AnimatePresence mode="wait">
              {activeTab === "geral" && (
                <motion.div 
                  key="geral"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  {/* KPI Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-[#E5E5EA] p-6 rounded-[2rem] shadow-3d-soft elevated-3d flex flex-col justify-between h-40">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#1C1C1E] shadow-inner">
                          <DollarSign size={20} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">Margem: {Math.round(margin)}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest block mb-1">Preço de Venda</span>
                        <span className="text-2xl font-black text-[#1C1C1E] tracking-tighter">{formatCurrency(product.retail_price || 0)}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E5E5EA] p-6 rounded-[2rem] shadow-3d-soft elevated-3d flex flex-col justify-between h-40">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#1C1C1E] shadow-inner">
                          <Calculator size={20} />
                        </div>
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg">Fator: {(product.retail_price / (cost || 1)).toFixed(1)}x</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest block mb-1">Custo Produção</span>
                        <span className="text-2xl font-black text-[#1C1C1E] tracking-tighter">{formatCurrency(cost)}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E5E5EA] p-6 rounded-[2rem] shadow-3d-soft elevated-3d flex flex-col justify-between h-40">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#1C1C1E] shadow-inner">
                          <Package size={20} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${product.stock && product.stock <= 5 ? 'bg-rose-50 text-rose-500' : 'bg-[#F5F5F7] text-[#1C1C1E]'}`}>
                          Mín: {product.minStock || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest block mb-1">Estoque Atual</span>
                        <span className="text-2xl font-black text-[#1C1C1E] tracking-tighter">{product.stock || 0} un</span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E5E5EA] p-6 rounded-[2rem] shadow-3d-soft elevated-3d flex flex-col justify-between h-40">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#1C1C1E] shadow-inner">
                          <Clock size={20} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest block mb-1">Tempo de Produção</span>
                        <span className="text-2xl font-black text-[#1C1C1E] tracking-tighter">{product.productionTime || 5} dias</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Informações de Mercado</h3>
                      <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-6 shadow-3d-soft elevated-3d">
                        <div className="flex justify-between items-center py-2 border-b border-[#F5F5F7]">
                          <span className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">Marca</span>
                          <span className="text-xs font-bold text-[#1C1C1E]">{product.brand || "Própria"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-[#F5F5F7]">
                          <span className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">Exclusivo</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${product.isExclusive ? 'bg-purple-50 text-purple-600' : 'bg-[#F5F5F7] text-[#8E8E93]'}`}>{product.isExclusive ? 'Sim' : 'Não'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-[#F5F5F7]">
                          <span className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">Destaque</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${product.isFeatured ? 'bg-amber-50 text-amber-600' : 'bg-[#F5F5F7] text-[#8E8E93]'}`}>{product.isFeatured ? 'Sim' : 'Não'}</span>
                        </div>
                        <div className="flex flex-col gap-2 py-2">
                          <span className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">Tags de Busca</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {product.tags && product.tags.length > 0 ? (
                              product.tags.map(tag => (
                                <span key={tag} className="px-3 py-1.5 bg-[#F5F5F7] border border-[#E5E5EA] text-[9px] font-black text-[#1C1C1E] uppercase tracking-widest rounded-xl shadow-xs">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#AEAEB2] font-medium italic">Nenhuma tag cadastrada</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Posicionamento Web</h3>
                      <div className="bg-[#1C1C1E] text-white rounded-[2.5rem] p-8 space-y-6 shadow-3d-deep elevated-3d relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        
                        <div className="space-y-2">
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">SEO Title</span>
                          <p className="text-xs font-bold text-white/90 truncate">{product.seoTitle || product.product_name}</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">URL Slug</span>
                          <p className="text-xs font-mono text-indigo-300">/produtos/{product.slug || "---"}</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">SEO Keywords</span>
                          <p className="text-[10px] font-medium text-white/50 leading-relaxed">{product.seoKeywords || "Não informado"}</p>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                           <div className="flex items-center gap-2 text-emerald-400">
                             <ShieldCheck size={14} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Indexação Otimizada</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Descrição Estratégica</h3>
                    <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 shadow-3d-soft elevated-3d">
                       <p className="text-sm text-[#1C1C1E] leading-relaxed font-medium whitespace-pre-wrap opacity-80">
                         {product.description || "Nenhuma descrição detalhada informada para este item."}
                       </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "producao" && (
                <motion.div 
                  key="producao"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Ficha Técnica Integrada</h3>
                      <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] overflow-hidden shadow-3d-soft elevated-3d">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                              <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Insumo / Componente</th>
                              <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest text-center">Quantidade</th>
                              <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest text-right">Custo Unit.</th>
                              <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F5F5F7]">
                            {product.insumos && product.insumos.length > 0 ? (
                              product.insumos.map((item, idx) => {
                                const insumo = insumos.find(i => i.id === item.insumoId);
                                const itemSubtotal = (insumo?.unitCost || 0) * item.quantity;
                                return (
                                  <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                                    <td className="px-8 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-black text-[#1C1C1E] uppercase tracking-tighter">{insumo?.name || "Insumo não encontrado"}</span>
                                        <span className="text-[9px] font-bold text-[#AEAEB2] uppercase tracking-widest">{insumo?.category}</span>
                                      </div>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                      <span className="text-[10px] font-black text-[#1C1C1E] bg-[#F5F5F7] px-3 py-1 rounded-lg border border-[#E5E5EA]">
                                        {item.quantity} {insumo?.unit}
                                      </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                      <span className="text-[11px] font-bold text-[#8E8E93] font-mono">{formatCurrency(insumo?.unitCost || 0)}</span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                      <span className="text-[11px] font-black text-[#1C1C1E] font-mono">{formatCurrency(itemSubtotal)}</span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-8 py-12 text-center text-[#AEAEB2]">
                                  <div className="flex flex-col items-center gap-3">
                                    <AlertTriangle size={32} strokeWidth={1} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma composição definida</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-[#1C1C1E] text-white">
                            <tr>
                              <td colSpan={3} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/50">Custo Total de Materiais</td>
                              <td className="px-8 py-5 text-right text-lg font-black tracking-tighter">{formatCurrency(cost)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Calculadora de Lucratividade</h3>
                      <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-8 shadow-3d-soft elevated-3d">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#8E8E93]">
                            <span>Preço de Venda</span>
                            <span className="text-[#1C1C1E]">{formatCurrency(product.retail_price || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-rose-500">
                            <span>Custo Produção (-)</span>
                            <span>{formatCurrency(cost)}</span>
                          </div>
                          <div className="pt-4 border-t border-[#F5F5F7] flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Lucro Bruto Un.</span>
                            <span className="text-xl font-black text-emerald-600 tracking-tighter">{formatCurrency(profit)}</span>
                          </div>
                        </div>

                        <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-2">
                           <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Markup Atual</span>
                             <span className="text-xs font-black text-emerald-700">{(product.retail_price / (cost || 1)).toFixed(2)}x</span>
                           </div>
                           <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2">
                             <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(margin, 100)}%` }} />
                           </div>
                           <p className="text-[8px] font-bold text-emerald-600/70 uppercase tracking-widest mt-2 text-center">Sua margem está saudável para este item.</p>
                        </div>

                        <div className="space-y-4 pt-4">
                          <h4 className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-[0.2em] border-b border-[#F5F5F7] pb-2">Preços Sugeridos</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA]">
                              <span className="text-[8px] font-black text-[#8E8E93] uppercase tracking-widest block">Margem 40%</span>
                              <span className="text-xs font-black text-[#1C1C1E]">{formatCurrency(cost / 0.6)}</span>
                            </div>
                            <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA]">
                              <span className="text-[8px] font-black text-[#8E8E93] uppercase tracking-widest block">Margem 50%</span>
                              <span className="text-xs font-black text-[#1C1C1E]">{formatCurrency(cost / 0.5)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "vendas" && (
                <motion.div 
                  key="vendas"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1C1C1E] text-white p-8 rounded-[2.5rem] shadow-3d-deep elevated-3d">
                       <ShoppingCart className="text-indigo-400 mb-4" size={24} />
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Volume de Vendas</span>
                       <div className="text-3xl font-black tracking-tighter mb-2">{totalSold} <span className="text-xs text-white/30">unidades</span></div>
                       <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Histórico total registrado</p>
                    </div>

                    <div className="bg-white border border-[#E5E5EA] p-8 rounded-[2.5rem] shadow-3d-soft elevated-3d">
                       <TrendingUp className="text-emerald-500 mb-4" size={24} />
                       <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest block mb-1">Receita Gerada</span>
                       <div className="text-3xl font-black text-[#1C1C1E] tracking-tighter mb-2">{formatCurrency(totalRevenue)}</div>
                       <p className="text-[10px] font-bold text-[#AEAEB2] uppercase tracking-wider">Vendas brutas totais</p>
                    </div>

                    <div className="bg-white border border-[#E5E5EA] p-8 rounded-[2.5rem] shadow-3d-soft elevated-3d">
                       <Calculator className="text-indigo-500 mb-4" size={24} />
                       <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest block mb-1">Lucro Acumulado</span>
                       <div className="text-3xl font-black text-[#1C1C1E] tracking-tighter mb-2">{formatCurrency(totalProfit)}</div>
                       <p className="text-[10px] font-bold text-[#AEAEB2] uppercase tracking-wider">Descontando custos diretos</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Últimos Pedidos com este Produto</h3>
                    <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] overflow-hidden shadow-3d-soft elevated-3d">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                            <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Pedido</th>
                            <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Cliente</th>
                            <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest text-center">Data</th>
                            <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest text-center">Qtd</th>
                            <th className="px-8 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F5F7]">
                          {productOrders.length > 0 ? (
                            productOrders.slice(0, 10).map((order) => {
                              const item = order.items.find(i => (i.id === product.id) || (i.productId === product.id));
                              return (
                                <tr key={order.id} className="hover:bg-[#FAFAFA] transition-colors group">
                                  <td className="px-8 py-4">
                                    <span className="text-xs font-black text-[#1C1C1E] font-mono">#{order.code}</span>
                                  </td>
                                  <td className="px-8 py-4">
                                    <span className="text-xs font-bold text-[#1C1C1E] uppercase">{order.customerName}</span>
                                  </td>
                                  <td className="px-8 py-4 text-center">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
                                      {safeFormatISO(order.createdAt, "dd/MM/yyyy")}
                                    </span>
                                  </td>
                                  <td className="px-8 py-4 text-center">
                                    <span className="text-xs font-black text-[#1C1C1E] bg-[#F5F5F7] px-2.5 py-1 rounded-lg border border-[#E5E5EA]">
                                      {item?.quantity} un
                                    </span>
                                  </td>
                                  <td className="px-8 py-4 text-right">
                                    <button className="p-2 text-[#AEAEB2] hover:text-[#1C1C1E] hover:bg-white rounded-xl shadow-xs border border-transparent hover:border-[#E5E5EA] transition-all">
                                      <ChevronRight size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-8 py-20 text-center text-[#AEAEB2]">
                                <div className="flex flex-col items-center gap-4">
                                  <div className="w-16 h-16 rounded-[1.5rem] bg-[#F5F5F7] flex items-center justify-center shadow-inner">
                                    <ShoppingCart size={32} strokeWidth={1} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma venda registrada ainda</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "historico" && (
                <motion.div 
                  key="historico"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                   <div className="relative pl-8">
                     <div className="absolute left-0 top-2 bottom-2 w-px bg-[#E5E5EA]" />
                     
                     <div className="space-y-12">
                       {productLogs.length > 0 ? (
                         productLogs.map((log, idx) => {
                           const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                           return (
                             <div key={idx} className="relative group">
                               <div className="absolute -left-10 top-0 w-4 h-4 rounded-full bg-white border-4 border-[#1C1C1E] z-10 group-hover:scale-125 transition-transform shadow-md" />
                               
                               <div className="bg-white border border-[#E5E5EA] p-8 rounded-[2.5rem] shadow-3d-soft elevated-3d hover:shadow-3d-deep transition-all">
                                  <div className="flex justify-between items-start mb-6">
                                    <div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                          log.action === 'Criação' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                          log.action === 'Exclusão Lógica' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                          'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                        }`}>
                                          {log.action}
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-[#E5E5EA]" />
                                        <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
                                          {safeFormatISO(logDate, "dd/MM/yyyy HH:mm")}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center shadow-inner">
                                          <ArrowUpRight size={14} className="text-[#AEAEB2]" />
                                        </div>
                                        <h4 className="text-base font-black text-[#1C1C1E] uppercase tracking-tighter">{log.resourceName}</h4>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <span className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-widest block mb-1">Responsável</span>
                                      <span className="text-xs font-bold text-[#1C1C1E] uppercase">{log.user.name || log.user.email}</span>
                                    </div>
                                  </div>

                                  {log.details?.changes && log.details.changes.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-[#F5F5F7]">
                                      {log.details.changes.map((change: any, cidx: number) => (
                                        <div key={cidx} className="p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5EA]/50 shadow-inner">
                                          <span className="text-[8px] font-black text-[#AEAEB2] uppercase tracking-[0.2em] mb-1.5 block">{change.field}</span>
                                          <div className="flex items-center gap-2 text-[10px] font-bold overflow-hidden">
                                            <span className="text-rose-400 line-through truncate max-w-[80px]">{JSON.stringify(change.from)}</span>
                                            <ChevronRight size={10} className="text-[#AEAEB2] shrink-0" />
                                            <span className="text-emerald-600 truncate">{JSON.stringify(change.to)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {log.details?.observations && (
                                    <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                                      {log.details.observations}
                                    </div>
                                  )}
                               </div>
                             </div>
                           );
                         })
                       ) : (
                         <div className="py-20 text-center opacity-40">
                           <History size={48} className="text-[#AEAEB2] mx-auto mb-6" strokeWidth={1} />
                           <p className="text-[10px] font-black uppercase tracking-widest">Nenhum histórico de alterações disponível</p>
                         </div>
                       )}
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Footer Meta */}
        <div className="absolute bottom-6 left-10 text-[9px] font-black text-[#AEAEB2] uppercase tracking-[0.3em] flex items-center gap-4">
           <span>ERP System - Protocol {product.id.substring(0, 8)}</span>
           <div className="w-1 h-1 rounded-full bg-[#E5E5EA]" />
           <span>Last Sync: {new Date().toLocaleTimeString()}</span>
        </div>
      </motion.div>
    </div>
  );
};
