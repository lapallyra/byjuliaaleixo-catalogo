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
  History,
  Archive,
} from "lucide-react";
import { CSVHandler } from "./CSVHandler";
import { NewClientForm } from "./NewClientForm";
import { Customer, CompanyId, Order } from "../../types";
import {
  deleteCustomer,
  updateCustomer,
  addCustomer,
  subscribeToSales,
} from "../../services/firebaseService";
import { exportGenericReportPDF } from "../../utils/pdfGenerator";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";
import { HorizontalScroll } from "../shared/HorizontalScroll";
import { motion, AnimatePresence } from "motion/react";

interface ClientsTabProps {
  companyId: CompanyId;
  customers: Customer[];
  onNewOrder?: (customerId: string) => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  companyId,
  customers,
  onNewOrder,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<"Todos" | "PF" | "PJ" | "ComPedidos" | "SemPedidos" | "Recorrentes" | "Aniversariantes">("Todos");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "newest" | "oldest" | "revenue" | "orders">("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<10 | 20 | 50 | 100>(20);

  // Modals & Detail panels
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newCustomers = customers.filter(c => {
      const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt || 0);
      return created >= thirtyDaysAgo;
    }).length;

    const recurrent = customers.filter(c => (c.ordersCount || 0) >= 2).length;

    const accumulatedRevenue = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
    const avgTicket = total > 0 ? accumulatedRevenue / total : 0;
    
    return { total, active, inactive, newCustomers, recurrent, accumulatedRevenue, avgTicket };
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
        // Search query (name, phone, email, cpf/cnpj, city, code)
        const normSearch = searchTerm.toLowerCase();
        const cleanSearch = searchTerm.replace(/\D/g, "");
        
        const matchesSearch =
          c.name.toLowerCase().includes(normSearch) ||
          (c.email && c.email.toLowerCase().includes(normSearch)) ||
          (c.city && c.city.toLowerCase().includes(normSearch)) ||
          (c.code && c.code.toLowerCase().includes(normSearch)) ||
          (cleanSearch && c.contact && c.contact.replace(/\D/g, "").includes(cleanSearch)) ||
          (cleanSearch && c.cpfCnpj && c.cpfCnpj.replace(/\D/g, "").includes(cleanSearch));

        if (!matchesSearch) return false;

