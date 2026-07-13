import React, { useState, useMemo, useEffect } from "react";
import { Order, Product, Insumo } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { calculateProductCost } from "../../lib/finance";
import { safeFormatISO } from "../../lib/dateUtils";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";
import { 
  ArrowLeft, Edit, FileText, MoreVertical, MessageSquare, History, 
  Plus, Trash2, Paperclip, Upload, File as FileIcon, CreditCard, 
  Package, Calendar, Check, X, Clock, MapPin, User, ChevronRight, Save, Eye, Download, Activity, FilePlus, Copy
} from "lucide-react";
import { OrderPrintA6Modal } from "./OrderPrintA6Modal";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface OrderDetailsViewProps {
  order: Order;
  products: Product[];
  insumos: Insumo[];
  onBack: () => void;
  onEdit: (order: Order) => void;
  onSave?: (order: Partial<Order>) => void;
  onUpdateStatus?: (id: string, status: Order["status"]) => void;
  onPrint?: (order: Order) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (order: Order) => void;
}

export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ 
  order, products, insumos, onBack, onEdit, onSave, onUpdateStatus, onPrint, onDelete, onDuplicate 
}) => {
  const orchestrator = useAdminOrchestrator();
  const [observations, setObservations] = useState(order.observations || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"geral" | "cliente" | "produtos" | "financeiro" | "producao" | "arquivos" | "historico">("geral");

  useEffect(() => {
    const handlePrintCoupon = () => { if(onPrint) onPrint(order); };
    const handlePrintEtiqueta = () => setIsLabelModalOpen(true);
    window.addEventListener('trigger-print-coupon', handlePrintCoupon);
    window.addEventListener('trigger-print-etiqueta', handlePrintEtiqueta);
    return () => {
        window.removeEventListener('trigger-print-coupon', handlePrintCoupon);
        window.removeEventListener('trigger-print-etiqueta', handlePrintEtiqueta);
    };
  }, [order, onPrint]);

  const statusSequence: Order["status"][] = [
    'waiting_production',
    'production',
    'conferencing',
    'packaging',
    'ready',
    'delivered'
  ];

  const advanceStatus = () => {
    if (!onUpdateStatus) return;
    const currentIndex = statusSequence.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < statusSequence.length - 1) {
      onUpdateStatus(order.id, statusSequence[currentIndex + 1]);
    }
  };

  // Parse items
  const items = order.items || [];
  const subtotal = items.reduce((sum, item) => sum + ((item.retail_price || item.current_price || 0) * (item.quantity || 1)), 0);
  const discount = order.discount || 0;
  const shipping = order.shippingCost || 0;
  const total = order.total || (subtotal + shipping - discount);
  const paid = order.hasSignal 
    ? (typeof order.signalValue === 'number' ? order.signalValue : (subtotal * 0.5)) 
    : (order.paymentStatus === "paid" || order.status === "fully_paid" ? total : 0);
  const remaining = Math.max(0, total - paid);

  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentValue, setPaymentValue] = useState("");
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);

  useEffect(() => {
    if (isPaymentModalOpen) {
      setPaymentMethod("pix");
      setPaymentValue(remaining.toFixed(2).replace(".", ","));
      setSelectedInstallments([]);
    }
  }, [isPaymentModalOpen, remaining]);

  const handleToggleInstallment = (index: number) => {
    const isSelected = selectedInstallments.includes(index);
    let newSelected: number[];
    if (isSelected) {
      newSelected = selectedInstallments.filter(i => i !== index);
    } else {
      newSelected = [...selectedInstallments, index];
    }
    setSelectedInstallments(newSelected);
    
    const installmentValue = order.remainingInstallmentValue || 0;
    const totalSelectedValue = newSelected.length * installmentValue;
    setPaymentValue(totalSelectedValue.toFixed(2).replace(".", ","));
  };

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
    const s = (status || "").toLowerCase();
    const map: Record<string, { label: string; color: string; border: string }> = {
      "novo pedido": { label: "NOVO PEDIDO", color: "bg-slate-100 text-slate-700", border: "border-slate-200" },
      "quote": { label: "ORÇAMENTO", color: "bg-slate-100 text-slate-700", border: "border-slate-200" },
      "orçamento": { label: "ORÇAMENTO", color: "bg-slate-100 text-slate-700", border: "border-slate-200" },
      "waiting_payment": { label: "SINAL", color: "bg-amber-100 text-amber-700", border: "border-amber-200" },
      "waiting_deposit": { label: "SINAL", color: "bg-amber-100 text-amber-700", border: "border-amber-200" },
      "aguardando sinal": { label: "SINAL", color: "bg-amber-100 text-amber-700", border: "border-amber-200" },
      "approval": { label: "APROVAÇÃO", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "aguardando aprovação cliente": { label: "APROVAÇÃO", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "production": { label: "EM PRODUÇÃO", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "em produção": { label: "EM PRODUÇÃO", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "assembly": { label: "MONTAGEM", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "montagem": { label: "MONTAGEM", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
      "conferência": { label: "CONFERÊNCIA", color: "bg-purple-100 text-purple-700", border: "border-purple-200" },
      "conferencing": { label: "CONFERÊNCIA", color: "bg-purple-100 text-purple-700", border: "border-purple-200" },
      "embalagem": { label: "EMBALAGEM", color: "bg-purple-100 text-purple-700", border: "border-purple-200" },
      "packaging": { label: "EMBALAGEM", color: "bg-purple-100 text-purple-700", border: "border-purple-200" },
      "ready": { label: "PRONTO PARA ENTREGAR", color: "bg-purple-100 text-purple-700", border: "border-purple-200" },
      "pronto para entregar": { label: "PRONTO PARA ENTREGAR", color: "bg-purple-100 text-purple-700", border: "border-purple-200" },
      "delivery": { label: "ENVIADO/ENTREGA", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "enviado": { label: "ENVIADO/ENTREGA", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "delivered": { label: "ENTREGUE/RECEBIDO", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "recebido": { label: "ENTREGUE/RECEBIDO", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "fully_paid": { label: "ENTREGUE/RECEBIDO", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "concluído (pagamento completo)": { label: "ENTREGUE/RECEBIDO", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
      "cancelled": { label: "CANCELADO", color: "bg-rose-100 text-rose-700", border: "border-rose-200" }
    };
    return map[s] || { label: status, color: "bg-slate-100 text-slate-700", border: "border-slate-200" };
  };

  const getStatusBadge = (status: string) => {
    const info = getStatusInfo(status);
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${info.color} ${info.border}`}>
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

  // Chronological timeline steps derived from order status
  const timelineSteps = ["Pedido", "Pagamento", "Produção", "Pronto", "Entregue"];
  let currentStepIndex = 0;
  if (["delivered", "fully_paid"].includes(order.status)) currentStepIndex = 4;
  else if (["ready"].includes(order.status)) currentStepIndex = 3;
  else if (["production", "assembly", "approval"].includes(order.status)) currentStepIndex = 2;
  else if (["paid"].includes(order.status) || order.paymentStatus === "paid") currentStepIndex = 1;

  const currentStatusInfo = getStatusInfo(order.status);

  // Chronological log
  const historyEntries = useMemo(() => {
    const defaultEntries = [
      { date: order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy") : "--", time: order.createdAt ? safeFormatISO(order.createdAt, "HH:mm") : "--", user: "Sistema", text: "Pedido criado" },
      { date: order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy") : "--", time: "14:40", user: "Sistema", text: "Status atualizado para: " + currentStatusInfo.label }
    ];
    if (order.history && order.history.length > 0) {
      return order.history.map(h => ({
        date: h.timestamp ? safeFormatISO(h.timestamp, "dd/MM/yyyy") : "--",
        time: h.timestamp ? safeFormatISO(h.timestamp, "HH:mm") : "--",
        user: h.updatedBy || "Membro da Equipe",
        text: `Status alterado para ${getStatusInfo(h.status).label}` + (h.notes ? ` (${h.notes})` : "")
      }));
    }
    return defaultEntries;
  }, [order, currentStatusInfo.label]);

  return (
    <div className="flex flex-col h-full bg-[#FDF8F5] animate-in fade-in duration-200 relative z-0">
      
      {/* HEADER OPERACIONAL */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/90 px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-20 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-pink-50 rounded-full transition-colors text-gray-500 hover:text-pink-600"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider">PEDIDO</span>
              <h1 className="text-base font-black text-gray-800 tracking-tight">#{order.code}</h1>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="font-semibold">{order.customerName}</span>
              <span className="w-1 h-1 rounded-full bg-pink-200" />
              <span>Total: <strong className="text-gray-800">{formatCurrency(total)}</strong></span>
              <span className="w-1 h-1 rounded-full bg-pink-200" />
              <span>Entrega: <strong className="text-gray-800">{order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy") : "A combinar"}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => onEdit(order)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/80 border border-white/90 hover:bg-pink-50 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Edit size={14} /> <span>Editar</span>
          </button>
          {statusSequence.includes(order.status) && order.status !== 'delivered' && (
            <button 
              onClick={advanceStatus}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <ChevronRight size={14} /> <span>Avançar Status</span>
            </button>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 bg-white/80 border border-white/90 hover:bg-pink-50 text-gray-700 rounded-xl transition-all shadow-sm"
            title="Mais Opções"
          >
            <MoreVertical size={16} />
          </button>

          {/* DROPDOWN MENU ⋮ */}
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <button 
                  onClick={() => { setIsMenuOpen(false); setIsPaymentModalOpen(true); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <CreditCard size={14} className="text-emerald-500" />
                  <span>Registrar pagamento</span>
                </button>
                <button 
                  onClick={() => { setIsMenuOpen(false); onEdit(order); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit size={14} className="text-blue-500" />
                  <span>Editar pedido</span>
                </button>
                {onPrint && (
                  <button 
                    onClick={() => { setIsMenuOpen(false); onPrint(order); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText size={14} className="text-slate-500" />
                    <span>Imprimir Cupom Não Fiscal</span>
                  </button>
                )}
                <button 
                  onClick={() => { setIsMenuOpen(false); setIsLabelModalOpen(true); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Package size={14} className="text-purple-500" />
                  <span>Imprimir Etiqueta</span>
                </button>
                {onDuplicate && (
                  <button 
                    onClick={() => { setIsMenuOpen(false); onDuplicate(order); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 pt-1.5"
                  >
                    <FilePlus size={14} className="text-amber-500" />
                    <span>Duplicar pedido</span>
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => { 
                      setIsMenuOpen(false); 
                      if (window.confirm("Deseja realmente excluir este pedido permanentemente?")) {
                        onDelete(order.id);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 pt-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Excluir pedido</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ABAS OPERACIONAIS (PILLS) */}
      <div className="bg-white/40 backdrop-blur-md border-b border-white/80 px-6 py-2.5 flex gap-1 overflow-x-auto scrollbar-hide shrink-0">
        {(["geral", "cliente", "produtos", "financeiro", "producao", "arquivos", "historico"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize whitespace-nowrap ${
              activeTab === tab 
                ? "bg-gradient-to-b from-pink-400 to-pink-500 text-white shadow-md" 
                : "text-gray-500 hover:text-gray-900 hover:bg-pink-50/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ÁREA DE CONTEÚDO DENSE */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* TAB: GERAL */}
          {activeTab === "geral" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* TIMELINE DE STATUS */}
              <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm overflow-x-auto">
                <div className="flex items-center min-w-[500px]">
                  {timelineSteps.map((step, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <React.Fragment key={idx}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-300 shrink-0 ${
                            isCompleted ? "bg-pink-500 text-white" :
                            isCurrent ? "bg-white border-2 border-pink-500 text-pink-600" :
                            "bg-gray-100 border border-gray-200 text-gray-400"
                          }`}>
                            {isCompleted ? <Check size={12} /> : (idx + 1)}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isCurrent ? "text-pink-600 font-extrabold" : "text-gray-400"
                          }`}>
                            {step}
                          </span>
                        </div>
                        {idx < timelineSteps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-3 bg-pink-100" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* INFO CENTRAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* DADOS PRINCIPAIS */}
                <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2">Ficha do Pedido</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium block">Origem</span>
                      <span className="font-bold text-gray-700 capitalize">{order.source || "admin"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">Criado em</span>
                      <span className="font-bold text-gray-700">
                        {order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy HH:mm") : "--"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">Tipo de Entrega</span>
                      <span className="font-bold text-gray-700 capitalize">
                        {order.deliveryType === 'retirada' ? 'Retirada' : order.deliveryType === 'delivery' ? 'Delivery' : 'Correios/Envio'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">Previsão</span>
                      <span className="font-bold text-gray-700">
                        {order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy") : "A combinar"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">Responsável</span>
                      <span className="font-bold text-gray-700">{order.assignee || "Não designado"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">Prioridade</span>
                      <span className="font-bold text-gray-700 capitalize">{order.productionPriority || "Normal"}</span>
                    </div>
                  </div>
                </div>

                {/* OBSERVACAO BOX COM AUTO SAVE */}
                <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2">Observações Operacionais</h3>
                    <textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Instruções de produção, embalagem, cores específicas..."
                      className="w-full bg-white/50 border border-white/60 rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 resize-none h-24 shadow-inner"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                    >
                      <Save size={12} /> {isSaving ? "Salvando..." : "Salvar Notas"}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: CLIENTE */}
          {activeTab === "cliente" && (
            <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-white pb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Dados Cadastrais do Cliente</h3>
                <button 
                  onClick={handleWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80 border border-emerald-200/50 rounded-xl text-xs font-bold transition-all"
                >
                  <MessageSquare size={12} /> WhatsApp
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5">Nome Completo</span>
                  <p className="font-bold text-gray-700">{order.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block mb-0.5">CPF / CNPJ</span>
                  <p className="font-semibold text-gray-700">{order.customerCpfCnpj ? formatCPFOrCNPJ(order.customerCpfCnpj) : "Não cadastrado"}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block mb-0.5">Telefone de Contato</span>
                  <p className="font-semibold text-gray-700">{order.contact ? formatPhone(order.contact) : "Não informado"}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block mb-0.5">E-mail</span>
                  <p className="font-semibold text-gray-700">{order.customerEmail || "Não cadastrado"}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400 font-medium block mb-0.5">Endereço de Entrega</span>
                  <div className="bg-white/50 border border-white/60 rounded-xl p-3 flex items-center justify-between gap-4">
                    <p className="font-medium text-gray-600">{order.customerAddress || order.address || "Sem endereço (Retirada no Ateliê)"}</p>
                    {(order.customerAddress || order.address) && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(order.customerAddress || order.address || "");
                          orchestrator.dispatchEvent({
                            type: 'FEEDBACK',
                            message: "Endereço copiado para a área de transferência!",
                            priority: 'HIGH',
                            customerName: '',
                            productName: '',
                            companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
                            data: { success: true, title: 'Sucesso' }
                          });
                        }}
                        className="p-1.5 hover:bg-pink-100 rounded-lg text-gray-400 hover:text-pink-600 shrink-0 transition-all"
                        title="Copiar Endereço"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUTOS */}
          {activeTab === "produtos" && (
            <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-white pb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Itens e Detalhes do Pedido</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white">
                      <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Produto</th>
                      <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Qtd</th>
                      <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Valor Un.</th>
                      <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40 text-xs">
                    {items.map((item, idx) => {
                      const price = item.retail_price || item.current_price || 0;
                      const qty = item.quantity || 1;
                      return (
                        <tr key={idx} className="hover:bg-pink-50/20">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-white border border-white overflow-hidden shrink-0 flex items-center justify-center">
                                {item.image ? (
                                  <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={14} className="text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-700">{item.product_name}</p>
                                {item.selectedVariation && <p className="text-[10px] text-gray-400 mt-0.5">{item.selectedVariation}</p>}
                                {item.observations && <p className="text-[10px] text-amber-600 italic mt-0.5">Obs: {item.observations}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="inline-block px-1.5 py-0.5 bg-pink-100/50 rounded font-bold text-[11px] text-pink-600">
                              {qty}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-medium text-gray-500">{formatCurrency(price)}</td>
                          <td className="py-2.5 text-right font-bold text-gray-700">{formatCurrency(price * qty)}</td>
                        </tr>
                      );
                    })}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400 italic">Nenhum produto adicionado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PERSONALIZAÇÃO EXTRA (IF EXIST) */}
              {(order.giftName || order.giftTheme || order.giftColors) && (
                <div className="bg-white/50 border border-white/60 rounded-xl p-4 space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Informações de Personalização</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {order.giftName && (
                      <div>
                        <span className="text-gray-400 block">Nome</span>
                        <span className="font-bold text-gray-700">{order.giftName}</span>
                      </div>
                    )}
                    {order.giftTheme && (
                      <div>
                        <span className="text-gray-400 block">Tema</span>
                        <span className="font-bold text-gray-700">{order.giftTheme}</span>
                      </div>
                    )}
                    {order.giftColors && (
                      <div>
                        <span className="text-gray-400 block">Cores</span>
                        <span className="font-bold text-gray-700">{order.giftColors}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: FINANCEIRO */}
          {activeTab === "financeiro" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* FLUXO DE PAGAMENTO */}
                <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2">Resumo do Faturamento</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center pb-1 border-b border-white">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-bold text-gray-700">{formatCurrency(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center pb-1 border-b border-white text-rose-500">
                          <span>Desconto</span>
                          <span className="font-bold">-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      {shipping > 0 && (
                        <div className="flex justify-between items-center pb-1 border-b border-white">
                          <span className="text-gray-500">Frete</span>
                          <span className="font-bold text-gray-700">{formatCurrency(shipping)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm pt-1.5">
                        <span className="font-bold text-slate-800">Total do Pedido</span>
                        <span className="font-black text-gray-800">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/60">
                      <div>
                        <span className="text-gray-400 block">Sinal Pago</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(paid)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Saldo Restante</span>
                        <span className="font-bold text-amber-600">{formatCurrency(remaining)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/60 flex items-center justify-between gap-4">
                    <div className="text-xs">
                      <span className="text-gray-400 block">Método</span>
                      <span className="font-bold text-gray-700 capitalize">{order.paymentMethod || "Não informado"}</span>
                    </div>
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      <CreditCard size={12} /> Registrar Pagamento
                    </button>
                  </div>
                </div>

                {/* LUCRATIVIDADE */}
                <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2">Auditoria de Lucratividade</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-white/50 border border-white/60 rounded-xl p-3">
                      <span className="text-gray-400 block">Receita Bruta</span>
                      <span className="text-sm font-bold text-gray-700">{formatCurrency(total)}</span>
                    </div>
                    <div className="bg-white/50 border border-white/60 rounded-xl p-3">
                      <span className="text-gray-400 block">Custo de Insumos</span>
                      <span className="text-sm font-bold text-rose-500">{formatCurrency(costTotal)}</span>
                    </div>
                    <div className="bg-white/50 border border-white/60 rounded-xl p-3">
                      <span className="text-gray-400 block">Margem Bruta %</span>
                      <span className="text-sm font-bold text-emerald-500">{margin.toFixed(1)}%</span>
                    </div>
                    <div className="bg-white/50 border border-white/60 rounded-xl p-3">
                      <span className="text-gray-400 block">Lucro Líquido Est.</span>
                      <span className="text-sm font-bold text-emerald-500">{formatCurrency(profit)}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: PRODUÇÃO */}
          {activeTab === "producao" && (
            <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="border-b border-white pb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Centro de Operações e Produção</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Status de Produção</span>
                    <span className="inline-block px-2.5 py-1 bg-pink-100/50 text-pink-600 border border-pink-200/30 rounded-xl font-bold">
                      {currentStatusInfo.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Responsável Designado</span>
                    <p className="font-bold text-gray-700">{order.assignee || "Sem responsável atribuído"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Prioridade Operacional</span>
                    <span className={`inline-block font-bold capitalize ${order.productionPriority === 'urgente' ? 'text-rose-600' : order.productionPriority === 'alta' ? 'text-amber-500' : 'text-gray-700'}`}>
                      {order.productionPriority || "Normal"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Data de Início da Produção</span>
                    <p className="font-semibold text-gray-700">{order.productionDate ? safeFormatISO(order.productionDate, "dd/MM/yyyy") : "Pendente de início"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Data Limite de Produção</span>
                    <p className="font-semibold text-gray-700">{order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy") : "Pendente"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ARQUIVOS */}
          {activeTab === "arquivos" && (
            <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="border-b border-white pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Centro de Documentação e Anexos</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Arquivos Anexados</span>
              </div>

              {/* Categorized file listing and tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* CUPOM NÃO FISCAL DOCUMENT ROW */}
                <div className="p-3 border border-white/60 rounded-xl bg-white/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-white flex items-center justify-center text-gray-400">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">Cupom Não Fiscal</p>
                      <p className="text-[10px] text-gray-400">Gere e salve a via do cliente</p>
                    </div>
                  </div>
                  {onPrint ? (
                    <button 
                      onClick={() => onPrint(order)}
                      className="p-1.5 hover:bg-pink-100 rounded-lg text-gray-700 transition-colors"
                      title="Gerar/Imprimir"
                    >
                      <Download size={14} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-400">Indisponível</span>
                  )}
                </div>

                {/* ETIQUETA DOCUMENT ROW */}
                <div className="p-3 border border-white/60 rounded-xl bg-white/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-white flex items-center justify-center text-gray-400">
                      <Package size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">Etiqueta de Envio (A6)</p>
                      <p className="text-[10px] text-gray-400">Etiqueta de identificação da caixa</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsLabelModalOpen(true)}
                    className="p-1.5 hover:bg-pink-100 rounded-lg text-gray-700 transition-colors"
                    title="Gerar/Imprimir"
                  >
                    <Download size={14} />
                  </button>
                </div>

                {/* COMPROVANTE PIX ROW */}
                <div className="p-3 border border-white/60 rounded-xl bg-white/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-white flex items-center justify-center text-gray-400">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">Comprovante de Pagamento</p>
                      <p className="text-[10px] text-gray-400">Comprovante do PIX ou depósito</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 italic">Pendente</span>
                </div>

                {/* IMAGENS DA PRODUÇÃO OR CUSTOM PHOTOS */}
                <div className="p-3 border border-white/60 rounded-xl bg-white/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-white flex items-center justify-center text-gray-400">
                      <Paperclip size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">Fotos da Produção</p>
                      <p className="text-[10px] text-gray-400">{(order.photos?.length || 0)} fotos anexadas</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 italic">--</span>
                </div>

              </div>

              {/* UPLOAD ZONE */}
              <div className="border border-dashed border-pink-200 rounded-[22px] p-6 flex flex-col items-center justify-center gap-2 bg-white/40 hover:bg-white/60 transition-all cursor-pointer">
                <Upload size={18} className="text-pink-400" />
                <p className="text-xs font-bold text-gray-700">Anexar Novo Arquivo</p>
                <p className="text-[10px] text-gray-400">Arraste comprovantes, fotos ou PDFs para cá</p>
              </div>
            </div>
          )}

          {/* TAB: HISTÓRICO */}
          {activeTab === "historico" && (
            <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-white pb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Histórico de Eventos e Auditoria</h3>
              </div>

              <div className="relative pl-3 space-y-4 before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-pink-100">
                {historyEntries.map((entry, idx) => (
                  <div key={idx} className="relative flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-pink-500 border-2 border-white shrink-0 mt-1 z-10 -ml-1" />
                    <div>
                      <p className="font-semibold text-gray-700">{entry.text}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium text-gray-400">
                        <span>{entry.date}</span>
                        <span className="w-1 h-1 rounded-full bg-pink-100" />
                        <span>{entry.time}</span>
                        <span className="w-1 h-1 rounded-full bg-pink-100" />
                        <span>{entry.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RODAPÉ OPERACIONAL FIXO */}
      <div className="bg-white/80 backdrop-blur-md border-t border-white/90 p-4 flex items-center justify-end gap-2 shrink-0 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-white/80 border border-white/90 text-gray-700 hover:bg-pink-50 rounded-xl font-bold text-xs transition-all shadow-sm"
        >
          Voltar
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : (
            <>
              <Save size={14} /> Salvar Alterações
            </>
          )}
        </button>
      </div>

      {/* MODAL DE REGISTRAR PAGAMENTO */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FDF8F5]/95 backdrop-blur-lg border border-white/80 w-full max-w-sm rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-pink-100 pb-2">
              <h3 className="text-sm font-bold text-gray-800 tracking-tight">Registrar Pagamento</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-pink-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">Forma de pagamento</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">Valor pago</label>
                <input 
                  type="text" 
                  placeholder="R$ 0,00"
                  value={paymentValue}
                  onChange={(e) => setPaymentValue(e.target.value)}
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                />
              </div>

              {order.paymentMode === 'planned' && order.remainingInstallments && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 block">Parcelas</label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {Array.from({ length: order.remainingInstallments }).map((_, idx) => {
                      const isChecked = selectedInstallments.includes(idx);
                      return (
                        <label key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white/60 border border-pink-100/50 cursor-pointer hover:bg-white transition-all">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleToggleInstallment(idx)}
                            className="w-3.5 h-3.5 rounded text-pink-600 border-pink-200 focus:ring-pink-500 focus:ring-offset-0" 
                          />
                          <span className="text-[11px] font-medium text-gray-700">Parcela {idx + 1} de {order.remainingInstallments} - {formatCurrency(order.remainingInstallmentValue || 0)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
               <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-2.5 bg-white border border-white/90 text-gray-600 hover:bg-pink-50 rounded-xl font-bold text-xs transition-all shadow-sm">
                 Cancelar
               </button>
               <button 
                 onClick={() => {
                   const parsedValue = parseFloat(paymentValue.replace(",", "."));
                   if (isNaN(parsedValue) || parsedValue <= 0) return;
                   if (order.paymentMode === 'planned' && order.remainingInstallments) {
                     const instVal = order.remainingInstallmentValue || 0;
                     if (selectedInstallments.length === 0) return;
                     if (parsedValue < (selectedInstallments.length * instVal)) return;
                   }
                   if (onSave) {
                     const isInstallmentPayment = order.paymentMode === 'planned' && order.remainingInstallments;
                     const newRemainingInstallments = isInstallmentPayment
                       ? Math.max(0, order.remainingInstallments - selectedInstallments.length)
                       : undefined;
                     
                     onSave({
                       id: order.id,
                       payAmount: parsedValue,
                       paymentMethod: paymentMethod,
                       remainingInstallments: newRemainingInstallments
                     });
                   }
                   setIsPaymentModalOpen(false);
                 }}
                 disabled={
                   (() => {
                     const valNum = parseFloat(paymentValue.replace(",", "."));
                     if (isNaN(valNum) || valNum <= 0) return true;
                     if (order.paymentMode === 'planned' && order.remainingInstallments) {
                       const instVal = order.remainingInstallmentValue || 0;
                       if (selectedInstallments.length === 0) return true;
                       if (valNum < (selectedInstallments.length * instVal)) return true;
                     }
                     return false;
                   })()
                 }
                 className="flex-1 py-2.5 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Confirmar Pagamento
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ETIQUETA A6 */}
      {isLabelModalOpen && (
        <OrderPrintA6Modal order={order} onClose={() => setIsLabelModalOpen(false)} />
      )}

    </div>
  );
};
