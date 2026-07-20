import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Database, 
  LogIn, 
  CreditCard, 
  Truck, 
  MessageSquare, 
  FileCheck,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface IntegrationCardProps {
  name: string;
  description: string;
  status: 'connected' | 'not_configured' | 'maintenance';
  icon: React.ReactNode;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ name, description, status, icon }) => {
  const statusStyles = {
    connected: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      led: 'bg-emerald-500 shadow-[0_0_8px_#10B981]',
      label: 'Conectado'
    },
    not_configured: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      led: 'bg-amber-500 shadow-[0_0_8px_#F59E0B]',
      label: 'Não Configurado'
    },
    maintenance: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      led: 'bg-rose-500 shadow-[0_0_8px_#F43F5E]',
      label: 'Manutenção'
    }
  };

  const style = statusStyles[status];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] group relative overflow-hidden"
    >
      {/* LED Status Indicator */}
      <div className="absolute top-6 right-8 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${style.led} animate-pulse`} />
        <span className={`text-[9px] font-black uppercase tracking-wider ${style.text}`}>
          {style.label}
        </span>
      </div>

      <div className="flex flex-col h-full">
        <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] mb-6 shadow-inner">
          {icon}
        </div>

        <h3 className="text-lg font-bold text-[#1C1C1E] tracking-tight mb-2">
          {name}
        </h3>
        
        <p className="text-[11px] font-medium text-[#8E8E93] leading-relaxed mb-8 flex-grow">
          {description}
        </p>

        <button 
          onClick={() => alert(`Abrindo configurações de ${name}...`)}
          className="w-full py-4 bg-white border border-[#E5E5EA] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1C1C1E] transition-all hover:bg-[#F5F5F7] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:scale-95 flex items-center justify-center gap-2">
          Abrir Configurações <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export const IntegrationsTab: React.FC = () => {
  const integrations: IntegrationCardProps[] = [
    {
      name: 'Firebase',
      description: 'Banco de dados em tempo real, Autenticação e Storage oficial da plataforma Vitrine.',
      status: 'connected',
      icon: <Database size={24} strokeWidth={1.5} />
    },
    {
      name: 'Google Login',
      description: 'Permita que seus clientes acessem a vitrine utilizando a conta oficial do Google.',
      status: 'connected',
      icon: <LogIn size={24} strokeWidth={1.5} />
    },
    {
      name: 'Mercado Pago',
      description: 'Integração oficial para recebimentos via Cartão de Crédito, PIX e Boleto Bancário.',
      status: 'not_configured',
      icon: <CreditCard size={24} strokeWidth={1.5} />
    },
    {
      name: 'InfinitePay',
      description: 'Taxas competitivas para recebimento de vendas online e link de pagamento.',
      status: 'not_configured',
      icon: <Zap size={24} strokeWidth={1.5} />
    },
    {
      name: 'Melhor Envio',
      description: 'Gestão completa de fretes com Correios, Jadlog e diversas transportadoras.',
      status: 'not_configured',
      icon: <Truck size={24} strokeWidth={1.5} />
    },
    {
      name: 'WhatsApp Business',
      description: 'Notificações automáticas de pedido e atendimento direto via API oficial.',
      status: 'maintenance',
      icon: <MessageSquare size={24} strokeWidth={1.5} />
    },
    {
      name: 'NFS-e (Bling/Tiny)',
      description: 'Emissão automática de notas fiscais de serviço para cada pedido finalizado.',
      status: 'not_configured',
      icon: <FileCheck size={24} strokeWidth={1.5} />
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-medium text-[#1C1C1E] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E]">
              <Zap size={20} strokeWidth={1.5} />
            </div>
            Central de Integrações
          </h2>
          <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2 ml-13">
            Conecte sua vitrine com os melhores serviços do mercado
          </p>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-[#E5E5EA] rounded-2xl shadow-sm">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E]">
            Conexão Segura Ativa
          </span>
        </div>
      </div>

      {/* Info Alert */}
      <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 shrink-0">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900 mb-1">Dica de Configuração</h4>
          <p className="text-[11px] font-medium text-indigo-700 leading-relaxed max-w-3xl">
            Para ativar novas integrações, você precisará das chaves de API fornecidas por cada serviço. 
            Recomendamos realizar os testes em ambiente de Sandbox antes de ativar a produção.
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {integrations.map((item, idx) => (
          <IntegrationCard key={idx} {...item} />
        ))}
        
        {/* Future Placeholder Card */}
        <div className="border-2 border-dashed border-[#E5E5EA] rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group hover:border-[#1C1C1E]/20 transition-all">
          <div className="w-14 h-14 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#AEAEB2] mb-4">
            <ExternalLink size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93]">Novas Integrações</p>
          <p className="text-[9px] font-medium text-[#AEAEB2] mt-2 italic">Em breve no painel</p>
        </div>
      </div>
    </div>
  );
};
