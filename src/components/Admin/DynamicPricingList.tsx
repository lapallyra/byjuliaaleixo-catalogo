import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface ListItem {
  id: string;
  name: string;
  value: number;
  category?: string;
}

interface DynamicPricingListProps {
  title: string;
  subtitle: string;
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
  isPercentage?: boolean;
}

export const DynamicPricingList: React.FC<DynamicPricingListProps> = ({
  title,
  subtitle,
  items = [],
  onChange,
  isPercentage,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemValue, setNewItemValue] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean)),
  ) as string[];

  const handleAdd = () => {
    if (!newItemName || !newItemValue) return;
    const finalCategory = showNewCatInput ? customCategory : newItemCategory;
    onChange([
      ...items,
      {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
        name: newItemName,
        value: Number(newItemValue),
        category: finalCategory,
      },
    ]);
    setNewItemName("");
    setNewItemValue("");
    setNewItemCategory("");
    setCustomCategory("");
    setShowNewCatInput(false);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const handleUpdate = (id: string, newName: string, newValue: number) => {
    onChange(
      items.map((i) =>
        i.id === id ? { ...i, name: newName, value: newValue } : i,
      ),
    );
    setEditingId(null);
  };

  const total = items.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  return (
    <div className="p-8 rounded-[2rem] bg-[#FAF9F6] border border-lilac/10 space-y-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lilac/5 pb-6">
        <div>
          <h4 className="text-[14px] font-black uppercase text-slate-900 tracking-widest">
            {title}
          </h4>
          <p className="text-[9px] font-bold text-lilac uppercase tracking-widest mt-1">
            {subtitle}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-[#A09898] uppercase tracking-widest mb-1">
            Total acumulado
          </p>
          <p className="text-xl font-mono font-black text-slate-900">
            {!isPercentage && "R$"} {total.toFixed(2)} {isPercentage && "%"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-lilac/5 hover:border-lilac/20 transition-all hover:shadow-md"
          >
            {editingId === item.id ? (
              <div className="flex-1 flex flex-wrap gap-3">
                <input
                  type="text"
                  defaultValue={item.name}
                  className="flex-1 min-w-[150px] bg-slate-50 border border-lilac/10 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-900 outline-none focus:border-lilac"
                  onBlur={(e) =>
                    handleUpdate(item.id, e.target.value, item.value)
                  }
                  autoFocus
                />
                <input
                  type="number"
                  defaultValue={item.value}
                  className="w-24 bg-slate-50 border border-lilac/10 rounded-xl px-4 py-3 text-[11px] font-black text-slate-900 outline-none focus:border-lilac"
                  onBlur={(e) =>
                    handleUpdate(item.id, item.name, Number(e.target.value))
                  }
                />
                <button
                  onClick={() => setEditingId(null)}
                  className="p-3 text-emerald-500 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black text-slate-900 uppercase">
                      {item.name}
                    </span>
                    {item.category && (
                      <span className="text-[7px] font-bold bg-lilac/10 text-lilac px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <p className="text-[8px] text-[#A09898] font-bold uppercase tracking-widest">
                    Registrado em base global
                  </p>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div className="font-mono text-sm font-black text-slate-900">
                    {!isPercentage && "R$"} {item.value.toFixed(2)}{" "}
                    {isPercentage && "%"}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[#D1CACA] hover:text-lilac hover:bg-lilac/5 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[#D1CACA] hover:text-slate-9000 hover:bg-slate-50 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 bg-white/50 border-2 border-dashed border-lilac/10 rounded-[2rem] text-[9px] text-[#A09898] font-black uppercase tracking-[0.3em]">
            Nenhum registro de custo ativo
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-lilac/10 shadow-inner space-y-4">
        <h5 className="text-[9px] font-black text-lilac uppercase tracking-[0.3em] mb-4">
          Adicionar novo item
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="NOME (EX: ALUGUEL)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-xl px-5 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-lilac transition-all"
          />

          <input
            type="number"
            placeholder={isPercentage ? "VALOR %" : "VALOR R$"}
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-xl px-5 py-4 text-[10px] font-black outline-none focus:border-lilac transition-all"
          />

          <div className="flex gap-2">
            {!showNewCatInput ? (
              <div className="flex-1 flex gap-2">
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="flex-1 bg-[#FAF9F6] border border-lilac/10 rounded-xl px-4 py-4 text-[9px] font-black uppercase tracking-widest outline-none focus:border-lilac"
                >
                  <option value="">CATEGORIA...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(true)}
                  className="p-4 bg-lilac/5 text-lilac rounded-xl hover:bg-lilac/10 transition-all border border-lilac/10"
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="NOVA CATEGORIA..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="flex-1 bg-[#FAF9F6] border border-lilac/10 rounded-xl px-4 py-4 text-[9px] font-black uppercase outline-none focus:border-lilac"
                />
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(false)}
                  className="p-4 bg-slate-50 text-[#D1CACA] rounded-xl"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-black/10 h-full min-h-[50px] flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};
