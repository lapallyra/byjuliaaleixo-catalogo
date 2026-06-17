import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CalendarRange, Clock, Sparkles, Heart } from 'lucide-react';

export const VitrineFooter: React.FC = () => {
  return (
    <footer className="bg-[#111111] text-[#FAF8F5] pt-16 pb-10 mt-auto border-t border-[#E8DCC8]/20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Value Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 mb-12 border-b border-[#FAF8F5]/10">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-full bg-white/5 border border-white/10 text-[#D4AF37]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#FAF8F5]">Segurança Prime</h5>
              <p className="font-sans text-[10.5px] text-[#FAF8F5]/60 mt-0.5">Embalagens lacradas anti-impacto</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-full bg-white/5 border border-white/10 text-[#D4AF37]">
              <Sparkles size={20} />
            </div>
            <div>
              <h5 className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#FAF8F5]">100% Feito à Mão</h5>
              <p className="font-sans text-[10.5px] text-[#FAF8F5]/60 mt-0.5">Customização artesanal singular</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-full bg-white/5 border border-white/10 text-[#D4AF37]">
              <CalendarRange size={20} />
            </div>
            <div>
              <h5 className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#FAF8F5]">Edições de Época</h5>
              <p className="font-sans text-[10.5px] text-[#FAF8F5]/60 mt-0.5">Semanas especiais e sazonais</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-full bg-white/5 border border-white/10 text-[#D4AF37]">
              <Clock size={20} />
            </div>
            <div>
              <h5 className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#FAF8F5]">Sob Encomenda</h5>
              <p className="font-sans text-[10.5px] text-[#FAF8F5]/60 mt-0.5">Garantia de capricho em detalhes</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12">
          
          {/* Logo Column */}
          <div className="md:col-span-1.5 space-y-4">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.2em] text-[#FAF8F5] uppercase block">
              Vitrine <span className="text-[#D4AF37] italic font-normal">Ateliê V2</span>
            </span>
            <p className="font-sans text-xs text-[#FAF8F5]/60 leading-relaxed max-w-sm">
              Um conceito elevado de presentes especiais, onde cada curva, costura e personalizado é desenhado para durar eternamente na história de quem o recebe.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">Navegar</h4>
            <ul className="space-y-2.5 font-sans text-xs text-[#FAF8F5]/70">
              <li>
                <Link to="/vitrine-v2" className="hover:text-[#D4AF37] transition-colors">Novidades & Início</Link>
              </li>
              <li>
                <Link to="/vitrine-v2/catalogo" className="hover:text-[#D4AF37] transition-colors">Catálogo Completo</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#D4AF37] transition-colors">Ateliê Principal</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">Categorias</h4>
            <ul className="space-y-2.5 font-sans text-xs text-[#FAF8F5]/70">
              <li>
                <Link to="/vitrine-v2/catalogo?category=Home & Decor" className="hover:text-[#D4AF37] transition-colors">Home & Decor</Link>
              </li>
              <li>
                <Link to="/vitrine-v2/catalogo?category=Acessórios Prime" className="hover:text-[#D4AF37] transition-colors">Acessórios Prime</Link>
              </li>
              <li>
                <Link to="/vitrine-v2/catalogo?category=Especiais do Ateliê" className="hover:text-[#D4AF37] transition-colors">Especiais do Ateliê</Link>
              </li>
            </ul>
          </div>

          {/* Luxury Signature */}
          <div className="space-y-3">
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">Nosso Propósito</h4>
            <div className="flex items-start gap-1 font-sans text-xs text-[#FAF8F5]/60 italic leading-loose">
              "Transformar sentimentos profundos em produtos físicos incomparáveis, valorizando instantes felizes e o toque puramente manual."
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#FAF8F5]/40 mt-3 font-sans uppercase tracking-widest">
              <span>Feito no Brasil</span>
              <Heart size={10} className="text-[#C96B71]" />
            </div>
          </div>

        </div>

        {/* Solid Legal Block */}
        <div className="pt-8 border-t border-white/10 text-center">
          <p className="font-sans text-[10.5px] tracking-wide text-white/50 leading-relaxed">
            © 2025 Presentes Personalizados by Julia Aleixo. Todos os direitos reservados. CNPJ 63.348.579/0001-06 <br />
            <span className="text-[9.5px] opacity-70 mt-1 block">Vitrine Ateliê V2 - Plataforma de Experiência e Coleções Especiais</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
