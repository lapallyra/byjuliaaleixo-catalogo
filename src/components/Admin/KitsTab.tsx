import React, { useState, useEffect } from "react";
import { PackagePlus, Edit, Trash2, Plus, X, Search, CheckCircle2, ChevronDown, Layers } from "lucide-react";
import { Product, Insumo, CompanyId, CheckoutAddon } from "../../types";
import { addProduct, updateProduct, deleteProduct, getAddons } from "../../services/firebaseService";
import { ImageUpload } from "./ImageUpload";
import { uploadImage, compressImage } from "../../services/firebaseStorageService";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "../../lib/currencyUtils";

interface KitsTabProps {
  products: Product[];
  insumos: Insumo[];
  companyId: CompanyId;
}

export const KitsTab: React.FC<KitsTabProps> = ({ products, insumos, companyId }) => {
  const [addons, setAddons] = useState<CheckoutAddon[]>([]);
  const kits = products.filter(p => p.company === companyId && p.isKit);
  const normalProducts = products.filter(p => !p.isKit && p.company === companyId);
  const companyInsumos = insumos.filter(i => !i.category || true); // Assuming all insumos or company specific if possible

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    product_name: "",
    description: "",
    image: "",
    isKit: true,
    kitType: "kit_pronto",
    kitItems: [],
    kitDiscountPercentage: 0,
    isVisible: true,
    isFeatured: false,
    category: "Kit",
    subcategory: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [itemTypeToAdd, setItemTypeToAdd] = useState<'product' | 'insumo' | 'addon'>('product');
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    // fetch addons
    getAddons(companyId).then(setAddons);
  }, [companyId]);

  const handleSave = async () => {
    if (!formData.product_name || formData.product_name.length < 3) return alert('Nome do kit muito curto');
    if (!formData.image) return alert('É obrigatório adicionar uma foto ao kit');
    if (!formData.kitItems || formData.kitItems.length === 0) return alert('Adicione itens ao kit');

    setSaving(true);
    try {
      const isEditing = !!formData.id;
      
      // Calculate final price automatically!
      const totalRawValue = formData.kitItems.reduce((acc, item) => {
        let val = 0;
        if (item.type === 'product') {
          const p = normalProducts.find(x => x.id === item.id);
          val = p ? p.current_price * item.quantity : 0;
        } else if (item.type === 'insumo') {
          const ins = companyInsumos.find(x => x.id === item.id);
          val = ins ? ins.unitValue * item.quantity : 0;
        } else if (item.type === 'addon') {
          const add = addons.find(x => x.id === item.id);
          val = add ? add.price * item.quantity : 0;
        }
        return acc + val;
      }, 0);

      const discount = (totalRawValue * (formData.kitDiscountPercentage || 0)) / 100;
      const finalPrice = totalRawValue - discount;

      const kitData = {
        ...formData,
        company: companyId,
        isKit: true,
        current_price: finalPrice,
        retail_price: finalPrice,
        original_price: totalRawValue,
        wholesale_price: finalPrice,
        wholesale_min_qty: 1,
        code: formData.code || `KIT-${Math.floor(Math.random() * 10000)}`
      } as any;

      if (isEditing) {
        await updateProduct(kitData.id, kitData);
      } else {
        await addProduct(kitData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar kit');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (kit: Product) => {
    setFormData({ ...kit });
    setIsModalOpen(true);
  };

  const openNew = () => {
    setFormData({
      product_name: "",
      description: "",
      image: "",
      isKit: true,
      kitType: "kit_pronto",
      kitItems: [],
      kitDiscountPercentage: 0,
      isVisible: true,
      isFeatured: false,
      category: "Kit",
      subcategory: "",
    });
    setIsModalOpen(true);
  };

  const addItemToKit = (type: 'product' | 'insumo' | 'addon', id: string) => {
    const items = [...(formData.kitItems || [])];
    const existing = items.find(i => i.id === id && i.type === type);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ type, id, quantity: 1 });
    }
    setFormData({ ...formData, kitItems: items });
  };

  const updateItemQty = (type: 'product' | 'insumo' | 'addon', id: string, qty: number) => {
    if (qty <= 0) {
      setFormData({ ...formData, kitItems: formData.kitItems?.filter(i => !(i.id === id && i.type === type)) });
    } else {
      setFormData({
        ...formData,
        kitItems: formData.kitItems?.map(i => (i.id === id && i.type === type) ? { ...i, quantity: qty } : i)
      });
    }
  };

  const calcRawTotal = () => {
    return (formData.kitItems || []).reduce((acc, item) => {
      let val = 0;
      if (item.type === 'product') {
        const p = normalProducts.find(x => x.id === item.id);
        val = p ? p.current_price * item.quantity : 0;
      } else if (item.type === 'insumo') {
        const ins = companyInsumos.find(x => x.id === item.id);
        val = ins ? ins.unitValue * item.quantity : 0;
      } else if (item.type === 'addon') {
        const add = addons.find(x => x.id === item.id);
        val = add ? add.price * item.quantity : 0;
      }
      return acc + val;
    }, 0);
  };

  const currentRawTotal = calcRawTotal();
  const currentFinalTotal = currentRawTotal - ((currentRawTotal * (formData.kitDiscountPercentage || 0)) / 100);

  // Render Lists
  let listRender = [];
  if (itemTypeToAdd === 'product') listRender = normalProducts.filter(p => p.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
  if (itemTypeToAdd === 'insumo') listRender = companyInsumos.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  if (itemTypeToAdd === 'addon') listRender = addons.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-[#F0E6D2]">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
            <Layers className="text-[#D88D85]" /> Gestão de Kits
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#A09898] font-bold mt-1">
            Crie kits promocionais com estoque dinâmico
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#2D221F] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={16} /> Novo Kit
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kits.map(kit => (
          <div key={kit.id} className="bg-white p-6 rounded-[2rem] border border-[#F0E6D2] shadow-sm relative group overflow-hidden">
             {kit.kitType === 'monte_seu_kit' && (
               <div className="absolute top-4 left-4 bg-emerald-100 text-emerald-800 text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest z-10 shadow-sm border border-emerald-200">
                 Monte seu Kit
               </div>
             )}
             {kit.kitType === 'kit_pronto' && (
               <div className="absolute top-4 left-4 bg-indigo-100 text-indigo-800 text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest z-10 shadow-sm border border-indigo-200">
                 Kit Pronto
               </div>
             )}
            <div className="aspect-square mb-4 rounded-xl overflow-hidden relative border border-[#F0E6D2] group-hover:shadow-md transition-shadow">
               <img src={kit.image} className="w-full h-full object-cover" alt="Kit" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm uppercase mb-1 truncate">{kit.product_name}</h3>
              <div className="flex gap-2 items-center mb-4">
                 <span className="text-xl font-black text-[#D88D85]">{formatCurrency(kit.current_price)}</span>
                 {kit.kitDiscountPercentage ? <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-full line-through">{formatCurrency(kit.original_price)}</span> : null}
              </div>
              <div className="text-[10px] uppercase font-black text-slate-500 bg-slate-100 p-2 rounded-lg text-center">
                 Estoque: {Math.min(...(kit.kitItems?.map(item => {
                     if (item.type === 'product') {
                         const p = normalProducts.find(x => x.id === item.id);
                         return p ? Math.floor((p.stock || 0) / item.quantity) : 0;
                     }
                     if (item.type === 'insumo') {
                         const i = companyInsumos.find(x => x.id === item.id);
                         return i ? Math.floor((i.quantity || 0) / item.quantity) : 0;
                     }
                     return 999;
                 }) || [0]))} unid.
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-[#F0E6D2]">
               <button onClick={() => handleEdit(kit)} className="flex-1 bg-slate-50 text-slate-600 hover:bg-[#FAF9F6] border border-[#F0E6D2] hover:text-[#D88D85] py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all">
                  Editar Kit
               </button>
               <button onClick={() => {
                 setFormData({ ...kit, id: undefined, product_name: `${kit.product_name} (Cópia)` });
                 setIsModalOpen(true);
               }} className="p-2 border border-[#F0E6D2] rounded-xl text-slate-500 hover:bg-slate-50 hover:text-[#D88D85] transition-colors">
                  <Layers size={16} />
               </button>
               <button onClick={async () => {
                 if (confirm("Tem certeza que deseja deletar este kit?")) {
                   await deleteProduct(kit.id);
                 }
               }} className="p-2 border border-rose-100 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                  <Trash2 size={16} />
               </button>
            </div>
          </div>
        ))}
        {kits.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-dashed border-[#F0E6D2]">
             <PackagePlus size={48} className="text-[#E5D5C5] mb-4" />
             <p className="text-slate-500 font-black text-sm uppercase tracking-widest">Nenhum kit criado</p>
             <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 max-w-sm">Crie kits para oferecer combinações de produtos com desconto aos seus clientes.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4 lg:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar relative flex flex-col"
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 px-8 py-6 border-b border-[#F0E6D2] flex justify-between items-center rounded-t-[2rem]">
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                    {formData.id ? "Editar Kit" : "Criar Novo Kit"}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure os itens e o desconto</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-slate-100 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Left Column - Essentials */}
                 <div className="space-y-6">
                    <div className="space-y-4">
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Kit</label>
                        <div className="grid grid-cols-2 gap-2">
                           <button 
                             onClick={() => setFormData({...formData, kitType: 'kit_pronto'})}
                             className={`px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.kitType === 'kit_pronto' ? 'bg-[#D88D85] text-white border-[#D88D85]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                           >
                             Kit Pronto
                           </button>
                           <button 
                             onClick={() => setFormData({...formData, kitType: 'monte_seu_kit'})}
                             className={`px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.kitType === 'monte_seu_kit' ? 'bg-[#D88D85] text-white border-[#D88D85]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                           >
                             Monte seu Kit
                           </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Foto Principal</label>
                        <ImageUpload
                          path={`kits/${companyId}`}
                          currentUrl={formData.image || ""}
                          onUploadComplete={(url) => setFormData({ ...formData, image: url })}
                          onRemove={() => setFormData({ ...formData, image: "" })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome do Kit</label>
                        <input
                          type="text"
                          value={formData.product_name}
                          onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                          className="w-full bg-[#FAF9F6] border border-[#F0E6D2] rounded-2xl px-6 py-4 text-sm font-bold focus:border-[#D88D85] outline-none transition-all"
                          placeholder="Ex: Kit Maternidade Luxo"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descrição</label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full bg-[#FAF9F6] border border-[#F0E6D2] rounded-2xl px-6 py-4 text-sm font-medium focus:border-[#D88D85] outline-none transition-all resize-none"
                          placeholder="Detalhes completos..."
                        />
                      </div>

                      <div className="flex gap-4 items-center pl-1">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isVisible ? 'bg-[#D88D85]' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.isVisible ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Kit Visível e Ativo no Catálogo</span>
                        </label>
                      </div>

                    </div>
                 </div>

                 {/* Right Column - Items and Price Logic */}
                 <div className="space-y-6">
                   <div className="bg-[#FAF9F6] p-6 border border-[#F0E6D2] rounded-2xl">
                     <div className="flex justify-between items-center mb-4">
                       <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Itens do Kit</h4>
                       <button onClick={() => setAddingItem(!addingItem)} className="text-[10px] font-black uppercase tracking-widest text-[#D88D85] hover:text-[#B48E4D] px-3 py-1 bg-white rounded-lg border border-[#F0E6D2] shadow-sm">
                         + Inserir Item
                       </button>
                     </div>

                     {addingItem && (
                       <div className="mb-6 bg-white p-4 rounded-xl border border-dashed border-[#D88D85]">
                         <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
                           <button onClick={() => setItemTypeToAdd('product')} className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-md ${itemTypeToAdd === 'product' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Produto</button>
                           <button onClick={() => setItemTypeToAdd('insumo')} className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-md ${itemTypeToAdd === 'insumo' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Insumo</button>
                           <button onClick={() => setItemTypeToAdd('addon')} className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-md ${itemTypeToAdd === 'addon' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Adicional</button>
                         </div>
                         <div className="relative mb-3">
                           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50 text-xs py-2 pl-9 pr-3 outline-none rounded-lg border border-slate-200" />
                         </div>
                         <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                           {listRender.slice(0, 20).map((l: any) => (
                             <div key={l.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                               <div className="truncate pr-2">
                                 <p className="text-[10px] font-bold text-slate-800 truncate">{l.product_name || l.name}</p>
                                 <p className="text-[9px] font-black text-[#D88D85]">{formatCurrency(l.current_price || l.unitValue || l.price || 0)}</p>
                               </div>
                               <button onClick={() => addItemToKit(itemTypeToAdd, l.id)} className="w-6 h-6 rounded bg-[#D88D85] text-white flex items-center justify-center hover:bg-[#B48E4D] shrink-0">
                                 <Plus size={12} />
                               </button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     <div className="space-y-2">
                       {formData.kitItems?.map((item, idx) => {
                         let name = "Desconhecido"; let price = 0;
                         if (item.type === 'product') { const p = normalProducts.find(x => x.id === item.id); name = p?.product_name || 'Produto Excluído'; price = p?.current_price || 0;}
                         if (item.type === 'insumo') { const p = companyInsumos.find(x => x.id === item.id); name = p?.name || 'Insumo Excluído'; price = p?.unitValue || 0;}
                         if (item.type === 'addon') { const p = addons.find(x => x.id === item.id); name = p?.name || 'Adicional Excluído'; price = p?.price || 0;}
                         
                         return (
                           <div key={`${item.id}-${idx}`} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                             <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-bold text-slate-800 truncate">{name}</p>
                               <div className="flex items-center gap-2">
                                 <p className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.type}</p>
                                 <p className="text-[9px] font-black text-[#D88D85]">{formatCurrency(price)} x {item.quantity}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                               <button onClick={() => updateItemQty(item.type, item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900">-</button>
                               <span className="text-[10px] font-black w-3 text-center">{item.quantity}</span>
                               <button onClick={() => updateItemQty(item.type, item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900">+</button>
                             </div>
                           </div>
                         );
                       })}
                       {formData.kitItems?.length === 0 && (
                         <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Itens Vazia</p>
                         </div>
                       )}
                     </div>

                   </div>

                   <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-400"/> Precificação Automática
                      </h4>
                      
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[10px] uppercase font-bold tracking-widest">Custo Total (Componentes)</span>
                         <span className="font-mono text-sm">{formatCurrency(currentRawTotal)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                         <span className="text-[10px] uppercase font-bold tracking-widest text-[#D88D85]">Desconto Concedido (%)</span>
                         <div className="w-24">
                           <input 
                             type="number" 
                             min="0" max="100"
                             value={formData.kitDiscountPercentage}
                             onChange={e => setFormData({...formData, kitDiscountPercentage: Number(e.target.value)})}
                             className="w-full bg-white/10 border border-white/20 rounded-lg text-right px-3 py-2 text-sm outline-none focus:border-[#D88D85]"
                           />
                         </div>
                      </div>

                      <div className="space-y-2 mb-4 pt-2 border-b border-white/10 pb-4">
                        <div className="flex justify-between text-[10px]">
                           <span className="text-slate-400">Lucro Bruto</span>
                           <span className={currentFinalTotal - currentRawTotal >= 0 ? "text-emerald-400" : "text-rose-400"}>
                             {formatCurrency(currentFinalTotal - currentRawTotal)}
                           </span>
                        </div>
                         <div className="flex justify-between text-[10px]">
                           <span className="text-slate-400">Margem</span>
                           <span className={currentFinalTotal - currentRawTotal >= 0 ? "text-emerald-400" : "text-rose-400"}>
                             {currentFinalTotal > 0 ? ((currentFinalTotal - currentRawTotal) / currentFinalTotal * 100).toFixed(1) : "0.0"}%
                           </span>
                        </div>
                      </div>
                      
                      {currentFinalTotal < currentRawTotal && (
                        <div className="bg-rose-900/40 text-rose-200 text-[9px] font-bold p-3 rounded-lg border border-rose-500/30 mb-4 text-center">
                          ⚠️ PREÇO ABAIXO DO CUSTO: O Kit gerará prejuízo.
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                         <div className="space-y-1">
                           <p className="text-[9px] uppercase font-black tracking-widest text-[#D88D85]">Preço Sugerido / Venda</p>
                         </div>
                         <span className="text-3xl font-black tracking-tighter text-white">{formatCurrency(currentFinalTotal)}</span>
                      </div>
                   </div>
                 </div>
              </div>
              
              <div className="p-8 border-t border-[#F0E6D2] bg-slate-50/50 rounded-b-[2rem] flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#2D221F] text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Kit"}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
