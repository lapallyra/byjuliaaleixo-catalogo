import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, PackagePlus, Eye, Search, Gift, Heart, Calendar, Sparkles, Plus, ShoppingCart, Check, Minus, ShoppingBag } from 'lucide-react';
import { Product, CartItem } from '../types';
import { ImageWithFallback } from './ImageWithFallback';
import { formatCurrency } from '../lib/currencyUtils';

interface KitsViewProps {
  allProducts: Product[];
}

export const KitsView: React.FC<KitsViewProps> = ({ allProducts }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [selectedItems, setSelectedItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('monte_seu_kit_selections');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('monte_seu_kit_selections', JSON.stringify(selectedItems));
  }, [selectedItems]);

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleAddToGiftListLocal = (product: Product) => {
    try {
      const saved = localStorage.getItem('unified_gift_list_v2');
      const prevList: Product[] = saved ? JSON.parse(saved) : [];
      if (prevList.some(item => item.id === product.id)) {
        alert("Este item já está na sua Lista de Presentes!");
        return;
      }
      const updated = [...prevList, product];
      localStorage.setItem('unified_gift_list_v2', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('giftlist-updated'));
      alert(`"${product.product_name}" foi adicionado com sucesso à sua Lista de Presentes! Quando terminar, você pode salvar a lista clicando no ícone de Presente no topo ou no menu lateral.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddOne = (p: Product) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) {
        return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...p, quantity: 1 } as CartItem];
    });
  };

  const handleRemoveOne = (productId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const totalPrice = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.retail_price * item.quantity), 0);
  }, [selectedItems]);

  const handleFinalizeKit = () => {
    if (selectedItems.length === 0) return;
    setIsFinalizing(true);
    try {
      const currentCartSaved = localStorage.getItem('unified_cart_v2');
      let currentCart: CartItem[] = [];
      try {
        currentCart = currentCartSaved ? JSON.parse(currentCartSaved) : [];
      } catch {
        currentCart = [];
      }

      const mergedCart = [...currentCart];
      selectedItems.forEach(kitItem => {
        const existingIdx = mergedCart.findIndex(item => item.id === kitItem.id);
        if (existingIdx > -1) {
          mergedCart[existingIdx].quantity += kitItem.quantity;
        } else {
          mergedCart.push({ ...kitItem });
        }
      });

      localStorage.setItem('unified_cart_v2', JSON.stringify(mergedCart));
      window.dispatchEvent(new CustomEvent('cart-updated'));
      setShowSuccessOverlay(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFinalizing(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'kit_pronto' | 'monte_seu_kit'>(() => {
    return pathname.includes('meukit') ? 'monte_seu_kit' : 'kit_pronto';
  });

  useEffect(() => {
    setActiveTab(pathname.includes('meukit') ? 'monte_seu_kit' : 'kit_pronto');
  }, [pathname]);

  const handleTabChange = (type: 'kit_pronto' | 'monte_seu_kit') => {
    setActiveTab(type);
    navigate(type === 'monte_seu_kit' ? '/kit-meukit' : '/kits');
  };

  const allKits = useMemo(() => {
    return allProducts.filter(p => p.isKit && (p.kitType === activeTab || (!p.kitType && activeTab === 'kit_pronto')));
  }, [allProducts, activeTab]);

  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('emocionar');

  const customCategories = [
    {
      id: 'emocionar',
      name: 'Para emocionar',
      desc: 'Recordações afetivas e manuscritas que tocam o coração.',
      icon: <Heart size={14} className="stroke-[2.5]" />,
      color: '#cca062',
      borderColor: 'border-[#cca062]/20',
      bgActive: 'bg-[#faf7f2]/95',
      textActive: 'text-[#cca062]',
    },
    {
      id: 'organizar',
      name: 'Para organizar',
      desc: 'Papelaria de alto padrão para dar vida aos seus objetivos.',
      icon: <Calendar size={14} className="stroke-[2.5]" />,
      color: '#6d5443',
      borderColor: 'border-[#6d5443]/15',
      bgActive: 'bg-[#f5eff2]/95',
      textActive: 'text-[#6d5443]',
    },
    {
      id: 'decorar',
      name: 'Para decorar',
      desc: 'Peças em madeira, cerâmica e velas para aquecer a alma.',
      icon: <Sparkles size={14} className="stroke-[2.5]" />,
      color: '#8c6239',
      borderColor: 'border-[#8c6239]/20',
      bgActive: 'bg-[#fcf8f2]/95',
      textActive: 'text-[#8c6239]',
    },
    {
      id: 'doces',
      name: 'Doces e mimos',
      desc: 'Mel artesanal, chocolates gourmet e mimos deliciosos.',
      icon: <Gift size={14} className="stroke-[2.5]" />,
      color: '#b6835c',
      borderColor: 'border-[#b6835c]/15',
      bgActive: 'bg-[#fcf4ee]/95',
      textActive: 'text-[#b6835c]',
    },
    {
      id: 'complementar',
      name: 'Para complementar',
      desc: 'Marcadores, canetas de ateliê e detalhes que encantam.',
      icon: <Plus size={14} className="stroke-[2.5]" />,
      color: '#cca062',
      borderColor: 'border-[#cca062]/15',
      bgActive: 'bg-[#faf7f2]/95',
      textActive: 'text-[#cca062]',
    },
    {
      id: 'embalagens',
      name: 'Embalagens',
      desc: 'Linhos finos, fitas de cetim e caixas rígidas exclusivas.',
      icon: <PackagePlus size={14} className="stroke-[2.5]" />,
      color: '#6d5443',
      borderColor: 'border-[#cca062]/20',
      bgActive: 'bg-[#fcf9f2]/95',
      textActive: 'text-[#6d5443]',
    },
  ];

  const getProductsForCategoryTab = (catId: string) => {
    const filtered = allProducts.filter(p => {
      const cat = (p.category || "").toLowerCase();
      const name = (p.product_name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const sub = (p.subcategory || "").toLowerCase();

      if (catId === 'embalagens') {
        return cat.includes("embalagem") || cat.includes("caixa") || sub.includes("embalagem") || sub.includes("caixa") || name.includes("caixa") || name.includes("embalagem") || name.includes("sacola");
      }
      if (catId === 'doces') {
        return cat.includes("doce") || cat.includes("mimo") || cat.includes("comida") || cat.includes("chocolate") || name.includes("doce") || name.includes("chocolate") || name.includes("pão de mel") || name.includes("biscoito") || name.includes("mel");
      }
      if (catId === 'organizar') {
        return cat.includes("organizar") || cat.includes("agenda") || cat.includes("planner") || cat.includes("caderno") || cat.includes("fichário") || name.includes("agenda") || name.includes("planner") || name.includes("caderno") || name.includes("bloquinho");
      }
      if (catId === 'decorar') {
        return cat.includes("decorar") || cat.includes("quarto") || cat.includes("quadro") || cat.includes("vela") || name.includes("vela") || name.includes("quadro") || name.includes("placa") || name.includes("arranjo");
      }
      if (catId === 'complementar') {
        return name.includes("chaveiro") || name.includes("caneta") || name.includes("caneca") || name.includes("marcador") || name.includes("tag") || name.includes("cartão");
      }
      if (catId === 'emocionar') {
        return !cat.includes("embalagem") && !cat.includes("caixa") && !name.includes("caixa") && !name.includes("embalagem") && !cat.includes("doce") && !cat.includes("organizar") && !name.includes("agenda") && !name.includes("planner") && !name.includes("caderno") && !name.includes("vela");
      }
      return false;
    });

    if (filtered.length > 0) return filtered;

    // Elegant fallbacks with real store materials:
    if (catId === 'emocionar') {
      return allProducts.slice(0, 4);
    }
    if (catId === 'organizar') {
      return allProducts.filter(p => p.category?.toLowerCase().includes('papel') || p.category?.toLowerCase().includes('caderno')).slice(0, 4);
    }
    if (catId === 'decorar') {
      return allProducts.filter(p => p.category?.toLowerCase().includes('casa') || p.category?.toLowerCase().includes('vela')).slice(0, 4);
    }
    if (catId === 'doces') {
      return allProducts.filter(p => p.category?.toLowerCase().includes('comida') || p.category?.toLowerCase().includes('doce')).slice(0, 4);
    }
    if (catId === 'complementar') {
      return allProducts.slice(Math.min(3, allProducts.length - 1), Math.min(7, allProducts.length));
    }
    if (catId === 'embalagens') {
      return allProducts.filter(p => p.category?.toLowerCase().includes('caixa') || p.category?.toLowerCase().includes('embalagem')).slice(0, 4);
    }
    return allProducts.slice(0, 3);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] selection:bg-[#cca062] selection:text-white flex flex-col font-sans">
      <header className="fixed top-0 inset-x-0 z-50 bg-[#FAF9F6] border-b border-[#cca062]/20 py-4 shadow-[0_10px_30px_#FAF9F6]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 p-2 -ml-2 text-[#6d5443] hover:text-[#cca062] hover:bg-[#cca062]/5 rounded-full transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black tracking-widest uppercase md:inline hidden">Voltar</span>
          </button>
          
          <div className="flex flex-col select-none cursor-pointer text-center md:text-left" onClick={() => navigate('/')}>
            <span className="font-serif text-lg md:text-2xl font-black italic tracking-tight text-[#6d5443] leading-tight">
              Presentes Personalizados
            </span>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.25em] text-[#cca062] font-sans">
              by Julia Aleixo
            </span>
          </div>

          <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 pt-24 pb-32">
        <div className="text-center mb-10 max-w-4xl mx-auto px-4">
          <p className="text-[#cca062] font-black text-xs tracking-[0.25em] uppercase mb-3 text-center">
            {activeTab === 'monte_seu_kit' ? 'Feito Sob Medida' : 'Kits do Ateliê'}
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-black text-[#6d5443] tracking-tight leading-tight mb-5 italic text-center">
            {activeTab === 'monte_seu_kit' ? (
              <>
                Porque os melhores presentes não são escolhidos.<br className="hidden md:inline" />
                <span className="not-italic text-[#cca062]"> São criados com amor.</span>
              </>
            ) : (
              <>
                Composições exclusivas pensadas<br className="hidden md:inline" />
                <span className="not-italic text-[#cca062]"> para encantar e surpreender.</span>
              </>
            )}
          </h2>
          <p className="text-sm md:text-base text-[#5c4a3d]/80 leading-relaxed font-sans font-medium max-w-2xl mx-auto text-center">
            {activeTab === 'monte_seu_kit' 
              ? "Combine produtos dos nossos ateliês e monte um presente único para alguém especial."
              : "Seleções harmoniosas e prontas de mimos repletos de afeto, com descontos especiais e embalagem de linho de alto nível inclusa."}
          </p>
          <div className="w-16 h-[2px] mx-auto mt-8 bg-[#cca062]/30 rounded-full"></div>
        </div>

        {/* Elegant 3D Soft Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 bg-white border border-[#cca062]/20 rounded-2xl shadow-[0_4px_12px_rgba(198,166,100,0.06)] gap-2">
            <button
              onClick={() => handleTabChange('kit_pronto')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 ${activeTab === 'kit_pronto' ? 'bg-[#6d5443] text-white shadow-[0_4px_12px_rgba(109,84,67,0.25),_inset_0_-2px_0_rgba(0,0,0,0.18)]' : 'text-[#604e42]/70 hover:text-[#cca062] hover:bg-[#cca062]/5'}`}
            >
              Kits Prontos
            </button>
            <button
              onClick={() => handleTabChange('monte_seu_kit')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 ${activeTab === 'monte_seu_kit' ? 'bg-[#6d5443] text-white shadow-[0_4px_12px_rgba(109,84,67,0.25),_inset_0_-2px_0_rgba(0,0,0,0.18)]' : 'text-[#604e42]/70 hover:text-[#cca062] hover:bg-[#cca062]/5'}`}
            >
              Monte Seu Kit
            </button>
          </div>
        </div>

        {activeTab === 'monte_seu_kit' ? (
          /* PREMIUM BINDER ACCORDION FOR MONTE SEU KIT */
          <div className="space-y-6">
            
            {/* Desktop Horizon Accordion Layout */}
            <div className="hidden lg:flex flex-row items-stretch min-h-[660px] w-full gap-4 rounded-[2.5rem] p-4 bg-white/40 border border-[#cca062]/10 shadow-[0_12px_45px_rgba(198,166,100,0.04)]">
              {customCategories.map((cat, idx) => {
                const isActive = activeCategoryTab === cat.id;
                const catProducts = getProductsForCategoryTab(cat.id);
                // Discreet staggered escadinha offset
                const staggeredTranslateY = (idx % 3) * 6;
                
                return (
                  <motion.div
                    key={cat.id}
                    onClick={() => {
                      if (!isActive) setActiveCategoryTab(cat.id);
                    }}
                    layout
                    transition={{ type: "spring", stiffness: 350, damping: 32 }}
                    style={{ transform: `translateY(${staggeredTranslateY}px)` }}
                    className={`flex flex-col justify-between overflow-hidden cursor-pointer rounded-[2rem] border transition-all duration-500 relative ${
                      isActive 
                        ? `${cat.borderColor} ${cat.bgActive} flex-[4.5] p-8 shadow-[0_18px_45px_rgba(198,166,100,0.12)]` 
                        : `border-[#6d5443]/15 bg-white hover:border-[#cca062]/50 w-16 flex-[0.3] h-full py-8 text-center flex flex-col items-center justify-between shadow-sm`
                    }`}
                  >
                    {isActive ? (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="flex-1 flex flex-col h-full overflow-hidden"
                      >
                        {/* Drawer Header */}
                        <div className="flex flex-row justify-between items-center border-b border-[#cca062]/10 pb-6 mb-6">
                          <div>
                            <div className="flex items-center gap-2 text-[#cca062] mb-1">
                              {cat.icon}
                              <span className="text-[9px] font-black uppercase tracking-[0.25em] font-sans">
                                Ateliê de Criação • Fichário {idx + 1}
                              </span>
                            </div>
                            <h3 className="font-serif text-3xl font-black text-[#6d5443] italic">{cat.name}</h3>
                            <p className="text-xs text-[#5c4a3d]/80 mt-1 font-medium font-sans">{cat.desc}</p>
                          </div>
                          
                          <div className="bg-white px-5 py-2.5 border border-[#cca062]/20 rounded-full shadow-sm text-center shrink-0">
                            <span className="text-[9px] font-black text-[#6d5443] uppercase tracking-wider block">Disponíveis</span>
                            <span className="text-[#cca062] font-black text-xs block">{catProducts.length} mimos</span>
                          </div>
                        </div>

                        {/* Drawer Products Scroll Container */}
                        <div className="flex-1 overflow-y-auto pr-1 pb-4 scrollbar-thin">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                             {catProducts.map((p, pIdx) => {
                               const today = new Date();
                               const createdAtDate = p.createdAt?.toMillis ? new Date(p.createdAt.toMillis()) : p.createdAt instanceof Date ? p.createdAt : new Date();
                               const diffDays = Math.floor((today.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
                               const isNew = diffDays <= 7;

                               return (
                                 <motion.div
                                   key={p.id}
                                   initial={{ opacity: 0, y: 15 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: pIdx * 0.04 }}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     navigate(`/${p.company === 'guennita' ? 'comamorguennita' : p.company === 'tuttymimo' ? 'tuttymimo' : p.company === 'mimada' ? 'mimadasim' : 'lapallyra'}?search=${encodeURIComponent(p.product_name)}`);
                                   }}
                                   className="bg-white rounded-[1.5rem] border border-[#cca062]/15 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group/item"
                                 >
                                   <div className="aspect-square relative overflow-hidden bg-neutral-50/50">
                                     <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-700" isThumbnail={true} />
                                     
                                     {/* Gold Foil Badges */}
                                     <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none z-10">
                                       {isNew && (
                                         <span className="inline-flex items-center gap-1 bg-gradient-to-br from-[#dfba6b] via-[#fff5d6] to-[#b38d3f] text-[#473319] border border-[#ffd175]/45 shadow-[0_3px_8px_rgba(179,141,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.45)] text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap">
                                           <Sparkles size={7.5} className="animate-pulse text-[#473319] shrink-0" /> Novidade
                                         </span>
                                       )}
                                       {p.isFeatured && (
                                         <span className="inline-flex items-center gap-1 bg-gradient-to-br from-[#dfba6b] via-[#fff5d6] to-[#b38d3f] text-[#473319] border border-[#ffd175]/45 shadow-[0_3px_8px_rgba(179,141,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.45)] text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap">
                                           <Sparkles size={7.5} className="animate-pulse text-[#473319] shrink-0" /> Best Seller
                                         </span>
                                       )}
                                     </div>

                                     <div className="absolute inset-0 bg-[#6d5443]/5 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                       <span className="bg-white/95 text-[#6d5443] border border-[#cca062]/10 font-bold uppercase tracking-widest text-[8px] px-3.5 py-2 rounded-full shadow-sm">Ver Detalhes</span>
                                     </div>
                                   </div>
                                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                                  <div>
                                    <span className="text-[8px] uppercase tracking-wider font-black text-[#cca062] block mb-1">Ateliê {p.company}</span>
                                    <h4 className="font-bold text-xs text-[#6d5443] leading-tight truncate group-hover/item:text-[#cca062] transition-colors">{p.product_name}</h4>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-[#cca062]/5">
                                    <span className="text-xs font-black text-[#6d5443]">{formatCurrency(p.retail_price)}</span>
                                    {activeTab === 'monte_seu_kit' ? (() => {
                                      const itemInKit = selectedItems.find(item => item.id === p.id);
                                      return itemInKit ? (
                                        <div className="flex items-center gap-2 select-none" onClick={(e) => e.stopPropagation()}>
                                          <button 
                                            type="button" 
                                            onClick={() => handleRemoveOne(p.id)} 
                                            className="w-6 h-6 rounded-lg bg-[#cca062]/15 text-[#cca062] font-black flex items-center justify-center hover:bg-[#cca062] hover:text-white transition-all text-xs"
                                          >
                                            <Minus size={10} className="stroke-[3]" />
                                          </button>
                                          <span className="text-xs font-black text-[#6d5443] min-w-[16px] text-center">{itemInKit.quantity}</span>
                                          <button 
                                            type="button" 
                                            onClick={() => handleAddOne(p)} 
                                            className="w-6 h-6 rounded-lg bg-[#cca062]/15 text-[#cca062] font-black flex items-center justify-center hover:bg-[#cca062] hover:text-white transition-all text-xs"
                                          >
                                            <Plus size={10} className="stroke-[3]" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleAddOne(p); }}
                                          className="h-6 px-3 rounded-lg bg-[#cca062]/10 text-[#cca062] hover:bg-[#cca062] hover:text-white flex items-center gap-1 transition-all text-[9.5px] font-black uppercase tracking-wider select-none"
                                        >
                                          <Plus size={10} className="stroke-[3]" /> Selecionar
                                        </button>
                                      );
                                    })() : (
                                      <div className="h-6 px-3 rounded-lg bg-[#cca062]/10 text-[#cca062] hover:bg-[#cca062] hover:text-white flex items-center gap-1 transition-all text-[9.5px] font-black uppercase tracking-wider">
                                        <Plus size={10} className="stroke-[3]" /> Unidade
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* Collapsed Vertical Stripe */
                      <div className="flex-1 flex flex-col items-center justify-between h-full w-full py-2 select-none">
                        <div className="w-6 h-6 rounded-full bg-[#cca062]/10 border border-[#cca062]/20 flex items-center justify-center text-[#cca062] text-[9px] font-black shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]">
                          {idx + 1}
                        </div>
                        
                        <div className="my-[4rem] flex-1 flex items-center justify-center">
                          <span 
                            className="text-[10px] uppercase tracking-[0.25em] font-black text-[#6d5443]/70 font-sans whitespace-nowrap" 
                            style={{ 
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)'
                            }}
                          >
                            {cat.name}
                          </span>
                        </div>

                        <div className="w-2.5 h-2.5 rounded-full border border-white/80 shadow-sm" style={{ backgroundColor: cat.color }}></div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile/Tablet Vertical Stack Binder Layout */}
            <div className="flex lg:hidden flex-col gap-4">
              {customCategories.map((cat, idx) => {
                const isActive = activeCategoryTab === cat.id;
                const catProducts = getProductsForCategoryTab(cat.id);
                // Escadinha offset in cascade margin-left
                const steppedMl = (idx % 3) * 6;
                
                return (
                  <motion.div
                    key={`mob-${cat.id}`}
                    onClick={() => {
                      if (!isActive) setActiveCategoryTab(cat.id);
                    }}
                    layout
                    transition={{ type: "spring", stiffness: 350, damping: 32 }}
                    style={{ marginLeft: `${steppedMl}px` }}
                    className={`rounded-[1.7rem] border overflow-hidden cursor-pointer transition-all duration-400 ${
                      isActive 
                        ? `${cat.borderColor} ${cat.bgActive} p-5 shadow-md` 
                        : "border-[#6d5443]/10 bg-white hover:border-[#cca062]/40 p-4 flex items-center justify-between shadow-sm"
                    }`}
                  >
                    {isActive ? (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        {/* Header for expanded mobile row */}
                        <div className="flex justify-between items-start border-b border-[#cca062]/10 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[#cca062]">
                              {cat.icon}
                              <span className="text-[8px] font-black uppercase tracking-widest font-sans">Dividor {idx + 1}</span>
                            </div>
                            <h3 className="font-serif text-xl font-black text-[#6d5443] italic">{cat.name}</h3>
                            <p className="text-[10px] text-[#5c4a3d]/80 leading-snug">{cat.desc}</p>
                          </div>
                          <span className="text-[9px] font-black text-white bg-[#cca062] px-2.5 py-1 rounded-full shadow-sm">
                            {catProducts.length} itens
                          </span>
                        </div>

                         {/* Compact mobile horizontal product list (sem scroll de categoria, mas mantendo flexível) */}
                         <div className="grid grid-cols-2 gap-4">
                           {catProducts.map((p) => {
                             const today = new Date();
                             const createdAtDate = p.createdAt?.toMillis ? new Date(p.createdAt.toMillis()) : p.createdAt instanceof Date ? p.createdAt : new Date();
                             const diffDays = Math.floor((today.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
                             const isNew = diffDays <= 7;

                             return (
                               <div
                                 key={`mob-p-${p.id}`}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   navigate(`/${p.company === 'guennita' ? 'comamorguennita' : p.company === 'tuttymimo' ? 'tuttymimo' : p.company === 'mimada' ? 'mimadasim' : 'lapallyra'}?search=${encodeURIComponent(p.product_name)}`);
                                 }}
                                 className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm flex flex-col"
                               >
                                 <div className="aspect-square relative overflow-hidden bg-neutral-50/50">
                                   <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-cover" isThumbnail={true} />
                                   
                                   {/* Gold Foil Badges */}
                                   <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none z-10">
                                     {isNew && (
                                       <span className="inline-flex items-center gap-0.5 bg-gradient-to-br from-[#dfba6b] via-[#fff5d6] to-[#b38d3f] text-[#473319] border border-[#ffd175]/45 shadow-[0_2px_4px_rgba(179,141,63,0.3),inset_0_0.5px_0.5px_rgba(255,255,255,0.45)] text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                         <Sparkles size={6} className="animate-pulse text-[#473319] shrink-0" /> Novidade
                                       </span>
                                     )}
                                     {p.isFeatured && (
                                       <span className="inline-flex items-center gap-0.5 bg-gradient-to-br from-[#dfba6b] via-[#fff5d6] to-[#b38d3f] text-[#473319] border border-[#ffd175]/45 shadow-[0_2px_4px_rgba(179,141,63,0.3),inset_0_0.5px_0.5px_rgba(255,255,255,0.45)] text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                         <Sparkles size={6} className="animate-pulse text-[#473319] shrink-0" /> Best Seller
                                       </span>
                                     )}
                                   </div>
                                 </div>
                              <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                                <h4 className="font-bold text-[10px] text-[#6d5443] leading-tight line-clamp-1">{p.product_name}</h4>
                                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 mt-auto">
                                  <span className="text-[10px] font-black text-[#6d5443]">{formatCurrency(p.retail_price)}</span>
                                  {activeTab === 'monte_seu_kit' ? (() => {
                                    const itemInKit = selectedItems.find(item => item.id === p.id);
                                    return itemInKit ? (
                                      <div className="flex items-center gap-1.5 select-none" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          type="button" 
                                          onClick={() => handleRemoveOne(p.id)} 
                                          className="w-5 h-5 rounded bg-[#cca062]/10 text-[#cca062] font-black flex items-center justify-center hover:bg-[#cca062] hover:text-white transition-all text-[10px]"
                                        >
                                          <Minus size={8} className="stroke-[3]" />
                                        </button>
                                        <span className="text-[10px] font-black text-[#6d5443] min-w-[12px] text-center">{itemInKit.quantity}</span>
                                        <button 
                                          type="button" 
                                          onClick={() => handleAddOne(p)} 
                                          className="w-5 h-5 rounded bg-[#cca062]/10 text-[#cca062] font-black flex items-center justify-center hover:bg-[#cca062] hover:text-white transition-all text-[10px]"
                                        >
                                          <Plus size={8} className="stroke-[3]" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleAddOne(p); }}
                                        className="p-1 rounded-full bg-[#cca062]/10 text-[#cca062] hover:bg-[#cca062] hover:text-white transition-all select-none"
                                      >
                                        <Plus size={12} className="stroke-[3]" />
                                      </button>
                                    );
                                  })() : (
                                    <Plus size={12} className="text-[#cca062] stroke-[3]" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </motion.div>
                    ) : (
                      /* Collapsed mobile row representation */
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#cca062]/10 border border-[#cca062]/20 flex items-center justify-center text-[#cca062] text-[10px] font-black shadow-sm">
                            {idx + 1}
                          </div>
                          <span className="text-xs uppercase tracking-[0.18em] font-black text-[#6d5443] font-sans">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase text-neutral-400 tracking-wider">
                            {catProducts.length} itens
                          </span>
                          <div className="w-2 h-2 rounded-full border border-white shadow-sm" style={{ backgroundColor: cat.color }}></div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

          </div>
        ) : (
          /* STANDARD KITS SHOWCASE FOR KITS PRONTOS */
          allKits.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 border border-dashed border-[#cca062]/30 rounded-[3rem] bg-white">
               <PackagePlus size={48} className="text-[#cca062]/20 mb-4" />
               <p className="text-[#6d5443] font-bold uppercase tracking-widest text-xs">Nenhum Kit Disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {allKits.map((kit, idx) => (
                 <motion.div
                   key={kit.id}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: idx * 0.08, duration: 0.5 }}
                   className="bg-white rounded-[2.2rem] border border-[#cca062]/15 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#cca062]/35 transition-all duration-300 cursor-pointer group flex flex-col"
                   onClick={() => navigate(`/${kit.company === 'guennita' ? 'comamorguennita' : kit.company === 'tuttymimo' ? 'tuttymimo' : kit.company === 'mimada' ? 'mimadasim' : 'lapallyra'}?search=${encodeURIComponent(kit.product_name)}`)}
                 >
                   <div className="aspect-square relative overflow-hidden bg-neutral-50/50">
                      <ImageWithFallback src={kit.image} alt={kit.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" isThumbnail={true} />
                      
                      <div className="absolute inset-0 bg-[#6d5443]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white/95 text-[#6d5443] border border-[#cca062]/10 font-bold uppercase tracking-widest text-[8px] px-4 py-2.5 rounded-full shadow-sm">Ver Detalhes do Kit</span>
                      </div>

                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#6d5443] text-[8px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest z-10 shadow-sm border border-[#cca062]/10">
                        Kit do Ateliê
                      </div>

                      {kit.kitDiscountPercentage ? (
                        <div className="absolute top-4 right-4 bg-[#cca062] text-white text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest z-10 shadow-md">
                           -{kit.kitDiscountPercentage}% OFF
                        </div>
                      ) : null}
                   </div>
                   
                   <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                     <div>
                       <span className="text-[8px] uppercase tracking-[0.2em] font-black text-[#cca062] block mb-1">Ateliê {kit.company}</span>
                       <h3 className="font-serif text-lg font-black text-[#6d5443] leading-tight mb-2 truncate group-hover:text-[#cca062] transition-colors italic">{kit.product_name}</h3>
                       <p className="text-xs text-[#5c4a3d]/70 font-sans font-medium line-clamp-2 leading-relaxed">{kit.description}</p>
                     </div>
                     
                     <div className="pt-4 border-t border-[#cca062]/10 flex items-center justify-between mt-auto">
                        <div>
                          {kit.kitDiscountPercentage ? (
                            <div className="text-[9px] text-neutral-400 line-through font-bold mb-0.5">
                              De: {formatCurrency(kit.original_price ?? kit.retail_price * 1.2)}
                            </div>
                          ) : null}
                          <div className="text-xl font-black text-[#6d5443] font-sans">
                             {formatCurrency(kit.current_price ?? kit.retail_price)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleAddToGiftListLocal(kit);
                             }}
                             className="h-8 w-8 rounded-xl bg-[#cca062]/10 hover:bg-[#cca062] hover:text-white text-[#cca062] flex items-center justify-center transition-all bg-white"
                             title="Adicionar à Lista de Presentes"
                           >
                             <Gift size={13} className="stroke-[2.5]" />
                           </button>
                           <div className="h-8 px-4 rounded-xl bg-neutral-900 text-white flex items-center gap-1.5 transition-all text-[9px] font-black uppercase tracking-wider">
                              <Search size={11} className="stroke-[3]" /> Conhecer
                           </div>
                        </div>
                     </div>
                   </div>
                 </motion.div>
              ))}
            </div>
          )
        )}
      </main>

      {/* FLOATING BOTTOM BAR WITH HUGE EXQUISITE VALUE EMPHASIS */}
      <AnimatePresence>
        {activeTab === 'monte_seu_kit' && selectedItems.length > 0 && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 180 }}
            className="fixed bottom-0 inset-x-0 z-[1000] bg-[#2d1f18] border-t border-[#cca062]/30 py-5 px-6 md:px-10 shadow-[0_-15px_45px_rgba(45,31,24,0.35)]"
          >
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Left/Center: Dynamic Count and Thumbnails */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left self-stretch md:self-auto">
                <div className="hidden sm:flex -space-x-3 overflow-hidden select-none mr-2">
                  {selectedItems.slice(0, 5).map((item, i) => (
                    <div 
                      key={`thumb-${item.id}`} 
                      className="w-10 h-10 rounded-full border-2 border-[#2d1f18] bg-white overflow-hidden shadow-md relative"
                      style={{ zIndex: 10 - i }}
                    >
                      <ImageWithFallback src={item.image} alt={item.product_name} className="w-full h-full object-cover" isThumbnail={true} />
                    </div>
                  ))}
                  {selectedItems.length > 5 && (
                    <div className="w-10 h-10 rounded-full border-2 border-[#2d1f18] bg-[#cca062] text-white flex items-center justify-center font-bold text-xs shadow-md z-0">
                      +{selectedItems.length - 5}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#cca062] block mb-1">
                    {selectedItems.reduce((acc, curr) => acc + curr.quantity, 0)} {selectedItems.reduce((acc, curr) => acc + curr.quantity, 0) === 1 ? 'mimo selecionado' : 'mimos selecionados'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      TOTAL DO SEU PRESENTE
                    </span>
                    <span className="text-3xl md:text-4xl font-serif font-black text-[#ffd685] tracking-tight mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-pulse">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Deseja limpar todos os itens selecionados do seu kit?")) {
                      setSelectedItems([]);
                    }
                  }}
                  className="text-neutral-400 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest px-4 py-3 hover:bg-white/5 rounded-xl transition-all"
                >
                  Limpar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const compiledKit: Product = {
                      id: `kit_custom_${Date.now()}`,
                      code: `KIT-${Math.floor(100+Math.random()*900)}`,
                      company: selectedItems[0]?.company || 'guennita',
                      product_name: 'Meu Kit Personalizado',
                      description: 'Kit sob medida contendo: ' + selectedItems.map(i => `${i.quantity}x ${i.product_name}`).join(', '),
                      original_price: totalPrice,
                      retail_price: totalPrice,
                      wholesale_price: totalPrice,
                      wholesale_min_qty: 1,
                      current_price: totalPrice,
                      image: selectedItems[0]?.image || '/logo_placeholder.png',
                      category: 'Kits',
                      subcategory: 'Customizado',
                      isVisible: true,
                      isFeatured: false,
                      isKit: true,
                      kitType: 'monte_seu_kit'
                    };
                    handleAddToGiftListLocal(compiledKit);
                    setSelectedItems([]); // Clear selections after adding
                  }}
                  className="w-full md:w-auto bg-[#cca062]/20 border border-[#cca062]/40 text-[#ffffff] hover:bg-[#cca062] hover:text-[#2d1f18] hover:border-[#cca062] transition-all duration-300 px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] select-none flex items-center justify-center gap-1.5 animate-pulse"
                >
                  <Gift size={13} /> Add à Lista
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeKit}
                  disabled={isFinalizing}
                  className="w-full md:w-auto bg-transparent border border-[#cca062]/40 text-[#fdfbf7] hover:bg-[#cca062] hover:text-[#2d1f18] hover:border-[#cca062] transition-all duration-300 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] select-none"
                >
                  {isFinalizing ? "ENVIANDO..." : "Finalizar Kit"}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM SUCCESS OVERLAY */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl border border-[#cca062]/20 text-center relative"
            >
              <div className="w-16 h-16 rounded-full bg-[#cca062]/10 text-[#cca062] flex items-center justify-center mx-auto mb-6 border border-[#cca062]/20">
                <Check size={32} className="stroke-[3]" />
              </div>
              
              <h3 className="font-serif text-3xl font-black text-[#6d5443] mb-3 italic">
                Presente Criado!
              </h3>
              
              <p className="text-[#5c4a3d]/80 text-sm font-medium leading-relaxed mb-8">
                Que escolha maravilhosa! Todos os mimos selecionados foram adicionados à sua sacola de presentes. O que gostaria de fazer agora?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItems([]);
                    setShowSuccessOverlay(false);
                  }}
                  className="bg-transparent border border-[#cca062]/30 text-[#6d5443] hover:bg-[#cca062]/5 font-black uppercase tracking-wider text-[9px] py-4 rounded-xl transition-all"
                >
                  Montar Outro
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const firstCompany = selectedItems[0]?.company || 'guennita';
                    const targetPath = firstCompany === 'guennita' ? 'comamorguennita' : firstCompany === 'tuttymimo' ? 'tuttymimo' : firstCompany === 'mimada' ? 'mimadasim' : 'lapallyra';
                    setSelectedItems([]);
                    setShowSuccessOverlay(false);
                    navigate(`/${targetPath}?cart=open`);
                  }}
                  className="bg-[#6d5443] hover:bg-[#cca062] text-white font-black uppercase tracking-wider text-[9px] py-4 rounded-xl transition-all shadow-[0_4px_12px_rgba(109,84,67,0.2)]"
                >
                  Ver Carrinho
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
};
