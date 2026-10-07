import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, Layers, Search, ArrowUpDown } from 'lucide-react';
import { Product, CompanyId, SiteSettings } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { formatCurrency } from '../../lib/currencyUtils';
import { StoreDividerId, STORE_DIVIDERS } from './HomeAtelierDividers';

// Imagens editoriais / isotipos padrão de cada ateliê
const PALLYRA_IMAGE = "/src/assets/images/pallyra_editorial_1784213505525.jpg";
const MIMADA_IMAGE = "/src/assets/images/mimada_editorial_1784213531490.jpg";
const TUTTY_IMAGE = "/src/assets/images/tuttymimo_editorial_1784213576844.jpg";
const GUENNITA_IMAGE = "/src/assets/images/guennita_editorial_1784213518263.jpg";

interface HomeCuratedProductsProps {
  allProducts: Product[];
  activeDivider: StoreDividerId;
  customSettings?: Record<string, SiteSettings | null>;
}

/**
 * Componente: HomeCuratedProducts
 * Exibe a vitrine dos produtos das abas ("Loja Completa", "La Pallyra", "Mimada Sim", "com amor, Guennita", "Tutty Mimo").
 * Limpo e direto: sem mini títulos, sem legendas explicativas dispensáveis, apenas o logotipo (para marcas) e o título principal elegante.
 */
