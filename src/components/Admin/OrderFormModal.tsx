import React, { useState, useEffect, useRef } from "react";
import { Order, Product, CompanyId } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { safeFormat } from "../../lib/dateUtils";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";
import { X, CheckCircle, Trash2 } from "lucide-react";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

export interface OrderFormModalProps {
  editingOrder: Partial<Order> | null;
  products: Product[];
  companyId: string;
  onClose: () => void;
  onSave: (data: Partial<Order>) => void;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  editingOrder,
  products,
  companyId,
  onClose,
  onSave,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isSavingRef = useRef(false);
  const [items, setItems] = useState<any[]>(editingOrder?.items || []);
  const [shipping, setShipping] = useState(editingOrder?.shippingCost || 0);
  const [discount, setDiscount] = useState(editingOrder?.discount || 0);
  const [signalValue, setSignalValue] = useState(editingOrder?.signalValue || 0);
  const [paymentMethod, setPaymentMethod] = useState(editingOrder?.paymentMethod || "");

  const [observations, setObservations] = useState(
    editingOrder?.observations || "",
  );
  const [selectedAtelier, setSelectedAtelier] = useState<CompanyId>(
    (editingOrder?.companyId as CompanyId) || (companyId as CompanyId),
  );
  const [cpfCnpj, setCpfCnpj] = useState(editingOrder?.customerCpfCnpj || "");
  const [contact, setContact] = useState(editingOrder?.contact || "");
  const [deliveryType, setDeliveryType] = useState(
    editingOrder?.deliveryType || "retirada",
  );
  const [isWholesale, setIsWholesale] = useState(
    editingOrder?.isWholesale || false,
  );
  const [responsible, setResponsible] = useState(editingOrder?.responsible || "");
  const [priority, setPriority] = useState<Order["priority"]>(editingOrder?.priority || "normal");

  const [customizationName, setCustomizationName] = useState(editingOrder?.customizationName || "");
  const [customizationTheme, setCustomizationTheme] = useState(editingOrder?.customizationTheme || "");
  const [customizationColors, setCustomizationColors] = useState(editingOrder?.customizationColors || "");
  const [customizationArtText, setCustomizationArtText] = useState(editingOrder?.customizationArtText || "");
  const [customizationEventDate, setCustomizationEventDate] = useState(editingOrder?.customizationEventDate || "");
  const [customizationNotes, setCustomizationNotes] = useState(editingOrder?.customizationNotes || "");

  const subtotal = items.reduce(
    (sum, it) => sum + (it.retail_price || it.current_price || 0) * it.quantity,
    0,
  );
  const totalWithShipping = Math.max(0, subtotal - discount + shipping);
  const remainingValue = Math.max(0, totalWithShipping - signalValue);

