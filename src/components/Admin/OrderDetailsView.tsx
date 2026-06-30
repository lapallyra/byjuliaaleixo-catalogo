import React, { useState, useMemo } from "react";
import { Order, Product, Insumo } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { calculateProductCost } from "../../lib/finance";
import { safeFormatISO } from "../../lib/dateUtils";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";
import { 
  ArrowLeft, Edit, FileText, MoreVertical, MessageSquare, History, 
  Plus, Trash2, Paperclip, Upload, File as FileIcon, CreditCard, 
  Package, Calendar, Check, X, Clock, MapPin, User, ChevronRight, Save, Eye, Download, Activity
} from "lucide-react";

interface OrderDetailsViewProps {
  order: Order;
  products: Product[];
  insumos: Insumo[];
  onBack: () => void;
  onEdit: (order: Order) => void;
  onSave?: (order: Partial<Order>) => void;
  onPrint?: (order: Order) => void;
}

export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ 
  order, products, insumos, onBack, onEdit, onSave, onPrint 
}) => {
  const [observations, setObservations] = useState(order.observations || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Parse items
  const items = order.items || [];
  const subtotal = items.reduce((sum, item) => sum + ((item.retail_price || item.current_price || 0) * (item.quantity || 1)), 0);
  const discount = order.discount || 0;
  const shipping = order.shippingCost || 0;
  const total = order.total || (subtotal + shipping - discount);
  const paid = order.hasSignal ? (order.signalValue || (subtotal * 0.5)) : (order.paymentStatus === "paid" || order.status === "fully_paid" ? total : 0);
  const remaining = Math.max(0, total - paid);

  const costTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId || p.id === item.id);
      if (!product) return sum;
      const prodCost = calculateProductCost(product, insumos);
      return sum + (prodCost * (item.quantity || 1));
    }, 0);
  }, [items, products, insumos]);

  const profit = total - costTotal;
  const margin = total > 0 ? (profit / total) * 100 : 0;

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave({ ...order, observations });
        onBack();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    const map: Record<string, { label: string; color: string; border: string }> = {
      "novo pedido": { label: "Novo Pedido", color: "bg-gray-100 text-gray-700", border: "border-gray-200" },
      "quote": { label: "Orçamento", color: "bg-gray-100 text-gray-700", border: "border-gray-200" },
      "waiting_payment": { label: "Aguardando Pagamento", color: "bg-amber-100 text-amber-700", border: "border-amber-200" },
      "waiting_deposit": { label: "Sinal Pendente", color: "bg-amber-100 text-amber-700", border: "border-amber-200" },
      "approval": { label: "Aprovação de Arte", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "production": { label: "Em Produção", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "assembly": { label: "Montagem", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "ready": { label: "Pronto para Retirada", color: "bg-purple-100 text-purple-700", border: "border-purple-200" },
      "delivery": { label: "Enviado", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "delivered": { label: "Entregue", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "fully_paid": { label: "Concluído", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "cancelled": { label: "Cancelado", color: "bg-rose-100 text-rose-700", border: "border-rose-200" }
    };
    return map[s] || { label: status, color: "bg-gray-100 text-gray-700", border: "border-gray-200" };
  };

  const getStatusBadge = (status: string) => {
    const info = getStatusInfo(status);
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${info.color} ${info.border}`}>
        {info.label}
      </span>
    );
  };

  const handleWhatsApp = () => {
    if (!order.contact) return;
    const phone = order.contact.replace(/\D/g, "");
    const text = encodeURIComponent(`Olá ${order.customerName}, sobre o seu pedido #${order.code}...`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  // Mock History
  const historyEntries = [
    { date: order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy") : "--", time: order.createdAt ? safeFormatISO(order.createdAt, "HH:mm") : "--", user: "Sistema", text: "Pedido criado" },
    { date: order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy") : "--", time: "14:40", user: "Sistema", text: "Aguardando pagamento" }
  ];

  const timelineSteps = ["Pedido", "Pagamento", "Produção", "Pronto", "Entregue"];
  let currentStepIndex = 0;
  if (["delivered", "fully_paid"].includes(order.status)) currentStepIndex = 4;
  else if (["ready"].includes(order.status)) currentStepIndex = 3;
  else if (["production", "assembly", "approval"].includes(order.status)) currentStepIndex = 2;
  else if (["paid"].includes(order.status) || order.paymentStatus === "paid") currentStepIndex = 1;

  const currentStatusInfo = getStatusInfo(order.status);

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] animate-in fade-in duration-300 relative z-0">
      
      {/* Header (Sticky) */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[#F5F5F7] rounded-xl transition-colors text-[#8E8E93] hover:text-[#1C1C1E]"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#1C1C1E] tracking-tight">Pedido #{order.code}</h1>
            {getStatusBadge(order.status)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(order)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#1C1C1E] rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Edit size={16} /> <span className="hidden sm:inline">Editar Pedido</span>
          </button>
          {onPrint && (
            <button 
              onClick={() => onPrint(order)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#1C1C1E] rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <FileText size={16} /> <span className="hidden sm:inline">gerar PDF</span>
            </button>
          )}
          <button className="p-2 bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#1C1C1E] rounded-xl transition-colors shadow-sm">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* TIMELINE */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm overflow-x-auto">
            <div className="flex items-center min-w-max">
              {timelineSteps.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isPending = idx > currentStepIndex;

                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center gap-3 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 ${
                        isCompleted ? "bg-[#1C1C1E] text-white shadow-md" :
                        isCurrent ? "bg-white border-2 border-[#1C1C1E] text-[#1C1C1E] shadow-sm" :
                        "bg-[#F5F5F7] border border-[#E5E5EA] text-[#8E8E93]"
                      }`}>
                        {isCompleted ? <Check size={18} /> : (idx + 1)}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        isCurrent ? "text-[#1C1C1E]" :
                        isCompleted ? "text-[#1C1C1E]" :
                        "text-[#8E8E93]"
                      }`}>
                        {step}
                      </span>
                    </div>
                    {idx < timelineSteps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-4 mt-[-24px] bg-[#E5E5EA]">
                        <div className={`h-full transition-all duration-500 ${isCompleted ? "bg-[#1C1C1E]" : "bg-transparent"}`} style={{ width: "100%" }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* CARD STATUS E DESTAQUE */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${currentStatusInfo.color} ${currentStatusInfo.border}`}>
                <Activity size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Status Atual</p>
                <h2 className="text-lg font-bold text-[#1C1C1E]">{currentStatusInfo.label}</h2>
              </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Última Atualização</p>
               <p className="text-sm font-semibold text-[#1C1C1E]">
                 {order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy") : "--"} às {order.createdAt ? safeFormatISO(order.createdAt, "HH:mm") : "--"}
               </p>
            </div>
          </div>

          {/* Row 1: Client & Finance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD 01 - CLIENTE */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-[#1C1C1E]">
                    <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                      <User size={16} className="text-[#8E8E93]" />
                    </div>
                    <h3 className="font-bold tracking-tight">Cliente</h3>
                  </div>
                  <button className="text-[11px] font-bold text-[#8E8E93] hover:text-[#1C1C1E] uppercase tracking-wider flex items-center gap-1 transition-colors">
                    <History size={12} /> Histórico
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Nome</p>
                      <p className="text-sm font-semibold text-[#1C1C1E] truncate">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">CPF/CNPJ</p>
                      <p className="text-sm text-[#1C1C1E]">{order.customerCpfCnpj ? formatCPFOrCNPJ(order.customerCpfCnpj) : "---"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Telefone</p>
                      <p className="text-sm text-[#1C1C1E]">{order.contact ? formatPhone(order.contact) : "---"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">E-mail</p>
                      <p className="text-sm text-[#1C1C1E] truncate">{order.customerEmail || "---"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Cidade</p>
                      <p className="text-sm text-[#1C1C1E] truncate">---</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Estado</p>
                      <p className="text-sm text-[#1C1C1E]">---</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Endereço completo</p>
                    <p className="text-sm text-[#1C1C1E] truncate">{order.customerAddress || order.address || "Não informado"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#F2F2F7] flex gap-3">
                <button 
                  onClick={handleWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-xl text-xs font-bold transition-colors"
                >
                  <MessageSquare size={14} /> WhatsApp
                </button>
                <button 
                  onClick={() => onEdit(order)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-xl text-xs font-bold transition-colors"
                >
                  <Edit size={14} /> Editar
                </button>
              </div>
            </div>

            {/* CARD 03 - RESUMO FINANCEIRO */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#1C1C1E] mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                    <CreditCard size={16} className="text-[#8E8E93]" />
                  </div>
                  <h3 className="font-bold tracking-tight">Resumo Financeiro</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#8E8E93]">Subtotal</span>
                    <span className="font-medium text-[#1C1C1E]">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#8E8E93]">Desconto / Cupom</span>
                      <span className="font-medium text-rose-500">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#8E8E93]">Frete</span>
                      <span className="font-medium text-[#1C1C1E]">{formatCurrency(shipping)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#F2F2F7] flex justify-between items-center">
                    <span className="font-bold text-[#1C1C1E]">Total Geral</span>
                    <span className="font-bold text-lg text-[#1C1C1E]">{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#F2F2F7] grid grid-cols-2 gap-4">
                   <div>
                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Valor Pago</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(paid)}</p>
                  </div>
                   <div>
                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Valor Restante</p>
                    <p className="text-sm font-bold text-amber-600">{formatCurrency(remaining)}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mt-6 pt-6 border-t border-[#F2F2F7] flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Forma de Pagamento</p>
                    <p className="text-xs font-semibold text-[#1C1C1E] capitalize">{order.paymentMethod || "Não informado"}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1 text-right">Status</p>
                     <p className={`text-xs font-bold text-right ${remaining === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                       {remaining === 0 ? "Pago Integral" : (paid > 0 ? "Parcial (Sinal)" : "Pendente")}
                     </p>
                  </div>
                </div>
                <div className="mt-4 flex">
                  <button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1C1C1E] text-white rounded-xl text-xs font-bold transition-all hover:bg-black"
                  >
                    Registrar Pagamento
                  </button>
                </div>
              </div>
            </div>

            {/* CARD - RESUMO DE LUCRATIVIDADE */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[#1C1C1E] mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                  <Activity size={16} className="text-[#8E8E93]" />
                </div>
                <h3 className="font-bold tracking-tight">Resumo de Lucratividade</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Receita Total</p>
                  <p className="text-sm font-bold text-[#1C1C1E]">{formatCurrency(total)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Custo Produção</p>
                  <p className="text-sm font-bold text-rose-600">{formatCurrency(costTotal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Lucro Estimado</p>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(profit)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Margem</p>
                  <p className="text-sm font-bold text-emerald-600">{margin.toFixed(1)}%</p>
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: Items */}
          {/* CARD 02 - ITENS DO PEDIDO */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#1C1C1E] mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                <Package size={16} className="text-[#8E8E93]" />
              </div>
              <h3 className="font-bold tracking-tight">Itens do Pedido</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5EA]">
                    <th className="pb-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider font-sans">Produto</th>
                    <th className="pb-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider font-sans text-center">Qtd</th>
                    <th className="pb-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider font-sans text-right">Valor Un.</th>
                    <th className="pb-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider font-sans text-right">Subtotal</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7]">
                  {items.map((item, idx) => {
                    const price = item.retail_price || item.current_price || 0;
                    const qty = item.quantity || 1;
                    return (
                      <tr key={idx} className="group">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] overflow-hidden shrink-0 flex items-center justify-center">
                              {item.image ? (
                                <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={16} className="text-[#8E8E93]" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1C1C1E]">{item.product_name}</p>
                              {item.selectedVariation && <p className="text-xs text-[#8E8E93]">{item.selectedVariation}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-[#F5F5F7] rounded-md text-xs font-bold text-[#1C1C1E]">
                            {qty}
                          </span>
                        </td>
                        <td className="py-4 text-right text-sm font-medium text-[#8E8E93]">{formatCurrency(price)}</td>
                        <td className="py-4 text-right text-sm font-bold text-[#1C1C1E]">{formatCurrency(price * qty)}</td>
                        <td className="py-4 text-right">
                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-md transition-colors">
                               <Edit size={14} />
                             </button>
                             <button className="p-1.5 text-[#8E8E93] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                               <Trash2 size={14} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-[#8E8E93]">Nenhum item cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-[#F2F2F7]">
              <button className="flex items-center gap-2 text-xs font-bold text-[#1C1C1E] hover:text-[#8E8E93] uppercase tracking-wider transition-colors">
                <Plus size={14} /> Adicionar Item
              </button>
            </div>
          </div>

          {/* Row 3: Deadlines & Observations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD 04 - PRAZOS */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-[#1C1C1E] mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                  <Calendar size={16} className="text-[#8E8E93]" />
                </div>
                <h3 className="font-bold tracking-tight">Prazos</h3>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                  <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Data do Pedido</span>
                  <span className="text-sm font-semibold text-[#1C1C1E]">
                    {order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy") : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Prev. Produção</span>
                  <span className="text-sm font-semibold text-blue-700">
                     --/--/----
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Prev. Entrega</span>
                  <span className="text-sm font-semibold text-purple-700">
                    {order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy") : "A combinar"}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 05 - OBSERVAÇÕES */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#1C1C1E]">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                    <MessageSquare size={16} className="text-[#8E8E93]" />
                  </div>
                  <h3 className="font-bold tracking-tight">Observações</h3>
                </div>
              </div>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex.: Tema, cores, nomes, datas, informações importantes..."
                className="flex-1 w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl p-4 text-sm outline-none focus:bg-white focus:border-[#1C1C1E] transition-all text-[#1C1C1E] resize-none min-h-[120px]"
              />
            </div>
          </div>

          {/* Row 4: Files & History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD 06 - ARQUIVOS */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#1C1C1E] mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                  <Paperclip size={16} className="text-[#8E8E93]" />
                </div>
                <h3 className="font-bold tracking-tight">Arquivos</h3>
              </div>
              
              <div className="border-2 border-dashed border-[#E5E5EA] rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-[#FAF9F6] hover:bg-[#F5F5F7] transition-colors cursor-pointer mb-4">
                <Upload size={24} className="text-[#8E8E93]" />
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1C1C1E]">Clique para anexar ou arraste arquivos</p>
                  <p className="text-[11px] text-[#8E8E93] mt-1">Imagens, PDF, Arte, Comprovantes</p>
                </div>
              </div>

              {/* Mock attached files */}
              <div className="space-y-2">
                 <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <FileIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C1C1E] truncate">Comprovante_PIX.pdf</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider">PDF</p>
                        <span className="w-1 h-1 rounded-full bg-[#E5E5EA]" />
                        <p className="text-[10px] font-medium text-[#8E8E93]">120 KB</p>
                        <span className="w-1 h-1 rounded-full bg-[#E5E5EA]" />
                        <p className="text-[10px] font-medium text-[#8E8E93]">Hoje, 14:30</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-white rounded-lg transition-colors" title="Visualizar">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-white rounded-lg transition-colors" title="Baixar">
                        <Download size={16} />
                      </button>
                      <button className="p-2 text-[#8E8E93] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* CARD 07 - HISTÓRICO */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#1C1C1E] mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                  <Clock size={16} className="text-[#8E8E93]" />
                </div>
                <h3 className="font-bold tracking-tight">Histórico</h3>
              </div>

              <div className="relative pl-3 space-y-6 before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-[#F2F2F7]">
                {historyEntries.map((entry, idx) => (
                  <div key={idx} className="relative flex gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1C1C1E] border-4 border-white shrink-0 mt-1.5 z-10 -ml-1.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#1C1C1E]">{entry.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-[#8E8E93]">
                        <span>{entry.date}</span>
                        <span className="w-1 h-1 rounded-full bg-[#E5E5EA]" />
                        <span>{entry.time}</span>
                        <span className="w-1 h-1 rounded-full bg-[#E5E5EA]" />
                        <span>{entry.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* RODAPÉ FIXO */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-[#E5E5EA] p-4 flex items-center justify-end gap-3 shrink-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <button 
          onClick={onBack}
          className="px-6 py-3 bg-white border border-[#E5E5EA] text-[#1C1C1E] rounded-xl font-bold text-sm transition-all hover:bg-[#F5F5F7]"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-[#1C1C1E] text-white rounded-xl font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : (
            <>
              <Save size={16} /> Salvar
            </>
          )}
        </button>
      </div>

      {/* MODAL DE PAGAMENTO */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#1C1C1E] tracking-tight">Registrar Pagamento</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#1C1C1E] block">Forma de pagamento</label>
                <select className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#1C1C1E] transition-all text-[#1C1C1E]">
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#1C1C1E] block">Valor pago</label>
                <input 
                  type="text" 
                  placeholder="R$ 0,00"
                  defaultValue={formatCurrency(remaining)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#1C1C1E] transition-all text-[#1C1C1E]"
                />
              </div>

              {order.paymentMode === 'planned' && order.remainingInstallments && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1C1E] block">Parcelas</label>
                  <div className="space-y-2">
                    {Array.from({ length: order.remainingInstallments }).map((_, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] cursor-pointer hover:bg-white transition-colors">
                        <input type="checkbox" className="w-4 h-4 rounded text-[#1C1C1E] border-[#E5E5EA] focus:ring-[#1C1C1E]" />
                        <span className="text-sm font-medium text-[#1C1C1E]">Parcela {idx + 1} de {order.remainingInstallments} - {formatCurrency(order.remainingInstallmentValue || 0)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
               <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 bg-[#F5F5F7] text-[#1C1C1E] rounded-xl font-bold text-sm transition-all hover:bg-[#E5E5EA]">
                 Cancelar
               </button>
               <button 
                 onClick={() => {
                   if (onSave) {
                     onSave({
                       ...order,
                       paymentStatus: "paid",
                       status: "paid"
                     });
                   }
                   setIsPaymentModalOpen(false);
                 }}
                 className="flex-1 py-3 bg-[#1C1C1E] text-white rounded-xl font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all"
               >
                 Confirmar Pagamento
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
