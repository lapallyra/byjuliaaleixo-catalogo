import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Gift, ArrowRight, ArrowRightLeft, Star } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { VitrineHeader } from '../components/VitrineHeader';
import { VitrineFooter } from '../components/VitrineFooter';
import { ProductGrid } from '../components/ProductGrid';
import { CartDrawer } from '../components/CartDrawer';

export const VitrineIndexPage: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const featuredProducts = PRODUCTS.slice(0, 3);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeader onOpenCart={() => setIsCartOpen(true)} />
      
      {/* Hero Showcase Frame */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-cover bg-center overflow-hidden border-b border-[#E8DCC8]/30 select-none" style={{ backgroundImage: 'linear-gradient(rgba(26,22,19,0.78), rgba(26,22,19,0.72)), url("https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1200&auto=format&fit=crop")' }}>
        <div className="absolute inset-0 bg-radial-at-c from-transparent to-black/30 pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-[#FAF8F5]/10 border border-white/20 px-3.5 py-1.5 rounded-full text-[#D4AF37] text-[10.5px] font-bold uppercase tracking-[0.2em] mb-2 animate-pulse-slow">
            <Sparkles size={13} />
            <span>Coleção Semanas Especiais</span>
          </div>

          <h1 className="font-serif text-3.5xl sm:text-5xl lg:text-6xl text-white font-extrabold tracking-tight leading-none leading-tight">
            Presentes que guardam <br />
            <span className="text-[#D4AF37] italic font-normal tracking-wide">eternos instantes</span>
          </h1>

          <p className="font-sans text-white/80 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            No Ateliê V2, a curadoria ganha alma. Cada matéria-prima nobre é selecionada e finalizada sob medida à mão para celebrar as laços mais marcantes da vida.
          </p>

          <div className="pt-4 flex flex-row flex-wrap items-center justify-center gap-4">
            <Link
              to="/vitrine-v2/catalogo"
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-white text-[11px] font-bold uppercase tracking-widest px-8 h-12 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explorar Catálogo</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button
              onClick={() => {
                const sec = document.getElementById('featured-section');
                if (sec) sec.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-[11px] font-bold uppercase tracking-widest px-6 h-12 rounded-xl transition-colors cursor-pointer"
            >
              Ver Destaques
            </button>
          </div>
        </div>
      </section>

      {/* Editorial Category Teasers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 select-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="group relative h-48 bg-cover bg-center rounded-2xl overflow-hidden border border-[#E8DCC8]/30 flex flex-col justify-end p-6" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.65)), url("https://images.unsplash.com/photo-1603006905393-0d1fc06aef88?q=80&w=600&auto=format&fit=crop")' }}>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37]">Requinte Sensorial</span>
            <h3 className="font-serif text-lg font-bold text-white mb-2 uppercase">Home & Decor</h3>
            <Link 
              to="/vitrine-v2/catalogo?category=Home & Decor"
              className="text-[10.5px] font-bold uppercase tracking-wider text-white/95 group-hover:text-[#D4AF37] flex items-center gap-1 group-hover:translate-x-1.5 transition-all"
            >
              <span>Ver Coleção</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="group relative h-48 bg-cover bg-center rounded-2xl overflow-hidden border border-[#E8DCC8]/30 flex flex-col justify-end p-6" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.65)), url("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop")' }}>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37]">Elegância Pessoal</span>
            <h3 className="font-serif text-lg font-bold text-white mb-2 uppercase">Acessórios Prime</h3>
            <Link 
              to="/vitrine-v2/catalogo?category=Acessórios Prime"
              className="text-[10.5px] font-bold uppercase tracking-wider text-white/95 group-hover:text-[#D4AF37] flex items-center gap-1 group-hover:translate-x-1.5 transition-all"
            >
              <span>Ver Coleção</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="group relative h-48 bg-cover bg-center rounded-2xl overflow-hidden border border-[#E8DCC8]/30 flex flex-col justify-end p-6" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.65)), url("https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop")' }}>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37]">Barra de Memórias</span>
            <h3 className="font-serif text-lg font-bold text-white mb-2 uppercase">Especiais Ateliê</h3>
            <Link 
              to="/vitrine-v2/catalogo?category=Especiais do Ateliê"
              className="text-[10.5px] font-bold uppercase tracking-wider text-white/95 group-hover:text-[#D4AF37] flex items-center gap-1 group-hover:translate-x-1.5 transition-all"
            >
              <span>Ver Coleção</span>
              <ArrowRight size={12} />
            </Link>
          </div>

        </div>
      </section>

      {/* Featured Section */}
      <section id="featured-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-24 select-none">
        
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-[#D4AF37] text-[10.5px] font-bold uppercase tracking-[0.25em] block mb-1">
              PRODUTOS SELECIONADOS
            </span>
            <h2 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-[#111111] leading-none uppercase">
              Curadoria Especial V2
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6D5443] mt-2 max-w-lg leading-relaxed">
              Destaques criados exclusivamente para campanhas presentes, idealizados para encantar detalhes com requinte e doçura.
            </p>
          </div>
          <div>
            <Link 
              to="/vitrine-v2/catalogo"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#D4AF37] pb-1 border-b-2 border-[#111111] hover:border-[#D4AF37] transition-all"
            >
              <span>Ver Catálogo Completo</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Dynamic products list */}
        <ProductGrid products={featuredProducts} />

      </section>

      {/* Romantic Brand Promise block */}
      <section className="bg-white py-20 px-4 select-none border-t border-b border-[#E8DCC8]/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="text-[#C96B71] text-[10.5px] font-bold uppercase tracking-[0.25em] block">
            AFETO À MÃO
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#111111] uppercase tracking-wide">
            "A sutileza das pequenas coisas, unindo eternidade ao carinho"
          </h2>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto opacity-70" />
          <p className="font-sans text-[13.5px] sm:text-[14.5px] text-[#6D5443] leading-relaxed max-w-xl mx-auto font-light">
            No nosso ateliê, acreditamos que os presentes mais valiosos da vida não são medidos pelo preço ou tamanho, mas pela intenção pura dedicada a cada filete e desenho. É por isso que embalamos cada história com o maior capricho que você merece.
          </p>
        </div>
      </section>

      {/* Cart Drawer state handler */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <VitrineFooter />
    </div>
  );
};
