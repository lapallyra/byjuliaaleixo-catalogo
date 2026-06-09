import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  TrendingDown,
  Archive,
  Info,
  Hash,
  DollarSign,
  X,
  Printer,
} from "lucide-react";
import { CSVHandler } from "./CSVHandler";
import { Insumo } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { exportGenericReportPDF } from "../../utils/pdfGenerator";

interface InventoryTabProps {
  insumos: Insumo[];
  onSaveInsumo: (insumo: Partial<Insumo>) => void;
  onDeleteInsumo: (id: string) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  insumos,
  onSaveInsumo,
  onDeleteInsumo,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Partial<Insumo> | null>(
    null,
  );
  const [insumoToDelete, setInsumoToDelete] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map(i => i.id));
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
    try {
      for (const id of selectedIds) {
        await onDeleteInsumo(id);
      }
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      alert("Insumos excluídos com sucesso!");
    } catch (e) {
      console.error("Erro na exclusão em massa:", e);
      alert("Houve um erro ao excluir um ou mais insumos.");
    }
  };

  const confirmDelete = () => {
    if (insumoToDelete) {
      onDeleteInsumo(insumoToDelete);
      setInsumoToDelete(null);
    }
  };

  const criticalItems = useMemo(
    () => insumos.filter((i) => i.quantity <= (i.criticalLimit || 5)),
    [insumos],
  );

  const filtered = useMemo(
    () =>
      insumos.filter(
        (i) =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.code && i.code.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    [insumos, searchTerm],
  );

  const [isDetailOpen, setIsDetailOpen] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
      {/* Critical Alert */}
      {criticalItems.length > 0 && (
        <div className="bg-slate-50 border-1 border-rose-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200 animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest tracking-tight">
                Estoque Crítico Detectado
              </h3>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">
                {criticalItems.length}{" "}
                {criticalItems.length === 1 ? "item precisa" : "itens precisam"}{" "}
                de reposição imediata.
              </p>
            </div>
          </div>
          <div className="flex -space-x-3 overflow-hidden p-1">
            {criticalItems.slice(0, 5).map((item, idx) => (
              <div
                key={`crit-${item.id}-${idx}`}
                className="w-10 h-10 rounded-full border-2 border-white bg-white flex items-center justify-center text-[10px] font-black text-slate-9000 shadow-sm"
                title={item.name}
              >
                {item.name.charAt(0)}
              </div>
            ))}
            {criticalItems.length > 5 && (
              <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-9000 shadow-sm">
                +{criticalItems.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[2rem] border border-lilac/10 shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D1CACA]"
            size={16}
          />
          <input
            type="text"
            placeholder="BUSCAR NO ESTOQUE..."
            className="w-full pl-14 pr-6 py-4 rounded-[1.25rem] bg-white border border-lilac/10 text-[10px] uppercase font-black tracking-[0.2em] outline-none focus:border-lilac transition-all text-slate-900 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-center lg:justify-end">
          <CSVHandler 
            moduleName="Insumos" 
            data={filtered} 
            fields={['name', 'code', 'unit', 'quantity', 'costPrice', 'description']}
            onImport={(newData) => {
                for (const item of newData) {
                    onSaveInsumo({
                        ...item,
                        quantity: Number(item.quantity) || 0,
                        costPrice: Number(item.costPrice) || 0,
                    });
                }
            }}
          />
          <button
            onClick={() => {
              const rows = filtered.map(ins => [
                ins.name,
                ins.category || "---",
                `${ins.quantity} ${ins.unit}`,
                `R$ ${(ins.costPrice || 0).toFixed(2)}`
              ]);
              exportGenericReportPDF({
                title: "Relatório de Estoque (Insumos)",
                columns: ["Material", "Categoria", "Estoque Físico", "Custo Unit."],
                rows,
                filters: `Busca: ${searchTerm || 'Nenhuma'}`
              });
            }}
            className="flex items-center justify-center px-6 py-4 bg-white text-slate-400 border border-slate-200 rounded-[1.25rem] hover:text-lilac hover:bg-slate-50 transition-all shadow-sm group text-[9px] font-black uppercase tracking-widest gap-2"
          >
            <Printer size={16} className="group-hover:scale-110 transition-transform" /> PDF
          </button>
          <button
            onClick={() => {
              setEditingInsumo({});
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-black text-white font-black py-4 px-10 rounded-[1.25rem] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl text-[9px] uppercase tracking-[0.3em] border border-black/10"
          >
            <Plus size={18} /> Novo Insumo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(max(300px,20%),1fr))] gap-6 pb-20">
        {filtered.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-lilac/20">
            <p className="text-[#A09898] italic text-[11px] font-black tracking-widest opacity-50 uppercase">
              Nenhum insumo encontrado no catálogo.
            </p>
          </div>
        )}
        {filtered.map((insumo, idx) => {
          const isCritical = insumo.quantity <= (insumo.criticalLimit || 5);
          return (
            <div
              key={`ins-card-${insumo.id}-${idx}`}
              className={`bg-white rounded-[2rem] border transition-all duration-300 p-8 flex flex-col gap-6 hover:shadow-xl group relative min-h-[360px] ${
                selectedIds.includes(insumo.id) ? "border-lilac ring-1 ring-lilac/20" : "border-lilac/10 hover:border-lilac/30"
              }`}
            >
              {/* Checkbox Overlay */}
              <div className="absolute top-6 left-6 z-10" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(insumo.id)}
                  onChange={(e) => handleSelectOne(insumo.id, e.target.checked)}
                  className="rounded border-gray-300 text-lilac focus:ring-lilac cursor-pointer scale-110"
                />
              </div>

              <div className="flex items-start justify-between pl-8">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] font-black text-lilac tracking-widest uppercase">
                    #{insumo.code || "---"}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-lilac transition-colors">
                    {insumo.name}
                  </h4>
                  <span className="text-[10px] font-black text-[#A09898] uppercase tracking-widest">
                    {insumo.category || "Geral"}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  isCritical ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                }`}>
                  <Package size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-50 bg-slate-50/50 rounded-2xl px-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-[#A09898] uppercase tracking-widest mb-1">Qtd Atual</span>
                  <span className={`text-sm font-black ${isCritical ? "text-rose-600" : "text-slate-900"}`}>
                    {insumo.quantity} <span className="text-[9px] text-[#A09898] ml-0.5">{insumo.unit}</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-[#A09898] uppercase tracking-widest mb-1">Preço/Un.</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatCurrency(insumo.unitValue || 0)}
                  </span>
                </div>
              </div>

              {insumo.description && (
                <p className="text-[10px] text-[#A09898] font-medium leading-relaxed line-clamp-2 px-2 italic">
                  {insumo.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingInsumo(insumo);
                      setIsModalOpen(true);
                    }}
                    className="p-3 rounded-xl bg-slate-50 text-[#D1CACA] hover:text-slate-900 hover:bg-white transition-all border border-transparent hover:border-slate-200"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setInsumoToDelete(insumo.id || null)}
                    className="p-3 rounded-xl bg-slate-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all border border-transparent"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <button
                  onClick={() => setIsDetailOpen(isDetailOpen === insumo.id ? null : insumo.id)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-9000 text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md active:scale-95"
                >
                  <Info size={14} /> Detalhes
                </button>
              </div>

              {isDetailOpen === insumo.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-gray-50 space-y-3"
                >
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#A09898]">Custo Total</span>
                    <span className="text-xs font-black text-slate-900">
                      {formatCurrency(insumo.costPrice || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#A09898]">Subcategoria</span>
                    <span className="text-xs font-black text-lilac">
                      {insumo.subcategory || "---"}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <InsumoFormModal
          editingInsumo={editingInsumo}
          existingInsumos={insumos}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            await onSaveInsumo({
              ...data,
              id: editingInsumo?.id,
              code:
                editingInsumo?.code ||
                `INS-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
            });
            setIsModalOpen(false);
          }}
        />
      )}
      {insumoToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center animate-in zoom-in-95">
            <Trash2 size={48} className="mx-auto text-slate-9000 mb-6" />
            <h3 className="text-xl font-black mb-2 uppercase">
              Excluir Insumo?
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setInsumoToDelete(null)}
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
              Excluir Insumos Selecionados?
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              Essa ação não pode ser desfeita e excluirá {selectedIds.length} insumos selecionados de forma segura e permanente.
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
            {selectedIds.length} {selectedIds.length === 1 ? 'insumo selecionado' : 'insumos selecionados'}
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

