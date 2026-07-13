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
  const isSavingRef = useRef(false);
  const [items, setItems] = useState<any[]>(editingOrder?.items || []);
  const [shipping, setShipping] = useState(editingOrder?.shippingCost || 0);
  const [isDepositPaid, setIsDepositPaid] = useState(
    editingOrder?.hasSignal || false,
  );
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

  const subtotal = items.reduce(
    (sum, it) => sum + (it.retail_price || it.current_price || 0) * it.quantity,
    0,
  );
  const totalWithShipping = subtotal + shipping;
  const depositValue = subtotal * 0.5;

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

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading || isSavingRef.current) return;
            isSavingRef.current = true;
            setLoading(true);
            try {
              const formData = new FormData(e.currentTarget);
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
                observations: observations,
                hasSignal: isDepositPaid,
                signalValue: depositValue,
                items,
                isWholesale: isWholesale,
                isEmergency: formData.get("isEmergency") === "on",
                companyId: selectedAtelier,
                marketplace: (formData.get("marketplace") as string) || "",
                marketplaceTax: Number(formData.get("marketplaceTax")) || 0,
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
                required
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

          {/* Checkcards for Payment/Delivery */}
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

            <div
              onClick={() => setIsDepositPaid(!isDepositPaid)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isDepositPaid ? "bg-emerald-50 border-emerald-500" : "bg-white border-gray-100 text-[#8E8E93]"}`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDepositPaid ? "bg-emerald-500 border-emerald-500" : "border-slate-200"}`}
              >
                {isDepositPaid && (
                  <CheckCircle className="text-white" size={12} />
                )}
              </div>
              <div>
                <p
                  className={`text-[10px] font-medium tracking-normal ${isDepositPaid ? "text-emerald-700" : ""}`}
                >
                  Sinal Pago (50%)
                </p>
                <p
                  className={`text-[9px] font-bold ${isDepositPaid ? "text-emerald-600" : ""}`}
                >
                  {formatCurrency(depositValue || 0)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-black text-white flex justify-between items-center col-span-1 md:col-span-2">
              <div>
                <p className="text-[9px] font-medium tracking-tight text-[#8E8E93]">
                  Total a Pagar
                </p>
                <p className="text-lg font-mono font-medium">
                  {formatCurrency(totalWithShipping || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-[#8E8E93]">
                  {isDepositPaid ? "Restante" : "Subtotal"}
                </p>
                <p className="text-[11px] font-mono font-medium text-white">
                  {formatCurrency(
                    (isDepositPaid
                      ? totalWithShipping - depositValue
                      : totalWithShipping) || 0,
                  )}
                </p>
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
