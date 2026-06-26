
import { create } from 'zustand';
import { CustomField, ProductLayer } from '../../types';

interface EditorState {
  product: any | null;
  layers: ProductLayer[];
  fields: CustomField[];
  selectedFieldId: string | null;
  setProduct: (product: any) => void;
  setSelectedFieldId: (id: string | null) => void;
  updateField: (fieldId: string, updates: Partial<CustomField>) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  product: null,
  layers: [],
  fields: [],
  selectedFieldId: null,
  setProduct: (product) => set({ product, fields: product?.fields || [], layers: product?.layers || [] }),
  setSelectedFieldId: (selectedFieldId) => set({ selectedFieldId }),
  updateField: (fieldId, updates) => set((state) => ({
    fields: state.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
  })),
}));
