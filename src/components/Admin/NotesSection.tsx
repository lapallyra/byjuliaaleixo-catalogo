import React, { useState } from 'react';
import { CustomerNote } from '../../types';

interface NotesSectionProps {
  notes: CustomerNote[];
  onChange: (notes: CustomerNote[]) => void;
  type: 'internal' | 'commercial';
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes, onChange, type }) => {
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (newNote.trim()) {
      onChange([...notes, {
        id: Math.random().toString(),
        date: new Date().toISOString(),
        userId: 'admin',
        userName: 'Admin',
        note: newNote.trim(),
        type: type
      }]);
      setNewNote('');
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-[#E5E5EA]">
      <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] flex items-center justify-between">
        {type === 'internal' ? 'Observações Internas Operacionais' : 'Notas Comerciais (Interações, Preferências, Oportunidades)'}
      </h5>
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E5EA] text-xs">
            <p className="text-[#8E8E93] text-[9px] mb-1">{new Date(n.date).toLocaleDateString()} - {n.userName}</p>
            {n.note}
          </div>
        ))}
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={`Adicionar nova nota ${type === 'internal' ? 'interna' : 'comercial'}...`}
          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs outline-none"
          rows={2}
        />
        <button type="button" onClick={addNote} className="w-full bg-[#1C1C1E] text-white py-2 rounded-xl text-xs font-bold">Adicionar Nota</button>
      </div>
    </div>
  );
};
