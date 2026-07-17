import React, { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { CustomerTag } from '../../types';

interface TagsSectionProps {
  tags: CustomerTag[];
  onChange: (tags: CustomerTag[]) => void;
}

export const TagsSection: React.FC<TagsSectionProps> = ({ tags, onChange }) => {
  const [newTagName, setNewTagName] = useState('');

  const addTag = () => {
    if (newTagName.trim()) {
      onChange([...tags, {
        id: Math.random().toString(),
        name: newTagName.trim(),
        color: '#cca062',
        active: true
      }]);
      setNewTagName('');
    }
  };

  const removeTag = (id: string) => {
    onChange(tags.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-[#E5E5EA]">
      <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] flex items-center justify-between">
        Tags Comerciais
      </h5>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Nova tag"
          className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-1.5 text-xs outline-none"
        />
        <button type="button" onClick={addTag} className="bg-[#1C1C1E] text-white p-2 rounded-xl"><Plus size={14} /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
            <Tag size={10} />
            {tag.name}
            <button type="button" onClick={() => removeTag(tag.id)}><Trash2 size={10} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
