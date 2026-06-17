import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingBag, Check, ShieldCheck, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { useCart } from '../hooks/useCart';
import { VitrineHeader } from '../components/VitrineHeader';
import { VitrineFooter } from '../components/VitrineFooter';
import { CartDrawer } from '../components/CartDrawer';

export const VitrineProdutoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [customEngraving, setCustomEngraving] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans select-none">
        <VitrineHeader onOpenCart={() => setIsCartOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
          <span className="text-4xl text-[#C96B71] mb-3 animate-bounce-short">🔍</span>
          <h2 className="font-serif text-lg font-bold text-[#111111] uppercase tracking-wide">
            Presente não localizado
          </h2>
          <p className="font-sans text-xs text-[#6D5443] mt-2 leading-relaxed">
            O código ou identificador deste produto especial não consta em our curadoria. Verifique outras opções de luxo.
          </p>
          <Link
            to="/vitrine-v2/catalogo"
            className="mt-6 bg-[#111111] text-white text-[11px] font-bold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all cursor-pointer"
          >
            Ir para o Catálogo
          </Link>
        </div>
        <VitrineFooter />
      </div>
    );
  }

  const handleAddToCart = () => {
    // Add engraving notes to a temporary custom spec property if needed
    const customizedProduct = {
      ...product,
      name: customEngraving ? `${product.name} (Gravação: "${customEngraving}")` : product.name
    };
    addToCart(customizedProduct, qty);
    
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsCartOpen(true);
    }, 850);
  };

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(product.price);

  const formattedOriginalPrice = product.originalPrice 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeader onOpenCart={() => setIsCartOpen(true)} />

      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 select-none">
        <Link 
          to="/vitrine-v2/catalogo"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6D5443] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Voltar ao Acervo de Presentes</span>
        </Link>
      </div>

      {/* Product Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Block: Image Carousel Gallery */}
          <div className="lg:col-span-6 space-y-4 select-none">
            {/* Primary Frame */}
            <div className="aspect-square bg-white border border-[#E8DCC8]/40 overflow-hidden rounded-2xl relative shadow-sm">
              <img 
                src={product.images[activeImgIndex]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-all duration-300"
              />
              {product.originalPrice && (
                <span className="absolute top-4 left-4 bg-[#C96B71] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-md shadow-sm">
                  Exclusivo
                </span>
              )}
            </div>

            {/* Thumbnail Selectors */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={`w-18 h-18 bg-white border rounded-xl overflow-hidden cursor-pointer transition-all ${
                      activeImgIndex === idx
                        ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]'
                        : 'border-[#E8DCC8]/45 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Block: Content specs & Purchase details */}
          <div className="lg:col-span-6 flex flex-col justify-start select-none">
            
            {/* Rating and categories line */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#D4AF37] text-[10.5px] font-bold uppercase tracking-[0.2em]">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#111111]">
                <Star size={13} className="text-[#D4AF37] fill-current" />
                <span className="font-bold">{product.rating.toFixed(1)}</span>
                <span className="text-[#6D5443]/60">({product.reviewsCount} avaliações do ateliê)</span>
              </div>
            </div>

            <h1 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-[#111111] uppercase tracking-wide leading-tight mb-2.5">
              {product.name}
            </h1>

            <p className="text-sm text-[#1C1B1A]/95 font-serif italic mb-6 text-[#6D5443]">
              "{product.tagline}"
            </p>

            {/* Price Frame */}
            <div className="bg-[#FAF8F5] border border-[#E8DCC8]/30 p-4 rounded-xl flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6D5443]/70 block mb-0.5">
                  Preço Exclusivo
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="font-sans text-xl.1 sm:text-2xl font-black text-[#111111]">
                    {formattedPrice}
                  </span>
                  {formattedOriginalPrice && (
                    <span className="font-sans text-xs sm:text-sm text-[#6D5443]/50 line-through">
                      {formattedOriginalPrice}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9.5px] font-bold bg-[#FAF8F5] inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E8DCC8]/30 uppercase tracking-wider text-[#D4AF37]">
                  <Sparkles size={11} />
                  <span>Em Estoque</span>
                </span>
              </div>
            </div>

            {/* Structured Features List Check */}
            <div className="space-y-2 mb-6">
              <h4 className="text-[10px] font-bold uppercase text-[#6D5443] tracking-widest mb-3">Diferenciais Premium</h4>
              {product.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-xs.1 text-[#6D5443]">
                  <Check size={14} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Elegant Custom Engraving Text Field */}
            <div className="bg-[#FAF8F5] border border-[#E8DCC8]/40 p-4 sm:p-5 rounded-xl space-y-3.5 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#111111] block">
                  Iniciais ou Monograma para Personalizar
                </label>
                <span className="text-[8.5px] uppercase tracking-wider text-[#6D5443]/60">(Opcional • Grátis)</span>
              </div>
              <input
                type="text"
                maxLength={45}
                placeholder="Exemplo: J & A • 12.10.2025"
                value={customEngraving}
                onChange={(e) => setCustomEngraving(e.target.value)}
                className="w-full bg-white border border-[#E8DCC8]/65 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-xs px-4 py-2.8 rounded-lg outline-none text-[#1C1B1A] placeholder-[#6D5443]/40 transition-colors"
              />
              <p className="text-[10px] text-[#6D5443]/80 leading-relaxed italic">
                * As letras serão gravadas em relevo de alta precisão (Hot Stamping) ou filete de ouro escovado, dependendo da peça.
              </p>
            </div>

            {/* Quantity Stepper & ADD TO BAG CTA */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-8">
              {/* Stepper */}
              <div className="flex items-center justify-between border border-[#E8DCC8]/65 bg-white rounded-xl h-12 px-3 sm:w-32 select-none">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-2.5 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="text-sm font-bold text-[#111111] min-w-[1.5rem] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-2.5 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to bag Button */}
              <button
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md text-white ${
                  isAdded 
                    ? 'bg-[#00E575] hover:bg-[#00E575]' 
                    : 'bg-[#111111] hover:bg-[#D4AF37]'
                }`}
                id="add-to-bag-detail"
              >
                {isAdded ? (
                  <>
                    <Check size={16} />
                    <span>Adicionado à Bolsa!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} />
                    <span>Adicionar à Bolsa • {product.price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price * qty) : ''}</span>
                  </>
                )}
              </button>
            </div>

            {/* Spec metadata list (Material, Dimensions) */}
            <div className="border-t border-[#E8DCC8]/30 pt-6 space-y-3 text-[11px]">
              <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-1">
                <span className="font-bold text-[#111111]/80 uppercase tracking-wider">Dimensões Externas</span>
                <span className="text-[#6D5443]">{product.dimensions}</span>
              </div>
              <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-1 pt-1.5 border-t border-[#FAF8F5]/30">
                <span className="font-bold text-[#111111]/80 uppercase tracking-wider">Materiais Nobres</span>
                <span className="text-[#6D5443]">{product.materials.join(', ')}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Accordions explanations for crafting/production */}
        <section className="mt-16 border-t border-[#E8DCC8]/35 pt-12 select-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111] uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-[#D4AF37]" />
                <span>Sobre as Semanas Especiais</span>
              </h3>
              <p className="text-xs.1 text-[#6D5443] leading-relaxed">
                As "Semanas Especiais" são janelas temporárias no Ateliê onde liberamos peças exclusivas em lotes hiper limitados. Cada embalagem possui numeração da série e um cartão holográfico de autenticidade padrão Julia Aleixo. Uma oportunidade ímpar de colecionar ou presentear com exclusividade imbatível. Onze etapas de checagem de qualidade garantem a perfeição de sua peça final.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111] uppercase tracking-wide mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#D4AF37]" />
                <span>Confecção & Prazos Ateliê</span>
              </h3>
              <p className="text-xs.1 text-[#6D5443] leading-relaxed">
                Por tratar-se de um desenvolvimento rigorosamente artesanal, cada peça requer de 1 a 3 dias úteis para finalização, gravação do monograma e secagem de lacres. Enviamos para todo o território nacional em embalagem dupla estofada com fragrâncias florais exclusivas do ateliê. Garantia total contra danos e avarias no trajeto.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Cart Drawer state handler */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <VitrineFooter />
    </div>
  );
};
