import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Wand2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';

interface HomeKitsSplitSectionProps {
  kits?: Product[];
}

export const HomeKitsSplitSection: React.FC<HomeKitsSplitSectionProps> = ({ kits = [] }) => {
  const navigate = useNavigate();

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="w-full rounded-2xl border border-[#D4AF37]/35 bg-[#FAF7F2] shadow-[0_4px_30px_rgba(179,143,77,0.06)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#D4AF37]/25">
          
          {/* LEFT SIDE: KIT PRONTO */}
          <div className="p-8 sm:p-10 md:p-12 flex flex-col justify-between space-y-6 bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#D4AF37]/30 text-[#8C6D37] text-[10px] font-medium uppercase tracking-widest">
                <Package size={12} strokeWidth={1.5} />
                <span>Coleção Exclusiva</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif text-[#2C1810] font-normal tracking-tight">
                Kits Prontos para Presentear
              </h3>

              <p className="text-xs sm:text-sm text-[#593E32] font-light leading-relaxed">
                Conjuntos harmoniosos criados com combinações perfeitas de papelaria, mimos e caixas cartonadas. A escolha ideal para encantar com rapidez e máxima elegância.
              </p>

              <ul className="space-y-2 pt-2 text-xs text-[#3D261C]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#B38F4D]" />
                  <span>Combinações prontas com curadoria refinada</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#B38F4D]" />
                  <span>Embalagem de luxo e laço inclusos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#B38F4D]" />
                  <span>Possibilidade de personalizar nomes e mensagens</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate('/kits')}
                className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#FAF8F5] hover:bg-[#2C1810] text-[#2C1810] hover:text-[#FAF8F5] border border-[#B38F4D]/50 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <span className="text-xs uppercase tracking-wider font-medium text-[#3D261C] group-hover:text-[#E5C388] transition-colors">
                  Explorar Kits Prontos
                </span>
                <ArrowRight size={13} className="text-[#8C6D37] group-hover:text-[#E5C388] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: MONTE SEU KIT */}
          <div className="p-8 sm:p-10 md:p-12 flex flex-col justify-between space-y-6 bg-gradient-to-b from-[#F7F3EB] to-[#FAF7F2]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#D4AF37]/30 text-[#8C6D37] text-[10px] font-medium uppercase tracking-widest">
                <Wand2 size={12} strokeWidth={1.5} />
                <span>Experiência Interativa</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif text-[#2C1810] font-normal tracking-tight">
                Monte Seu Kit Personalizado
              </h3>

              <p className="text-xs sm:text-sm text-[#593E32] font-light leading-relaxed">
                Você é a curadora do seu presente. Escolha a caixa ideal, adicione itens de papelaria, mimos e joias afetivas, selecione os aromas e defina a arte dos seus sonhos.
              </p>

              <ul className="space-y-2 pt-2 text-xs text-[#3D261C]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#B38F4D]" />
                  <span>Escolha livre entre produtos dos 4 ateliês</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#B38F4D]" />
                  <span>Visualização de itens e valor em tempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#B38F4D]" />
                  <span>Acabamentos exclusivos e dedicatória gravada</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate('/comomontar')}
                className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#2C1810] hover:bg-[#3D261C] text-[#FAF8F5] border border-[#D4AF37]/40 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <span className="text-xs uppercase tracking-wider font-medium text-[#E5C388] group-hover:text-[#FFF8EC] transition-colors">
                  Iniciar Montagem Interativa
                </span>
                <ArrowRight size={13} className="text-[#E5C388] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
};
