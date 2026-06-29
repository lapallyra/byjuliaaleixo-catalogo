import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Hash,
  Plus,
  X,
  Cake,
  TrendingUp,
  MapPin,
  Mail,
  Printer,
  ChevronRight,
  Copy,
  Check,
  ShoppingBag,
  DollarSign,
  Activity,
  UserCheck,
  UserX,
  Bookmark,
  Filter,
  FileSpreadsheet,
  Eye,
  MoreHorizontal,
  MessageSquare,
  Clipboard,
  Percent,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { CSVHandler } from "./CSVHandler";
import { Customer, CompanyId, Order } from "../../types";
import {
  deleteCustomer,
  updateCustomer,
  addCustomer,
  subscribeToSales,
} from "../../services/firebaseService";
import { exportGenericReportPDF } from "../../utils/pdfGenerator";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";
import { motion, AnimatePresence } from "motion/react";

interface ClientsTabProps {
  companyId: CompanyId;
  customers: Customer[];
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  companyId,
  customers,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Todos" | "Ativos" | "Inativos">("Todos");
  const [filterOrdersCount, setFilterOrdersCount] = useState<"Todos" | "1+" | "5+" | "10+">("Todos");
  const [filterMinSpent, setFilterMinSpent] = useState<"Todos" | "100" | "500" | "1000">("Todos");
  const [filterRegDate, setFilterRegDate] = useState<"Todos" | "EsteMês" | "EsteAno" | "Anterior">("Todos");
  const [sortBy, setSortBy] = useState<"name" | "spent" | "orders" | "newest">("spent");
  const [showFilters, setShowFilters] = useState(false);

  // Modals & Detail panels
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Clipboard copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk operation states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Active drawer tab
  const [drawerTab, setDrawerTab] = useState<"details" | "orders" | "products" | "timeline" | "notes">("details");

  // CRM internal note state inside drawer
  const [noteText, setNoteText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Local sales database subscription for detailed history
  const [sales, setSales] = useState<Order[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // Form states
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    cpfCnpj: "",
    birthDate: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    status: "Ativo" as "Ativo" | "Inativo" | "Cadastro Incompleto",
    notes: "",
  });

  // Subscribe to sales for deep purchase integration
  useEffect(() => {
    setLoadingSales(true);
    const unsubscribe = subscribeToSales((data) => {
      setSales(data);
      setLoadingSales(false);
    }, companyId);
    return () => unsubscribe();
  }, [companyId]);

  // Sync internal notes text when selected customer changes
  useEffect(() => {
    if (selectedCustomer) {
      setNoteText(selectedCustomer.notes || "");
    }
  }, [selectedCustomer]);

