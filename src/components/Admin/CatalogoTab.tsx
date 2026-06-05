import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Palette, 
  FileText, 
  Settings2, 
  Sliders, 
  Compass, 
  Heart, 
  Save, 
  CheckCircle2 
} from "lucide-react";
import { motion } from "motion/react";
import { subscribeToProducts, updateProduct, subscribeToAllSettings } from "../../services/firebaseService";
import { Product } from "../../types";

export const CatalogoTab: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProfile, setActiveProfile] = useState<'pallyra' | 'guennita' | 'mimada'>('pallyra');
  const [accentColor, setAccentColor] = useState("#C5A880"); // gentle elegant gold
  const [bannerText, setBannerText] = useState("🎄 PROMOÇÕES ESPECIAIS DE OUTONO - FEITO À MÃO");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load products to manage catalog visibility
  useEffect(() => {
    const unsub = subscribeToProducts((loaded) => {
      setProducts(loaded);
    });
    return () => unsub();
  }, []);

  const handleToggleVisibility = async (product: Product) => {
    try {
      await updateProduct(product.id, {
        ...product,
        isVisible: !product.isVisible
      });
      showToast("Visibilidade de produto atualizada!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await updateProduct(product.id, {
        ...product,
        isFeatured: !product.isFeatured
      });
      showToast("Status de destaque atualizado!");
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleSaveConfig = () => {
    showToast("Configurações do Catálogo gravadas com sucesso!");
  };

  const filteredProducts = products.filter(p => p.company === activeProfile);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 lg:p-10 rounded-[2rem] border border-[#F0E6D2] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#F5E6CA]/10 to-transparent rounded-full pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 bg-[#FAF6F0] border border-[#E9DFCB] px-3 py-1 rounded-full text-[8px] font-black uppercase text-[#B49E7C] tracking-widest">
            <Sliders size={10} /> Gerenciador de Vitrine
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-[#2D221F]">
            Catálogo Digital <span className="text-[#C5A880] font-sans font-light">Vitrine</span>
          </h1>
          <p className="text-xs text-[#A09088] font-sans max-w-xl">
            Personalize a aparência do seu e-commerce do ateliê, agende anúncios de topo e alterne a visibilidade dos itens de venda instantaneamente.
          </p>
        </div>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs"
        >
          <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50 shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">{successMsg}</span>
        </motion.div>
      )}

      {/* Catalog Profile Picker */}
      <div className="bg-white border border-[#F0E6D2] p-6 lg:p-8 rounded-[2rem] shadow-sm space-y-6">
        <div>
          <span className="text-[8px] font-black uppercase text-[#A09088] tracking-widest block">Selecione o Canal Ativo:</span>
          <div className="grid grid-cols-3 gap-4 mt-3">
            {[
              { id: 'pallyra', label: 'LA PALLYRA', style: 'focus:ring-rose-200', desc: 'Papelaria & Luxo' },
              { id: 'guennita', label: 'GUENNITA', style: 'focus:ring-amber-200', desc: 'Artesanato Afetivo' },
              { id: 'mimada', label: 'MIMADA SIM', style: 'focus:ring-indigo-200', desc: 'Presentes & Atelier' }
            ].map((prof) => (
              <button
                key={prof.id}
                onClick={() => setActiveProfile(prof.id as any)}
                className={`p-5 rounded-2xl border text-center transition-all ${
                  activeProfile === prof.id
                    ? "border-[#C5A880] bg-[#FAF6F0] ring-1 ring-[#C5A880]/30 shadow-md"
                    : "border-[#FAF6F0] bg-white hover:border-[#F0E6D2]"
                }`}
              >
                <div className="text-[11px] font-black uppercase tracking-wider text-[#2D221F]">
                  {prof.label}
                </div>
                <div className="text-[8px] uppercase tracking-widest text-[#A09088] mt-1 font-semibold">{prof.desc}</div>
                <div className="inline-flex items-center gap-1.5 text-[8px] text-[#C5A880] font-bold mt-3 uppercase tracking-wider bg-white border border-[#F0E6D2] px-2.5 py-1 rounded-full group-hover:scale-105 transition-all">
                  Configurar <ExternalLink size={8} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Style configurations (Left Column - Span 4) */}
        <div className="lg:col-span-5 bg-white border border-[#F0E6D2] p-6 lg:p-8 rounded-[2rem] shadow-sm space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D221F] border-b border-[#FAF6F0] pb-2 flex items-center gap-2">
            <Palette size={14} className="text-[#C5A880]" /> Identidade & Design
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F524C]">Cor de Realce do Tema</label>
              <div className="flex gap-2">
                {["#C5A880", "#2D221F", "#D88D85", "#7D6B60"].map(c => (
                  <button
                    key={c}
                    onClick={() => setAccentColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      accentColor === c ? "border-[#2D221F] scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border-0 outline-none p-0 overflow-hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F524C]">Comunicado do Topo do Catálogo</label>
              <input
                type="text"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#F0E6D2] focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 outline-none rounded-xl p-3.5 text-xs text-[#2D221F]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F524C]">Banner Promocional Ativo</label>
              <div className="p-4 bg-[#FAF6F0] border border-[#E9DFCB] rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-bold text-[#2D221F] uppercase tracking-wider">Campanha Especial Ateliê</h4>
                  <p className="text-[8px] text-[#A09088] mt-0.5">Mostrado na página inicial</p>
                </div>
                <div className="w-10 h-6 bg-[#C5A880] rounded-full p-0.5 cursor-pointer relative flex items-center justify-end">
                  <div className="w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full py-4 bg-[#2D221F] hover:bg-black text-white text-[10px] font-semibold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Save size={14} /> Gravar Design
            </button>
          </div>
        </div>

        {/* Dynamic product list management (Right Column - Span 8) */}
        <div className="lg:col-span-7 bg-white border border-[#F0E6D2] p-6 lg:p-8 rounded-[2rem] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#FAF6F0] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D221F] flex items-center gap-2">
              <Compass size={14} className="text-[#C5A880]" /> Vitrine Dinâmica
            </h3>
            <span className="text-[8px] font-black uppercase text-[#C5A880] bg-[#FAF6F0] px-3 py-1 rounded-full">
              {filteredProducts.length} Produtos Encontrados
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A09088] uppercase tracking-widest font-bold">
                Nenhum produto cadastrado para este canal de catálogo.
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div 
                  key={p.id}
                  className="p-4 bg-white border border-[#F0E6D2] hover:border-[#C5A880] rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-[#F0E6D2] overflow-hidden shrink-0">
                      {p.image ? (
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          ?
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-[#2D221F] uppercase tracking-wider">{p.product_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-mono font-bold bg-[#FAF9F6] text-[#A09088] px-2 py-0.5 rounded border border-[#FAF6F0] uppercase tracking-widest">{p.code}</span>
                        <span className="text-[8px] font-black text-[#C5A880]">R$ {p.current_price?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Featured Star Toggle */}
                    <button
                      onClick={() => handleToggleFeatured(p)}
                      className={`p-2 rounded-xl border transition-all ${
                        p.isFeatured 
                          ? "bg-amber-50 border-amber-200 text-amber-500 shadow-sm"
                          : "bg-white border-[#F0E6D2] text-[#A09088] hover:text-[#2D221F]"
                      }`}
                      title={p.isFeatured ? "Destaque Ativado" : "Ativar Destaque"}
                    >
                      <Heart size={14} className={p.isFeatured ? "fill-amber-500 stroke-amber-500" : ""} />
                    </button>

                    {/* Visibility Toggle Button */}
                    <button
                      onClick={() => handleToggleVisibility(p)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
                        p.isVisible
                          ? "bg-[#FAF6F0] border-[#E9DFCB] text-[#2D221F]"
                          : "bg-rose-50 border-rose-100 text-rose-500"
                      }`}
                    >
                      {p.isVisible ? (
                        <>
                          <Eye size={12} className="text-[#C5A880]" /> Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} className="text-rose-400" /> Oculto
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
