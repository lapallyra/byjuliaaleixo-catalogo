import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  Package,
  AlertTriangle,
  Clock,
  MoreVertical,
  X,
  Edit,
  History,
  TrendingDown,
  TrendingUp,
  Save,
} from "lucide-react";
import { Componente } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";

interface ComponentsTabProps {
  componentes: Componente[];
  onSaveComponente: (componente: Partial<Componente>) => Promise<void>;
  onDeleteComponente: (id: string) => Promise<void>;
}

export const ComponentsTab: React.FC<ComponentsTabProps> = ({
  componentes,
  onSaveComponente,
  onDeleteComponente,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponente, setEditingComponente] = useState<Partial<Componente> | null>(null);

  // KPIs
  const totalComponentes = componentes.length;
  const lowStock = componentes.filter((c) => c.quantity <= c.minQuantity && c.quantity > 0).length;
  const noStock = componentes.filter((c) => c.quantity === 0).length;
  const totalValue = componentes.reduce((acc, c) => acc + (c.quantity * c.unitCost), 0);

  const filtered = useMemo(() => 
    componentes.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [componentes, searchTerm]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Componentes", value: totalComponentes, color: "text-slate-900" },
          { label: "Estoque Baixo", value: lowStock, color: "text-amber-600" },
          { label: "Sem Estoque", value: noStock, color: "text-rose-600" },
          { label: "Valor Total", value: formatCurrency(totalValue), color: "text-emerald-600" },
        ].map((ind, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-[#E5E5EA] shadow-xs p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">{ind.label}</span>
            <span className={`text-2xl font-extrabold ${ind.color}`}>{ind.value}</span>
          </div>
        ))}
      </div>

      {/* SEARCH AND ADD */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
          <input
            type="text"
            placeholder="Pesquisar componentes..."
            className="w-full pl-12 pr-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-xs font-medium outline-none focus:border-[#E5E5EA] focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setEditingComponente({}); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[#1C1C1E] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all"
        >
          <Plus size={16} /> Novo Componente
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-xs flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase">{c.category}</span>
                <h4 className="text-sm font-bold text-[#1C1C1E]">{c.name}</h4>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.quantity === 0 ? 'bg-rose-50 text-rose-600' : c.quantity <= c.minQuantity ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {c.quantity === 0 ? 'Sem Estoque' : c.quantity <= c.minQuantity ? 'Baixo' : 'Normal'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-[#8E8E93]">Qtd:</span> <span className="font-bold">{c.quantity} {c.unit}</span></div>
              <div><span className="text-[#8E8E93]">Min:</span> <span className="font-bold">{c.minQuantity}</span></div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F7]">
               <span className="text-xs font-bold text-[#1C1C1E]">{formatCurrency(c.unitCost)}</span>
               <button 
                onClick={() => { setEditingComponente(c); setIsModalOpen(true); }}
                className="text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
               >
                 <Edit size={16} />
               </button>
            </div>
          </div>
        ))}
      </div>
      
      {isModalOpen && (
        <ComponenteFormModal
          editing={editingComponente}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            await onSaveComponente(data);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

interface ComponenteFormModalProps {
  editing: Partial<Componente> | null;
  onClose: () => void;
  onSave: (data: Partial<Componente>) => Promise<void>;
}

const ComponenteFormModal: React.FC<ComponenteFormModalProps> = ({ editing, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Componente>>(editing || {
    name: '',
    category: '',
    unit: 'unid',
    quantity: 0,
    minQuantity: 0,
    unitCost: 0,
    isActive: true
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">{editing?.id ? "Editar Componente" : "Novo Componente"}</h2>
          <button onClick={onClose}><X size={20} className="text-[#8E8E93]"/></button>
        </div>
        <div className="space-y-4">
           <input
             placeholder="Nome"
             className="w-full p-3 bg-[#F5F5F7] rounded-xl text-xs font-medium"
             value={formData.name}
             onChange={e => setFormData({...formData, name: e.target.value})}
           />
           <div className="grid grid-cols-2 gap-4">
             <input
               placeholder="Qtd"
               type="number"
               className="w-full p-3 bg-[#F5F5F7] rounded-xl text-xs font-medium"
               value={formData.quantity}
               onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
             />
             <input
               placeholder="Qtd Min"
               type="number"
               className="w-full p-3 bg-[#F5F5F7] rounded-xl text-xs font-medium"
               value={formData.minQuantity}
               onChange={e => setFormData({...formData, minQuantity: Number(e.target.value)})}
             />
           </div>
           <button
             onClick={() => onSave(formData)}
             className="w-full bg-[#1C1C1E] text-white p-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
           >
             <Save size={16}/> Salvar
           </button>
        </div>
      </div>
    </div>
  );
};
