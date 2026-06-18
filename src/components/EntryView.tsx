import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Sparkles, Gift } from 'lucide-react';
import { AppConfig, Product } from '../types';

interface EntryViewProps {
  config: AppConfig;
  allProducts: Product[];
}

export const EntryView: React.FC<EntryViewProps> = ({ config, allProducts = [] }) => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');

  // Curated data sources (Single Source of Truth)
  const kits = useMemo(() => allProducts.filter(p => p.isKit).slice(0, 3), [allProducts]);
  const featured = useMemo(() => allProducts.filter(p => !p.isKit && p.isFeatured).slice(0, 6), [allProducts]);
  const emotional = useMemo(() => allProducts.filter(p => !p.isKit && (p.emotionalScore || 0) > 60).slice(0, 4), [allProducts]);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 pb-20">
      {/* Search Bar - Hidden feature for support */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-6 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!searchCode.trim()) return;
            navigate(`/document?code=${searchCode.trim().toUpperCase()}`);
          }}
          className="max-w-xl mx-auto flex items-center gap-3 bg-neutral-100 rounded-full px-5 py-3 shadow-inner"
        >
          <Search size={20} className="text-neutral-500" />
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="encontre seu pedido"
            className="bg-transparent focus:outline-none w-full text-neutral-900 placeholder-neutral-500 text-sm"
          />
        </form>
      </div>

      {/* 🧠 HERO EMOCIONAL */}
      <header className="py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-6 tracking-tight">
          {config.site_title || 'Presentes que viram memória.'}
        </h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto italic">
          {config.site_subtitle || 'Escolha um presente que fala por você antes mesmo das palavras.'}
        </p>
      </header>

      {/* ⚡ IMPULSO (KITS) */}
      {kits.length > 0 && (
        <section className="px-6 pb-16 max-w-5xl mx-auto">
          <div className="bg-neutral-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
            <Sparkles className="mx-auto mb-4 text-emerald-400" size={32} />
            <h2 className="text-3xl font-bold mb-3">Kits Prontos</h2>
            <p className="text-neutral-300 mb-8 max-w-md mx-auto">Escolhas rápidas e certeiras para você não perder tempo.</p>
            <button onClick={() => navigate('/kits')} className="bg-white text-neutral-900 px-8 py-4 rounded-full font-bold hover:bg-neutral-200 transition">
              Ver Kits
            </button>
          </div>
        </section>
      )}

      {/* 💎 DESEJO (Featured) */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8 flex items-center gap-2">
          <Sparkles size={24} className="text-amber-500" />
          Mais desejados
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {featured.map(product => (
            <div key={product.id} className="bg-white border border-neutral-200 rounded-2xl p-4 hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/produto/${product.id}`)}>
              <div className="aspect-square bg-neutral-100 rounded-xl mb-4" />
              <p className="font-semibold text-sm truncate">{product.product_name}</p>
              <p className="text-xs text-neutral-500">R$ {(product.price || product.current_price || 0).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 💖 PRESENTE (Emotional) */}
      <section className="px-6 pb-16 max-w-6xl mx-auto bg-neutral-100/50 -mx-6 py-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8 flex items-center gap-2 px-6">
          <Heart size={24} className="text-rose-500" />
          Feito com emoção
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          {emotional.map(product => (
            <div key={product.id} className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-md transition flex gap-4 items-center cursor-pointer" onClick={() => navigate(`/produto/${product.id}`)}>
              <div className="w-20 h-20 bg-neutral-100 rounded-lg shrink-0" />
              <div>
                <p className="font-semibold">{product.product_name}</p>
                <p className="text-sm text-neutral-600 line-clamp-2">{product.description}</p>
                <p className="text-sm font-bold text-rose-600 mt-1">R$ {(product.price || product.current_price || 0).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* 🧭 EXPLORAÇÃO (Categorias) */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8 flex items-center gap-2">
          <Gift size={24} className="text-neutral-500" />
          Explore por intenção
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Aniversário', 'Amor', 'Personalizados', 'Decoração'].map(cat => (
             <button key={cat} onClick={() => navigate(`/categoria/${cat.toLowerCase()}`)} 
                     className="bg-white border border-neutral-200 rounded-2xl p-6 text-left hover:border-neutral-400 transition" >
               <p className="font-semibold">{cat}</p>
             </button>
          ))}
        </div>
      </section>

      {/* 🧾 FOOTER */}
      <footer className="text-center py-10 text-neutral-500 text-sm">
        © {new Date().getFullYear()} {config.site_name || 'Presentes'} — feitos para emocionar.
      </footer>
    </div>
  );
};