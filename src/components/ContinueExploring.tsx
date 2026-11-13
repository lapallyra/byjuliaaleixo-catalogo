import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ExploringItem {
  id: string;
  title: string;
  description: string;
  path: string;
}

const items: ExploringItem[] = [
  {
    id: 'loja',
    title: 'Nossa Loja',
    description: 'Conheça o catálogo completo da Madrinha dos Personalizados',
    path: '/loja'
  },
  {
    id: 'comomontar',
    title: 'Como Montar',
    description: 'Aprenda a criar seu kit personalizado passo a passo com alma e sofisticação.',
    path: '/comomontar'
  },
  {
    id: 'comofunciona-lp',
    title: 'Lista de Presentes',
    description: 'Saiba como criar e compartilhar sua lista de desejos especial para momentos únicos.',
    path: '/comofunciona-lp'
  },
  {
    id: 'feedclientes',
    title: 'Feedback dos Clientes',
    description: 'Veja o que nossos clientes dizem sobre suas experiências e mimos recebidos.',
    path: '/feedclientes'
  }
];

export const ContinueExploring: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const navigate = useNavigate();
  const filteredItems = items.filter(item => item.path !== currentPath);

  return (
    <section className="py-24 px-3 sm:px-4 bg-white border-t border-[#D4AF37]/20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Navegação Editorial</span>
          <h2 className="whitespace-nowrap text-[#0F2C59] font-mea-culpa text-[clamp(1.85rem,4vw,3rem)] mb-3 leading-[1.15]">Continue explorando</h2>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {filteredItems.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <h4 className="text-[#0F2C59] font-serif text-lg uppercase tracking-widest mb-3 flex items-center gap-2">
                {item.title}
                <span className="h-[1px] flex-1 bg-[#D4AF37]/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              </h4>
              <p className="text-[#1B2537]/70 text-xs leading-relaxed mb-6 font-light">
                {item.description}
              </p>
              <button
                onClick={() => navigate(item.path)}
                className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] hover:text-[#0F2C59] transition-colors group/btn cursor-pointer"
              >
                Conhecer
                <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
