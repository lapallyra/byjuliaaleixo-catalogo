import React, { useState } from "react";
import { Plus, Trash2, Calendar, User, MessageSquare } from "lucide-react";
import { CustomerInteraction } from "../../types";
import { useAuth } from "../../components/AuthProvider";

interface InteractionsSectionProps {
  interactions: CustomerInteraction[];
  onChange: (interactions: CustomerInteraction[]) => void;
}

export function InteractionsSection({ interactions, onChange }: InteractionsSectionProps) {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState<CustomerInteraction['actionType']>('contato');

  const handleAdd = () => {
    if (!description.trim() || !user) return;

    const newInteraction: CustomerInteraction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      userId: user.uid,
      userName: user.email || 'Usuário',
      actionType,
      description: description.trim()
    };

    onChange([...interactions, newInteraction]);
    setDescription("");
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(interactions.filter(i => i.id !== id));
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'contato': return 'Contato Realizado';
      case 'mensagem': return 'Mensagem Enviada';
      case 'observacao': return 'Observação Comercial';
      case 'campanha': return 'Campanha Associada';
      default: return type;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'contato': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mensagem': return 'bg-green-100 text-green-800 border-green-200';
      case 'observacao': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'campanha': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-2">
        <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] flex items-center gap-1.5">
          <MessageSquare size={12} /> Histórico de Interações Comerciais
        </h5>
        <button
          onClick={() => setIsAdding(true)}
          className="text-[#cca062] hover:text-[#b08750] transition-colors p-1"
          title="Nova Interação"
        >
          <Plus size={14} />
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E5EA] space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">
              Tipo de Ação
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full bg-white border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#cca062] transition-colors"
            >
              <option value="contato">Contato Realizado</option>
              <option value="mensagem">Mensagem Enviada</option>
              <option value="observacao">Observação Comercial</option>
              <option value="campanha">Campanha Associada</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes da interação..."
              className="w-full h-20 bg-white border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#cca062] transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!description.trim()}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#cca062] text-white rounded-lg hover:bg-[#b08750] transition-colors disabled:opacity-50"
            >
              Salvar Interação
            </button>
          </div>
        </div>
      )}

      {interactions.length === 0 ? (
        <div className="text-center py-6 bg-[#FAF9F6] rounded-xl border border-dashed border-[#E5E5EA]">
          <p className="text-xs font-semibold text-[#8E8E93]">Nenhuma interação registrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...interactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(interaction => (
            <div key={interaction.id} className="bg-white p-3 rounded-xl border border-[#E5E5EA] shadow-3xs group relative">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getActionColor(interaction.actionType)}`}>
                  {getActionLabel(interaction.actionType)}
                </span>
                <button
                  onClick={() => handleRemove(interaction.id)}
                  className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 transition-opacity p-1"
                  title="Remover"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-xs text-[#1C1C1E] whitespace-pre-wrap leading-relaxed mb-3">
                {interaction.description}
              </p>
              <div className="flex items-center gap-4 text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(interaction.date).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <User size={10} />
                  {interaction.userName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}