export const HomeCuratedProducts: React.FC<HomeCuratedProductsProps> = ({ 
  allProducts = [],
  activeDivider = 'todos',
  customSettings = {}
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default');

  const normalize = (str: string) => 
    (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Informações da divisória ativa
  const currentDividerInfo = STORE_DIVIDERS.find(d => d.id === activeDivider) || STORE_DIVIDERS[0];

  // Identificação do logotipo do ateliê
  // Regra: Apenas marcas têm logotipo, Loja Completa e Home não têm logotipo
  const atelierLogoData = useMemo(() => {
    if (activeDivider === 'todos' || activeDivider === 'home') {
      return null;
    }

    let defaultImg = '';
    let monogram = '';

    if (activeDivider === 'pallyra') {
      defaultImg = PALLYRA_IMAGE;
      monogram = 'LP';
    } else if (activeDivider === 'mimada') {
      defaultImg = MIMADA_IMAGE;
      monogram = 'MS';
    } else if (activeDivider === 'guennita') {
      defaultImg = GUENNITA_IMAGE;
      monogram = 'CG';
    } else if (activeDivider === 'tuttymimo') {
      defaultImg = TUTTY_IMAGE;
      monogram = 'TM';
    }

    const setting = customSettings?.[activeDivider];
    const logoSrc = setting?.store_logo || setting?.store_isotipo || setting?.logoUrl || defaultImg;

    return {
      logoSrc,
      monogram,
      name: currentDividerInfo.label
    };
  }, [activeDivider, customSettings, currentDividerInfo]);

  // Filtragem conforme a divisória ativa
  const dividerProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (product.isVisible === false) return false;
      if (!product.image && !product.images?.[0] && !product.main_image) return false;

      if (activeDivider === 'todos' || activeDivider === 'home') {
        return true;
      }

      const pTags = (product.tags || []).map(normalize);
      const pCompany = normalize(product.company || (product as any).companyId || '');

      if (activeDivider === 'pallyra') {
        const matchesTag = pTags.some(t => t.includes('pallyra') || t.includes('la pallyra'));
        const matchesCompany = pCompany === 'pallyra';
        return matchesTag || matchesCompany;
      }

      if (activeDivider === 'mimada') {
        const matchesTag = pTags.some(t => t.includes('mimada') || t.includes('mimada sim'));
        const matchesCompany = pCompany === 'mimada';
        return matchesTag || matchesCompany;
      }

      if (activeDivider === 'guennita') {
        const matchesTag = pTags.some(t => t.includes('guennita') || t.includes('com amor guennita'));
        const matchesCompany = pCompany === 'guennita';
        return matchesTag || matchesCompany;
      }

      if (activeDivider === 'tuttymimo') {
        const matchesTag = pTags.some(t => t.includes('tutty mimo') || t === 'tuttymimo' || t === 'tutty');
        const matchesCompany = pCompany === 'tuttymimo';
        return matchesTag || matchesCompany;
      }

      return true;
    });
  }, [allProducts, activeDivider]);

  // Categorias disponíveis nesta divisória
  const categories = useMemo(() => {
    const cats = Array.from(new Set(dividerProducts.map(p => p.category).filter(Boolean)));
    return ['Todos', ...cats];
  }, [dividerProducts]);

  // Aplica busca, categoria e ordenação
  const filteredProducts = useMemo(() => {
    let list = [...dividerProducts];

    if (searchQuery.trim()) {
      const q = normalize(searchQuery);
      list = list.filter(p => 
        normalize(p.product_name || (p as any).name || '').includes(q) ||
        normalize(p.description || '').includes(q) ||
        (p.tags && p.tags.some(t => normalize(t).includes(q)))
      );
    }

    if (selectedCategory !== 'Todos') {
      list = list.filter(p => p.category === selectedCategory);
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.current_price || a.retail_price) || 0) - (Number(b.current_price || b.retail_price) || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.current_price || b.retail_price) || 0) - (Number(a.current_price || a.retail_price) || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
    }

    return list;
  }, [dividerProducts, searchQuery, selectedCategory, sortBy]);

  const getCompanyName = (companyId?: CompanyId | string) => {
    switch (companyId) {
      case 'pallyra':
        return 'La Pallyra';
      case 'guennita':
        return 'com amor, Guennita';
      case 'mimada':
        return 'Mimada Sim';
      case 'tuttymimo':
        return 'Tutty Mimo';
      default:
        return 'Ateliê Exclusivo';
    }
  };

  const getCompanyRoute = (companyId?: CompanyId | string) => {
    switch (companyId) {
      case 'pallyra':
        return '/lapallyra';
      case 'guennita':
        return '/comamorguennita';
      case 'mimada':
        return '/mimadasim';
      case 'tuttymimo':
        return '/tuttymimo';
      default:
        return '/vitrine';
    }
  };

  // Tema dinâmico conforme a divisória ativa (Loja Completa usa a cor Azul Profundo do Header)
  const dividerTheme = useMemo(() => {
    switch (activeDivider) {
      case 'todos':
        return {
          primary: '#081220',
          accent: '#0F2038',
          borderHover: 'hover:border-[#081220]/70',
          badgeBg: 'bg-[#081220] text-[#FAF8F5]',
          textAccent: 'text-[#081220]',
          searchFocus: 'focus:border-[#081220]',
          searchIcon: 'text-[#081220]',
          priceColor: 'text-[#081220]',
          linkColor: 'text-[#081220]',
          shadowHover: 'hover:shadow-[0_8px_24px_rgba(8,18,32,0.12)]',
          kitBadge: 'bg-[#081220] text-[#FAF8F5] border-[#1A3150]',
          sortFocus: 'focus:border-[#081220]',
          titleColor: 'text-[#081220]',
          cleanBorder: 'border-[#081220]/30'
        };
      case 'pallyra':
        return {
          primary: '#161616',
          accent: '#C6A664',
          borderHover: 'hover:border-[#C6A664]/80',
          badgeBg: 'bg-[#161616] text-[#C6A664]',
          textAccent: 'text-[#C6A664]',
          searchFocus: 'focus:border-[#C6A664]',
          searchIcon: 'text-[#C6A664]',
          priceColor: 'text-[#161616]',
          linkColor: 'text-[#C6A664]',
          shadowHover: 'hover:shadow-[0_8px_24px_rgba(198,166,100,0.15)]',
          kitBadge: 'bg-[#161616] text-[#C6A664] border-[#C6A664]/40',
          sortFocus: 'focus:border-[#C6A664]',
          titleColor: 'text-[#161616]',
          cleanBorder: 'border-[#C6A664]/30'
        };
      case 'mimada':
        return {
          primary: '#FF007F',
          accent: '#FF007F',
          borderHover: 'hover:border-[#FF007F]/70',
          badgeBg: 'bg-[#FF007F] text-white',
          textAccent: 'text-[#FF007F]',
          searchFocus: 'focus:border-[#FF007F]',
          searchIcon: 'text-[#FF007F]',
          priceColor: 'text-[#161616]',
          linkColor: 'text-[#FF007F]',
          shadowHover: 'hover:shadow-[0_8px_24px_rgba(255,0,127,0.15)]',
          kitBadge: 'bg-[#FF007F] text-white border-white/40',
          sortFocus: 'focus:border-[#FF007F]',
          titleColor: 'text-[#FF007F]',
          cleanBorder: 'border-[#FF007F]/30'
        };
      case 'guennita':
        return {
          primary: '#56070c',
          accent: '#7a141a',
          borderHover: 'hover:border-[#7a141a]/80',
          badgeBg: 'bg-[#56070c] text-[#FAF8F5]',
          textAccent: 'text-[#7a141a]',
          searchFocus: 'focus:border-[#7a141a]',
          searchIcon: 'text-[#7a141a]',
          priceColor: 'text-[#56070c]',
          linkColor: 'text-[#7a141a]',
          shadowHover: 'hover:shadow-[0_8px_24px_rgba(86,7,12,0.15)]',
          kitBadge: 'bg-[#56070c] text-[#FAF8F5] border-[#D4AF37]/40',
          sortFocus: 'focus:border-[#7a141a]',
          titleColor: 'text-[#56070c]',
          cleanBorder: 'border-[#7a141a]/30'
        };
      case 'tuttymimo':
        return {
          primary: '#6A4A6A',
          accent: '#C8A2C8',
          borderHover: 'hover:border-[#C8A2C8]/90',
          badgeBg: 'bg-[#C8A2C8] text-[#2C1810]',
          textAccent: 'text-[#6A4A6A]',
          searchFocus: 'focus:border-[#C8A2C8]',
          searchIcon: 'text-[#8B6D8B]',
          priceColor: 'text-[#333333]',
          linkColor: 'text-[#8B6D8B]',
          shadowHover: 'hover:shadow-[0_8px_24px_rgba(200,162,200,0.2)]',
          kitBadge: 'bg-[#C8A2C8] text-white border-[#F4C2C2]',
          sortFocus: 'focus:border-[#C8A2C8]',
          titleColor: 'text-[#6A4A6A]',
          cleanBorder: 'border-[#C8A2C8]/30'
        };
      default:
        return {
          primary: '#2C1810',
          accent: '#D4AF37',
          borderHover: 'hover:border-[#D4AF37]/60',
          badgeBg: 'bg-[#2C1810] text-[#FAF8F5]',
          textAccent: 'text-[#8C6D37]',
          searchFocus: 'focus:border-[#D4AF37]',
          searchIcon: 'text-[#8C6D37]',
          priceColor: 'text-[#2C1810]',
          linkColor: 'text-[#8C6D37]',
          shadowHover: 'hover:shadow-[0_8px_24px_rgba(179,143,77,0.08)]',
          kitBadge: 'bg-[#2C1810] text-[#FAF8F5] border-[#D4AF37]/30',
          sortFocus: 'focus:border-[#D4AF37]',
          titleColor: 'text-[#2C1810]',
          cleanBorder: 'border-[#D4AF37]/30'
        };
    }
  }, [activeDivider]);

  return (
    <section className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-6 select-none">
      
      {/* Header Limpo da Vitrine: Sem mini títulos e sem legendas dispensáveis */}
      <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-6">
        
        {/* Logotipo da Marca na Vitrine (Apenas para ateliês, não para Loja Completa) */}
        {atelierLogoData && (
          <div className="flex justify-center mb-2">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white border-2 ${dividerTheme.cleanBorder} shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-1 flex items-center justify-center overflow-hidden`}>
              {atelierLogoData.logoSrc ? (
                <img
                  src={atelierLogoData.logoSrc}
                  alt={atelierLogoData.name}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className={`font-meaculpa text-3xl sm:text-4xl ${dividerTheme.textAccent}`} style={{ fontFamily: "'Mea Culpa', cursive" }}>
                  {atelierLogoData.monogram}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Título Principal Elegante Cursivo */}
        <h2 className={`text-4xl sm:text-5xl md:text-6xl font-mea-culpa ${dividerTheme.titleColor} tracking-tight leading-none py-1`}>
          {currentDividerInfo.label}
        </h2>
      </div>

      {/* Barra de Filtros da Vitrine (Busca, Categorias e Ordenação) */}
      <div className="bg-[#FAF7F2] border border-[#E8DFC8] rounded-2xl p-2.5 sm:p-3.5 mb-5 sm:mb-7 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Campo de Busca dentro da Vitrine */}
        <div className="relative w-full md:w-72">
          <Search size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dividerTheme.searchIcon}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por nome ou tag..."
            className={`w-full bg-white border border-[#E8DFC8] rounded-full pl-9 pr-4 py-2 text-xs text-[#2C1810] placeholder-[#8C7864]/60 outline-none ${dividerTheme.searchFocus} transition-colors`}
          />
        </div>

        {/* Pílulas de Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? `${dividerTheme.badgeBg} shadow-xs`
                  : 'bg-white border border-[#E8DFC8] text-[#593E32] hover:bg-[#F2ECE1]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Seletor de Ordenação */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <ArrowUpDown size={13} className={dividerTheme.searchIcon} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`bg-white border border-[#E8DFC8] rounded-xl px-3 py-1.5 text-xs text-[#2C1810] outline-none cursor-pointer ${dividerTheme.sortFocus}`}
          >
            <option value="default">Relevância</option>
            <option value="price_asc">Menor Preço</option>
            <option value="price_desc">Maior Preço</option>
            <option value="name">Ordem Alfabética</option>
          </select>
        </div>
      </div>

      {/* Grid de Produtos da Vitrine */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {filteredProducts.map((product) => {
            const imageUrl = product.image || product.images?.[0] || product.main_image || '';
            const price = Number(product.current_price || product.retail_price || product.price) || 0;
            const productName = product.product_name || (product as any).name || 'Produto Exclusivo';
            const companyName = getCompanyName(product.company);
            const targetRoute = getCompanyRoute(product.company);

            return (
              <div
                key={product.id}
                onClick={() => navigate(`${targetRoute}?product=${product.id}`)}
                className={`group flex flex-col rounded-2xl bg-[#FFFFFF] border border-[#E8DFC8] ${dividerTheme.borderHover} p-2.5 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${dividerTheme.shadowHover} transition-all duration-300 cursor-pointer`}
              >
                {/* Imagem do Produto */}
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FAF7F2] relative border border-[#F0EBE1]">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.isKit && (
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full ${dividerTheme.kitBadge} text-[9px] sm:text-[10px] font-medium tracking-wider uppercase`}>
                      Kit
                    </span>
                  )}
                  <div className="absolute inset-0 bg-[#2C1810]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-[#FFFFFF]/95 text-[#2C1810] text-xs font-medium flex items-center gap-1.5 shadow-sm">
                      <Eye size={12} strokeWidth={1.5} /> Detalhes & Personalizar
                    </span>
                  </div>
                </div>

                {/* Informações */}
                <div className="mt-3 space-y-1 text-left flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-[#2C1810] line-clamp-2 leading-snug">
                      {productName}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between mt-2">
                    <span className={`text-xs sm:text-sm font-sans font-semibold ${dividerTheme.priceColor} tracking-tight tabular-nums font-poppins`}>
                      {price > 0 ? formatCurrency(price) : 'Sob Consulta'}
                    </span>
                    <span className={`text-[11px] ${dividerTheme.linkColor} font-medium group-hover:opacity-80 transition-colors flex items-center gap-1`}>
                      Personalizar <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-[#E8DFC8]">
          <Layers size={36} className={`mx-auto ${dividerTheme.textAccent} opacity-50 mb-3`} />
          <h4 className="text-sm font-semibold text-[#2C1810] uppercase tracking-wide">
            Nenhum produto encontrado nesta vitrine
          </h4>
          {(searchQuery || selectedCategory !== 'Todos') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Todos');
              }}
              className={`mt-4 px-5 py-2 rounded-full ${dividerTheme.badgeBg} text-xs font-medium tracking-wider uppercase hover:opacity-90 transition-opacity`}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

    </section>
  );
};
