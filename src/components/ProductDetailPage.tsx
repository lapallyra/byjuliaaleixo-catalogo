import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus, 
  Plus, 
  Heart, 
  Gift, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight,
  Check,
  ArrowLeft
} from 'lucide-react';
import { Product, CompanyId, Variation } from '../types';
import { getTheme } from '../lib/theme';
import { ImageWithFallback } from './ImageWithFallback';

interface ProductDetailPageProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onAddToGiftList?: (product: Product) => void;
  allProducts: Product[];
  companyId: CompanyId;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onClose,
  onAddToCart,
  onAddToGiftList,
  companyId
}) => {
  const theme = getTheme(companyId);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [imageIndex, setImageIndex] = useState(0);
  const [isWholesaleActive, setIsWholesaleActive] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = [
    product.image || product.main_image,
    ...(product.images || [])
  ].filter(Boolean) as string[];

  const hasWholesale = product.isWholesaleEnabled && product.wholesale_min_qty && product.wholesale_min_qty > 0;

  useEffect(() => {
    // Reset states when product changes
    setQuantity(1);
    setSelectedVariations({});
    setImageIndex(0);
    setIsWholesaleActive(false);
    setIsFavorite(false);
    
    if (product.variations && product.variations.length > 0) {
      const initial: Record<string, string> = {};
      product.variations.forEach(v => {
        if (v.options && v.options.length > 0) {
          initial[v.name] = v.options[0].name;
        }
      });
      setSelectedVariations(initial);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  const handleWholesaleToggle = () => {
    if (!hasWholesale) return;
    
    const newWholesaleState = !isWholesaleActive;
    setIsWholesaleActive(newWholesaleState);
    
    if (newWholesaleState) {
      setQuantity(product.wholesale_min_qty || 1);
    } else {
      setQuantity(1);
    }
  };

  const handleQuantityChange = (val: number) => {
    const min = isWholesaleActive ? (product.wholesale_min_qty || 1) : 1;
    if (val < min) {
      setQuantity(min);
      return;
    }
    setQuantity(val);
  };

  const nextImage = () => setImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // Price calculations
  let currentPrice = isWholesaleActive ? (product.wholesale_price || product.retail_price) : (product.retail_price || product.current_price || 0);
  
  // Add variation price if selected
  Object.entries(selectedVariations).forEach(([varName, optName]) => {
    const variation = product.variations?.find(v => v.name === varName);
    const option = variation?.options.find(o => o.name === optName);
    if (option && option.price) {
      currentPrice += option.price;
    }
  });

  const originalPrice = product.original_price;

  return (
    <div className="w-full bg-[#FAFAF9] min-h-screen text-slate-900 pb-20 font-sans">
      
      {/* HEADER / NAVIGATION */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-900 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para a Vitrine
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        
        {/* BLOCO 01 - LADO ESQUERDO: Carrossel */}
        <div className="space-y-6">
          <div className="aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden relative shadow-sm group">
            <AnimatePresence mode="wait">
              <motion.div
                key={imageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <ImageWithFallback 
                  src={images[imageIndex]} 
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  isCritical={true}
                  fetchPriority="high"
                />
              </motion.div>
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                    i === imageIndex ? 'border-neutral-900 scale-105' : 'border-transparent opacity-60'
                  }`}
                >
                  <ImageWithFallback src={img} alt={`${product.product_name} ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BLOCO 01 - LADO DIREITO: Detalhes */}
        <div className="flex flex-col py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-neutral-400">
              {product.category}
            </span>
            
            {/* TAG ATACADO */}
            <button 
              onClick={handleWholesaleToggle}
              className={`px-4 py-1.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-widest transition-all border ${
                !hasWholesale 
                  ? 'bg-neutral-100 border-neutral-100 text-neutral-300 cursor-not-allowed opacity-50' 
                  : isWholesaleActive 
                    ? 'bg-green-600 border-green-600 text-white shadow-md active:bg-green-700' 
                    : 'bg-[#3A312D] border-[#3A312D] text-white hover:bg-neutral-800'
              }`}
              disabled={!hasWholesale}
            >
              Ativar Atacado
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-6 italic leading-tight">
            {product.product_name}
          </h1>

          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-3xl font-sans font-bold text-neutral-900">
              R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {originalPrice > currentPrice && (
              <span className="text-lg font-sans text-neutral-300 line-through">
                R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )}
            {isWholesaleActive && (
              <div className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                <Check size={12} strokeWidth={3} />
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
                  Preço Atacado (Mín. {product.wholesale_min_qty})
                </span>
              </div>
            )}
          </div>

          <div className="prose prose-sm prose-neutral mb-10 max-w-none">
            <p className="text-neutral-500 leading-relaxed font-sans text-sm md:text-base">
              {product.description}
            </p>
          </div>

          {/* Variações */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-8 mb-12">
              {product.variations.map((v: Variation) => (
                <div key={v.id} className="space-y-4">
                  <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400">
                    {v.name}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {v.options.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setSelectedVariations({ ...selectedVariations, [v.name]: opt.name })}
                        className={`px-6 py-3 rounded-2xl text-xs font-sans font-bold uppercase tracking-wider transition-all border ${
                          selectedVariations[v.name] === opt.name
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg scale-105'
                            : 'bg-white border-neutral-100 text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        {opt.name}
                        {opt.price > 0 && <span className="ml-2 opacity-60">+ R$ {opt.price.toFixed(2)}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AÇÕES DE COMPRA */}
          <div className="space-y-6 mt-auto">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Seletor de Quantidade */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="flex items-center bg-white rounded-2xl p-1.5 border border-neutral-100 shadow-sm">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors disabled:opacity-30"
                    disabled={isWholesaleActive && quantity <= (product.wholesale_min_qty || 1)}
                  >
                    <Minus size={18} />
                  </button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) handleQuantityChange(val);
                    }}
                    className="w-16 text-center bg-transparent border-none focus:ring-0 text-base font-sans font-bold text-neutral-900"
                    min={isWholesaleActive ? (product.wholesale_min_qty || 1) : 1}
                  />
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {isWholesaleActive && (
                  <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-green-600 text-center">
                    Pedido mínimo: {product.wholesale_min_qty} un.
                  </p>
                )}
              </div>

              {/* Botão Adicionar */}
              <button 
                onClick={() => onAddToCart(product, quantity)}
                className="flex-1 w-full flex items-center justify-center gap-3 bg-neutral-900 text-white py-5 px-8 rounded-2xl text-xs font-sans font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 active:scale-[0.98]"
              >
                <ShoppingCart size={18} />
                Adicionar ao Carrinho
              </button>
            </div>

            {/* Ícones Secundários */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                title="Favoritar"
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border group relative ${
                  isFavorite ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-neutral-100 text-neutral-400 hover:text-neutral-900 hover:border-neutral-200 shadow-sm'
                }`}
              >
                <Heart size={22} fill={isFavorite ? "currentColor" : "none"} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  Favoritar
                </span>
              </button>
              <button 
                onClick={() => onAddToGiftList?.(product)}
                title="Lista de Presentes"
                className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-200 shadow-sm transition-all group relative"
              >
                <Gift size={22} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  Lista de Presentes
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 02 - Informações Técnicas */}
      <div className="max-w-[1600px] mx-auto px-6 mt-24">
        <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-sm border border-neutral-100">
          <div className="max-w-3xl">
            <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-neutral-400 mb-6">
              Especificações
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="text-xl font-serif text-neutral-900 italic">Detalhes Técnicos</h3>
                <ul className="space-y-3 text-sm text-neutral-500 font-sans">
                  <li className="flex justify-between border-b border-neutral-50 pb-2">
                    <span>Código:</span>
                    <span className="font-bold text-neutral-700">{product.code}</span>
                  </li>
                  <li className="flex justify-between border-b border-neutral-50 pb-2">
                    <span>Categoria:</span>
                    <span className="font-bold text-neutral-700">{product.category}</span>
                  </li>
                  {product.dimensions && (
                    <li className="flex justify-between border-b border-neutral-50 pb-2">
                      <span>Dimensões:</span>
                      <span className="font-bold text-neutral-700">
                        {product.dimensions.length}x{product.dimensions.width}x{product.dimensions.height} cm
                      </span>
                    </li>
                  )}
                  {product.weight && (
                    <li className="flex justify-between border-b border-neutral-50 pb-2">
                      <span>Peso:</span>
                      <span className="font-bold text-neutral-700">{product.weight}g</span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-serif text-neutral-900 italic">Prazos & Produção</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Cada peça é produzida sob demanda com o cuidado e exclusividade que você merece. O prazo médio de produção é de <strong>{product.productionTime || 5} dias úteis</strong> após a confirmação do pedido.
                </p>
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-neutral-400 shrink-0 shadow-sm">
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-neutral-900 uppercase tracking-wider mb-1">Qualidade Garantida</p>
                    <p className="text-[10px] text-neutral-500 font-sans">Revisão minuciosa antes do envio.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Personalização */}
            <div className="mt-16 pt-16 border-t border-neutral-50">
              <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-neutral-400 mb-6">
                Personalização
              </h2>
              <div className="flex items-center gap-3 p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                  (product.personalizationSettings && product.personalizationSettings.length > 0) ? 'bg-white text-green-600' : 'bg-white text-rose-400'
                }`}>
                  {(product.personalizationSettings && product.personalizationSettings.length > 0) ? <Check size={18} /> : <X size={18} />}
                </div>
                <p className={`text-sm font-sans font-bold ${
                  (product.personalizationSettings && product.personalizationSettings.length > 0) ? 'text-neutral-700' : 'text-neutral-400'
                }`}>
                  {(product.personalizationSettings && product.personalizationSettings.length > 0)
                    ? '✓ Este produto pode ser personalizado.' 
                    : '✗ Este produto não possui personalização.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
