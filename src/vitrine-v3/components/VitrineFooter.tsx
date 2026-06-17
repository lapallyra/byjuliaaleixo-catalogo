import React from 'react';
import { Gift, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VitrineFooterV3: React.FC = () => {
  return (
    <footer className="bg-neutral-950 text-neutral-400 font-sans mt-auto border-t border-[#D4AF37]/25 select-none">
      
      {/* Guarantees micro-strip */}
      <div className="border-b border-neutral-900 py-6 px-4 bg-neutral-950/60 text-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] sm:text-xs">
          
          <div className="flex flex-col items-center space-y-1.5 p-3">
            <ShieldCheck size={20} className="text-[#D4AF37]" />
            <h4 className="font-bold uppercase tracking-wider text-white">Selo de Autenticidade d\'Ateliê</h4>
            <p className="text-neutral-500 max-w-xs leading-relaxed">
              Cada presente acompanha um cartão assinado, carimbado com cera quente e numerado à mão.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-1.5 p-3 border-y md:border-y-0 md:border-x border-neutral-900">
            <Gift size={20} className="text-[#D4AF37]" />
            <h4 className="font-bold uppercase tracking-wider text-white">Curadoria Emocional</h4>
            <p className="text-neutral-500 max-w-xs leading-relaxed">
              Caixa em papel cartão premium com fitas cetim e perfume floral de lavanda e alecrim.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-1.5 p-3">
            <Sparkles size={18} className="text-[#D4AF37]" />
            <h4 className="font-bold uppercase tracking-wider text-white">Confecção Lenta (Slow Design)</h4>
            <p className="text-neutral-500 max-w-xs leading-relaxed">
              Produção artesanal focada na perfeição dos monográficos, costuras e aromas.
            </p>
          </div>

        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">
          
          {/* Logo brand and slogan */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="font-serif text-lg font-black uppercase text-white tracking-widest leading-none">
              Julia Aleixo
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] block">
              Coleção Vitrine V3
            </span>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Eternizando momentos doces e afetivos através de peças clássicas refinadas, feitas por encomenda e projetadas com sentimentos verdadeiros.
            </p>
          </div>

          {/* Quick links catalog navigation */}
          <div className="space-y-3">
            <h4 className="text-[10.5px] font-black uppercase tracking-[0.2em] text-white">
              Coleções
            </h4>
            <ul className="space-y-2 text-xs font-semibold uppercase tracking-wider">
              <li>
                <Link to="/vitrine-v3/catalogo" className="hover:text-[#D4AF37] transition-colors">
                  Velas & Aromáticos
                </Link>
              </li>
              <li>
                <Link to="/vitrine-v3/catalogo" className="hover:text-[#D4AF37] transition-colors">
                  Acessórios de Luxo
                </Link>
              </li>
              <li>
                <Link to="/vitrine-v3/catalogo" className="hover:text-[#D4AF37] transition-colors">
                  Enxoval de Linho
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal support details */}
          <div className="space-y-3">
            <h4 className="text-[10.5px] font-black uppercase tracking-[0.2em] text-white">
              Ateliê Virtual
            </h4>
            <ul className="space-y-2 text-xs font-semibold uppercase tracking-wider">
              <li>
                <Link to="/vitrine-v3" className="hover:text-[#D4AF37] transition-colors">
                  Início V3
                </Link>
              </li>
              <li>
                <Link to="/vitrine-v3/carrinho" className="hover:text-[#D4AF37] transition-colors">
                  Minha Bolsa
                </Link>
              </li>
              <li>
                <Link to="/vitrine-v3/checkout" className="hover:text-[#D4AF37] transition-colors">
                  Finalizar Compra
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts and real addresses details */}
          <div className="space-y-3 text-neutral-500 text-xs">
            <h4 className="text-[10.5px] font-black uppercase tracking-[0.2em] text-white">
              Privacidade & Lojas
            </h4>
            <p className="leading-relaxed">
              Atendimento Digital Ateliê Julia Aleixo LTDA.<br />
              São Paulo, SP — Brasil<br />
              WhatsApp: <span className="text-white font-medium">(11) 99999-9999</span>
            </p>
          </div>

        </div>

        {/* Lower row */}
        <div className="border-t border-neutral-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-600 gap-4">
          <span>
            &copy; {new Date().getFullYear()} Julia Aleixo Ateliê. Todos os direitos reservados. Vitrine V3 Isolada.
          </span>
          <div className="flex items-center gap-1.5 font-light">
            <span>Desenvolvido com carinho para momentos de esplendor</span>
            <Heart size={10} className="text-red-500 fill-current animate-pulse" />
          </div>
        </div>

      </div>

    </footer>
  );
};
