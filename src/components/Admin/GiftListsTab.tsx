import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gift,
  Search,
  Trash2,
  Calendar,
  Package,
  X,
  Plus,
  Edit2,
  Copy,
  Archive,
  CheckCircle,
  Eye,
  Filter,
  RefreshCw,
  FolderOpen,
  Tag,
  AlertCircle,
  Heart,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Star,
  ExternalLink,
  Clock,
  User,
  MessageSquare,
  ChevronRight,
  Check,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import { subscribeToGiftLists, OperationType, handleFirestoreError } from "../../services/firebaseService";
import { db } from "../../lib/firebase";
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Product } from "../../types";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface GiftListsTabProps {
  companyId: string;
  products: Product[];
}

interface GiftListHistoryEntry {
  id: string;
  type: "created" | "product_added" | "product_removed" | "reservation" | "cancellation" | "delivery" | "ended" | "archived" | "order_changed" | "highlight_changed";
  title: string;
  description: string;
  timestamp: string;
}

interface GiftListItem {
  id: string;
  product_name: string;
  retail_price: number;
  image?: string;
  status: "disponivel" | "reservado" | "presenteado";
  qtyAvailable: number;
  qtyReserved: number;
  qtyDelivered: number;
  isHighlighted?: boolean;
  order: number;
  reservedBy?: string;
  giftedBy?: string;
}

interface GiftList {
  id: string;
  code: string;
  listName: string;
  hostName: string;
  eventType: string;
  eventDate: string;
  message?: string;
  banner?: string;
  status: "active" | "ended" | "archived";
  items: GiftListItem[];
  history?: GiftListHistoryEntry[];
  companyId: string;
  createdAt?: any;
}

const EVENT_TYPES = [
  "Casamento",
  "Aniversário",
  "Chá de Bebê",
  "Chá de Panela",
  "Bodas",
  "Outros"
];

const PRESET_BANNERS = [
  {
    name: "Clássico Minimalista",
    url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Floral Romântico",
    url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Celebração Ouro",
    url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600"
  }
];