        // Quick Filters
        if (quickFilter === "PF" && c.cpfCnpj && c.cpfCnpj.length > 14) return false; // Basic PF check
        if (quickFilter === "PJ" && c.cpfCnpj && c.cpfCnpj.length <= 14) return false; // Basic PJ check
        if (quickFilter === "ComPedidos" && (c.ordersCount || 0) === 0) return false;
        if (quickFilter === "SemPedidos" && (c.ordersCount || 0) > 0) return false;
        if (quickFilter === "Recorrentes" && (c.ordersCount || 0) < 2) return false;
        if (quickFilter === "Aniversariantes") {
          if (!c.birthDate) return false;
          const [, month] = c.birthDate.split("/");
          if (parseInt(month) !== new Date().getMonth() + 1) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        if (sortBy === "name_desc") return b.name.localeCompare(a.name);
        if (sortBy === "orders") return (b.ordersCount || 0) - (a.ordersCount || 0);
        if (sortBy === "revenue") return (b.totalSpent || 0) - (a.totalSpent || 0);
        
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        
        if (sortBy === "oldest") return dateA - dateB;
        return dateB - dateA; // newest default
      });
  }, [
    customers,
    searchTerm,
    quickFilter,
    sortBy,
  ]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, quickFilter, sortBy, itemsPerPage]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
                filters: `Busca: ${searchTerm || "Nenhuma"} | Filtro Rápido: ${quickFilter}`,
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
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block">Novos Clientes (30 dias)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">+{clientKPIs.newCustomers}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block">Clientes Ativos</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-[#cca062]">{clientKPIs.active}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block">Clientes Recorrentes</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-[#1C1C1E]">{clientKPIs.recurrent}</span>
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

      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-xs p-24 flex flex-col items-center justify-center text-center mt-8">
          <div className="w-20 h-20 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-6">
            <UserPlus className="text-[#8E8E93]" size={32} />
          </div>
          <h2 className="text-[#1C1C1E] font-extrabold text-lg uppercase tracking-wider mb-2">Nenhum Cliente Cadastrado</h2>
          <p className="text-sm text-[#8E8E93] max-w-md mb-8">
            Você ainda não possui nenhum cliente registrado. Cadastre seu primeiro cliente para começar a construir seu relacionamento e registrar vendas.
          </p>
          <button
            onClick={handleOpenNewForm}
            className="flex items-center gap-2 px-8 py-4 bg-[#1C1C1E] hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-b-[3px] border-b-black"
          >
            <Plus size={16} /> Cadastrar Primeiro Cliente
          </button>
        </div>
      ) : (
        <>
          {/* CONTROL ACTIONS BAR */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* Main Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
            <input
              type="text"
              placeholder="BUSCAR POR NOME, TELEFONE, E-MAIL, CPF/CNPJ, CIDADE OU CÓDIGO..."
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
                <option value="name_asc">Nome A-Z</option>
                <option value="name_desc">Nome Z-A</option>
                <option value="newest">Mais recente</option>
                <option value="oldest">Mais antigo</option>
                <option value="revenue">Maior faturamento</option>
                <option value="orders">Mais pedidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {[
            { id: "Todos", label: "Todos" },
            { id: "PF", label: "Pessoa Física" },
            { id: "PJ", label: "Pessoa Jurídica" },
            { id: "ComPedidos", label: "Com Pedidos" },
            { id: "SemPedidos", label: "Sem Pedidos" },
            { id: "Recorrentes", label: "Recorrentes" },
            { id: "Aniversariantes", label: "Aniversariantes do mês" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                quickFilter === f.id 
                  ? "bg-[#1C1C1E] text-white border-[#1C1C1E]" 
                  : "bg-white text-[#8E8E93] border-[#E5E5EA] hover:border-[#1C1C1E] hover:text-[#1C1C1E]"
              }`}
            >
              {f.label}
            </button>
          ))}
          {quickFilter !== "Todos" && (
            <button
              onClick={() => setQuickFilter("Todos")}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all ml-auto flex items-center gap-1"
            >
              <X size={12} /> Limpar Filtro
            </button>
          )}
        </div>
      </div>

      {/* CUSTOMER CARDS GRID */}
      {paginatedCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-xs p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-4">
            <Search className="text-[#8E8E93]" size={24} />
          </div>
          <h3 className="text-[#1C1C1E] font-bold uppercase tracking-wider mb-2">Nenhum cliente encontrado</h3>
          <p className="text-xs text-[#8E8E93] max-w-sm">
            Não encontramos nenhum cliente que corresponda aos filtros e termos de pesquisa atuais.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedCustomers.map((c) => {
            const metrics = customerMetricsMap.get(c.id);

            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCustomer(c);
                  setIsDetailDrawerOpen(true);
                }}
                className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs hover:border-[#1C1C1E] transition-all cursor-pointer group flex flex-col relative"
              >
                {/* Header row: Avatar + Name + Actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {renderAvatar(c.name, c.avatarUrl, "md")}
                      {metrics?.activeOrders ? (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse border-2 border-white" />
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold text-[#cca062] uppercase tracking-wider">
                        #{c.code || "----"}
                      </span>
                      <h3 className="text-sm font-bold text-[#1C1C1E] uppercase group-hover:text-[#cca062] transition-colors line-clamp-1">
                        {c.name}
                      </h3>
                      {metrics?.isRecurrent && (
                        <span className="text-[8px] font-black text-white bg-[#cca062] px-1.5 py-[1px] rounded uppercase tracking-widest mt-1">
                          Recorrente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown Trigger (preventing drawer open) */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === c.id ? null : c.id);
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {openDropdownId === c.id && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#E5E5EA] py-1 z-50 overflow-hidden">
                        {onNewOrder && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onNewOrder(c.id); setOpenDropdownId(null); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#1C1C1E] hover:bg-[#F5F5F7] flex items-center gap-2"
                          >
                            <Plus size={14} /> Novo Pedido
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(c);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-[#1C1C1E] hover:bg-[#F5F5F7] flex items-center gap-2"
                        >
                          <Edit2 size={14} /> Editar Cliente
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (c.contact) {
                              const num = c.contact.replace(/\D/g, "");
                              window.open(`https://wa.me/55${num}`, "_blank");
                            }
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-[#1C1C1E] hover:bg-[#F5F5F7] flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Abrir WhatsApp
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                            setIsDetailDrawerOpen(true);
                            setDrawerTab("orders");
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-[#1C1C1E] hover:bg-[#F5F5F7] flex items-center gap-2"
                        >
                          <History size={14} /> Ver Histórico
                        </button>
                        <div className="h-px bg-[#F2F2F7] my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerToDelete(c.id);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <Archive size={14} /> Arquivar Cliente
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-auto text-xs border-t border-[#F2F2F7] pt-3">
                  <div>
                    <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider block mb-0.5">Telefone</span>
                    <span className="font-semibold text-[#1C1C1E]">{formatPhone(c.contact) || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider block mb-0.5">Cidade / UF</span>
                    <span className="font-medium text-[#1C1C1E] capitalize truncate block" title={`${c.city || ""} / ${c.state || ""}`}>
                      {c.city ? `${c.city} / ${c.state || ""}` : "Não informada"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider block mb-0.5">Total de Pedidos</span>
                    <span className="font-bold text-[#1C1C1E] bg-[#F5F5F7] px-2 py-0.5 rounded-md border border-[#E5E5EA]">{c.ordersCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider block mb-0.5">Última Compra</span>
                    <span className="font-medium text-[#1C1C1E]">
                      {metrics?.lastPurchaseDate ? metrics.lastPurchaseDate.toLocaleDateString("pt-BR") : "Nenhum pedido"}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 mt-1 border-t border-[#F2F2F7] flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider block">Valor Investido</span>
                    <span className="font-extrabold text-emerald-600">
                      R$ {(c.totalSpent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {filteredCustomers.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 bg-white p-4 rounded-2xl border border-[#E5E5EA] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Itens por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value) as any);
                setCurrentPage(1);
              }}
              className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-2 py-1 text-xs font-bold text-[#1C1C1E] outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">
            <span>
              {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E5E5EA] text-[#1C1C1E] hover:bg-[#F5F5F7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                disabled={currentPage * itemsPerPage >= filteredCustomers.length}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-[#E5E5EA] text-[#1C1C1E] hover:bg-[#F5F5F7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

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
              <HorizontalScroll className="border-b border-[#E5E5EA] bg-white text-xs shrink-0 w-full">
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
              </HorizontalScroll>

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
