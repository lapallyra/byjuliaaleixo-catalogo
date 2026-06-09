import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Phone,
  Hash,
  Plus,
  X,
  Cake,
  TrendingUp,
  MapPin,
  Calendar as CalendarIcon,
  Mail,
  Printer,
} from "lucide-react";
import { CSVHandler } from "./CSVHandler";
import { Customer, CompanyId } from "../../types";
import {
  deleteCustomer,
  updateCustomer,
  addCustomer,
} from "../../services/firebaseService";
import { exportGenericReportPDF } from "../../utils/pdfGenerator";
import { isWithinInterval, addDays, startOfDay, endOfDay } from "date-fns";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";

interface ClientsTabProps {
  companyId: CompanyId;
  customers: Customer[];
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  companyId,
  customers,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCustomers.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await deleteCustomer(id);
      }
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      alert("Clientes excluídos com sucesso!");
    } catch (e) {
      console.error("Erro na exclusão em massa:", e);
      alert("Houve um erro ao excluir um ou mais clientes.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.cpfCnpj && c.cpfCnpj.includes(searchTerm)) ||
          (c.code && c.code.includes(searchTerm));
        return matchesSearch;
      }).sort((a, b) => a.name.localeCompare(b.name)),
    [customers, searchTerm],
  );

  const birthdayCustomers = useMemo(
    () =>
      customers.filter((c) => {
        if (!c.birthDate) return false;
        try {
          const parts = c.birthDate.split("/");
          if (parts.length < 2) return false;
          const [day, month] = parts;
          const currentYear = new Date().getFullYear();
          const birthDate = new Date(
            currentYear,
            parseInt(month) - 1,
            parseInt(day),
          );
          return isWithinInterval(birthDate, {
            start: startOfDay(new Date()),
            end: endOfDay(addDays(new Date(), 7)),
          });
        } catch (e) {
          return false;
        }
      }),
    [customers],
  );

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    cpfCnpj: "",
    birthDate: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      contact: customer.contact,
      cpfCnpj: customer.cpfCnpj,
      birthDate: customer.birthDate,
      address: customer.address || "",
      number: customer.number || "",
      neighborhood: customer.neighborhood || "",
      city: customer.city || "",
      state: customer.state || "",
      zipCode: customer.zipCode || "",
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      setLoading(true);
      try {
        await deleteCustomer(customerToDelete);
      } catch (error) {
        console.error("Erro ao deletar cliente:", error);
      } finally {
        setLoading(false);
        setCustomerToDelete(null);
      }
    }
  };

  const handleDelete = (id: string) => {
    setCustomerToDelete(id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, {
          ...formData,
          companyId: companyId,
        });
        alert("Cliente atualizado!");
      } else {
        await addCustomer({
          ...formData,
          companyId: companyId,
          totalSpent: 0,
          ordersCount: 0,
        });
        alert("Cliente cadastrado com sucesso!");
      }

      setIsModalOpen(false);
      setFormData({
        name: "",
        contact: "",
        cpfCnpj: "",
        birthDate: "",
        address: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      });
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-white p-6 rounded-[2rem] border border-lilac/10 shadow-sm">
        <div className="relative w-full lg:max-w-md">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D1CACA]"
            size={18}
          />
          <input
            type="text"
            placeholder="BUSCAR CLIENTE NO SISTEMA..."
            className="w-full pl-14 pr-6 py-4 rounded-[1.25rem] bg-white border border-lilac/10 text-[10px] uppercase font-black tracking-[0.2em] outline-none focus:border-lilac transition-all shadow-sm text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto justify-center lg:justify-end">
          <CSVHandler 
            moduleName="Clientes" 
            data={filteredCustomers} 
            fields={['name', 'code', 'contact', 'cpfCnpj', 'birthDate', 'address', 'city', 'state', 'zipCode']}
            onImport={(newData) => {
                for (const item of newData) {
                    addCustomer({
                        ...item,
                        companyId: companyId,
                        totalSpent: 0,
                        ordersCount: 0,
                    });
                }
            }}
          />
          <button
            onClick={() => {
              const rows = filteredCustomers.map(c => [
                c.name,
                c.contact || (c as any).phone || "---",
                (c as any).instagram || "---",
                `${c.ordersCount || 0}`,
                `R$ ${(c.totalSpent || 0).toFixed(2)}`
              ]);
              exportGenericReportPDF({
                title: "Relatório de Clientes",
                columns: ["Nome", "Telefone", "Instagram", "Qtd. Pedidos", "Valor Investido"],
                rows,
                filters: `Busca: ${searchTerm || 'Nenhuma'}`
              });
            }}
            className="flex items-center justify-center px-6 py-4 bg-white text-[#D1CACA] border border-lilac/10 rounded-[1.25rem] hover:text-lilac hover:bg-slate-50 transition-all shadow-sm group text-[9px] font-black uppercase tracking-widest gap-2"
          >
            <Printer size={16} className="group-hover:scale-110 transition-transform" /> Abrir PDF
          </button>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-black text-white rounded-[1.25rem] font-black font-sans text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl border border-black/10"
          >
            <UserPlus size={18} /> Novo Cliente
          </button>
        </div>
      </div>

      {birthdayCustomers.length > 0 && (
        <div className="p-8 rounded-[2.5rem] bg-lilac/5 border border-lilac/10 backdrop-blur-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-white text-lilac shadow-sm border border-lilac/10">
              <Cake size={24} />
            </div>
            <div>
              <h4 className="font-black text-xs text-slate-900 uppercase tracking-widest leading-tight">
                Aniversariantes da Semana
              </h4>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 opacity-70">
                {birthdayCustomers.map((c) => c.name).join(", ")}
              </p>
            </div>
          </div>
          <p className="text-[9px] text-lilac font-black uppercase tracking-widest bg-white px-5 py-2 rounded-2xl border border-lilac/10 shadow-sm">
            {birthdayCustomers.length} Aviso(s)
          </p>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(max(300px,20%),1fr))] gap-6 pb-20">
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-lilac/20">
            <p className="text-[#A09898] italic font-black text-[10px] tracking-widest opacity-50 uppercase">
              Nenhum cliente encontrado no sistema
            </p>
          </div>
        )}
        {filteredCustomers.map((c, idx) => (
          <div
            key={c.id}
            className={`bg-white rounded-[2rem] border transition-all duration-300 p-8 flex flex-col gap-6 hover:shadow-xl group relative min-h-[360px] ${
              selectedIds.includes(c.id) ? "border-lilac ring-1 ring-lilac/20" : "border-lilac/10 hover:border-lilac/30"
            }`}
          >
            {/* Checkbox Overlay */}
            <div className="absolute top-6 left-6 z-10" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.includes(c.id)}
                onChange={(e) => handleSelectOne(c.id, e.target.checked)}
                className="rounded border-gray-300 text-lilac focus:ring-lilac cursor-pointer scale-110"
              />
            </div>

            <div className="flex items-center gap-4 pl-8">
              <div className="w-14 h-14 rounded-2xl bg-lilac/5 text-lilac flex items-center justify-center shrink-0 shadow-sm border border-lilac/10 group-hover:bg-lilac group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                  {c.name}
                </h4>
                <span className="text-[9px] font-black text-lilac tracking-widest uppercase">
                  #{c.code}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 py-4 border-t border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 text-lilac">
                  <Phone size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-[#A09898] uppercase tracking-widest">Contato</span>
                  <span className="text-[10px] font-black text-slate-700">
                    {formatPhone(c.contact)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 text-emerald-500">
                  <TrendingUp size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-[#A09898] uppercase tracking-widest">Investimento</span>
                  <span className="text-[11px] font-mono font-black text-slate-900">
                    R$ {(c.totalSpent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(c); }}
                  className="p-3 rounded-xl bg-slate-50 text-[#D1CACA] hover:text-slate-900 hover:bg-white transition-all border border-transparent hover:border-slate-200"
                  title="Editar"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                  className="p-3 rounded-xl bg-slate-50 text-rose-300 hover:text-white hover:bg-rose-500 transition-all border border-transparent"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCustomer(c);
                  setIsDetailModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-9000 text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md active:scale-95"
              >
                Perfil Completo
              </button>
            </div>
          </div>
        ))}
      </div>

      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white  w-full  max-w-2xl  rounded-[3rem] border border-lilac/30 overflow-hidden shadow-2xl  relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="h-32 bg-gradient-to-r from-lilac to-lilac/80 p-8 flex items-end">
              <div className="w-20 h-20 rounded-[2rem] bg-white text-lilac flex items-center justify-center shadow-xl translate-y-12">
                <Users size={32} />
              </div>
            </div>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedCustomer(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full bg-black/5 hover:bg-black/10 text-slate-900/60 hover:text-slate-900 transition-all"
            >
              <X size={24} />
            </button>

            <div className="px-10 pt-20 pb-12">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-[10px] font-black text-lilac uppercase tracking-[0.3em] mt-2">
                    Código do Cliente: {selectedCustomer.code}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-[#A09898] block tracking-widest mb-1">
                    Total Gasto
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-500">
                    R$ {(selectedCustomer.totalSpent || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white text-lilac">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-[#A09898] uppercase tracking-widest">
                        Contato / WhatsApp
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {formatPhone(selectedCustomer.contact)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white text-lilac">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-[#A09898] uppercase tracking-widest">
                        Documento
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedCustomer.cpfCnpj ? formatCPFOrCNPJ(selectedCustomer.cpfCnpj) : "NÃO INFORMADO"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white text-lilac">
                      <CalendarIcon size={18} />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-[#A09898] uppercase tracking-widest">
                        Nascimento
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedCustomer.birthDate || "NÃO INFORMADO"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-white text-lilac">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-[#A09898] uppercase tracking-widest">
                        Endereço
                      </p>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {selectedCustomer.address || "SEM ENDEREÇO CADASTRADO"}
                        <br />
                        <span className="text-[10px] text-[#A09898]">
                          {selectedCustomer.city} {selectedCustomer.state}{" "}
                          {selectedCustomer.zipCode}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-[#F0E6D2] flex justify-end gap-4">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-8 py-4 bg-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#A09898]"
                >
                  Fechar Resumo
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedCustomer);
                  }}
                  className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                >
                  Editar Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white  w-full  max-w-2xl  rounded-3xl border border-lilac/30 p-8 md:p-12 shadow-2xl  relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedCustomer(null);
              }}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 text-[#A09898] transition-all"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter">
              {selectedCustomer ? "Editar Cliente" : "Novo Cliente"}
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Nome Completo
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    WhatsApp / Contato
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="(00) 0 0000-0000"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                    value={formData.contact}
                    onChange={(e) => {
                      setFormData({ ...formData, contact: formatPhone(e.target.value) });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    CPF / CNPJ
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="000.000.000-00"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                    value={formData.cpfCnpj}
                    onChange={(e) => {
                      setFormData({ ...formData, cpfCnpj: formatCPFOrCNPJ(e.target.value) });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                    value={formData.birthDate}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "");
                      v = v.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
                      setFormData({ ...formData, birthDate: v });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Nº
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Bairro
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                    value={formData.neighborhood}
                    onChange={(e) =>
                      setFormData({ ...formData, neighborhood: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    UF
                  </label>
                  <select
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:border-lilac outline-none text-slate-900"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  >
                    <option value="">SELECIONE</option>
                    {[
                      "AC",
                      "AL",
                      "AP",
                      "AM",
                      "BA",
                      "CE",
                      "DF",
                      "ES",
                      "GO",
                      "MA",
                      "MT",
                      "MS",
                      "MG",
                      "PA",
                      "PB",
                      "PR",
                      "PE",
                      "PI",
                      "RJ",
                      "RN",
                      "RS",
                      "RO",
                      "RR",
                      "SC",
                      "SP",
                      "SE",
                      "TO",
                    ].map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                  CEP
                </label>
                <input
                  type="text"
                  placeholder="00.000-000"
                  className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-sm focus:border-lilac outline-none text-slate-900 font-bold"
                  value={formData.zipCode}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    v = v.replace(/(\d{2})(\d{3})(\d{3})/, "$1.$2-$3");
                    setFormData({ ...formData, zipCode: v });
                  }}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="flex-1 py-4 border border-lilac/10 rounded-2xl font-bold text-[#A09898] hover:bg-white transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-black hover:scale-105 transition-all shadow-xl uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {loading
                    ? "Salvando..."
                    : selectedCustomer
                      ? "Atualizar Cliente"
                      : "Salvar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {customerToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center animate-in zoom-in-95">
            <Trash2 size={48} className="mx-auto text-slate-9000 mb-6" />
            <h3 className="text-xl font-black mb-2 uppercase">
              Excluir Cliente?
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              Essa ação não pode ser desfeita. Isso não apagará os pedidos dele,
              mas removerá o cadastro.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-gray-500 uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-500/30"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center animate-in zoom-in-95">
            <Trash2 size={48} className="mx-auto text-rose-500 mb-6" />
            <h3 className="text-xl font-black mb-2 uppercase">
              Excluir Clientes Selecionados?
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              Essa ação não pode ser desfeita e excluirá {selectedIds.length} clientes selecionados de forma segura e permanente.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-gray-500 uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-lilac/20 shadow-2xl rounded-2xl p-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
            {selectedIds.length} {selectedIds.length === 1 ? 'cliente selecionado' : 'clientes selecionados'}
          </span>
          <button
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-rose-700 transition-all hover:scale-105 active:scale-95 shadow-md shadow-rose-200"
          >
            <Trash2 size={14} /> Excluir Selecionados
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-[9px] font-black uppercase tracking-widest text-[#A09898] hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};