export const GiftListsTab: React.FC<GiftListsTabProps> = React.memo(({
  companyId,
  products = []
}) => {
  const orchestrator = useAdminOrchestrator();
  const [lists, setLists] = useState<GiftList[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterDate, setFilterDate] = useState("");
  const [filterMinGifts, setFilterMinGifts] = useState<number | "">("");

  // Sidebar detail panel state
  const [selectedList, setSelectedList] = useState<GiftList | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"summary" | "products" | "timeline">("summary");
  
  // Sidebar sub-search states
  const [storeSearch, setStoreSearch] = useState("");
  const [listProductSearch, setListProductSearch] = useState("");

  // Form states (for creating/editing list metadata)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<GiftList>>({
    code: "",
    listName: "",
    hostName: "",
    eventType: "Casamento",
    eventDate: "",
    message: "",
    banner: PRESET_BANNERS[0].url,
    status: "active",
    items: [],
    history: []
  });

  // Load lists from Firestore via subscription
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToGiftLists((fetchedLists) => {
      const formatted = fetchedLists.map((l: any) => ({
        ...l,
        status: l.status || "active",
        items: (l.items || []).map((item: any, idx: number) => ({
          ...item,
          qtyAvailable: typeof item.qtyAvailable === "number" ? item.qtyAvailable : (item.status === "disponivel" ? 1 : 0),
          qtyReserved: typeof item.qtyReserved === "number" ? item.qtyReserved : (item.status === "reservado" ? 1 : 0),
          qtyDelivered: typeof item.qtyDelivered === "number" ? item.qtyDelivered : (item.status === "presenteado" ? 1 : 0),
          isHighlighted: !!item.isHighlighted,
          order: typeof item.order === "number" ? item.order : idx + 1
        })),
        history: l.history || []
      })) as GiftList[];
      setLists(formatted);
      setLoading(false);
    }, companyId);

    return () => unsub();
  }, [companyId]);

  // Keep selectedList synced with real-time lists updates
  const activeSelectedList = useMemo(() => {
    if (!selectedList) return null;
    return lists.find((l) => l.id === selectedList.id) || selectedList;
  }, [lists, selectedList]);

  // KPIs
  const kpis = useMemo(() => {
    const total = lists.length;
    const active = lists.filter((l) => l.status === "active").length;
    
    // Total registered gifts across all lists
    const totalGifts = lists.reduce((sum, l) => sum + (l.items?.length || 0), 0);

    // Upcoming events: Future events
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = lists.filter((l) => {
      if (!l.eventDate || l.status !== "active") return false;
      const ed = new Date(l.eventDate);
      return ed >= now;
    }).length;

    return { total, active, upcoming, totalGifts };
  }, [lists]);

  // Automatic indicators
  const indicators = useMemo(() => {
    const activeLists = lists.filter((l) => l.status === "active");
    
    // 1. Evento mais próximo
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const futureLists = activeLists
      .filter((l) => l.eventDate)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    const closestEvent = futureLists.length > 0 ? futureLists[0] : null;

    // 2. Lista com mais presentes
    const listWithMostGifts = [...lists].sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0))[0] || null;

    // 3. Produto mais reservado across all lists
    const productReservationCounts: Record<string, { name: string; count: number }> = {};
    lists.forEach((l) => {
      l.items?.forEach((item) => {
        const qty = item.qtyReserved || (item.status === "reservado" ? 1 : 0);
        if (qty > 0) {
          productReservationCounts[item.id] = {
            name: item.product_name,
            count: (productReservationCounts[item.id]?.count || 0) + qty,
          };
        }
      });
    });
    const mostReservedProduct = Object.values(productReservationCounts).sort((a, b) => b.count - a.count)[0] || null;

    // 4. Produto mais entregue across all lists
    const productDeliveryCounts: Record<string, { name: string; count: number }> = {};
    lists.forEach((l) => {
      l.items?.forEach((item) => {
        const qty = item.qtyDelivered || (item.status === "presenteado" ? 1 : 0);
        if (qty > 0) {
          productDeliveryCounts[item.id] = {
            name: item.product_name,
            count: (productDeliveryCounts[item.id]?.count || 0) + qty,
          };
        }
      });
    });
    const mostDeliveredProduct = Object.values(productDeliveryCounts).sort((a, b) => b.count - a.count)[0] || null;

    // 5. Listas encerradas
    const closedListsCount = lists.filter((l) => l.status === "ended").length;

    return {
      closestEvent,
      listWithMostGifts,
      mostReservedProduct,
      mostDeliveredProduct,
      closedListsCount,
    };
  }, [lists]);

  // Filtered lists logic
  const filteredLists = useMemo(() => {
    return lists.filter((l) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        l.listName?.toLowerCase().includes(searchLower) ||
        l.hostName?.toLowerCase().includes(searchLower) ||
        l.code?.toLowerCase().includes(searchLower) ||
        l.eventType?.toLowerCase().includes(searchLower);

      const matchesType = filterType === "todos" || l.eventType === filterType;
      const matchesStatus = filterStatus === "todos" || l.status === filterStatus;
      const matchesDate = !filterDate || l.eventDate === filterDate;
      
      const minGiftsVal = filterMinGifts === "" ? 0 : Number(filterMinGifts);
      const matchesMinGifts = (l.items?.length || 0) >= minGiftsVal;

      return matchesSearch && matchesType && matchesStatus && matchesDate && matchesMinGifts;
    });
  }, [lists, search, filterType, filterStatus, filterDate, filterMinGifts]);

  // Firestore update helper
  const updateListInFirestore = async (updatedList: GiftList) => {
    const path = `giftLists/${updatedList.code}`;
    try {
      const docRef = doc(db, "giftLists", updatedList.code);
      await setDoc(docRef, updatedList);
    } catch (err) {
      console.error("Erro ao atualizar lista no Firestore:", err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Houve um problema ao salvar as alterações no banco de dados.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Actions
  const handleOpenCreate = () => {
    const random = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");
    const generatedCode = `LP-${random}`;

    setFormData({
      code: generatedCode,
      listName: "",
      hostName: "",
      eventType: "Casamento",
      eventDate: "",
      message: "Preparamos esta lista com muito carinho para compartilhar este momento especial com vocês!",
      banner: PRESET_BANNERS[0].url,
      status: "active",
      items: [],
      history: []
    });
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (list: GiftList) => {
    setFormData({ ...list });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.listName || !formData.hostName) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Por favor, preencha os campos obrigatórios: Código, Nome da Lista e Anfitrião.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Aviso' }
    });
      return;
    }

    const codeUpper = formData.code.trim().toUpperCase();

    if (!isEditMode && lists.some((l) => l.code === codeUpper)) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: `O código "${codeUpper}" já está em uso por outra lista de presentes.`,
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
      return;
    }

    const path = `giftLists/${codeUpper}`;
    try {
      const docRef = doc(db, "giftLists", codeUpper);
      const isNew = !isEditMode;

      const payload: Partial<GiftList> = {
        id: codeUpper,
        code: codeUpper,
        listName: formData.listName.trim(),
        hostName: formData.hostName.trim(),
        eventType: formData.eventType || "Casamento",
        eventDate: formData.eventDate || "",
        message: formData.message || "",
        banner: formData.banner || PRESET_BANNERS[0].url,
        status: formData.status || "active",
        items: formData.items || [],
        history: isNew ? [{
          id: crypto.randomUUID(),
          type: "created",
          title: "Lista Criada",
          description: `A lista de presentes "${formData.listName.trim()}" foi criada com sucesso para o anfitrião ${formData.hostName.trim()}.`,
          timestamp: new Date().toISOString()
        }] : (formData.history || []),
        companyId
      };

      await setDoc(docRef, payload, { merge: true });
      setIsFormOpen(false);
      alert(isEditMode ? "Lista atualizada com sucesso!" : "Lista criada com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar lista de presentes:", err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao salvar lista de presentes. Por favor, tente novamente.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
      handleFirestoreError(err, isEditMode ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleDuplicate = async (list: GiftList) => {
    const randomSuffix = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");
    const newCode = `LP-${randomSuffix}`;
    const path = `giftLists/${newCode}`;

    try {
      const docRef = doc(db, "giftLists", newCode);
      const newHistoryEntry: GiftListHistoryEntry = {
        id: crypto.randomUUID(),
        type: "created",
        title: "Lista Duplicada",
        description: `Esta lista foi duplicada a partir da lista original ${list.code}.`,
        timestamp: new Date().toISOString()
      };

      const payload: GiftList = {
        ...list,
        id: newCode,
        code: newCode,
        listName: `${list.listName} (Cópia)`,
        status: "active",
        history: [newHistoryEntry, ...(list.history || [])]
      };

      await setDoc(docRef, payload);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: `Lista duplicada com sucesso! Novo Código: ${newCode}`,
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
    } catch (err) {
      console.error("Erro ao duplicar lista:", err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleArchive = async (list: GiftList) => {
    const path = `giftLists/${list.code}`;
    try {
      const docRef = doc(db, "giftLists", list.code);
      const newHistoryEntry: GiftListHistoryEntry = {
        id: crypto.randomUUID(),
        type: "archived",
        title: "Lista Arquivada",
        description: "A lista foi movida para os arquivos do painel administrativo.",
        timestamp: new Date().toISOString()
      };
      await updateDoc(docRef, { 
        status: "archived",
        history: [newHistoryEntry, ...(list.history || [])]
      });
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: `Lista ${list.code} arquivada com sucesso.`,
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
    } catch (err) {
      console.error("Erro ao arquivar lista:", err);
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleEnd = async (list: GiftList) => {
    const path = `giftLists/${list.code}`;
    try {
      const docRef = doc(db, "giftLists", list.code);
      const newHistoryEntry: GiftListHistoryEntry = {
        id: crypto.randomUUID(),
        type: "ended",
        title: "Lista Encerrada",
        description: "A lista de presentes foi finalizada e dada como encerrada.",
        timestamp: new Date().toISOString()
      };
      await updateDoc(docRef, { 
        status: "ended",
        history: [newHistoryEntry, ...(list.history || [])]
      });
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: `Lista ${list.code} encerrada com sucesso.`,
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
    } catch (err) {
      console.error("Erro ao encerrar lista:", err);
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDelete = async (list: GiftList) => {
    if (confirm(`Deseja realmente deletar a lista de presentes "${list.listName}"? Esta ação não poderá ser desfeita.`)) {
      const path = `giftLists/${list.code}`;
      try {
        await deleteDoc(doc(db, "giftLists", list.code));
        orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Lista excluída com sucesso.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
        if (selectedList?.id === list.id) {
          setSelectedList(null);
        }
      } catch (err) {
        console.error("Erro ao excluir lista:", err);
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  // List item actions inside Sidebar Detail Panel
  const handleAddProductToSelectedList = async (product: Product) => {
    if (!activeSelectedList) return;

    if (activeSelectedList.items.some((item) => item.id === product.id)) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Este produto já está incluído nesta lista.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
      return;
    }

    const nextOrder = activeSelectedList.items.length > 0
      ? Math.max(...activeSelectedList.items.map((i) => i.order || 0)) + 1
      : 1;

    const newItem: GiftListItem = {
      id: product.id,
      product_name: product.product_name,
      retail_price: product.retail_price,
      image: product.image || "",
      status: "disponivel",
      qtyAvailable: 1,
      qtyReserved: 0,
      qtyDelivered: 0,
      isHighlighted: false,
      order: nextOrder
    };

    const newHistoryEntry: GiftListHistoryEntry = {
      id: crypto.randomUUID(),
      type: "product_added",
      title: "Presente Adicionado",
      description: `O presente "${product.product_name}" foi adicionado à lista.`,
      timestamp: new Date().toISOString()
    };

    const updatedList: GiftList = {
      ...activeSelectedList,
      items: [...activeSelectedList.items, newItem],
      history: [newHistoryEntry, ...(activeSelectedList.history || [])]
    };

    await updateListInFirestore(updatedList);
  };

  const handleRemoveProductFromSelectedList = async (itemId: string, productName: string) => {
    if (!activeSelectedList) return;
    if (!confirm(`Tem certeza de que deseja remover "${productName}" da lista?`)) return;

    const newHistoryEntry: GiftListHistoryEntry = {
      id: crypto.randomUUID(),
      type: "product_removed",
      title: "Presente Removido",
      description: `O presente "${productName}" foi excluído da lista de presentes.`,
      timestamp: new Date().toISOString()
    };

    const updatedList: GiftList = {
      ...activeSelectedList,
      items: activeSelectedList.items.filter((item) => item.id !== itemId),
      history: [newHistoryEntry, ...(activeSelectedList.history || [])]
    };

    await updateListInFirestore(updatedList);
  };

  const handleToggleProductHighlight = async (itemId: string, productName: string) => {
    if (!activeSelectedList) return;

    const updatedItems = activeSelectedList.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, isHighlighted: !item.isHighlighted };
      }
      return item;
    });

    const isNowHighlighted = updatedItems.find((i) => i.id === itemId)?.isHighlighted;

    const newHistoryEntry: GiftListHistoryEntry = {
      id: crypto.randomUUID(),
      type: "highlight_changed",
      title: isNowHighlighted ? "Presente em Destaque" : "Destaque Removido",
      description: `O presente "${productName}" foi ${isNowHighlighted ? "marcado como destaque" : "retirado dos destaques"}.`,
      timestamp: new Date().toISOString()
    };

    const updatedList: GiftList = {
      ...activeSelectedList,
      items: updatedItems,
      history: [newHistoryEntry, ...(activeSelectedList.history || [])]
    };

    await updateListInFirestore(updatedList);
  };

  const handleMoveProductOrder = async (index: number, direction: "up" | "down") => {
    if (!activeSelectedList) return;
    const sortedItems = [...activeSelectedList.items].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (direction === "up" && index > 0) {
      const temp = sortedItems[index].order;
      sortedItems[index].order = sortedItems[index - 1].order;
      sortedItems[index - 1].order = temp;
    } else if (direction === "down" && index < sortedItems.length - 1) {
      const temp = sortedItems[index].order;
      sortedItems[index].order = sortedItems[index + 1].order;
      sortedItems[index + 1].order = temp;
    } else {
      return;
    }

    const newHistoryEntry: GiftListHistoryEntry = {
      id: crypto.randomUUID(),
      type: "order_changed",
      title: "Ordenação de Presentes",
      description: "A ordem manual de exibição dos presentes foi ajustada.",
      timestamp: new Date().toISOString()
    };

    const updatedList: GiftList = {
      ...activeSelectedList,
      items: sortedItems,
      history: [newHistoryEntry, ...(activeSelectedList.history || [])]
    };

    await updateListInFirestore(updatedList);
  };

  const handleUpdateItemQuantities = async (
    itemId: string,
    updates: Partial<GiftListItem>,
    logTitle: string,
    logDesc: string,
    logType: GiftListHistoryEntry["type"]
  ) => {
    if (!activeSelectedList) return;

    const updatedItems = activeSelectedList.items.map((item) => {
      if (item.id === itemId) {
        const nextItem = { ...item, ...updates };

        // Automatically determine status if not explicitly overridden
        if (updates.qtyAvailable !== undefined || updates.qtyReserved !== undefined || updates.qtyDelivered !== undefined) {
          if (updates.status === undefined) {
            const avail = nextItem.qtyAvailable ?? 0;
            const res = nextItem.qtyReserved ?? 0;
            const del = nextItem.qtyDelivered ?? 0;
            
            if (avail > 0) {
              nextItem.status = "disponivel";
            } else if (res > 0) {
              nextItem.status = "reservado";
            } else if (del > 0) {
              nextItem.status = "presenteado";
            }
          }
        }
        return nextItem;
      }
      return item;
    });

    const newHistoryEntry: GiftListHistoryEntry = {
      id: crypto.randomUUID(),
      type: logType,
      title: logTitle,
      description: logDesc,
      timestamp: new Date().toISOString()
    };

    const updatedList: GiftList = {
      ...activeSelectedList,
      items: updatedItems,
      history: [newHistoryEntry, ...(activeSelectedList.history || [])]
    };

    await updateListInFirestore(updatedList);
  };

  // Helper to filter store catalog products
  const filteredStoreProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBrand = p.company === companyId;
      const matchQuery = !storeSearch || p.product_name?.toLowerCase().includes(storeSearch.toLowerCase());
      return matchBrand && matchQuery;
    });
  }, [products, companyId, storeSearch]);

  // Helper to filter and sort list products
  const sortedAndFilteredListProducts = useMemo(() => {
    if (!activeSelectedList) return [];
    return [...activeSelectedList.items]
      .filter((item) => !listProductSearch || item.product_name?.toLowerCase().includes(listProductSearch.toLowerCase()))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [activeSelectedList, listProductSearch]);

  return (
    <div className="space-y-8 select-none font-sans bg-[#FCFBF9] min-h-screen text-[#1C1C1E] pb-12">
      
      {/* 1. CABEÇALHO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2rem] border border-[#E5E5EA] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100/50">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#1C1C1E] flex items-center gap-2">
                Lista de Presentes <Sparkles size={16} className="text-amber-400" />
              </h2>
              <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest">
                Gerenciamento estrutural das listas de presentes da Vitrine
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full md:w-auto bg-white border border-[#E5E5EA] border-b-[3.5px] border-b-gray-300 hover:border-b-gray-400 hover:bg-gray-50 active:border-b active:translate-y-[1.5px] shadow-xs rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-wider text-gray-700 flex items-center justify-center gap-2.5 transition-all"
        >
          <Plus size={16} /> Nova Lista de Presentes
        </button>
      </header>

      {/* 2. KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E5EA] rounded-[1.5rem] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93]">Total de Listas</span>
            <FolderOpen size={16} className="text-gray-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-[#1C1C1E]">{kpis.total}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Cadastradas</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-[1.5rem] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93]">Listas Ativas</span>
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-600">{kpis.active}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Em andamento</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-[1.5rem] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93]">Eventos Próximos</span>
            <Calendar size={16} className="text-blue-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-blue-600">{kpis.upcoming}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Ativos e futuros</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-[1.5rem] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93]">Presentes Mapeados</span>
            <Package size={16} className="text-[#8E8E93]" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-[#1C1C1E]">{kpis.totalGifts}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Mimos integrados</p>
          </div>
        </div>
      </section>

      {/* 2.2. INDICADORES ESPECIAIS (AUTOMATIC INDICATORS) */}
      <section className="bg-white border border-[#E5E5EA] rounded-[2rem] p-6 shadow-xs space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5 pl-1">
          <Sparkles size={12} /> Indicadores Estratégicos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Evento mais próximo */}
          <div className="bg-[#FCFBF9] border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93]">Próximo Evento</span>
            <div className="mt-2">
              <p className="text-xs font-black text-gray-800 truncate" title={indicators.closestEvent?.listName}>
                {indicators.closestEvent ? indicators.closestEvent.listName : "Nenhum ativo"}
              </p>
              <span className="text-[9px] font-mono font-bold text-rose-400 mt-1 block">
                {indicators.closestEvent?.eventDate ? new Date(indicators.closestEvent.eventDate).toLocaleDateString() : "-"}
              </span>
            </div>
          </div>

          {/* Lista com mais presentes */}
          <div className="bg-[#FCFBF9] border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93]">Maior Lista</span>
            <div className="mt-2">
              <p className="text-xs font-black text-gray-800 truncate" title={indicators.listWithMostGifts?.listName}>
                {indicators.listWithMostGifts ? indicators.listWithMostGifts.listName : "-"}
              </p>
              <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase">
                {indicators.listWithMostGifts ? `${indicators.listWithMostGifts.items?.length || 0} Presentes` : "-"}
              </span>
            </div>
          </div>

          {/* Produto mais reservado */}
          <div className="bg-[#FCFBF9] border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93]">Mais Reservado</span>
            <div className="mt-2">
              <p className="text-xs font-black text-gray-800 truncate" title={indicators.mostReservedProduct?.name}>
                {indicators.mostReservedProduct ? indicators.mostReservedProduct.name : "Nenhum"}
              </p>
              <span className="text-[9px] font-bold text-amber-500 mt-1 block uppercase">
                {indicators.mostReservedProduct ? `${indicators.mostReservedProduct.count} Reservas` : "-"}
              </span>
            </div>
          </div>

          {/* Produto mais entregue */}
          <div className="bg-[#FCFBF9] border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93]">Mais Entregue</span>
            <div className="mt-2">
              <p className="text-xs font-black text-gray-800 truncate" title={indicators.mostDeliveredProduct?.name}>
                {indicators.mostDeliveredProduct ? indicators.mostDeliveredProduct.name : "Nenhum"}
              </p>
              <span className="text-[9px] font-bold text-[#D4AF37] mt-1 block uppercase">
                {indicators.mostDeliveredProduct ? `${indicators.mostDeliveredProduct.count} Entregues` : "-"}
              </span>
            </div>
          </div>

          {/* Listas encerradas */}
          <div className="bg-[#FCFBF9] border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93]">Listas Encerradas</span>
            <div className="mt-2">
              <h5 className="text-sm font-black text-gray-800">
                {indicators.closedListsCount}
              </h5>
              <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase">Histórico finalizado</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH AND FILTERS */}
      <section className="bg-white p-5 rounded-[2rem] border border-[#E5E5EA] shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          <div className="relative md:col-span-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por lista, anfitrião, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-gray-700 transition-all"
            >
              <option value="todos">Todos Eventos</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-gray-700 transition-all"
            >
              <option value="todos">Todos Status</option>
              <option value="active">Ativa</option>
              <option value="ended">Encerrada</option>
              <option value="archived">Arquivada</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-gray-700 transition-all"
              title="Filtrar por data do evento"
            />
          </div>

          <div className="md:col-span-2 flex gap-1">
            <button
              onClick={() => {
                setSearch("");
                setFilterType("todos");
                setFilterStatus("todos");
                setFilterDate("");
                setFilterMinGifts("");
              }}
              className="w-full bg-gray-50 border border-[#E5E5EA] hover:bg-gray-100 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-gray-600"
            >
              <RefreshCw size={12} /> Limpar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E5EA]/70 w-fit">
          <Filter size={12} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantidade Mínima de Presentes:</span>
          <input
            type="number"
            min="0"
            value={filterMinGifts}
            placeholder="0"
            onChange={(e) => setFilterMinGifts(e.target.value === "" ? "" : Number(e.target.value))}
            className="bg-transparent border-b border-gray-300 focus:border-rose-300 text-xs font-black w-14 outline-none text-center text-gray-800"
          />
        </div>
      </section>

      {/* 3. LISTA DAS LISTAS & CADASTRO/EDIÇÃO */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LIST OF LISTS CONTAINER (Spans 8 columns) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#8E8E93] flex items-center gap-2">
              Listas Cadastradas ({filteredLists.length})
            </h4>
            <div className="h-[1px] bg-[#E5E5EA] flex-1 ml-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredLists.map((list) => {
                const totalGifts = list.items?.length || 0;
                const isEnded = list.status === "ended";
                const isArchived = list.status === "archived";

                return (
                  <motion.div
                    key={list.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-[#E5E5EA] rounded-[2rem] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative"
                  >
                    {/* Event Status Badges */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        list.status === "active" ? "bg-emerald-400 shadow-[0_0_6px_#10B981]" : isEnded ? "bg-red-400" : "bg-gray-400"
                      }`} />
                      <span className="text-[8px] font-black uppercase text-white tracking-widest">
                        {list.status === "active" ? "Ativa" : isEnded ? "Encerrada" : "Arquivada"}
                      </span>
                    </div>

                    {/* Banner Card */}
                    <div className="h-32 bg-gray-50 relative overflow-hidden shrink-0">
                      {list.banner ? (
                        <img
                          src={list.banner}
                          alt={list.listName}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-rose-50 to-orange-50 flex items-center justify-center text-rose-300">
                          <Gift size={32} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end p-5">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">
                            {list.eventType}
                          </span>
                          <h3 className="text-sm font-black text-white truncate drop-shadow-xs uppercase tracking-tight">
                            {list.listName}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Info Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
                      <div className="space-y-2.5">
                        {/* Host name */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8E8E93] font-bold uppercase tracking-wider">Anfitrião:</span>
                          <span className="font-black text-gray-800 uppercase tracking-wide truncate max-w-[140px]">
                            {list.hostName}
                          </span>
                        </div>

                        {/* List Unique Code */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8E8E93] font-bold uppercase tracking-wider">Código único:</span>
                          <span className="font-mono font-black text-gray-800 bg-[#FAF9F6] border border-gray-200/50 px-2 py-0.5 rounded-lg text-[11px]">
                            {list.code}
                          </span>
                        </div>

                        {/* Event Date */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8E8E93] font-bold uppercase tracking-wider">Data do Evento:</span>
                          <span className="font-bold text-gray-700 flex items-center gap-1.5">
                            <Calendar size={12} className="text-gray-400" />
                            {list.eventDate ? new Date(list.eventDate).toLocaleDateString() : "Não informada"}
                          </span>
                        </div>

                        {/* Products quantity */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8E8E93] font-bold uppercase tracking-wider">Produtos na Lista:</span>
                          <span className="font-bold text-gray-700 flex items-center gap-1">
                            <Package size={12} className="text-gray-400" />
                            {totalGifts} presentes
                          </span>
                        </div>
                      </div>

                      {/* Clear 3D buttons actions bar */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                        {/* Selected List Sidebar trigger button */}
                        <button
                          onClick={() => {
                            setSelectedList(list);
                            setSidebarTab("summary");
                          }}
                          className="flex-1 min-w-[70px] bg-[#FFF5F5] hover:bg-[#FFEAEB] border border-rose-100 text-rose-500 rounded-xl py-2 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1"
                        >
                          <Eye size={10} /> Painel
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEdit(list)}
                          className="flex-1 min-w-[70px] bg-white border border-[#E5E5EA] border-b-[3px] border-b-gray-200 hover:border-b-gray-300 hover:bg-gray-50 active:border-b active:translate-y-[2px] shadow-xs rounded-xl py-2 text-[9px] font-black uppercase tracking-widest text-gray-700 transition-all flex items-center justify-center gap-1"
                        >
                          <Edit2 size={10} /> Metadata
                        </button>

                        {/* Duplicate button */}
                        <button
                          onClick={() => handleDuplicate(list)}
                          className="p-2 bg-white border border-[#E5E5EA] border-b-[3px] border-b-gray-200 hover:border-b-gray-300 hover:text-amber-600 active:border-b active:translate-y-[2px] shadow-xs rounded-xl transition-all"
                          title="Duplicar Lista"
                        >
                          <Copy size={12} />
                        </button>

                        {/* End/Close list */}
                        {list.status === "active" && (
                          <button
                            onClick={() => handleEnd(list)}
                            className="p-2 bg-white border border-[#E5E5EA] border-b-[3px] border-b-gray-200 hover:border-b-gray-300 hover:text-red-500 active:border-b active:translate-y-[2px] shadow-xs rounded-xl transition-all"
                            title="Encerrar Lista"
                          >
                            <X size={12} />
                          </button>
                        )}

                        {/* Archive button */}
                        {list.status !== "archived" && (
                          <button
                            onClick={() => handleArchive(list)}
                            className="p-2 bg-white border border-[#E5E5EA] border-b-[3px] border-b-gray-200 hover:border-b-gray-300 hover:text-indigo-600 active:border-b active:translate-y-[2px] shadow-xs rounded-xl transition-all"
                            title="Arquivar Lista"
                          >
                            <Archive size={12} />
                          </button>
                        )}

                        {/* Delete button with alert */}
                        <button
                          onClick={() => handleDelete(list)}
                          className="p-2 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 text-red-500 rounded-xl transition-all"
                          title="Excluir Lista"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty state list */}
            {filteredLists.length === 0 && !loading && (
              <div className="bg-white border border-[#E5E5EA] rounded-[2rem] p-16 text-center text-gray-400 col-span-2">
                <Gift size={48} className="mx-auto mb-3 opacity-30" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Nenhuma lista corresponde à pesquisa</h3>
                <p className="text-[10px] text-gray-400 max-w-sm mx-auto mt-1">
                  Revise os filtros aplicados ou crie uma nova lista de presentes no cabeçalho.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4. FORMULÁRIO DE CADASTRO/EDIÇÃO (Spans 4 columns) */}
        <div className="xl:col-span-4 bg-white border border-[#E5E5EA] rounded-[2rem] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100/50">
                <FolderOpen size={16} />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-[#1C1C1E]">
                  {isFormOpen ? (isEditMode ? "Editar Lista" : "Nova Lista") : "Configuração da Lista"}
                </h3>
                <p className="text-[8px] text-[#8E8E93] font-bold uppercase tracking-widest">
                  {isFormOpen ? "Insira os dados do evento" : "Selecione uma ação para começar"}
                </p>
              </div>
            </div>

            {isFormOpen && (
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!isFormOpen ? (
              <motion.div
                key="empty-state-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center text-gray-400 space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#FCFBF9] border border-gray-100 flex items-center justify-center mx-auto text-gray-300">
                  <SlidersIcon size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-gray-500">Nenhuma Edição em Andamento</p>
                  <p className="text-[9px] text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Clique em **Nova Lista de Presentes** no cabeçalho ou em **Metadata** em qualquer card para modificar as configurações primárias de uma lista.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="active-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSave}
                className="space-y-4 text-xs"
              >
                {/* Event Name */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Nome da Lista *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Casamento de Maria & João"
                    value={formData.listName || ""}
                    onChange={(e) => setFormData({ ...formData, listName: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-gray-800 transition-colors placeholder:text-gray-300"
                  />
                </div>

                {/* Host Name */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Nome Completo do Anfitrião *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Souza"
                    value={formData.hostName || ""}
                    onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-gray-800 transition-colors placeholder:text-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Event Type */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Tipo de Evento</label>
                    <select
                      value={formData.eventType || "Casamento"}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-gray-800 transition-colors"
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* List Unique Code */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Código da Lista</label>
                    <input
                      type="text"
                      disabled={isEditMode}
                      placeholder="Ex: LP-WEDDING"
                      value={formData.code || ""}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                      className="w-full bg-gray-50 border border-[#E5E5EA] disabled:opacity-75 rounded-xl px-3 py-2.5 text-xs font-mono font-black outline-none text-gray-800 transition-colors"
                      title={isEditMode ? "O código identificador de uma lista não pode ser modificado após sua criação." : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Event Date */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Data do Evento</label>
                    <input
                      type="date"
                      value={formData.eventDate || ""}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-gray-800 transition-colors"
                    />
                  </div>

                  {/* List Status */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Status</label>
                    <select
                      value={formData.status || "active"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-gray-800 transition-colors"
                    >
                      <option value="active">Ativa</option>
                      <option value="ended">Encerrada</option>
                      <option value="archived">Arquivada</option>
                    </select>
                  </div>
                </div>

                {/* Custom Personalized Message */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Mensagem para os Convidados</label>
                  <textarea
                    placeholder="Deixe uma mensagem bonita aqui..."
                    value={formData.message || ""}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl p-3.5 text-xs font-bold outline-none text-gray-800 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Banner Image URL */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Banner da Lista (URL Opcional)</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={formData.banner || ""}
                    onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-gray-800 transition-colors"
                  />

                  {/* Preset Banner Selector */}
                  <div className="space-y-1 mt-2">
                    <span className="block text-[8px] font-black uppercase text-gray-400">Ou selecione um tema padrão:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_BANNERS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, banner: preset.url })}
                          className={`relative h-10 rounded-lg overflow-hidden border transition-all ${
                            formData.banner === preset.url ? "ring-2 ring-rose-300 border-rose-300 scale-95" : "border-gray-200"
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="flex-1 bg-white border border-[#E5E5EA] border-b-[3.5px] border-b-gray-300 hover:border-b-gray-400 active:border-b active:translate-y-[2px] shadow-xs rounded-xl py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 transition-all flex items-center justify-center gap-1.5"
                  >
                    Salvar Dados
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* SLIDING PAINEL LATERAL (LIST DETAILS, OPERATIONS AND HISTORY) */}
      <AnimatePresence>
        {activeSelectedList && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            
            {/* Backdrop with a soft blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedList(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            />

            {/* Panel itself */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="relative w-full max-w-2xl md:max-w-3xl bg-white shadow-2xl flex flex-col h-full border-l border-[#E5E5EA]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-[#FCFBF9]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/50">
                      Painel Administrativo
                    </span>
                    <span className="text-[10px] font-mono font-black text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                      {activeSelectedList.code}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mt-1">
                    {activeSelectedList.listName}
                  </h3>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* Public Page Link button */}
                  <a
                    href={`/listadepresentes/${activeSelectedList.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-initial bg-white border border-[#E5E5EA] border-b-[3px] border-b-gray-200 hover:border-b-gray-300 hover:bg-gray-50 active:border-b active:translate-y-[1.5px] shadow-xs rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink size={11} /> Visualizar Página
                  </a>

                  <button
                    onClick={() => setSelectedList(null)}
                    className="p-2.5 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
                    title="Fechar Painel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-gray-100 px-6 bg-white shrink-0">
                <button
                  onClick={() => setSidebarTab("summary")}
                  className={`py-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                    sidebarTab === "summary"
                      ? "border-rose-400 text-rose-500"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <InfoIcon size={14} /> Resumo & Anfitrião
                </button>
                <button
                  onClick={() => setSidebarTab("products")}
                  className={`py-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                    sidebarTab === "products"
                      ? "border-rose-400 text-rose-500"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Package size={14} /> Gerenciador de Produtos
                </button>
                <button
                  onClick={() => setSidebarTab("timeline")}
                  className={`py-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                    sidebarTab === "timeline"
                      ? "border-rose-400 text-rose-500"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Clock size={14} /> Histórico / Linha do Tempo
                </button>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#FCFBF9]">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: SUMMARY & HOST */}
                  {sidebarTab === "summary" && (
                    <motion.div
                      key="summary-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Banner display */}
                      {activeSelectedList.banner && (
                        <div className="relative h-44 rounded-2xl overflow-hidden border border-gray-200">
                          <img
                            src={activeSelectedList.banner}
                            alt={activeSelectedList.listName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-md">
                              {activeSelectedList.eventType}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* General metadata card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 border-b border-gray-50 pb-2">
                            <User size={12} /> Dados do Anfitrião
                          </h4>
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93] block">Nome Completo</span>
                            <span className="font-black text-gray-800 text-xs uppercase block">{activeSelectedList.hostName}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93] block">Código do Evento</span>
                            <span className="font-mono font-black text-[#D4AF37] text-xs block">{activeSelectedList.code}</span>
                          </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 border-b border-gray-50 pb-2">
                            <Calendar size={12} /> Cronograma do Evento
                          </h4>
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93] block">Data Limite / Celebração</span>
                            <span className="font-bold text-gray-800 text-xs block">
                              {activeSelectedList.eventDate ? new Date(activeSelectedList.eventDate).toLocaleDateString("pt-BR", { dateStyle: "long" }) : "Não agendado"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93] block">Estado Atual</span>
                            <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                              {activeSelectedList.status === "active" ? "Ativo" : activeSelectedList.status === "ended" ? "Encerrado" : "Arquivado"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Message to Guests */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 border-b border-gray-50 pb-2">
                          <MessageSquare size={12} /> Mensagem de Boas-vindas aos Convidados
                        </h4>
                        <div className="bg-[#FCFBF9] border-l-4 border-rose-300 p-4 rounded-r-xl">
                          <p className="text-xs text-gray-600 font-bold italic leading-relaxed">
                            "{activeSelectedList.message || "Sem mensagem customizada registrada."}"
                          </p>
                        </div>
                      </div>

                      {/* List analytics bento block */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 border-b border-gray-50 pb-2">
                          <Sparkles size={12} /> Desempenho e Reservas da Lista
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[8px] font-black uppercase text-[#8E8E93] block">Mimos Totais</span>
                            <span className="text-lg font-black text-gray-800 mt-1 block">{activeSelectedList.items.length}</span>
                          </div>

                          <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                            <span className="text-[8px] font-black uppercase text-emerald-800 block">Disponíveis</span>
                            <span className="text-lg font-black text-emerald-600 mt-1 block">
                              {activeSelectedList.items.filter(i => i.qtyAvailable > 0 || i.status === "disponivel").length}
                            </span>
                          </div>

                          <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                            <span className="text-[8px] font-black uppercase text-amber-800 block">Reservados</span>
                            <span className="text-lg font-black text-amber-600 mt-1 block">
                              {activeSelectedList.items.filter(i => i.qtyReserved > 0 || i.status === "reservado").length}
                            </span>
                          </div>

                          <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100/50">
                            <span className="text-[8px] font-black uppercase text-blue-800 block">Entregues</span>
                            <span className="text-lg font-black text-blue-600 mt-1 block">
                              {activeSelectedList.items.filter(i => i.qtyDelivered > 0 || i.status === "presenteado").length}
                            </span>
                          </div>
                        </div>

                        {/* Conversion progress bar */}
                        <div className="pt-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 mb-1.5">
                            <span>Progresso de Aquisição</span>
                            <span>
                              {activeSelectedList.items.length > 0
                                ? Math.round((activeSelectedList.items.filter(i => i.status === "presenteado" || i.qtyDelivered > 0).length / activeSelectedList.items.length) * 100)
                                : 0}
                              % Concluído
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50 relative">
                            <div
                              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#C5A030]"
                              style={{
                                width: `${
                                  activeSelectedList.items.length > 0
                                    ? (activeSelectedList.items.filter(i => i.status === "presenteado" || i.qtyDelivered > 0).length / activeSelectedList.items.length) * 100
                                    : 0
                                }%`
                              }}
                            />
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* TAB 2: PRODUCT MANAGER */}
                  {sidebarTab === "products" && (
                    <motion.div
                      key="products-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Section 2.1: Add New Product to List */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="border-b border-gray-50 pb-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E] flex items-center gap-1.5">
                            <PlusCircle size={14} className="text-rose-500" /> Adicionar Presentes do Catálogo da Loja
                          </h4>
                          <p className="text-[8px] text-[#8E8E93] font-bold uppercase tracking-widest mt-0.5">
                            Pesquise os mimos da sua loja e adicione-os instantaneamente a esta lista
                          </p>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                          <input
                            type="text"
                            placeholder="Buscar produtos em catálogo da loja..."
                            value={storeSearch}
                            onChange={(e) => setStoreSearch(e.target.value)}
                            className="w-full bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none transition-all placeholder:text-gray-400"
                          />
                        </div>

                        {/* Search results list */}
                        <div className="max-h-52 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-xl bg-[#FAF9F6] px-2">
                          {filteredStoreProducts.slice(0, 10).map((prod) => {
                            const isAlreadyInList = activeSelectedList.items.some((item) => item.id === prod.id);

                            return (
                              <div key={prod.id} className="flex items-center justify-between py-2.5 px-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-white border border-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                    {prod.image ? (
                                      <img src={prod.image} alt={prod.product_name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Gift size={16} className="text-gray-300" />
                                    )}
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-black text-gray-800 leading-tight">{prod.product_name}</h5>
                                    <span className="text-[10px] text-rose-400 font-bold">R$ {prod.retail_price.toFixed(2)}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleAddProductToSelectedList(prod)}
                                  disabled={isAlreadyInList}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${
                                    isAlreadyInList
                                      ? "bg-gray-100 text-gray-400 border-gray-100"
                                      : "bg-white text-rose-500 border-rose-100 hover:bg-rose-50"
                                  }`}
                                >
                                  {isAlreadyInList ? (
                                    <>
                                      <Check size={10} /> Já na Lista
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={10} /> Incluir
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}

                          {filteredStoreProducts.length === 0 && (
                            <div className="py-6 text-center text-gray-400">
                              <p className="text-[10px] font-bold uppercase tracking-wider">Nenhum produto em catálogo correspondente</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 2.2: List of active products in list */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="border-b border-gray-50 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E] flex items-center gap-1.5">
                              <Package size={14} className="text-[#D4AF37]" /> Presentes na Lista ({activeSelectedList.items.length})
                            </h4>
                            <p className="text-[8px] text-[#8E8E93] font-bold uppercase tracking-widest mt-0.5">
                              Ajuste posições, defina destaques e gerencie o estoque e reservas para cada presente
                            </p>
                          </div>

                          <input
                            type="text"
                            placeholder="Buscar nesta lista..."
                            value={listProductSearch}
                            onChange={(e) => setListProductSearch(e.target.value)}
                            className="bg-[#FAF9F6] border border-[#E5E5EA] focus:border-rose-300 rounded-lg px-2.5 py-1 text-[10px] font-bold outline-none"
                          />
                        </div>

                        {/* List products manager items */}
                        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                          {sortedAndFilteredListProducts.map((item, idx) => {
                            return (
                              <div
                                key={item.id}
                                className="bg-[#FCFBF9] border border-gray-100 rounded-xl p-4 space-y-4 relative hover:shadow-xs transition-shadow"
                              >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100/50 pb-3">
                                  <div className="flex items-center gap-3">
                                    {/* Thumbnail */}
                                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                      {item.image ? (
                                        <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Gift size={20} className="text-gray-300" />
                                      )}
                                    </div>

                                    <div>
                                      <h5 className="text-xs font-black text-gray-800 flex items-center gap-2">
                                        {item.product_name}
                                        {item.isHighlighted && (
                                          <span className="bg-amber-50 text-amber-500 border border-amber-200 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                            <Star size={8} fill="#EAB308" className="text-amber-500" /> Destaque
                                          </span>
                                        )}
                                      </h5>
                                      <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                                        R$ {item.retail_price.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quick Actions (Move up, move down, highlight, trash) */}
                                  <div className="flex items-center gap-1.5 self-end md:self-auto">
                                    <button
                                      onClick={() => handleMoveProductOrder(idx, "up")}
                                      disabled={idx === 0}
                                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-all border border-gray-200 bg-white"
                                      title="Mover para Cima"
                                    >
                                      <ArrowUp size={12} />
                                    </button>

                                    <button
                                      onClick={() => handleMoveProductOrder(idx, "down")}
                                      disabled={idx === sortedAndFilteredListProducts.length - 1}
                                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-all border border-gray-200 bg-white"
                                      title="Mover para Baixo"
                                    >
                                      <ArrowDown size={12} />
                                    </button>

                                    <button
                                      onClick={() => handleToggleProductHighlight(item.id, item.product_name)}
                                      className={`p-1.5 rounded-lg transition-all border ${
                                        item.isHighlighted
                                          ? "bg-amber-50 border-amber-200 text-amber-500"
                                          : "bg-white border-gray-200 text-gray-400 hover:text-amber-500"
                                      }`}
                                      title="Alternar Destaque"
                                    >
                                      <Star size={12} fill={item.isHighlighted ? "#EAB308" : "none"} />
                                    </button>

                                    <button
                                      onClick={() => handleRemoveProductFromSelectedList(item.id, item.product_name)}
                                      className="p-1.5 bg-white hover:bg-red-50 border border-red-100 hover:border-red-200 text-red-400 hover:text-red-600 rounded-lg transition-all"
                                      title="Remover da Lista"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Quantities control section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Available Quantity */}
                                  <div className="bg-white border border-gray-100 rounded-lg p-2.5 flex flex-col justify-between">
                                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Disponível</span>
                                    <div className="flex items-center justify-between">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateItemQuantities(
                                            item.id,
                                            { qtyAvailable: Math.max(0, item.qtyAvailable - 1) },
                                            "Estoque Disponível Reduzido",
                                            `A quantidade disponível do presente "${item.product_name}" foi reduzida para ${Math.max(0, item.qtyAvailable - 1)}.`,
                                            "order_changed"
                                          )
                                        }
                                        className="text-gray-400 hover:text-rose-500"
                                      >
                                        <MinusCircle size={14} />
                                      </button>
                                      <span className="text-xs font-black text-gray-800">{item.qtyAvailable}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateItemQuantities(
                                            item.id,
                                            { qtyAvailable: item.qtyAvailable + 1 },
                                            "Estoque Disponível Incrementado",
                                            `A quantidade disponível do presente "${item.product_name}" foi incrementada para ${item.qtyAvailable + 1}.`,
                                            "order_changed"
                                          )
                                        }
                                        className="text-gray-400 hover:text-emerald-500"
                                      >
                                        <PlusCircle size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Reserved Quantity */}
                                  <div className="bg-white border border-gray-100 rounded-lg p-2.5 flex flex-col justify-between">
                                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Reservado</span>
                                    <div className="flex items-center justify-between">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateItemQuantities(
                                            item.id,
                                            { qtyReserved: Math.max(0, item.qtyReserved - 1) },
                                            "Reserva Desfeita",
                                            `A quantidade reservada do presente "${item.product_name}" foi atualizada para ${Math.max(0, item.qtyReserved - 1)}.`,
                                            "cancellation"
                                          )
                                        }
                                        className="text-gray-400 hover:text-rose-500"
                                      >
                                        <MinusCircle size={14} />
                                      </button>
                                      <span className="text-xs font-black text-amber-500">{item.qtyReserved}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextCount = item.qtyReserved + 1;
                                          const name = prompt("Insira o nome do convidado que deseja reservar este presente:", item.reservedBy || "");
                                          handleUpdateItemQuantities(
                                            item.id,
                                            { 
                                              qtyReserved: nextCount,
                                              reservedBy: name || item.reservedBy || "Convidado"
                                            },
                                            "Reserva Efetuada",
                                            `Uma nova unidade do presente "${item.product_name}" foi reservada por "${name || 'Convidado'}".`,
                                            "reservation"
                                          );
                                        }}
                                        className="text-gray-400 hover:text-emerald-500"
                                      >
                                        <PlusCircle size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Delivered Quantity */}
                                  <div className="bg-white border border-gray-100 rounded-lg p-2.5 flex flex-col justify-between">
                                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Entregue / Comprado</span>
                                    <div className="flex items-center justify-between">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateItemQuantities(
                                            item.id,
                                            { qtyDelivered: Math.max(0, item.qtyDelivered - 1) },
                                            "Entrega Desfeita",
                                            `A quantidade entregue do presente "${item.product_name}" foi atualizada para ${Math.max(0, item.qtyDelivered - 1)}.`,
                                            "order_changed"
                                          )
                                        }
                                        className="text-gray-400 hover:text-rose-500"
                                      >
                                        <MinusCircle size={14} />
                                      </button>
                                      <span className="text-xs font-black text-blue-500">{item.qtyDelivered}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextCount = item.qtyDelivered + 1;
                                          const name = prompt("Insira o nome do comprador que adquiriu este presente:", item.giftedBy || "");
                                          handleUpdateItemQuantities(
                                            item.id,
                                            { 
                                              qtyDelivered: nextCount,
                                              giftedBy: name || item.giftedBy || "Convidado"
                                            },
                                            "Presente Entregue",
                                            `Uma unidade do presente "${item.product_name}" foi marcada como comprada/entregue por "${name || 'Convidado'}".`,
                                            "delivery"
                                          );
                                        }}
                                        className="text-gray-400 hover:text-emerald-500"
                                      >
                                        <PlusCircle size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Status and Guest Metadata fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                  {/* Dominant Status Dropdown */}
                                  <div>
                                    <span className="block text-[8px] font-black uppercase text-gray-400 mb-1">Status Dominante</span>
                                    <select
                                      value={item.status || "disponivel"}
                                      onChange={(e) => {
                                        const status = e.target.value as any;
                                        handleUpdateItemQuantities(
                                          item.id,
                                          { status },
                                          "Status Modificado",
                                          `O status do presente "${item.product_name}" foi modificado manualmente para "${status}".`,
                                          status === "reservado" ? "reservation" : status === "presenteado" ? "delivery" : "cancellation"
                                        );
                                      }}
                                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-[10px] font-bold text-gray-800 outline-none"
                                    >
                                      <option value="disponivel">Disponível</option>
                                      <option value="reservado">Reservado</option>
                                      <option value="presenteado">Presenteado / Entregue</option>
                                    </select>
                                  </div>

                                  {/* Guest names text fields */}
                                  <div className="flex flex-col justify-end">
                                    {item.status === "reservado" && (
                                      <div>
                                        <span className="block text-[8px] font-black uppercase text-gray-400 mb-1">Nome do Convidado</span>
                                        <input
                                          type="text"
                                          placeholder="Nome de quem reservou"
                                          value={item.reservedBy || ""}
                                          onChange={(e) =>
                                            handleUpdateItemQuantities(
                                              item.id,
                                              { reservedBy: e.target.value },
                                              "Nome de Reserva Atualizado",
                                              `O nome da pessoa que reservou o presente "${item.product_name}" foi atualizado para "${e.target.value}".`,
                                              "order_changed"
                                            )
                                          }
                                          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-[10px] font-bold outline-none"
                                        />
                                      </div>
                                    )}

                                    {item.status === "presenteado" && (
                                      <div>
                                        <span className="block text-[8px] font-black uppercase text-gray-400 mb-1">Nome do Comprador</span>
                                        <input
                                          type="text"
                                          placeholder="Nome de quem presenteou"
                                          value={item.giftedBy || ""}
                                          onChange={(e) =>
                                            handleUpdateItemQuantities(
                                              item.id,
                                              { giftedBy: e.target.value },
                                              "Nome de Comprador Atualizado",
                                              `O nome do comprador do presente "${item.product_name}" foi atualizado para "${e.target.value}".`,
                                              "order_changed"
                                            )
                                          }
                                          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-[10px] font-bold outline-none"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {sortedAndFilteredListProducts.length === 0 && (
                            <div className="bg-white border border-[#E5E5EA] rounded-[1.5rem] p-12 text-center text-gray-400">
                              <Package size={32} className="mx-auto mb-2 opacity-30" />
                              <h5 className="text-[10px] font-black uppercase tracking-wider">Nenhum presente na lista</h5>
                              <p className="text-[9px] text-gray-400 mt-0.5">Use o campo acima para buscar e incluir novos presentes.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: LINHA DO TEMPO (TIMELINE) */}
                  {sidebarTab === "timeline" && (
                    <motion.div
                      key="timeline-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="border-b border-gray-50 pb-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E] flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" /> Histórico de Alterações da Lista
                          </h4>
                          <p className="text-[8px] text-[#8E8E93] font-bold uppercase tracking-widest mt-0.5">
                            Linha do tempo detalhada registrando criação, inclusões, reservas, entregas e encerramentos
                          </p>
                        </div>

                        {/* Interactive Timeline */}
                        <div className="relative pl-6 border-l-2 border-rose-100 space-y-6 ml-3 py-2">
                          {activeSelectedList.history && activeSelectedList.history.length > 0 ? (
                            activeSelectedList.history.map((log) => {
                              return (
                                <div key={log.id} className="relative">
                                  {/* Bullet point indicator with icon */}
                                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-rose-300 ring-4 ring-white">
                                    {log.type === "created" && <Gift size={8} className="text-rose-400" />}
                                    {log.type === "product_added" && <Plus size={8} className="text-emerald-500" />}
                                    {log.type === "product_removed" && <Trash2 size={8} className="text-red-400" />}
                                    {log.type === "reservation" && <Sparkles size={8} className="text-amber-500" />}
                                    {log.type === "cancellation" && <X size={8} className="text-rose-400" />}
                                    {log.type === "delivery" && <Check size={8} className="text-blue-500" />}
                                    {log.type === "ended" && <CheckCircle size={8} className="text-[#D4AF37]" />}
                                    {(!["created", "product_added", "product_removed", "reservation", "cancellation", "delivery", "ended"].includes(log.type)) && (
                                      <Clock size={8} className="text-gray-400" />
                                    )}
                                  </span>

                                  {/* Log Event Body */}
                                  <div className="space-y-1.5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                                      <h5 className="text-xs font-black text-gray-800 uppercase tracking-tight">
                                        {log.title}
                                      </h5>
                                      <span className="text-[9px] font-mono font-bold text-gray-400">
                                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed bg-[#FAF9F6] p-2 rounded-lg border border-gray-100">
                                      {log.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            // Default Fallback Log if list was created before history tracking was added
                            <div className="relative">
                              <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-rose-300 ring-4 ring-white">
                                <Gift size={8} className="text-rose-400" />
                              </span>
                              <div className="space-y-1.5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                                  <h5 className="text-xs font-black text-gray-800 uppercase tracking-tight">
                                    Lista Criada
                                  </h5>
                                  <span className="text-[9px] font-mono font-bold text-gray-400">
                                    {activeSelectedList.createdAt?.toDate 
                                      ? activeSelectedList.createdAt.toDate().toLocaleString("pt-BR")
                                      : "Data da criação original"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed bg-[#FAF9F6] p-2 rounded-lg border border-gray-100">
                                  A lista de presentes "{activeSelectedList.listName}" foi registrada com o código de identificação único {activeSelectedList.code}.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Sidebar footer statistics summary */}
              <div className="p-6 border-t border-gray-100 shrink-0 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                    <Package size={14} />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-[#8E8E93] block">Valoração Estimada</span>
                    <span className="text-xs font-black text-gray-800">
                      R$ {activeSelectedList.items.reduce((sum, item) => sum + (item.retail_price * (item.qtyAvailable + item.qtyReserved + item.qtyDelivered || 1)), 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedList(null)}
                  className="w-full md:w-auto bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all text-center"
                >
                  Fechar Painel
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});

// Simple icon helpers representing Slider/Info icon without unnecessary external imports
const SlidersIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="2" y1="14" x2="6" y2="14" />
    <line x1="10" y1="8" x2="14" y2="8" />
    <line x1="18" y1="16" x2="22" y2="16" />
  </svg>
);

const InfoIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