  // KPI Calculations
  const clientKPIs = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => (c.status || "Ativo") === "Ativo").length;
    const inactive = total - active;
    const accumulatedRevenue = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
    const avgTicket = total > 0 ? accumulatedRevenue / total : 0;
    
    return { total, active, inactive, accumulatedRevenue, avgTicket };
  }, [customers]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCustomers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
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

  // Advanced Filter & Sort Logic
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search query (name, email, contact, cpf/cnpj, code)
        const normSearch = searchTerm.toLowerCase();
        const cleanSearch = searchTerm.replace(/\D/g, "");
        
        const matchesSearch =
          c.name.toLowerCase().includes(normSearch) ||
          (c.email && c.email.toLowerCase().includes(normSearch)) ||
          (c.code && c.code.toLowerCase().includes(normSearch)) ||
          (cleanSearch && c.contact && c.contact.replace(/\D/g, "").includes(cleanSearch)) ||
          (cleanSearch && c.cpfCnpj && c.cpfCnpj.replace(/\D/g, "").includes(cleanSearch));

        if (!matchesSearch) return false;

        // Status filter
        const customerStatus = c.status || "Ativo";
        if (filterStatus === "Ativos" && customerStatus !== "Ativo") return false;
        if (filterStatus === "Inativos" && customerStatus !== "Inativo") return false;

        // Orders count filter
        const ordersCount = c.ordersCount || 0;
        if (filterOrdersCount === "1+" && ordersCount < 1) return false;
        if (filterOrdersCount === "5+" && ordersCount < 5) return false;
        if (filterOrdersCount === "10+" && ordersCount < 10) return false;

        // Spent filter
        const totalSpent = c.totalSpent || 0;
        if (filterMinSpent === "100" && totalSpent < 100) return false;
        if (filterMinSpent === "500" && totalSpent < 500) return false;
        if (filterMinSpent === "1000" && totalSpent < 1000) return false;

        // Registration date filter
        if (filterRegDate !== "Todos") {
          const regDate = c.createdAt?.toDate
            ? c.createdAt.toDate()
            : new Date(c.createdAt || Date.now());
          const now = new Date();
          if (filterRegDate === "EsteMês") {
            if (regDate.getMonth() !== now.getMonth() || regDate.getFullYear() !== now.getFullYear())
              return false;
          } else if (filterRegDate === "EsteAno") {
            if (regDate.getFullYear() !== now.getFullYear()) return false;
          } else if (filterRegDate === "Anterior") {
            if (regDate.getFullYear() === now.getFullYear()) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        } else if (sortBy === "orders") {
          return (b.ordersCount || 0) - (a.ordersCount || 0);
        } else if (sortBy === "newest") {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        } else {
          // Default or spent
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        }
      });
  }, [
    customers,
    searchTerm,
    filterStatus,
    filterOrdersCount,
    filterMinSpent,
    filterRegDate,
    sortBy,
  ]);

  // Birthday reminder for upcoming 7 days
  const birthdayCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!c.birthDate) return false;
      try {
        const parts = c.birthDate.split("/");
        if (parts.length < 2) return false;
        const [day, month] = parts;
        const currentYear = new Date().getFullYear();
        const birthDate = new Date(
          currentYear,
          parseInt(month) - 1,
          parseInt(day)
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999);
        return birthDate >= today && birthDate <= nextWeek;
      } catch (e) {
        return false;
      }
    });
  }, [customers]);

  // Global customer metrics map for quick summary
  const customerMetricsMap = useMemo(() => {
    const map = new Map<string, {
      activeOrders: number;
      lastPurchaseDate: Date | null;
      isRecurrent: boolean;
      topProducts: string[];
    }>();

    customers.forEach(c => {
      const cleanPhone = c.contact?.replace(/\D/g, "");
      const cleanCpf = c.cpfCnpj?.replace(/\D/g, "");
      
      const cSales = sales.filter((o) => {
        const orderPhone = o.contact?.replace(/\D/g, "");
        const orderCpf = o.customerCpfCnpj?.replace(/\D/g, "");
        return (
          (cleanPhone && orderPhone === cleanPhone) ||
          (cleanCpf && orderCpf === cleanCpf) ||
          (o.customerName && o.customerName.toLowerCase() === c.name.toLowerCase())
        );
      });

      let activeCount = 0;
      let lastDate: Date | null = null;
      const productsMap: { [name: string]: number } = {};

      cSales.forEach(o => {
        if (["pending", "processing", "production", "shipped"].includes(o.status || "")) {
          activeCount++;
        }
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
        if (!lastDate || oDate > lastDate) {
          lastDate = oDate;
        }

        o.items?.forEach(item => {
           const pName = item.product_name || "Produto";
           productsMap[pName] = (productsMap[pName] || 0) + (item.quantity || 1);
        });
      });

      const topProducts = Object.entries(productsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      map.set(c.id, {
        activeOrders: activeCount,
        lastPurchaseDate: lastDate,
        isRecurrent: cSales.length > 1,
        topProducts
      });
    });

    return map;
  }, [customers, sales]);

  // Correlate sales to active selected customer for timeline, history, and aggregate products
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const cleanPhone = selectedCustomer.contact.replace(/\D/g, "");
    const cleanCpf = selectedCustomer.cpfCnpj?.replace(/\D/g, "");

    return sales.filter((o) => {
      const orderPhone = o.contact?.replace(/\D/g, "");
      const orderCpf = o.customerCpfCnpj?.replace(/\D/g, "");

      return (
        (cleanPhone && orderPhone === cleanPhone) ||
        (cleanCpf && orderCpf === cleanCpf) ||
        (o.customerName && o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase())
      );
    });
  }, [sales, selectedCustomer]);

  // Get most bought products for this client
  const customerProducts = useMemo(() => {
    const productsMap: {
      [id: string]: {
        name: string;
        image?: string;
        qty: number;
        totalSpent: number;
        lastPrice: number;
      };
    } = {};

    customerOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const id = item.id || item.product_name;
        if (!productsMap[id]) {
          productsMap[id] = {
            name: item.product_name,
            image: item.image,
            qty: 0,
            totalSpent: 0,
            lastPrice: item.price || 0,
          };
        }
        productsMap[id].qty += item.quantity || 1;
        productsMap[id].totalSpent += (item.price || 0) * (item.quantity || 1);
        productsMap[id].lastPrice = item.price || 0;
      });
    });

    return Object.values(productsMap).sort((a, b) => b.qty - a.qty);
  }, [customerOrders]);

  // Generate an elegant dynamic timeline
  const timelineEvents = useMemo(() => {
    if (!selectedCustomer) return [];
    const events: {
      id: string;
      type: "creation" | "order" | "info" | "note";
      date: Date;
      title: string;
      desc: string;
      valueLabel?: string;
      icon: any;
      statusColor?: string;
    }[] = [];

    // Registration event
    const regDate = selectedCustomer.createdAt?.toDate
      ? selectedCustomer.createdAt.toDate()
      : new Date(selectedCustomer.createdAt || Date.now());

    events.push({
      id: "creation",
      type: "creation",
      date: regDate,
      title: "Conta Criada",
      desc: "Cliente registrado na plataforma.",
      icon: UserCheck,
      statusColor: "emerald",
    });

    // Orders milestones
    customerOrders.forEach((o) => {
      const orderDate = o.createdAt?.toDate
        ? o.createdAt.toDate()
        : new Date(o.createdAt || Date.now());

      events.push({
        id: `order-${o.id}`,
        type: "order",
        date: orderDate,
        title: `Compra #${o.code || "Realizada"}`,
        desc: `Status: ${o.status.toUpperCase()}`,
        valueLabel: `R$ ${(o.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        icon: ShoppingBag,
        statusColor: o.status === "paid" || o.status === "fully_paid" || o.status === "delivered" ? "emerald" : "amber",
      });
    });

    // Birthday event
    if (selectedCustomer.birthDate) {
      try {
        const parts = selectedCustomer.birthDate.split("/");
        if (parts.length >= 2) {
          const [d, m] = parts;
          const currentYear = new Date().getFullYear();
          const birthDate = new Date(currentYear, parseInt(m) - 1, parseInt(d));
          events.push({
            id: "birthday",
            type: "info",
            date: birthDate,
            title: `Aniversário (${selectedCustomer.birthDate})`,
            desc: "Data especial de nascimento registrada.",
            icon: Cake,
            statusColor: "purple",
          });
        }
      } catch (e) {}
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selectedCustomer, customerOrders]);

  // CRM notes updates
  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setSavingNotes(true);
    try {
      await updateCustomer(selectedCustomer.id, {
        notes: noteText,
      });
      // Update local object representation in drawer
      setSelectedCustomer({
        ...selectedCustomer,
        notes: noteText,
      });
      alert("Notas e observações atualizadas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar observações.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Toggle quick status (Ativo / Inativo)
  const handleToggleStatus = async (customer: Customer) => {
    const newStatus = (customer.status || "Ativo") === "Ativo" ? "Inativo" : "Ativo";
    try {
      await updateCustomer(customer.id, { status: newStatus });
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer({ ...selectedCustomer, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar status do cliente.");
    }
  };

  // Form handlers
  const handleOpenNewForm = () => {
    setSelectedCustomer(null);
    setFormData({
      name: "",
      contact: "",
      email: "",
      cpfCnpj: "",
      birthDate: "",
      address: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      status: "Ativo",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      contact: customer.contact,
      email: customer.email || "",
      cpfCnpj: customer.cpfCnpj || "",
      birthDate: customer.birthDate || "",
      address: customer.address || "",
      number: customer.number || "",
      neighborhood: customer.neighborhood || "",
      city: customer.city || "",
      state: customer.state || "",
      zipCode: customer.zipCode || "",
      status: customer.status || "Ativo",
      notes: customer.notes || "",
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      setLoading(true);
      try {
        await deleteCustomer(customerToDelete);
        if (selectedCustomer?.id === customerToDelete) {
          setIsDetailDrawerOpen(false);
          setSelectedCustomer(null);
        }
      } catch (error) {
        console.error("Erro ao deletar cliente:", error);
      } finally {
        setLoading(false);
        setCustomerToDelete(null);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalStatus = formData.status;
      if (selectedCustomer && selectedCustomer.status === "Cadastro Incompleto") {
        const hasAllMandatory = formData.cpfCnpj && formData.email && formData.address && formData.city && formData.state && formData.zipCode;
        if (hasAllMandatory) {
          finalStatus = "Ativo";
        }
      }

      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, {
          ...formData,
          status: finalStatus,
          companyId,
        });
        alert("Cliente atualizado!");
      } else {
        await addCustomer({
          ...formData,
          companyId,
          totalSpent: 0,
          ordersCount: 0,
        });
        alert("Cliente cadastrado com sucesso!");
      }

      setIsModalOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente.");
    } finally {
      setLoading(false);
    }
  };

  // Copy full customer summary card to clipboard
  const handleCopyCustomerSummary = (customer: Customer) => {
    const ordersSummary = sales.filter((o) => {
      const cleanPhone = customer.contact.replace(/\D/g, "");
      const orderPhone = o.contact?.replace(/\D/g, "");
      return cleanPhone && orderPhone === cleanPhone;
    });

    const summaryText = `
=== RESUMO CRM CLIENTE ===
Código: #${customer.code}
Nome: ${customer.name}
Telefone: ${formatPhone(customer.contact)}
E-mail: ${customer.email || "Não cadastrado"}
CPF/CNPJ: ${customer.cpfCnpj ? formatCPFOrCNPJ(customer.cpfCnpj) : "Não cadastrado"}
Data de Nascimento: ${customer.birthDate || "Não informada"}
Endereço: ${customer.address ? `${customer.address}, ${customer.number} - ${customer.neighborhood}, ${customer.city}/${customer.state} (${customer.zipCode})` : "Sem endereço cadastrado"}
Status: ${customer.status || "Ativo"}

Histórico de Compras:
- Total Pedidos: ${customer.ordersCount || 0} un.
- Valor Investido: R$ ${(customer.totalSpent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Observações CRM: ${customer.notes || "Nenhuma anotação disponível"}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopiedId(customer.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Premium initials avatar renderer
  const renderAvatar = (name: string, url?: string, size: "sm" | "md" | "lg" = "sm") => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const dimensions = {
      sm: "w-10 h-10 text-xs",
      md: "w-16 h-16 text-lg",
      lg: "w-20 h-20 text-2xl",
    };

    if (url) {
      return (
        <img
          src={url}
          alt={name}
          className={`${dimensions[size]} rounded-2xl object-cover border border-[#E5E5EA]`}
          referrerPolicy="no-referrer"
        />
      );
    }

    const gradients = [
      "from-[#1C1C1E]/5 to-[#1C1C1E]/10 text-[#1C1C1E]",
      "from-[#cca062]/10 to-[#cca062]/20 text-[#cca062]",
      "from-emerald-50 to-emerald-100 text-emerald-700",
      "from-blue-50 to-blue-100 text-blue-700",
    ];

    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectedGradient = gradients[hash % gradients.length];

    return (
      <div
        className={`${dimensions[size]} rounded-2xl flex items-center justify-center font-extrabold uppercase tracking-widest border border-[#E5E5EA]/40 shadow-3xs bg-gradient-to-tr ${selectedGradient}`}
      >
        {initials || "?"}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 select-none">
      {/* HEADER SECTION WITH STATS CARDS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5EA] text-[#1C1C1E] shadow-sm">
            <Users size={24} className="text-[#cca062]" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight">
              Clientes & CRM
            </h3>
            <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mt-1">
              Painel de Clientes, Comportamento e Histórico de Consumo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CSVHandler
            moduleName="Clientes"
            data={filteredCustomers}
            fields={[
              "name",
              "code",
              "contact",
              "email",
              "cpfCnpj",
              "birthDate",
              "address",
              "city",
              "state",
              "zipCode",
              "status",
              "notes",
            ]}
            onImport={(newData) => {
              for (const item of newData) {
                addCustomer({
                  ...item,
                  companyId,
                  totalSpent: parseFloat(item.totalSpent) || 0,
                  ordersCount: parseInt(item.ordersCount) || 0,
                  status: item.status || "Ativo",
                });
              }
            }}
          />

          <button
            onClick={() => {
              const rows = filteredCustomers.map((c) => [
                c.name,
                c.contact || "---",
                c.email || "---",
                `${c.ordersCount || 0}`,
                `R$ ${(c.totalSpent || 0).toFixed(2)}`,
                c.status || "Ativo",
              ]);
              exportGenericReportPDF({
                title: "Relatório CRM de Clientes",
                columns: ["Nome", "Telefone", "E-mail", "Pedidos", "Total Gasto", "Status"],
                rows,
                filters: `Busca: ${searchTerm || "Nenhuma"} | Status: ${filterStatus}`,
              });
            }}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl font-bold text-xs uppercase tracking-wider text-[#1C1C1E] transition-all shadow-sm active:scale-95 cursor-pointer border-b-[3px] border-b-[#E5E5EA] hover:border-b-[#1C1C1E]"
          >
            <Printer size={15} /> Exportar PDF
          </button>

          <button
            onClick={handleOpenNewForm}
            className="flex items-center gap-2 px-6 py-3 bg-[#1C1C1E] hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-b-[3px] border-b-black"
          >
            <UserPlus size={15} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block">Total Clientes</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-[#1C1C1E]">{clientKPIs.total}</span>
            <span className="text-[10px] text-emerald-500 font-bold">100%</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block">Clientes Ativos</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-[#1C1C1E]">{clientKPIs.active}</span>
            <span className="text-[10px] text-[#cca062] font-bold">
              {clientKPIs.total > 0 ? `${((clientKPIs.active / clientKPIs.total) * 100).toFixed(0)}%` : "0%"}
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block">Faturamento Acumulado</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-extrabold text-emerald-600">
              R$ {clientKPIs.accumulatedRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block">Ticket Médio Geral</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-extrabold text-[#cca062]">
              R$ {clientKPIs.avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* BIRTHDAYS CORNER */}
      {birthdayCustomers.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50/50 via-white to-amber-50/20 border border-[#E5E5EA] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100/50 text-amber-700">
              <Cake size={20} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">
                Aniversariantes da Semana 🎉
              </h4>
              <p className="text-[11px] text-[#8E8E93] font-medium mt-1">
                {birthdayCustomers.map((c) => `${c.name} (${c.birthDate})`).join(", ")}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white border border-[#E5E5EA] text-[10px] font-bold rounded-lg text-amber-700">
            {birthdayCustomers.length} Aviso(s)
          </span>
        </div>
      )}

      {/* CONTROL ACTIONS BAR */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Main Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
            <input
              type="text"
              placeholder="BUSCAR CLIENTE POR NOME, E-MAIL, TELEFONE OU CPF..."
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-12 pr-4 py-3 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#1C1C1E] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
            {/* Sort selection */}
            <div className="flex items-center gap-2 border border-[#E5E5EA] rounded-xl px-3 py-2 bg-white">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase">ORDENAR POR:</span>
              <select
                className="text-xs font-bold bg-transparent outline-none text-[#1C1C1E] uppercase cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="spent">Maior Gasto</option>
                <option value="name">Alfabético (A-Z)</option>
                <option value="orders">Mais Pedidos</option>
                <option value="newest">Mais Recentes</option>
              </select>
            </div>

            {/* Expand filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                showFilters
                  ? "bg-[#1C1C1E] text-white border-[#1C1C1E]"
                  : "bg-white text-[#1C1C1E] border-[#E5E5EA] hover:border-[#1C1C1E]"
              }`}
            >
              <Filter size={14} /> Filtros {showFilters ? "Ativos" : ""}
            </button>
          </div>
        </div>

        {/* Expandable CRM filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#F2F2F7]">
                {/* Status Filter */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-[#8E8E93] tracking-wider">Status do Cliente</label>
                  <select
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1C1C1E]"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Ativos">Ativos</option>
                    <option value="Inativos">Inativos</option>
                  </select>
                </div>

                {/* Orders count filter */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-[#8E8E93] tracking-wider">Mínimo de Pedidos</label>
                  <select
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1C1C1E]"
                    value={filterOrdersCount}
                    onChange={(e) => setFilterOrdersCount(e.target.value as any)}
                  >
                    <option value="Todos">Todos os clientes</option>
                    <option value="1+">1+ Pedidos realizados</option>
                    <option value="5+">5+ Pedidos realizados</option>
                    <option value="10+">Clientes VIP (10+ Pedidos)</option>
                  </select>
                </div>

                {/* Spent filter */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-[#8E8E93] tracking-wider">Valor Gasto Mínimo</label>
                  <select
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1C1C1E]"
                    value={filterMinSpent}
                    onChange={(e) => setFilterMinSpent(e.target.value as any)}
                  >
                    <option value="Todos">Todos os valores</option>
                    <option value="100">Mais de R$ 100,00</option>
                    <option value="500">Mais de R$ 500,00</option>
                    <option value="1000">Mais de R$ 1.000,00</option>
                  </select>
                </div>

                {/* Registration Date Filter */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-[#8E8E93] tracking-wider">Data de Cadastro</label>
                  <select
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1C1C1E]"
                    value={filterRegDate}
                    onChange={(e) => setFilterRegDate(e.target.value as any)}
                  >
                    <option value="Todos">Qualquer período</option>
                    <option value="EsteMês">Cadastrado este mês</option>
                    <option value="EsteAno">Cadastrado este ano</option>
                    <option value="Anterior">Anos anteriores</option>
                  </select>
                </div>
              </div>

              {/* Clear filters trigger */}
              <div className="flex justify-end pt-3">
                <button
                  onClick={() => {
                    setFilterStatus("Todos");
                    setFilterOrdersCount("Todos");
                    setFilterMinSpent("Todos");
                    setFilterRegDate("Todos");
                  }}
                  className="text-[9px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 bg-rose-50/50 border border-rose-100 rounded-lg px-2.5 py-1"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CUSTOMER TABLE LISTING */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded text-[#1C1C1E] focus:ring-[#cca062]"
                    checked={
                      filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-[#8E8E93]">Código / Foto</th>
                <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-[#8E8E93]">Nome Completo / Local</th>
                <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-[#8E8E93]">Contato & E-mail</th>
                <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] text-center">Pedidos</th>
                <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] text-right">Total Gasto</th>
                <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] text-center">Status</th>
                <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2F7]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
                    Nenhum cliente atende aos critérios de pesquisa selecionados
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const isChecked = selectedIds.includes(c.id);
                  const isCopied = copiedId === c.id;
                  const cStatus = c.status || "Ativo";
                  const isIncomplete = cStatus === "Cadastro Incompleto" && (!c.cpfCnpj || !c.email || !c.address || !c.city || !c.state || !c.zipCode);
                  const metrics = customerMetricsMap.get(c.id);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#FAF9F6]/60 transition-colors group cursor-pointer relative"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setIsDetailDrawerOpen(true);
                      }}
                    >
                      {/* Checkbox cell with dynamic LED strip */}
                      <td className={`p-4 text-center relative ${isIncomplete ? "border-l-[5px] border-l-amber-500" : ""}`} onClick={(e) => e.stopPropagation()}>
                        {isIncomplete && (
                          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-amber-500 shadow-[0_0_8px_#f59e0b,0_0_15px_#f59e0b] animate-pulse" />
                        )}
                        <input
                          type="checkbox"
                          className="rounded text-[#1C1C1E] focus:ring-[#cca062]"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(c.id, e.target.checked)}
                        />
                      </td>

                      {/* Code / Avatar cell */}
                      <td className="p-4 relative">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                             {renderAvatar(c.name, c.avatarUrl, "sm")}
                             {metrics?.activeOrders ? (
                               <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse border-2 border-white" title={`${metrics.activeOrders} pedido(s) em andamento`} />
                             ) : null}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-[#cca062] uppercase tracking-wider">
                              #{c.code || "----"}
                            </span>
                            {metrics?.isRecurrent && (
                              <span className="text-[8px] font-black text-white bg-[#cca062] px-1.5 py-[1px] rounded uppercase tracking-widest mt-0.5">
                                Recorrente
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Name / Location cell */}
                      <td className="p-4">
                        <div 
                          className="space-y-0.5 group/name relative inline-block"
                          title={`Resumo: \nPedidos: ${c.ordersCount || 0} \nGasto: R$ ${(c.totalSpent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} \nÚltima Compra: ${metrics?.lastPurchaseDate ? metrics.lastPurchaseDate.toLocaleDateString() : "N/A"}`}
                        >
                          <p className="text-xs font-bold text-[#1C1C1E] group-hover:text-[#cca062] transition-colors uppercase">
                            {c.name}
                          </p>
                          <p className="text-[10px] font-medium text-[#8E8E93] flex items-center gap-1">
                            <MapPin size={10} /> {c.city || "S/Cidade"} / {c.state || "UF"}
                          </p>
                        </div>
                      </td>

                      {/* Contact & Email cell */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-[#1C1C1E]">{formatPhone(c.contact)}</p>
                          <p className="text-[10px] text-[#8E8E93] lowercase truncate max-w-[180px]">
                            {c.email || "sem_email@vitrine.com"}
                          </p>
                        </div>
                      </td>

                      {/* Total Orders cell */}
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-[#1C1C1E] bg-[#F5F5F7] border border-[#E5E5EA] px-2.5 py-0.5 rounded-md">
                          {c.ordersCount || 0}
                        </span>
                      </td>

                      {/* Total Spent cell */}
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-emerald-600">
                            R$ {(c.totalSpent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          {metrics?.lastPurchaseDate && (
                            <span className="text-[9px] text-[#8E8E93] font-medium mt-0.5">
                              {metrics.lastPurchaseDate.toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status indicator badge */}
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                            cStatus === "Ativo"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : cStatus === "Cadastro Incompleto"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          }`}
                          title="Clique para alternar status"
                        >
                          {cStatus}
                        </button>
                      </td>

                      {/* Actions quick click panel */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyCustomerSummary(c)}
                            className="p-1.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                            title="Copiar dados"
                          >
                            {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                            title="Editar cadastro"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setCustomerToDelete(c.id)}
                            className="p-1.5 bg-white border border-[#E5E5EA] hover:bg-rose-50 rounded-lg text-[#8E8E93] hover:text-rose-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER / SLIDE OVER PANEL (CRM SIDEBAR) */}
      <AnimatePresence>
        {isDetailDrawerOpen && selectedCustomer && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-[150] flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-hidden flex flex-col border-l border-[#E5E5EA]"
            >
              {/* Drawer Header Area */}
              <div className="p-6 border-b border-[#E5E5EA] flex items-center justify-between shrink-0 bg-[#F5F5F7]">
                <div className="flex items-center gap-4">
                  {renderAvatar(selectedCustomer.name, selectedCustomer.avatarUrl, "md")}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-[#1C1C1E] tracking-tight truncate max-w-[280px]">
                        {selectedCustomer.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                        (selectedCustomer.status || "Ativo") === "Ativo"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}>
                        {selectedCustomer.status || "Ativo"}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#cca062] font-bold uppercase tracking-widest mt-1">
                      Código do Cliente: #{selectedCustomer.code || "---"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    setSelectedCustomer(null);
                  }}
                  className="p-2 hover:bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* CRM KPIs Strip */}
              <div className="grid grid-cols-3 border-b border-[#E5E5EA] bg-[#FAF9F6]/50 shrink-0 text-center">
                <div className="p-4 border-r border-[#E5E5EA]">
                  <span className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-wider block">Total Investido</span>
                  <span className="text-base font-extrabold text-emerald-600 mt-1 block">
                    R$ {(selectedCustomer.totalSpent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 border-r border-[#E5E5EA]">
                  <span className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-wider block">Pedidos Realizados</span>
                  <span className="text-base font-extrabold text-[#1C1C1E] mt-1 block">
                    {selectedCustomer.ordersCount || 0} un.
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-wider block">Ticket Médio</span>
                  <span className="text-base font-extrabold text-[#cca062] mt-1 block">
                    R$ {
                      (selectedCustomer.ordersCount > 0
                        ? selectedCustomer.totalSpent / selectedCustomer.ordersCount
                        : 0
                      ).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                  </span>
                </div>
              </div>

              {/* Navigation Tabs inside Drawer */}
              <div className="flex border-b border-[#E5E5EA] bg-white text-xs shrink-0 overflow-x-auto">
                {[
                  { id: "details", label: "Dados Gerais" },
                  { id: "orders", label: `Pedidos (${customerOrders.length})` },
                  { id: "products", label: "Produtos" },
                  { id: "timeline", label: "Histórico CRM" },
                  { id: "notes", label: "Notas CRM" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id as any)}
                    className={`flex-1 min-w-[90px] py-3.5 border-b-2 text-center font-bold uppercase text-[9px] tracking-wider transition-all whitespace-nowrap ${
                      drawerTab === tab.id
                        ? "border-[#cca062] text-[#cca062] bg-[#FAF9F6]/30"
                        : "border-transparent text-[#8E8E93] hover:text-[#1C1C1E]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#FAF9F6]/30">
                {drawerTab === "details" && (
                  <div className="space-y-6">
                    {/* Personal data panel */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-3xs space-y-4">
                      <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#F2F2F7] pb-2">
                        Dados Pessoais
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block">CPF / CNPJ</span>
                          <span className="text-xs font-bold text-[#1C1C1E]">
                            {selectedCustomer.cpfCnpj ? formatCPFOrCNPJ(selectedCustomer.cpfCnpj) : "Não Informado"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block">Nascimento</span>
                          <span className="text-xs font-bold text-[#1C1C1E]">{selectedCustomer.birthDate || "Não Informado"}</span>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block">E-mail</span>
                          <span className="text-xs font-bold text-[#1C1C1E] break-all">{selectedCustomer.email || "Não Informado"}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block">Telefone</span>
                          <span className="text-xs font-bold text-[#1C1C1E]">{formatPhone(selectedCustomer.contact)}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block">Data de Cadastro</span>
                          <span className="text-xs font-bold text-[#1C1C1E]">
                            {selectedCustomer.createdAt?.toDate
                              ? selectedCustomer.createdAt.toDate().toLocaleDateString("pt-BR")
                              : new Date(selectedCustomer.createdAt || Date.now()).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Address panel */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-3xs space-y-4">
                      <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#F2F2F7] pb-2 flex items-center gap-1.5">
                        <MapPin size={12} /> Endereço de Entrega
                      </h5>
                      {selectedCustomer.address ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-[#1C1C1E] uppercase">
                            {selectedCustomer.address}, nº {selectedCustomer.number || "S/N"}
                          </p>
                          <p className="text-xs font-semibold text-[#8E8E93] uppercase">
                            Bairro: {selectedCustomer.neighborhood || "Não Informado"}
                          </p>
                          <p className="text-xs font-bold text-[#cca062] uppercase">
                            {selectedCustomer.city} - {selectedCustomer.state} {selectedCustomer.zipCode ? `| CEP: ${selectedCustomer.zipCode}` : ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs italic text-[#8E8E93]">Nenhum endereço cadastrado para este cliente.</p>
                      )}
                    </div>

                    {/* Latest Purchases & Preferences */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-3xs space-y-4">
                      <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#F2F2F7] pb-2 flex items-center gap-1.5">
                        <ShoppingBag size={12} /> Últimos Produtos & Preferências
                      </h5>
                      
                      <div className="space-y-4">
                        {/* Latest Purchase */}
                        <div>
                           <p className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] mb-2">Última Compra</p>
                           {customerOrders.length > 0 ? (
                             <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA]">
                               <div className="flex items-center justify-between mb-2">
                                 <span className="text-xs font-bold text-[#1C1C1E] uppercase">Pedido #{customerOrders[0].code || '---'}</span>
                                 <span className="text-[10px] font-bold text-[#8E8E93]">
                                   {customerOrders[0].createdAt?.toDate ? customerOrders[0].createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                                 </span>
                               </div>
                               <p className="text-xs text-[#8E8E93] truncate">
                                 {customerOrders[0].items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ') || 'Sem itens'}
                               </p>
                             </div>
                           ) : (
                             <p className="text-xs italic text-[#8E8E93]">Nenhuma compra registrada.</p>
                           )}
                        </div>

                        {/* Top Preferences */}
                        {customerProducts.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] mb-2">Preferências (Mais Comprados)</p>
                            <div className="flex flex-wrap gap-2">
                              {customerProducts.slice(0, 3).map((p, idx) => (
                                <span key={idx} className="px-2.5 py-1 text-[10px] font-bold text-[#cca062] bg-[#cca062]/10 rounded-lg border border-[#cca062]/20 uppercase">
                                  {p.qty}x {p.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {drawerTab === "orders" && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#E5E5EA] pb-2">
                      Histórico de Pedidos ({customerOrders.length})
                    </h5>

                    {loadingSales ? (
                      <div className="flex justify-center p-8">
                        <RefreshCw className="animate-spin text-[#cca062]" />
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-[#E5E5EA] p-6">
                        <ShoppingBag size={32} className="mx-auto text-[#D1D1D6] mb-2" />
                        <p className="text-xs font-bold text-[#8E8E93] uppercase">Nenhum pedido encontrado</p>
                        <p className="text-[10px] text-[#8E8E93] mt-1">Este cliente ainda não realizou compras registradas no painel.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerOrders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-white p-4 rounded-xl border border-[#E5E5EA] shadow-3xs flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#cca062]">#{order.code || "---"}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider border ${
                                order.status === "paid" || order.status === "fully_paid"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {order.status}
                              </span>
                            </div>

                            <div className="text-xs font-semibold text-[#8E8E93]">
                              {order.items?.map((item) => `${item.quantity || 1}x ${item.product_name}`).join(", ")}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7]">
                              <span className="text-[10px] text-[#8E8E93] font-medium">
                                {order.createdAt?.toDate
                                  ? order.createdAt.toDate().toLocaleString("pt-BR")
                                  : new Date(order.createdAt || Date.now()).toLocaleString("pt-BR")}
                              </span>
                              <span className="text-xs font-bold text-[#1C1C1E]">
                                R$ {(order.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {drawerTab === "products" && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#E5E5EA] pb-2">
                      Produtos Preferidos do Cliente
                    </h5>
                    {customerProducts.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-[#E5E5EA] p-6">
                        <ShoppingBag size={32} className="mx-auto text-[#D1D1D6] mb-2" />
                        <p className="text-xs font-bold text-[#8E8E93] uppercase">Nenhum produto comprado</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {customerProducts.map((p, idx) => (
                          <div
                            key={`p-pref-${idx}`}
                            className="bg-white p-3.5 rounded-xl border border-[#E5E5EA] shadow-3xs flex items-center gap-3"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7] shrink-0">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#1C1C1E] truncate uppercase">{p.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] font-bold text-[#cca062] bg-[#cca062]/10 px-1.5 py-0.5 rounded">
                                  {p.qty} comprados
                                </span>
                                <span className="text-xs font-bold text-[#1C1C1E]">
                                  R$ {p.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {drawerTab === "timeline" && (
                  <div className="space-y-6">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#E5E5EA] pb-2">
                      Linha do Tempo CRM
                    </h5>

                    <div className="relative pl-6 border-l-2 border-[#E5E5EA]/80 ml-3 space-y-6 py-2">
                      {timelineEvents.map((ev, index) => {
                        const IconComponent = ev.icon;
                        return (
                          <div key={ev.id} className="relative">
                            {/* Dot icon */}
                            <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border border-[#E5E5EA] flex items-center justify-center shadow-3xs text-[#1C1C1E]">
                              <IconComponent size={12} className={ev.statusColor === "emerald" ? "text-emerald-600" : "text-[#cca062]"} />
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-[#E5E5EA] shadow-3xs space-y-1">
                              <div className="flex items-center justify-between">
                                <h6 className="text-xs font-bold text-[#1C1C1E] uppercase">{ev.title}</h6>
                                <span className="text-[9px] text-[#8E8E93] font-bold">
                                  {ev.date.toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8E8E93] font-medium leading-relaxed">{ev.desc}</p>
                              {ev.valueLabel && (
                                <span className="inline-block mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                  {ev.valueLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {drawerTab === "notes" && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#E5E5EA] pb-2">
                      Observações & Registro Interno CRM
                    </h5>

                    <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-3xs space-y-4">
                      <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider leading-relaxed">
                        Escreva notas de atendimento, preferências de brindes, observações sobre entregas especiais ou feedbacks. Estas informações são estritamente internas e seguras.
                      </p>

                      <textarea
                        rows={6}
                        className="w-full bg-[#FAF9F6] border border-[#E5E5EA] rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-[#1C1C1E] resize-none"
                        placeholder="Ex: Prefere embalagem minimalista em papel kraft. Entrar em contato via WhatsApp nas sextas-feiras."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          className="px-5 py-2.5 bg-[#1C1C1E] text-white hover:bg-black font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-sm active:scale-95 border-b-[3px] border-b-black"
                        >
                          {savingNotes ? "Salvando..." : "Salvar Notas Internas"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer footer */}
              <div className="p-6 bg-[#F5F5F7] border-t border-[#E5E5EA] flex items-center justify-between shrink-0">
                <button
                  onClick={() => handleCopyCustomerSummary(selectedCustomer)}
                  className="px-4 py-2.5 bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Copy size={13} /> Copiar Resumo
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      handleOpenEdit(selectedCustomer);
                    }}
                    className="px-5 py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#E5E5EA] text-[#1C1C1E] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                  >
                    Editar Dados
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      setCustomerToDelete(selectedCustomer.id);
                    }}
                    className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW & EDIT FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fffdfa] w-full max-w-2xl rounded-3xl border border-[#E5E5EA] shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="px-8 py-5 border-b border-[#E5E5EA] flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-[#1C1C1E]">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1C1C1E]">
                      {selectedCustomer ? "Editar Cadastro do Cliente" : "Cadastrar Novo Cliente"}
                    </h4>
                    <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider mt-0.5">
                      Vitrine CRM Database
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedCustomer(null);
                  }}
                  className="p-2 hover:bg-[#F5F5F7] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer border border-[#E5E5EA]"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                {/* Basic info header */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#E5E5EA] pb-1.5">
                    Informações Pessoais
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Nome Completo *</label>
                      <input
                        required
                        type="text"
                        placeholder="Ex: Maria Alice Ferreira"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Contato / WhatsApp *</label>
                      <input
                        required
                        type="text"
                        placeholder="(00) 00000-0000"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: formatPhone(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">E-mail (Opcional)</label>
                      <input
                        type="email"
                        placeholder="exemplo@gmail.com"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">CPF ou CNPJ</label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.cpfCnpj}
                        onChange={(e) => setFormData({ ...formData, cpfCnpj: formatCPFOrCNPJ(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Data de Nascimento</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.birthDate}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "");
                          v = v.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
                          setFormData({ ...formData, birthDate: v });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Address block */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#E5E5EA] pb-1.5 flex items-center gap-1">
                    <MapPin size={11} /> Endereço Residencial
                  </h5>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Rua / Logradouro</label>
                      <input
                        type="text"
                        placeholder="Rua das Acácias"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Número</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Bairro</label>
                      <input
                        type="text"
                        placeholder="Centro"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Cidade</label>
                      <input
                        type="text"
                        placeholder="São Paulo"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">UF (Estado)</label>
                      <select
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1C1C1E]"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      >
                        <option value="">UF</option>
                        {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 col-span-3">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">CEP</label>
                      <input
                        type="text"
                        placeholder="00000-000"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.zipCode}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "");
                          v = v.replace(/(\d{5})(\d{3})/, "$1-$2");
                          setFormData({ ...formData, zipCode: v });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* CRM Notes & Status */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] border-b border-[#E5E5EA] pb-1.5">
                    Configuração CRM
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Status CRM</label>
                      <select
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1C1C1E]"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Cadastro Incompleto">Cadastro Incompleto</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">Observações Iniciais</label>
                      <input
                        type="text"
                        placeholder="Preferências, feedbacks..."
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="pt-6 border-t border-[#E5E5EA] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedCustomer(null);
                    }}
                    disabled={loading}
                    className="px-5 py-2.5 border border-[#E5E5EA] rounded-xl text-xs font-bold text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#1C1C1E] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer border-b-[3px] border-b-black"
                  >
                    {loading ? "Salvando..." : selectedCustomer ? "Atualizar Cliente" : "Cadastrar Cliente"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {customerToDelete && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-sm w-full rounded-2xl p-6 text-center border border-[#E5E5EA]"
            >
              <Trash2 size={40} className="mx-auto text-rose-500 mb-4" />
              <h3 className="text-sm font-bold text-[#1C1C1E] uppercase">
                Excluir Cliente Permanentemente?
              </h3>
              <p className="text-xs text-[#8E8E93] mt-2 leading-relaxed">
                Essa ação não pode ser desfeita. Isso não apagará os pedidos feitos pelo cliente, mas removerá o registro cadastral do CRM permanentemente.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCustomerToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-xs uppercase text-[#8E8E93] hover:text-[#1C1C1E] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase shadow-md shadow-rose-200 hover:bg-rose-600 transition-all cursor-pointer"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM BULK DELETE MODAL */}
      <AnimatePresence>
        {isBulkDeleteModalOpen && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-sm w-full rounded-2xl p-6 text-center border border-[#E5E5EA]"
            >
              <Trash2 size={40} className="mx-auto text-rose-500 mb-4" />
              <h3 className="text-sm font-bold text-[#1C1C1E] uppercase">
                Excluir {selectedIds.length} Clientes?
              </h3>
              <p className="text-xs text-[#8E8E93] mt-2 leading-relaxed">
                Você selecionou {selectedIds.length} clientes para exclusão permanente. Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-xs uppercase text-[#8E8E93] hover:text-[#1C1C1E] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase shadow-md shadow-rose-200 hover:bg-rose-700 transition-all cursor-pointer"
                >
                  Sim, Excluir todos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION STRIP FOR SELECTED ITEMS */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-[#E5E5EA] shadow-2xl rounded-2xl p-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {selectedIds.length} {selectedIds.length === 1 ? "cliente selecionado" : "clientes selecionados"}
          </span>
          <button
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider hover:bg-rose-700 transition-all hover:scale-102 active:scale-95 shadow-md shadow-rose-100"
          >
            <Trash2 size={13} /> Excluir Selecionados
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-[9px] font-bold uppercase tracking-widest text-[#8E8E93] hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};
