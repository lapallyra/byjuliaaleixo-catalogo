import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Search, User, Info } from 'lucide-react';
import { AppConfig } from '../types';
import { ATELIERS } from '../constants';
import { LogoAndSignature } from './ui/LogoAndSignature';

interface FooterProps {
  config: AppConfig;
}

export const Footer: React.FC<FooterProps> = ({ config }) => {
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-[#e8dcc8]/25 pt-16 pb-10 px-4 md:px-8 font-sans overflow-hidden mt-auto">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row justify-between gap-8 mb-10">
        <div className="md:w-[20%] flex flex-col items-center md:items-start text-center md:text-left">
          <div className="mb-4 flex flex-col items-center md:items-start cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LogoAndSignature small={true} />
          </div>
          <p className="text-[11px] text-[#6d5443]/85 mb-6 max-w-[220px] leading-relaxed font-light font-tahoma">
            Kits afetivos luxuosos e presentes exclusivos sob medida para demonstrar carinho em momentos memoráveis.
          </p>
          <div className="flex gap-4.5 text-[#cca062]/80">
            <a href="/#ateliers" className="hover:text-[#3A312D] transition-colors" title="Nossos ateliês"><Info size={15} /></a>
            <a href={`https://wa.me/${(config.whatsapp_number || "").replace(/\D/g, '')}`} className="hover:text-[#3A312D] transition-colors" title="Fale pelo Whatsapp"><Mail size={15} /></a>
            <button onClick={() => navigate('/document')} className="hover:text-[#3A312D] transition-colors outline-none cursor-pointer" title="Verificar documentos"><Search size={15} /></button>
            <button onClick={() => navigate('/admin')} className="hover:text-[#3A312D] transition-colors outline-none cursor-pointer" title="Entrar no Painel"><User size={15} /></button>
          </div>
        </div>
        
        <div className="md:w-[15%]">
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Ateliês</h4>
           <ul className="space-y-3 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
             {ATELIERS.map((a) => (
               <li key={a.id}><button onClick={() => navigate(a.route)} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">{a.name}</button></li>
             ))}
           </ul>
        </div>

        <div className="md:w-[15%]">
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Navegação</h4>
           <ul className="space-y-3 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
             <li><a href="/#kits" className="hover:text-[#cca062] transition-colors">Kits Prontos</a></li>
             <li><button onClick={() => navigate('/kit-meukit')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Monte seu Kit</button></li>
             <li><button onClick={() => navigate('/colecoes')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Coleções</button></li>
             <li><button onClick={() => navigate('/listadepresentes-info')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Lista de Presentes</button></li>
           </ul>
        </div>
        
        <div className="md:w-[20%]">
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Contato</h4>
           <ul className="space-y-3 text-[11px] font-light text-[#6d5443]/80 font-tahoma mb-6">
               <li>E-mail: lapallyra@gmail.com</li>
               <li>Contato: 44 9 7400 2857</li>
               <li className="pt-2">
                   <span className="font-bold block mb-1">Horário de atendimento</span>
                   <span className="bg-[#e8dcc8]/40 px-2 py-0.5 rounded font-bold text-[#3A312D]">14:00 às 20:00</span>
                   <p className="mt-1">Segunda | Terça | Quinta</p>
                   <p>Sexta e Domingo</p>
               </li>
           </ul>
        </div>

        <div className="md:w-[15%]">
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Suporte</h4>
           <ul className="space-y-3 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
              <li><button onClick={() => navigate('/rastreamento')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer">Rastreamento de Pedido</button></li>
              <li><a href="#" className="hover:text-[#cca062] transition-colors">Prazos e Entregas</a></li>
              <li><a href="#" className="hover:text-[#cca062] transition-colors">Trocas e devoluções</a></li>
           </ul>
        </div>

        <div className="md:w-[15%] flex flex-col items-center md:items-start">
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Pagamento</h4>
           <div className="flex flex-col gap-4 items-center md:items-start">
              {/* Mercado Pago Badge */}
              <div className="flex items-center justify-center bg-[#faf8f5]/80 border border-[#e8dcc8]/35 py-2.5 px-6 rounded-xl hover:border-[#cca062]/20 transition-all duration-300 w-full max-w-[160px]">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/9/98/Mercado_Pago.svg" 
                  alt="Mercado Pago" 
                  className="h-11 object-contain" 
                  onError={(e) => {
                    e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/9/98/Mercado_Pago.svg";
                  }}
                />
              </div>

              {/* InfinitePay Badge */}
              <div className="flex flex-col items-center md:items-start gap-1.5 w-full">
                <span className="text-[8px] font-bold tracking-[0.15em] text-[#6d5443]/50 uppercase font-sans ml-1">Parcelamento Inteligente</span>
                <div className="flex items-center justify-center bg-[#faf8f5]/80 border border-[#e8dcc8]/35 py-2.5 px-5 rounded-xl hover:border-[#cca062]/20 transition-all duration-300 w-full max-w-[160px]">
                  <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Logo_InfinitePay.svg" 
                      alt="Infinite Pay" 
                      className="h-6 object-contain" 
                      onError={(e) => {
                        e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/0/0c/Logo_InfinitePay.svg";
                      }}
                    />
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* FINAL LEGAL FOOTER */}
      <div className="max-w-[1600px] mx-auto border-t border-[#e8dcc8]/20 pt-6 mt-6 text-center select-none">
        <p className="font-sans text-[11px] sm:text-[12px] text-[#6d5443]/75 tracking-normal font-normal leading-relaxed">
          © 2025 Presentes Personalizados by Julia Aleixo. Todos os direitos reservados. CNPJ 63.348.579/0001-06
        </p>
      </div>
    </footer>
  );
};
