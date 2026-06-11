import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gift,
  Search,
  Trash2,
  Printer,
  ExternalLink,
  Calendar,
  Package,
  ShoppingBag,
  X,
} from "lucide-react";
import { subscribeToGiftLists } from "../../services/firebaseService";
import { db } from "../../lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { ImageWithFallback } from "../ImageWithFallback";
import { exportGenericReportPDF } from "../../utils/pdfGenerator";

export const GiftListsTab: React.FC<{ companyId: string }> = ({
  companyId,
}) => {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedList, setSelectedList] = useState<any | null>(null);

  useEffect(() => {
    const unsub = subscribeToGiftLists(setLists, companyId);
    setLoading(false);
    return () => unsub();
  }, [companyId]);

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir esta lista?")) {
      await deleteDoc(doc(db, "giftLists", id));
    }
  };

  const handlePrint = (list: any) => {
    const rows = list.items.map((item: any) => [
      item.product_name,
      `R$ ${(item.retail_price || 0).toFixed(2)}`
    ]);

    const total = list.items.reduce((acc: number, i: any) => acc + (i.retail_price || 0), 0);
    rows.push(["TOTAL:", `R$ ${total.toFixed(2)}`]);

    exportGenericReportPDF({
      title: `Lista de Presentes - Código: ${list.code}`,
      columns: ["Produto", "Preço"],
      rows,
      filters: `Data: ${list.createdAt?.toDate?.()?.toLocaleDateString() || new Date(list.createdAt).toLocaleDateString()}`
    });
  };

  const filtered = lists.filter((l) =>
    l.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            Lista de Presentes
          </h2>
          <p className="text-xs text-[#A09898] font-bold uppercase tracking-widest mt-1">
            Gerencie as listas criadas pelos clientes
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A09898]"
            size={16}
          />
          <input
            type="text"
            placeholder="BUSCAR CÓDIGO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#F0E6D2] rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black uppercase outline-none focus:border-lilac/30 transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map((list) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#F0E6D2] rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-lilac/10 rounded-2xl text-lilac">
                  <Gift size={20} />
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => handlePrint(list)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#A09898] hover:text-slate-900 hover:bg-slate-50 transition-colors text-[9px] font-black uppercase tracking-widest"
                    title="Abrir PDF"
                  >
                    <Printer size={14} /> Abrir PDF
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-500 transition-colors text-[9px] font-black uppercase tracking-widest"
                    title="Excluir"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-black text-[#D1CACA] uppercase tracking-[0.2em]">
                  CÓDIGO
                </span>
                <div className="text-2xl font-mono font-black tracking-tight">
                  {list.code}
                </div>
              </div>

              <div className="flex-1 space-y-3 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <ShoppingBag size={14} />
                  {list.items.length} itens selecionados
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Calendar size={14} />
                  {list.createdAt?.toDate().toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => setSelectedList(list)}
                className="w-full py-3 bg-white hover:bg-black hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Ver Detalhes
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-[#D1CACA] grayscale opacity-40">
          <Gift size={60} className="mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            Nenhuma lista encontrada
          </p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedList && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedList(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-black uppercase tracking-widest text-sm">
                  Resumo da Lista: {selectedList.code}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleDelete(selectedList.id);
                      setSelectedList(null);
                    }}
                    className="p-2 text-[#A09898] hover:text-slate-9000 hover:bg-slate-50 rounded-full transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedList(null)}
                    className="p-2 hover:bg-white rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {selectedList.items.map((item: any, idx: number) => (
                  <div
                    key={item.id || item.product_name || idx}
                    className="flex items-center gap-4 p-3 bg-white rounded-xl border border-[#F0E6D2]"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <ImageWithFallback
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package size={16} className="text-[#D1CACA]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black uppercase tracking-tight line-clamp-1">
                        {item.product_name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold">
                        R$ {item.retail_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-gray-50 bg-white/50 flex justify-between items-center">
                <div className="text-xs font-black uppercase text-[#A09898]">
                  Total Sugerido
                </div>
                <div className="text-xl font-mono font-black">
                  R${" "}
                  {selectedList.items
                    .reduce((acc: number, i: any) => acc + i.retail_price, 0)
                    .toFixed(2)}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