interface InsumoFormModalProps {
  editingInsumo: Partial<Insumo> | null;
  onClose: () => void;
  onSave: (data: Partial<Insumo>) => void;
}

const InsumoFormModal: React.FC<
  InsumoFormModalProps & { existingInsumos: Insumo[] }
> = ({ editingInsumo, onClose, onSave, existingInsumos }) => {
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(editingInsumo?.quantity || 0);
  const [cost, setCost] = useState(editingInsumo?.costPrice || 0);
  const [category, setCategory] = useState(editingInsumo?.category || "");
  const [subcategory, setSubcategory] = useState(
    editingInsumo?.subcategory || "",
  );
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState("");
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [showNewSubInput, setShowNewSubInput] = useState(false);
  const unitValRaw = qty > 0 ? cost / qty : 0;
  const unitVal = Math.ceil(unitValRaw * 100) / 100;

  const defaultInsumoCategories = [
    "Acessórios",
    "Espirais e Wire-o",
    "Papéis",
    "Papelão Cinza",
    "Plásticos e Bolsos",
    "Fitas e Elásticos",
    "Ferramentas",
    "Embalagens",
    "Tintas e Colas"
  ];
  const categories = Array.from(
    new Set([
      ...defaultInsumoCategories,
      ...(existingInsumos?.map((i) => i.category).filter(Boolean) || [])
    ]),
  );
  const subcategories = Array.from(
    new Set(
      existingInsumos
        ?.filter((i) => i.category === category)
        .map((i) => i.subcategory)
        .filter(Boolean) || [],
    ),
  );

  const handleNumericInput = (val: number, setter: (v: number) => void) => {
    if (isNaN(val)) return;
    setter(val);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white  w-full  max-w-xl  rounded-[2rem] border border-lilac/30 p-8 md:p-10 shadow-2xl  relative max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-8 right-8 p-1 rounded-full hover:bg-slate-100 text-[#A09898]"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-8">
          {editingInsumo?.id ? "Editar Insumo" : "Novo Insumo"}
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const formData = new FormData(e.currentTarget);
              await onSave({
                id: editingInsumo?.id,
                name: formData.get("name") as string,
                category: showNewCatInput ? newCat : category,
                subcategory: showNewSubInput ? newSub : subcategory,
                unit: formData.get("unit") as any,
                quantity: Number(qty),
                costPrice: Number(cost),
                unitValue: unitVal,
                description: formData.get("description") as string,
                criticalLimit: 5,
              });
              onClose();
            } catch (err) {
              console.error("Erro ao salvar insumo:", err);
              alert("Erro ao salvar insumo. Verifique sua conexão.");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-6"
        >
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] uppercase font-black tracking-widest text-[#A09898] pl-2">
              Nome do Material
            </label>
            <input
              name="name"
              defaultValue={editingInsumo?.name}
              required
              type="text"
              className="w-full bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-bold outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] uppercase font-black tracking-widest text-[#A09898] pl-2">
                Categoria
              </label>
              {!showNewCatInput ? (
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-bold outline-none text-slate-900"
                  >
                    <option value="">Selecionar...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(true)}
                    className="p-3 bg-black text-white rounded-xl hover:scale-105 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    placeholder="Nova categoria"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="flex-1 bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-bold outline-none text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(false)}
                    className="p-3 bg-slate-200 rounded-xl text-gray-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] uppercase font-black tracking-widest text-[#A09898] pl-2">
                Subcategoria
              </label>
              {!showNewSubInput ? (
                <div className="flex gap-2">
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="flex-1 bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-bold outline-none text-slate-900"
                  >
                    <option value="">Selecionar...</option>
                    {subcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewSubInput(true)}
                    className="p-3 bg-black text-white rounded-xl hover:scale-105 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    placeholder="Nova subcat"
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    className="flex-1 bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-bold outline-none text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewSubInput(false)}
                    className="p-3 bg-slate-200 rounded-xl text-gray-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] uppercase font-black tracking-widest text-[#A09898] pl-2">
                Qtd em Estoque
              </label>
              <input
                type="number"
                step="1"
                value={qty === 0 ? "" : qty}
                onChange={(e) =>
                  handleNumericInput(Number(e.target.value), setQty)
                }
                required
                placeholder="0"
                className="w-full bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-black outline-none text-slate-900"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] uppercase font-black tracking-widest text-[#A09898] pl-2">
                Vlr Pago Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={cost === 0 ? "" : cost}
                onChange={(e) =>
                  handleNumericInput(Number(e.target.value), setCost)
                }
                required
                placeholder="0.00"
                className="w-full bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-black outline-none text-slate-900"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] uppercase font-black tracking-widest text-[#A09898] pl-2">
                Unidade
              </label>
              <select
                name="unit"
                defaultValue={editingInsumo?.unit || "unid"}
                className="w-full bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-black outline-none text-slate-900 appearance-none"
              >
                <option value="mt">MT</option>
                <option value="unid">UN</option>
                <option value="pct">PCT</option>
                <option value="cx">CX</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black text-white text-center border-2 border-lilac/20">
            <p className="text-[9px] font-black uppercase text-[#A09898] tracking-widest mb-1">
              Custo por Unidade (Unidade/M/Pct)
            </p>
            <p className="text-xl font-mono font-black">
              {formatCurrency(unitVal)}
            </p>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[9px] uppercase font-black tracking-widest text-[#A09898] pl-2">
              Observações / Fornecedor
            </label>
            <textarea
              name="description"
              defaultValue={editingInsumo?.description}
              className="w-full bg-slate-50 border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-bold outline-none h-20 text-slate-900 resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 border border-lilac/10 rounded-xl font-bold uppercase text-[9px] tracking-widest text-[#A09898]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-black text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Insumo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
