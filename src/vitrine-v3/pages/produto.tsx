import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PRODUCTS_V3 } from '../data/products';
import { getActiveCampaign } from '../campaigns/campaign-engine';
import { useCartV3 } from '../core/cart/useCart';
import { CartDrawerV3 } from '../components/CartDrawer';
import { VitrineHeaderV3 } from '../components/VitrineHeader';
import { VitrineFooterV3 } from '../components/VitrineFooter';
import { ArrowLeft, Star, ShoppingBag, Gift, Truck, ShieldCheck, Heart, Sparkles, Check } from 'lucide-react';

export const VitrineProdutoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCartV3();

  // Find the requested product
  const product = useMemo(() => {
    return PRODUCTS_V3.find((p) => p.id === id);
  }, [id]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [customizationText, setCustomizationText] = useState<string>('');
  
  // Success notification after adding to cart
  const [addSuccess, setAddSuccess] = useState<boolean>(false);

  // Fallback if product is not found
  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
        <VitrineHeaderV3 onOpenCart={() => setIsCartOpen(true)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-1 text-center select-none">
          <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase text-[#111111]">Produto não catalogado</h2>
          <p className="text-xs text-[#6D5443] mt-2 mb-6">Esta criação d\'Ateliê pode ter esgotado na campanha atual de joias e finos.</p>
          <Link to="/vitrine-v3/catalogo" className="bg-[#111111] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37]">
            Voltar ao Catálogo
          </Link>
        </main>
        <VitrineFooterV3 />
      </div>
    );
  }

  // Set default initial state for variants and images
  if (!activeImage && product.images?.length > 0) {
    setActiveImage(product.images[0]);
  }
  if (!selectedColor && product.variants?.colors && product.variants.colors.length > 0) {
    setSelectedColor(product.variants.colors[0]);
  }
  if (!selectedSize && product.variants?.sizes && product.variants.sizes.length > 0) {
    setSelectedSize(product.variants.sizes[0]);
  }

  const activeCampaign = getActiveCampaign();
  const belongsCampaign = activeCampaign.productIds.includes(product.id);

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(product.price);

  const formattedOriginalPrice = product.originalPrice 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)
    : null;

  const handleAddToCartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToCart(
      product,
      1,
      selectedColor || undefined,
      selectedSize || undefined,
      customizationText || undefined
    );
    
    // Fire nice dynamic animation response
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2500);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeaderV3 onOpenCart={() => setIsCartOpen(true)} />

      {/* Back to Catalogue */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 select-none">
        <Link 
          to="/vitrine-v3/catalogo"
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#6D5443] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Voltar ao Acervo de Peças</span>
        </Link>
      </div>

      {/* Main product core wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Gallery column (Left) */}
        <div className="lg:col-span-6 space-y-4 select-none">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-[#E8DCC8]/40 shadow-xs relative">
            {/* Active badges */}
            {product.badge && (
              <span className="absolute top-4 left-4 z-10 bg-neutral-900 border border-neutral-800 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded">
                {product.badge}
              </span>
            )}
            
            <img 
              src={activeImage || product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-cover transition-all"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Thumbnails row */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-18 h-18 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    activeImage === img 
                      ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/30 bg-white' 
                      : 'border-[#E8DCC8]/40 hover:border-[#D4AF37]/60 bg-[#FAF8F5]'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Specs / Details box */}
          <div className="pt-6 border-t border-[#E8DCC8]/25 space-y-4 text-xs">
            <h3 className="font-serif text-sm font-bold text-[#111111] uppercase tracking-wide">
              Pesos, Medidas & Atributos
            </h3>
            
            <div className="bg-white border border-[#E8DCC8]/30 rounded-2xl p-4.5 space-y-3">
              <div className="flex justify-between pb-2 border-b border-[#E8DCC8]/15">
                <span className="text-[#6D5443]/85 font-medium">Dimensões oficiais</span>
                <span className="font-mono text-neutral-800 font-bold">{product.dimensions}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#E8DCC8]/15">
                <span className="text-[#6D5443]/85 font-medium">Materiais empregados</span>
                <span className="text-neutral-800 font-bold">{product.materials.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6D5443]/85 font-medium">Disponibilidade</span>
                <span className="font-bold text-[#00AF54]">Envio rápido em até 48 horas úteis</span>
              </div>
            </div>
          </div>

        </div>

        {/* Details & config form column (Right) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Base meta details */}
          <div className="space-y-2 select-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#FAF8F5] border border-[#E8DCC8]/60 text-[#6D5443] px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider">
                {product.category}
              </span>

              {belongsCampaign && (
                <span className="bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/45 px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} className="fill-current" />
                  <span>Oferta Especial Ativa</span>
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3.2xl font-extrabold text-[#111111] uppercase tracking-wide leading-tight">
              {product.name}
            </h1>
            <p className="font-serif italic text-xs.1 text-[#6D5443] font-light">
              "{product.tagline}"
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex text-[#D4AF37] text-xs">
                ★★★★★
              </div>
              <span className="text-[10px] text-neutral-400 font-semibold">{product.reviewsCount} opiniões verificadas de madrinhas e noivas</span>
            </div>
          </div>

          <p className="text-xs.1 sm:text-xs.2 text-[#6D5443] leading-relaxed select-none">
            {product.longDescription}
          </p>

          <div className="border-t border-[#E8DCC8]/25 pt-4 select-none">
            <div className="flex items-baseline gap-2">
              {formattedOriginalPrice && (
                <span className="text-sm text-neutral-400 line-through font-mono">
                  {formattedOriginalPrice}
                </span>
              )}
              <span className="text-2xl font-black text-[#111111] font-mono tracking-tight">
                {formattedPrice}
              </span>
            </div>
            <span className="text-[9.5px] text-[#00AF54] font-medium block mt-1">✓ Lote especial com monogramas grátis inclusos</span>
          </div>

          {/* Configuration Form for variants / custom text */}
          <form onSubmit={handleAddToCartSubmit} className="space-y-6 pt-2">
            
            {/* Color variant choose */}
            {product.variants?.colors && product.variants.colors.length > 0 && (
              <div className="space-y-2 select-none">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#6D5443] block">
                  Escolha o Tom / Revestimento:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2.2 rounded-xl text-xs font-bold transition-all border ${
                        selectedColor === color 
                          ? 'bg-[#111111] text-white border-neutral-950 shadow-sm' 
                          : 'bg-white text-neutral-700 border-[#E8DCC8]/50 hover:bg-[#D4AF37]/10'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size variant choose */}
            {product.variants?.sizes && product.variants.sizes.length > 0 && (
              <div className="space-y-2 select-none">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#6D5443] block">
                  Dimensão / Volume Especial:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2.2 rounded-xl text-xs font-bold transition-all border ${
                        selectedSize === size 
                          ? 'bg-[#111111] text-white border-neutral-950 shadow-sm' 
                          : 'bg-white text-neutral-700 border-[#E8DCC8]/50 hover:bg-[#D4AF37]/10'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customization input field */}
            <div className="space-y-2.5 bg-white border border-[#E8DCC8]/35 p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center gap-1.5 justify-between select-none">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#111111] block">
                  Iniciais do Monograma (Ouro Líquido)
                </label>
                <span className="text-[8.5px] bg-[#FAF8F5] text-[#D4AF37] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Pintado à Mão</span>
              </div>
              
              <input 
                type="text"
                maxLength={45}
                value={customizationText}
                onChange={(e) => setCustomizationText(e.target.value)}
                placeholder="Ex. J.A., 24.12.2026, ou iniciais dos noivos"
                className="w-full bg-[#FAF8F5] border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4 py-2.8 rounded-xl outline-none transition-all"
              />
              
              <p className="text-[9.5px] text-[#6D5443] leading-relaxed select-none">
                *Caso prefira sem gravação, deixe em branco. Nossos desenhistas pintarão o brasão clássico padrão do ateliê.
              </p>
            </div>

            {/* Actions Row */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className={`w-full text-xs font-black uppercase tracking-[0.18em] h-13 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  addSuccess 
                    ? 'bg-[#00AF54] text-white' 
                    : 'bg-[#111111] text-white hover:bg-[#D4AF37]'
                }`}
                id="add-to-cart-v3-btn"
              >
                {addSuccess ? (
                  <>
                    <Check size={16} />
                    <span>Item Adicionado à Bolsa!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} />
                    <span>Adicionar Presente d\'Ateliê V3</span>
                  </>
                )}
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center text-[10px] text-neutral-500 py-1.5 select-none font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#D4AF37]" />
                  <span>Selo de procedência</span>
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 bg-neutral-300 rounded-full" />
                <div className="flex items-center gap-1.5">
                  <Truck size={14} className="text-[#D4AF37]" />
                  <span>Acolchoado especial com perfume de lavanda</span>
                </div>
              </div>
            </div>

          </form>

        </div>

      </main>

      {/* Cart Drawer */}
      <CartDrawerV3 isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <VitrineFooterV3 />
    </div>
  );
};
