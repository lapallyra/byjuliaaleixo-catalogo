import React, { useState } from "react";
import { ArrowLeft, X, Save, Loader2, User, Phone, Mail, FileText, Calendar, MapPin, Search } from "lucide-react";
import { CompanyId, Customer } from "../../types";
import { addCustomer } from "../../services/firebaseService";
import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface CustomerFormPageProps {
  companyId?: CompanyId;
  onClose: () => void;
  onSave?: (customerData: Partial<Customer>) => Promise<void>;
}

export const CustomerFormPage: React.FC<CustomerFormPageProps> = ({
  companyId,
  onClose,
  onSave,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [selectedAtelier, setSelectedAtelier] = useState<string>(companyId || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    cpfCnpj: "",
    birthDate: "",
    zipCode: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    status: "Ativo" as "Ativo" | "Inativo" | "Cadastro Incompleto",
    notes: "",
  });

  const handleCepSearch = async () => {
    const cleanCep = formData.zipCode.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const newCustomerPayload: Partial<Customer> = {
        ...formData,
        ...(selectedAtelier ? { companyId: selectedAtelier as CompanyId } : {}),
        totalSpent: 0,
        ordersCount: 0,
        createdAt: new Date().toISOString(),
      };

      if (onSave) {
        await onSave(newCustomerPayload);
      } else {
        await addCustomer(newCustomerPayload as any);
      }

      orchestrator.dispatchEvent({
        type: "FEEDBACK",
        message: "Cliente cadastrado na base central com sucesso!",
        priority: "HIGH",
        customerName: formData.name,
        productName: "",
        companyId: (selectedAtelier || undefined) as any,
        data: { success: true, title: "Sucesso" },
      });

      onClose();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      orchestrator.dispatchEvent({
        type: "FEEDBACK",
        message: "Erro ao cadastrar cliente.",
        priority: "HIGH",
        customerName: "",
        productName: "",
        companyId: (selectedAtelier || undefined) as any,
        data: { success: false, title: "Erro" },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto pb-12 animate-in fade-in duration-200 px-2 sm:px-3">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-4 md:p-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all border border-slate-200 flex items-center gap-1.5 text-xs font-bold"
              title="Voltar para Clientes"
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                <span>Clientes</span>
                <span>/</span>
                <span>Novo Cliente</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Novo Cliente
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Cadastre informações completas do cliente para vendas e relacionamento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all border border-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form id="new-customer-form" onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6">
          {/* Section: Dados Básicos */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-[20px] p-5 md:p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest block border-b border-slate-200/80 pb-2 mb-6">
              Dados Pessoais / Comerciais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Ateliê de Primeiro Contato <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <select
                  value={selectedAtelier}
                  onChange={(e) => setSelectedAtelier(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-slate-800 font-medium cursor-pointer"
                >
                  <option value="">Base Central / Compartilhado</option>
                  <option value="pallyra">La Pallyra</option>
                  <option value="guennita">Guennita</option>
                  <option value="mimada">Mimada</option>
                  <option value="tuttymimo">Tuttymimo</option>
                  <option value="madrinha">Madrinha</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Nome Completo <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Nome do cliente..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-slate-800 font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  WhatsApp / Telefone <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all text-slate-800 font-medium"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    placeholder="cliente@exemplo.com"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all text-slate-800 font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">CPF / CNPJ</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all text-slate-800 font-medium"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Data de Nascimento</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all text-slate-800 font-medium"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Status do Cliente</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all text-slate-800 font-medium"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="Ativo">🟢 Ativo</option>
                  <option value="Inativo">⚪ Inativo</option>
                  <option value="Cadastro Incompleto">🟡 Cadastro Incompleto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Endereço */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-[20px] p-5 md:p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest block border-b border-slate-200/80 pb-2 mb-6">
              Endereço de Entrega / Cobrança
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">CEP</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="00000-000"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs outline-none focus:border-emerald-500 text-slate-800"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCepSearch}
                    disabled={isSearchingCep}
                    className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    title="Buscar CEP"
                  >
                    {isSearchingCep ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Logradouro / Rua</label>
                <input
                  type="text"
                  placeholder="Rua, Avenida, etc."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 text-slate-800"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Número</label>
                <input
                  type="text"
                  placeholder="Ex: 123 ou S/N"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 text-slate-800"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Bairro</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 text-slate-800"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Cidade / UF</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cidade"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 text-slate-800"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="UF"
                    className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-xs outline-none focus:border-emerald-500 text-slate-800 uppercase text-center font-bold"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Observações */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-[20px] p-5 md:p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest block border-b border-slate-200/80 pb-2 mb-6">
              Observações Gerais
            </h3>
            <textarea
              rows={3}
              placeholder="Preferências do cliente, restrições ou anotações comerciais..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-500 text-slate-800"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 p-4 md:p-6 shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
          >
            Cancelar
          </button>
          <button
            form="new-customer-form"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Cliente
          </button>
        </div>
      </div>
    </div>
  );
};