  const companiesList = [
    { id: "pallyra", name: "La Pallyra" },
    { id: "guennita", name: "com amor, Guennita" },
    { id: "mimada", name: "Mimada Sim" },
    { id: "tuttymimo", name: "Tutty Mimo" },
  ];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-gray-200 p-8 md:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 text-[#8E8E93] transition-all"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-medium text-slate-900 tracking-normal mb-8">
          {editingOrder?.id ? "Editar Pedido" : "Novo Pedido"}
        </h2>

        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
            {formError}
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading || isSavingRef.current) return;
            setFormError(null);
            isSavingRef.current = true;
            setLoading(true);
            try {
              const formData = new FormData(e.currentTarget);
              
              if (deliveryType !== "retirada") {
                const addressVal = (formData.get("address") as string || "").trim();
                if (!addressVal) {
                  setFormError("O endereço é obrigatório para pedidos que exigem entrega.");
                  isSavingRef.current = false;
                  setLoading(false);
                  return;
                }
                const segments = addressVal.split(",").map(s => s.trim()).filter(Boolean);
                if (segments.length < 3 || addressVal.length < 15) {
                  setFormError("O endereço fornecido está incompleto. Por favor, preencha o endereço completo contendo pelo menos: Rua, Número, Bairro e Cidade.");
                  isSavingRef.current = false;
                  setLoading(false);
                  return;
                }
              }

              await onSave({
                customerName: formData.get("customerName") as string,
                contact: contact,
                customerCpfCnpj: cpfCnpj,
                address: formData.get("address") as string,
                total: totalWithShipping,
                status: formData.get("status") as any,
                deliveryDate: formData.get("deliveryDate") as string,
                deliveryType: deliveryType as any,
                shippingCost: shipping,
                discount: discount,
                observations: observations,
                hasSignal: signalValue > 0,
                signalValue: signalValue,
                paymentMethod: paymentMethod,
                items,
                isWholesale: isWholesale,
                isEmergency: formData.get("isEmergency") === "on",
                companyId: selectedAtelier,
                marketplace: (formData.get("marketplace") as string) || "",
                marketplaceTax: Number(formData.get("marketplaceTax")) || 0,
                responsible: responsible,
                priority: priority,
                customizationName: customizationName,
                customizationTheme: customizationTheme,
                customizationColors: customizationColors,
                customizationArtText: customizationArtText,
                customizationEventDate: customizationEventDate,
                customizationNotes: customizationNotes,
              });
              onClose();
            } catch (err) {
              console.error("Erro ao salvar pedido:", err);
              orchestrator.dispatchEvent({
                type: 'FEEDBACK',
                message: "Erro ao salvar pedido.",
                priority: 'HIGH',
                customerName: '',
                productName: '',
                companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
                data: { success: false, title: 'Erro' }
              });
            } finally {
              isSavingRef.current = false;
              setLoading(false);
            }
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Escolher Ateliê
              </label>
              <select
                value={selectedAtelier}
                onChange={(e) =>
                  setSelectedAtelier(e.target.value as CompanyId)
                }
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              >
                {companiesList.map((c, cIdx) => (
                  <option key={`company-opt-${c.id}-${cIdx}`} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Nome do Cliente
              </label>
              <input
                name="customerName"
                defaultValue={editingOrder?.customerName}
                required
                type="text"
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                CPF / CNPJ
              </label>
              <input
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCPFOrCNPJ(e.target.value))}
                placeholder="000.000.000-00"
                required
                type="text"
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Contato
              </label>
              <input
                value={contact}
                onChange={(e) => setContact(formatPhone(e.target.value))}
                required
                type="text"
                placeholder="(44) 9 9999-9999"
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Endereço Completo
              </label>
              <input
                name="address"
                defaultValue={editingOrder?.address}
                required={deliveryType !== "retirada"}
                type="text"
                placeholder="Rua, Número, Bairro, Cidade"
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Tipo de Entrega
              </label>
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as any)}
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-medium outline-none text-slate-900"
              >
                <option value="retirada">RETIRADA</option>
                <option value="delivery">DELIVERY</option>
                <option value="shipping">ENVIO</option>
              </select>
            </div>
          </div>

          {deliveryType === "shipping" && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 animate-in fade-in slide-in-from-top-2">
              <label className="text-[9px] uppercase font-medium text-blue-400 tracking-widest block mb-2">
                Custo do Frete (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value))}
                className="w-full bg-white border border-blue-200 rounded-xl px-5 py-3 text-[11px] font-medium outline-none font-mono text-blue-600"
              />
            </div>
          )}

          {/* Incluir Produto Select */}
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-medium uppercase text-gray-700 tracking-widest">
                Produtos Selecionados
              </h4>
              <div className="text-[10px] font-medium text-slate-900">
                Ateliê: {selectedAtelier.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <select
                onChange={(e) => {
                  const p = products.find((prod) => prod.id === e.target.value);
                  if (p) {
                    const existingIdx = items.findIndex((i) => i.id === p.id);
                    if (existingIdx !== -1) {
                      const newItems = [...items];
                      newItems[existingIdx].quantity =
                        (newItems[existingIdx].quantity || 1) + 1;
                      setItems(newItems);
                    } else {
                      setItems([...items, { ...p, quantity: 1 }]);
                    }
                  }
                  e.target.value = "";
                }}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[11px] font-bold outline-none"
              >
                <option value="">+ Adicionar Produto do Catálogo...</option>
                {products
                  .filter((p) => p.company === selectedAtelier)
                  .map((p, pIdx) => (
                    <option key={`prod-opt-${p.id}-${pIdx}`} value={p.id}>
                      {p.product_name} - {formatCurrency(p.retail_price)}
                    </option>
                  ))}
              </select>
            </div>

            {items.map((item, idx) => (
              <div
                key={`edit-cart-item-${item.id || "new"}-${idx}`}
                className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
              >
                <span className="flex-1 text-[11px] font-bold text-gray-700">
                  {item.product_name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-[#8E8E93]">
                    QTD:
                  </span>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].quantity = Number(e.target.value);
                      setItems(newItems);
                    }}
                    className="w-16 bg-white border border-gray-100 rounded-lg px-2 py-1 text-[11px] font-medium text-center"
                  />
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-900 w-24 text-right">
                  {formatCurrency(
                    (item.retail_price || item.current_price || 0) * (item.quantity || 0),
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="text-[#D1D1D6] hover:text-rose-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Data de Entrega / Evento
              </label>
              <input
                name="deliveryDate"
                defaultValue={
                  editingOrder?.deliveryDate ||
                  safeFormat(new Date(), "yyyy-MM-dd")
                }
                required
                type="date"
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Status Inicial
              </label>
              <select
                name="status"
                defaultValue={editingOrder?.status || "novo pedido"}
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-medium outline-none text-slate-900"
              >
                <option value="novo pedido">NOVO PEDIDO</option>
                <option value="quote">ORÇAMENTO</option>
                <option value="waiting_deposit">SINAL</option>
                <option value="approval">APROVAÇÃO</option>
                <option value="production">EM PRODUÇÃO</option>
                <option value="assembly">MONTAGEM</option>
                <option value="conferencing">CONFERÊNCIA</option>
                <option value="packaging">EMBALAGEM</option>
                <option value="ready">PRONTO PARA ENTREGAR</option>
                <option value="delivery">ENVIADO/ENTREGA</option>
                <option value="delivered">ENTREGUE/RECEBIDO</option>
                <option value="cancelled">CANCELADO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Responsável
              </label>
              <input
                type="text"
                placeholder="Nome do responsável..."
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900 font-sans"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Order["priority"])}
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-medium outline-none text-slate-900"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Personalização Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase font-black text-pink-600 tracking-widest pl-2">
              Personalização do Pedido
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-pink-50/20 border border-pink-100/30 p-5 rounded-[22px]">
              {/* Nome para Personalização */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Nome para Personalização
                </label>
                <input
                  type="text"
                  placeholder="Nome do aniversariante, casal, etc."
                  value={customizationName}
                  onChange={(e) => setCustomizationName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900 font-sans"
                />
              </div>

              {/* Tema */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Tema
                </label>
                <input
                  type="text"
                  placeholder="Tema do evento..."
                  value={customizationTheme}
                  onChange={(e) => setCustomizationTheme(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900 font-sans"
                />
              </div>

              {/* Cores */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Cores
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rosa e Dourado..."
                  value={customizationColors}
                  onChange={(e) => setCustomizationColors(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900 font-sans"
                />
              </div>

              {/* Texto da Arte */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Texto da Arte
                </label>
                <input
                  type="text"
                  placeholder="Texto que irá na arte..."
                  value={customizationArtText}
                  onChange={(e) => setCustomizationArtText(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900 font-sans"
                />
              </div>

              {/* Data do Evento */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Data do Evento
                </label>
                <input
                  type="date"
                  value={customizationEventDate}
                  onChange={(e) => setCustomizationEventDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900 font-sans"
                />
              </div>

              {/* Observações da Personalização */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Observações da Personalização
                </label>
                <textarea
                  rows={2}
                  placeholder="Observações ou detalhes específicos da personalização..."
                  value={customizationNotes}
                  onChange={(e) => setCustomizationNotes(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-medium outline-none text-slate-900 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Checkcards and Financial Area */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setIsWholesale(!isWholesale)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isWholesale ? "bg-amber-50 border-amber-500" : "bg-white border-gray-100 text-[#8E8E93]"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isWholesale ? "bg-amber-500 border-amber-500" : "border-slate-200"}`}
                >
                  {isWholesale && (
                    <CheckCircle className="text-white" size={12} />
                  )}
                </div>
                <div>
                  <p
                    className={`text-[10px] font-medium tracking-normal ${isWholesale ? "text-amber-700" : ""}`}
                  >
                    Pedido de Atacado
                  </p>
                  <p
                    className={`text-[8px] font-bold ${isWholesale ? "text-amber-600" : ""}`}
                  >
                    Aplica aviso de atacado no comprovante
                  </p>
                </div>
              </div>
            </div>

            {/* Finance Fields */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="text-[10px] font-medium uppercase text-slate-800 tracking-widest pl-1 font-mono">
                Informações Financeiras do Pedido
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                    Desconto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                    Sinal Recebido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={signalValue || ""}
                    onChange={(e) => setSignalValue(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
                  >
                    <option value="">Selecione...</option>
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Financial Summary Display */}
              <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-white grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-wider">Subtotal</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{formatCurrency(subtotal)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-medium text-rose-500 tracking-wider">Desconto (-)</p>
                  <p className="text-sm font-mono font-bold text-rose-600">-{formatCurrency(discount)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-medium text-slate-500 tracking-wider">Frete (+)</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{formatCurrency(shipping)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-medium text-emerald-600 tracking-wider">Sinal Recebido (-)</p>
                  <p className="text-sm font-mono font-bold text-emerald-600">-{formatCurrency(signalValue)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-wider">Saldo Restante</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{formatCurrency(remainingValue)}</p>
                </div>
                <div className="bg-black text-white p-2 rounded-lg text-center flex flex-col justify-center items-center col-span-2 md:col-span-1">
                  <p className="text-[8px] uppercase font-medium text-slate-400 tracking-wider">Total Final</p>
                  <p className="text-sm font-mono font-bold text-white">{formatCurrency(totalWithShipping)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Marketplace Integration */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-gray-100 space-y-4">
            <h4 className="text-[10px] font-medium uppercase text-slate-800 tracking-widest pl-1 font-mono">
              Integração Marketplace / Origem da Venda
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Plataforma / Canal (Ex: Shopee, Mercado Livre, Elo7)
                </label>
                <select
                  name="marketplace"
                  defaultValue={editingOrder?.marketplace || ""}
                  className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-medium outline-none text-slate-900"
                >
                  <option value="">Nenhum (Venda Direta)</option>
                  <option value="shopee">Shopee</option>
                  <option value="mercado_livre">Mercado Livre</option>
                  <option value="elo7">Elo7</option>
                  <option value="shein">Shein</option>
                  <option value="site_proprio">Site Próprio</option>
                  <option value="whatsapp">WhatsApp / Instagram</option>
                  <option value="outro">Outro (Canal Externo)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Taxa do Marketplace (%)
                </label>
                <input
                  name="marketplaceTax"
                  type="number"
                  step="0.01"
                  defaultValue={editingOrder?.marketplaceTax || 0}
                  placeholder="Ex: 12.5 (12.5% de taxa)"
                  className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-medium outline-none font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
              Observações do Pedido
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-[11px] font-bold outline-none h-24 text-slate-900 resize-none"
              placeholder="Ex regular: Tamanho M, Cor Rosa, Nome Julia..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 border border-gray-200 rounded-xl font-bold uppercase text-[10px] tracking-widest text-[#8E8E93] hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-black text-white rounded-xl font-medium uppercase text-[10px] tracking-widest hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
