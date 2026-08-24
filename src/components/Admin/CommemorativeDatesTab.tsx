import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Search,
  Plus,
  Trash2,
  Edit2,
  Bell,
  ArrowRight,
  AlertCircle,
  Tag,
  Briefcase,
  Heart,
  Sun,
  Crown,
  Sparkles,
  ShoppingBag,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { commemorativeDateService } from "../../services/commemorativeDateService";
import { CommemorativeDate, CategoryId } from "../../types";
import {
  format,
  isToday,
  isAfter,
  isBefore,
  addDays,
  startOfToday,
  endOfToday,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { getMobileDateOccurrence, slugify } from "../../lib/commemorativeDateUtils";
import { HorizontalScroll } from "../shared/HorizontalScroll";
import { ImageUpload } from "./ImageUpload";

const categories: {
  id: CategoryId;
  label: string;
  icon: any;
  color: string;
}[] = [
  { id: "comercial", label: "Comercial", icon: ShoppingBag, color: "#f59e0b" },
  {
    id: "profissional",
    label: "Profissional",
    icon: Briefcase,
    color: "#3b82f6",
  },
  { id: "religiosa", label: "Religiosa", icon: Crown, color: "#a855f7" },
  { id: "sazonal", label: "Sazonal", icon: Sun, color: "#10b981" },
  { id: "marketing", label: "Marketing", icon: Tag, color: "#ec4899" },
  { id: "emocional", label: "Emocional", icon: Heart, color: "#ef4444" },
  { id: "feminina", label: "Feminina", icon: Heart, color: "#db2777" },
  { id: "masculina", label: "Masculina", icon: Briefcase, color: "#1e40af" },
  { id: "infantil", label: "Infantil", icon: Sparkles, color: "#f97316" },
  { id: "escolar", label: "Escolar", icon: Briefcase, color: "#4f46e5" },
  {
    id: "empresarial",
    label: "Empresarial",
    icon: Briefcase,
    color: "#6366f1",
  },
  { id: "casamento", label: "Casamento", icon: Heart, color: "#d946ef" },
  { id: "maternidade", label: "Maternidade", icon: Heart, color: "#f43f5e" },
  { id: "social", label: "Redes Sociais", icon: Sparkles, color: "#06b6d4" },
  { id: "evento", label: "Eventos Ateliê", icon: Calendar, color: "#8b5cf6" },
];

function isValidDayMonth(day: number, month: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Months with 30 days: April (4), June (6), September (9), November (11)
  if ([4, 6, 9, 11].includes(month) && day > 30) {
    return false;
  }
  
  // February (2): max 29 days (to account for leap years)
  if (month === 2 && day > 29) {
    return false;
  }
  
  return true;
}

export function CommemorativeDatesTab() {
  const [dates, setDates] = useState<CommemorativeDate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] =
    useState<Partial<CommemorativeDate> | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formError, setFormError] = useState<string | null>(null);

  const openModal = (date: Partial<CommemorativeDate> | null) => {
    setEditingDate(date);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDate(null);
    setFormError(null);
  };

  useEffect(() => {
    const unsub = commemorativeDateService.subscribe(setDates);
  // No longer seeding initial dates to comply with SITE-005
    return unsub;
  }, []);

  const getFullDate = (
    d: CommemorativeDate,
    year = currentMonth.getFullYear(),
  ) => {
    if (!d) return new Date();
    if (d.year_fixed) {
      return new Date(year, (d.month || 1) - 1, d.day || 1);
    } else if (d.mobile_id) {
      const occurrence = getMobileDateOccurrence(d.mobile_id, year);
      return new Date(year, (occurrence.month || 1) - 1, occurrence.day || 1);
    }
    return new Date(year, (d.month || 1) - 1, d.day || 1);
  };

  const filteredDates = useMemo(() => {
    return dates
      .filter((d) => {
        if (!d) return false;
        const name = d.name || "";
        const description = d.description || "";
        const hashtags = Array.isArray(d.hashtags)
          ? d.hashtags.join(" ")
          : typeof d.hashtags === "string"
            ? d.hashtags
            : "";

        const matchesSearch =
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hashtags.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || d.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const dateA = getFullDate(a);
        const dateB = getFullDate(b);
        return dateA.getTime() - dateB.getTime();
      });
  }, [dates, searchTerm, selectedCategory, currentMonth]);

  const todayDates = useMemo(() => {
    const today = startOfToday();
    return dates.filter((d) => {
      const occurrence = getFullDate(d, today.getFullYear());
      return isToday(occurrence);
    });
  }, [dates]);

  const upcomingDates = useMemo(() => {
    const today = startOfToday();
    return dates.filter((d) => {
      const occurrence = getFullDate(d, today.getFullYear());
      return (
        isAfter(occurrence, today) && isBefore(occurrence, addDays(today, 40))
      );
    });
  }, [dates]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editingDate?.name) return;

    // 1. Name duplication validation (slug)
    const currentSlug = slugify(editingDate.name);
    const isDuplicateSlug = dates.some(
      (d) => d.id !== editingDate?.id && slugify(d.name) === currentSlug
    );
    if (isDuplicateSlug) {
      setFormError(
        `Já existe outra campanha cadastrada com um nome que gera o mesmo endereço/slug ("${currentSlug}").`
      );
      return;
    }

    // 2. Day/Month validation if it is fixed-year (not mobile date)
    if (editingDate.year_fixed) {
      const day = Number(editingDate.day ?? 1);
      const month = Number(editingDate.month ?? 1);
      if (!isValidDayMonth(day, month)) {
        setFormError(`A data informada (${day}/${month}) é inválida para o calendário.`);
        return;
      }
    }

    const data = {
      ...editingDate,
      day: Number(editingDate.day ?? 1),
      month: Number(editingDate.month ?? 1),
      priority: Number(editingDate.priority || 1),
      active: editingDate.active ?? true,
      year_fixed: editingDate.year_fixed ?? true,
      recurrent: editingDate.recurrent ?? true,
      hashtags:
        typeof editingDate.hashtags === "string"
          ? (editingDate.hashtags as string).split(",").map((h) => h.trim())
          : editingDate.hashtags || [],
    } as Omit<CommemorativeDate, "id" | "createdAt" | "updatedAt">;

    try {
      if (editingDate.id) {
        await commemorativeDateService.updateDate(editingDate.id, data);
      } else {
        await commemorativeDateService.addDate(data);
      }
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar a data comemorativa.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja excluir esta data?")) {
      await commemorativeDateService.deleteDate(id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-medium text-slate-900 tracking-tight">
            Datas Comemorativas
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Sua bússola de marketing e planejamento estratégico.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-xl text-xs font-medium tracking-normal transition-all ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-[#8E8E93] hover:text-slate-600"}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-xl text-xs font-medium tracking-normal transition-all ${viewMode === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-[#8E8E93] hover:text-slate-600"}`}
            >
              Calendário
            </button>
          </div>
          <button
            onClick={() => {
              openModal({
                category: "comercial",
                day: 1,
                month: 1,
                theme_color: "#3b82f6",
                icon: "Calendar",
                active: true,
                recurrent: true,
                year_fixed: true,
              });
            }}
            className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/10 active:scale-95 group"
          >
            <Plus
              size={18}
              className="group-hover:rotate-90 transition-transform duration-500"
            />
            <span className="text-xs font-medium tracking-normal">
              Nova Data
            </span>
          </button>
        </div>
      </div>

      {/* Widget Hoje/Próximos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Calendar size={180} strokeWidth={1} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Bell className="animate-bounce" size={24} />
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.3em] opacity-80">
                Radar de Oportunidades
              </span>
            </div>

            {todayDates.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-3xl font-display font-medium leading-tight">
                  Hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}:
                  <br />
                  <span className="text-yellow-300">
                    {todayDates.map((d) => d.name).join(" & ")}
                  </span>
                </h3>
                <p className="text-white/70 max-w-lg leading-relaxed">
                  Aproveite para criar campanhas e disparar notificações para
                  seus clientes.
                </p>
                <div className="flex gap-4 pt-4">
                  <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl text-[10px] font-medium tracking-normal hover:bg-slate-50 transition-all flex items-center gap-2">
                    Criar Campanha <ArrowRight size={14} />
                  </button>
                  <button className="bg-indigo-500/50 text-white border border-white/20 backdrop-blur-md px-6 py-3 rounded-xl text-[10px] font-medium tracking-normal hover:bg-indigo-500/70 transition-all">
                    Ver Sugestões
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-3xl font-display font-medium">
                  Nenhuma data oficial para hoje.
                </h3>
                <p className="text-white/70">
                  Que tal planejar os próximos 40 dias? A próxima grande data é{" "}
                  {upcomingDates[0]?.name || "em breve"}.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-10 border border-[#E5E5EA] shadow-xl shadow-slate-200/50">
          <h4 className="text-xs font-medium tracking-normal text-[#8E8E93] mb-8 flex items-center gap-2">
            <Clock size={16} /> Próximos 40 dias
          </h4>
          <div className="space-y-6">
            {upcomingDates.length > 0 ? (
              upcomingDates.map((d, i) => (
                <div key={d.id} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-[#8E8E93] group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <span className="text-[10px] font-medium leading-none">
                      {format(getFullDate(d), "dd")}
                    </span>
                    <span className="text-[7px] font-medium uppercase">
                      {format(getFullDate(d), "MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800">
                      {d.name}
                    </p>
                    <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-tight">
                      {categories.find((c) => c.id === d.category)?.label}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-30">
                <Calendar size={40} className="mx-auto mb-2" strokeWidth={1} />
                <p className="text-[10px] font-medium uppercase">
                  Tranquilo por enquanto
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-slate-900 transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nome, descrição ou hashtag..."
            className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-6 text-sm font-medium focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <HorizontalScroll className="items-center gap-4 pb-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-8 py-4 rounded-full text-sm font-bold tracking-normal whitespace-nowrap transition-all border ${selectedCategory === "all" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-[#E5E5EA] text-slate-500"}`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-8 py-4 rounded-full text-sm font-bold tracking-normal whitespace-nowrap transition-all border flex items-center gap-3 ${selectedCategory === cat.id ? "bg-white border-slate-900 text-slate-900 shadow-lg" : "bg-white border-[#E5E5EA] text-slate-500"}`}
            >
              <cat.icon size={16} style={{ color: cat.color }} />
              {cat.label}
            </button>
          ))}
        </HorizontalScroll>
      </div>

      {/* Visualização de Lista/Cards */}
      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredDates.map((date) => {
              const catInfo = categories.find((c) => c.id === date.category);
              const Icon = catInfo?.icon || Calendar;

              return (
                <div
                  key={date.id}
                  className="bg-white rounded-2xl border border-[#E5E5EA] p-8 shadow-sm transition-all group relative overflow-hidden"
                >
                  {!date.active && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[8px] font-medium tracking-tight">
                        Data Inativa
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center duration-500"
                        style={{ backgroundColor: `${catInfo?.color}15` }}
                      >
                        <Icon size={20} style={{ color: catInfo?.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">
                            {date.name}
                          </h4>
                          {date.priority >= 10 && (
                            <Sparkles size={12} className="text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-[#8E8E93] font-bold tracking-normal">
                            {catInfo?.label}
                          </p>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                            {date.scope || (date.is_national ? 'Nacional' : 'Regional')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          openModal(date);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-xl text-[#8E8E93] hover:text-slate-900 transition-all text-[9px] font-medium tracking-normal"
                      >
                        <Edit2 size={14} /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(date.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-xl text-[#8E8E93] hover:text-rose-500 transition-all text-[9px] font-medium tracking-normal"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-6 line-clamp-2 italic font-mono">
                    "{date.description}"
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {date.hashtags.map((tag, i) => (
                      <span
                        key={`tag-${tag}-${i}`}
                        className="text-[9px] font-bold text-[#8E8E93] lowercase"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-300" />
                      <span className="text-xs font-medium text-slate-800 uppercase">
                        {format(getFullDate(date), "dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    {date.year_fixed ? (
                      <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-slate-300">
                        Data Fixa
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-blue-500">
                          Móvel
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-[#E5E5EA] shadow-xl overflow-hidden"
          >
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-display font-medium text-slate-900 tracking-normal">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentMonth(addDays(startOfMonth(currentMonth), -1))
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() =>
                    setCurrentMonth(addDays(endOfMonth(currentMonth), 1))
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 bg-slate-50/50">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div
                  key={d}
                  className="p-4 text-center text-[10px] font-medium uppercase tracking-[0.3em] text-[#8E8E93] border-r border-[#E5E5EA] last:border-0"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 min-h-[600px]">
              {(() => {
                const firstDay = startOfMonth(currentMonth);
                const lastDay = endOfMonth(currentMonth);
                const emptyDays = firstDay.getDay();
                const totalDays = lastDay.getDate();

                const cells = [];

                // Empty cells for alignment
                for (let i = 0; i < emptyDays; i++) {
                  cells.push(
                    <div
                      key={`empty-${i}`}
                      className="p-4 border-r border-b border-slate-50 bg-slate-50/20"
                    />,
                  );
                }

                // Real days
                for (let d = 1; d <= totalDays; d++) {
                  const cellDate = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    d,
                  );
                  const dayEvents = dates.filter((date) => {
                    const occ = getFullDate(date, currentMonth.getFullYear());
                    return (
                      occ.getDate() === d &&
                      occ.getMonth() === currentMonth.getMonth()
                    );
                  });

                  cells.push(
                    <div
                      key={d}
                      className={`p-4 border-r border-b border-slate-50 relative group hover:bg-slate-50/30 transition-colors min-h-[120px] ${isToday(cellDate) ? "bg-indigo-50/30" : ""}`}
                    >
                      <span
                        className={`text-xs font-medium transition-colors ${isToday(cellDate) ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-900"}`}
                      >
                        {d}
                      </span>

                      <div className="mt-2 space-y-1">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="px-2 py-1 rounded-md text-[7px] font-medium uppercase tracking-tighter truncate text-white"
                            style={{
                              backgroundColor:
                                categories.find((c) => c.id === event.category)
                                  ?.color || "#000",
                            }}
                            title={event.name}
                          >
                            {event.name}
                          </div>
                        ))}
                      </div>
                    </div>,
                  );
                }

                return cells;
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            layoutId="modal-date"
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-10 overflow-y-auto max-h-[85vh] no-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-display font-medium text-slate-900">
                    {editingDate?.id ? "Editar Data" : "Nova Data Comemorativa"}
                  </h3>
                  <p className="text-[#8E8E93] text-xs font-medium tracking-normal mt-1">
                    Configure os parâmetros da data estratégica.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                      Nome da Data
                    </label>
                    <input
                      type="text"
                      required
                      value={editingDate?.name || ""}
                      onChange={(e) =>
                        setEditingDate({ ...editingDate, name: e.target.value })
                      }
                      className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                      placeholder="Ex: Dia do Designer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                      Categoria
                    </label>
                    <select
                      value={editingDate?.category}
                      onChange={(e) =>
                        setEditingDate({
                          ...editingDate,
                          category: e.target.value as CategoryId,
                        })
                      }
                      className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm font-bold focus:bg-white outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                      Escopo da Data
                    </label>
                    <select
                      value={editingDate?.scope || (editingDate?.is_national ? 'nacional' : 'regional')}
                      onChange={(e) =>
                        setEditingDate({
                          ...editingDate,
                          scope: e.target.value as 'nacional' | 'mundial' | 'regional',
                          is_national: e.target.value === 'nacional'
                        })
                      }
                      className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm font-bold focus:bg-white outline-none"
                    >
                      <option value="nacional">Nacional (Brasil)</option>
                      <option value="mundial">Mundial / Internacional</option>
                      <option value="regional">Regional / Tradição de Ateliê</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                    Descrição / Curiosidade
                  </label>
                  <textarea
                    value={editingDate?.description || ""}
                    onChange={(e) =>
                      setEditingDate({
                        ...editingDate,
                        description: e.target.value,
                      })
                    }
                    className="w-full min-h-[100px] bg-slate-50 border border-[#E5E5EA] rounded-2xl p-6 text-sm font-medium focus:bg-white outline-none resize-none"
                    placeholder="Descreva brevemente o significado desta data..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                      Dia
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      disabled={!editingDate?.year_fixed}
                      value={editingDate?.day || ""}
                      onChange={(e) =>
                        setEditingDate({
                          ...editingDate,
                          day: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm font-bold focus:bg-white outline-none disabled:opacity-30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                      Mês
                    </label>
                    <select
                      disabled={!editingDate?.year_fixed}
                      value={editingDate?.month || ""}
                      onChange={(e) =>
                        setEditingDate({
                          ...editingDate,
                          month: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm font-bold focus:bg-white outline-none disabled:opacity-30"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {format(new Date(2024, i, 1), "MMMM", {
                            locale: ptBR,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                    Frase de Marketing SUGERIDA
                  </label>
                  <input
                    type="text"
                    value={editingDate?.marketing_phrase || ""}
                    onChange={(e) =>
                      setEditingDate({
                        ...editingDate,
                        marketing_phrase: e.target.value,
                      })
                    }
                    className="w-full h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm font-bold focus:bg-white outline-none"
                    placeholder="Ex: Presenteie quem te ensina todos os dias..."
                  />
                </div>

                {/* Design Section (Banner + Theme Color Picker) */}
                <div className="border-t border-slate-100 pt-8 space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900">
                    Design da Campanha
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium tracking-normal text-[#8E8E93] ml-2">
                        Cor Temática da Campanha
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editingDate?.theme_color || "#3b82f6"}
                          onChange={(e) =>
                            setEditingDate({
                              ...editingDate,
                              theme_color: e.target.value,
                            })
                          }
                          className="w-14 h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl p-1.5 cursor-pointer focus:ring-4 focus:ring-slate-100 transition-all outline-none animate-none"
                        />
                        <input
                          type="text"
                          value={editingDate?.theme_color || "#3b82f6"}
                          onChange={(e) =>
                            setEditingDate({
                              ...editingDate,
                              theme_color: e.target.value,
                            })
                          }
                          placeholder="#3b82f6"
                          className="flex-1 h-14 bg-slate-50 border border-[#E5E5EA] rounded-2xl px-6 text-sm font-bold uppercase focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <ImageUpload
                        label="Banner da Campanha"
                        path="datas_comemorativas"
                        currentUrl={editingDate?.banner || ""}
                        onUploadComplete={(url) =>
                          setEditingDate({ ...editingDate, banner: url })
                        }
                        onRemove={() =>
                          setEditingDate({ ...editingDate, banner: "" })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Status and Rules Section */}
                <div className="border-t border-slate-100 pt-8 space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900">
                    Controles de Status e Regras
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      {
                        key: 'active',
                        label: 'Status Ativa',
                        checked: editingDate?.active ?? true,
                        color: 'bg-emerald-500',
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingDate({ ...editingDate, active: e.target.checked })
                      },
                      {
                        key: 'recurrent',
                        label: 'Recorrente Anual',
                        checked: editingDate?.recurrent ?? true,
                        color: 'bg-indigo-600',
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingDate({ ...editingDate, recurrent: e.target.checked })
                      },
                      {
                        key: 'year_fixed',
                        label: 'Data Fixa',
                        checked: editingDate?.year_fixed ?? true,
                        color: 'bg-indigo-600',
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingDate({ ...editingDate, year_fixed: e.target.checked })
                      }
                    ].map((toggle) => (
                      <div key={toggle.key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center min-h-[72px]">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div
                            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${toggle.checked ? toggle.color : "bg-slate-200"}`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${toggle.checked ? "ml-6" : "ml-0"}`}
                            />
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={toggle.checked}
                            onChange={toggle.onChange}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900">
                            {toggle.label}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-xs font-medium flex items-center gap-3 animate-in fade-in duration-300">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-8 py-4 rounded-2xl text-[10px] font-medium tracking-normal text-[#8E8E93] hover:text-slate-900 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-black text-white px-10 py-5 rounded-2xl text-[10px] font-medium tracking-normal hover:scale-105 transition-all shadow-xl shadow-black/10 active:scale-95"
                  >
                    Salvar Configuração
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
