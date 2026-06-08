import React, { useState, useMemo } from "react";
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
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="relative w-full md:w-96">
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
        <div className="flex items-center gap-4 justify-end">
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
            onClick={() => window.print()}
            className="flex items-center justify-center p-4 bg-white text-slate-400 border border-slate-200 rounded-[1.25rem] hover:text-lilac hover:bg-slate-50 transition-all shadow-sm group"
            title="Visualização em PDF"
          >
            <Printer size={18} className="group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => {
              setEditingInsumo({});
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-black text-white font-black py-4 px-10 rounded-[1.25rem] hover:scale-105 transition-all shadow-xl text-[9px] uppercase tracking-[0.3em] border border-black/10"
          >
            <Plus size={18} /> Novo Insumo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-lilac/10 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-gray-50">
              <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#A09898]">
                Cod. Insumo
              </th>
              <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#A09898]">
                Nome
              </th>
              <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#A09898]">
                Descrição
              </th>
              <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#A09898]">
                Quantidade
              </th>
              <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#A09898]">
                Vlr. Unitário
              </th>
              <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#A09898] text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 uppercase">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-24 text-center text-[#A09898] italic text-[11px] font-black tracking-widest opacity-50"
                >
                  Nenhum insumo encontrado no catálogo.
                </td>
              </tr>
            )}
            {filtered.map((insumo, idx) => (
              <React.Fragment key={`ins-row-${insumo.id}-${idx}`}>
                <tr
                  className="group hover:bg-lilac-baby/30 transition-all cursor-pointer"
                  onClick={() =>
                    setIsDetailOpen(
                      isDetailOpen === insumo.id ? null : insumo.id,
                    )
                  }
                >
                  <td className="py-6 px-8">
                    <span className="font-mono text-[10px] font-black text-lilac">
                      #{insumo.code || "---"}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-xs font-black text-slate-900 tracking-tight">
                      {insumo.name}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-[10px] text-[#A09898] font-bold truncate max-w-[150px] block">
                      {insumo.description || "Sem detalhes"}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <span
                      className={`text-xs font-black ${insumo.quantity <= (insumo.criticalLimit || 5) ? "text-slate-9000" : "text-emerald-500"}`}
                    >
                      {insumo.quantity}{" "}
                      <span className="text-[9px] uppercase font-sans text-[#A09898]">
                        {insumo.unit}
                      </span>
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-xs font-black text-slate-900">
                      {formatCurrency(insumo.unitValue || 0)}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div
                      className="flex justify-end gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setIsDetailOpen(
                            isDetailOpen === insumo.id ? null : insumo.id,
                          )
                        }
                        className="p-3 rounded-xl bg-slate-50 text-[#D1CACA] hover:text-lilac transition-all"
                      >
                        <Info size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingInsumo(insumo);
                          setIsModalOpen(true);
                        }}
                        className="p-3 rounded-xl bg-slate-50 text-[#D1CACA] hover:text-slate-900 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setInsumoToDelete(insumo.id || null)}
                        className="p-3 rounded-xl bg-slate-50 text-rose-200 hover:text-slate-9000 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                {isDetailOpen === insumo.id && (
                  <tr className="bg-slate-50/50">
                    <td
                      colSpan={6}
                      className="px-12 py-8 border-b border-[#F0E6D2]"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[#A09898] mb-2">
                            Último Valor Pago
                          </p>
                          <p className="text-sm font-black text-slate-900">
                            {formatCurrency(insumo.costPrice || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[#A09898] mb-2">
                            Categoria
                          </p>
                          <p className="text-xs font-black text-lilac italic">
                            {insumo.category || "Não definida"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[#A09898] mb-2">
                            Subcategoria
                          </p>
                          <p className="text-xs font-black text-gray-600">
                            {insumo.subcategory || "---"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
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

  const categories = Array.from(
    new Set(existingInsumos?.map((i) => i.category).filter(Boolean) || []),
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
