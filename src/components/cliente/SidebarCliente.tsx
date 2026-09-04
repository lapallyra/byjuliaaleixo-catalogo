
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  User, 
  ShoppingBag, 
  BookOpen, 
  Gift, 
  Heart, 
  MapPin, 
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';

const menuItems = [
  { name: 'Perfil', icon: User, path: '/minha-experiencia', badgeKey: null },
  { name: 'Meus Pedidos', icon: ShoppingBag, path: '/minha-experiencia/pedidos', badgeKey: 'orders' },
  { name: 'Minhas Memórias', icon: BookOpen, path: '/minha-experiencia/memorias', badgeKey: 'memories' },
  { name: 'Presentes & Kits', icon: Gift, path: '/minha-experiencia/presentes', badgeKey: 'gifts' },
  { name: 'Favoritos', icon: Heart, path: '/minha-experiencia/favoritos', badgeKey: null },
  { name: 'Meus Endereços', icon: MapPin, path: '/minha-experiencia/enderecos', badgeKey: null },
  { name: 'Minha Conta', icon: Settings, path: '/minha-experiencia/minha-conta', badgeKey: null },
];

export const SidebarCliente: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { orders } = useOrders();

  const getBadgeValue = (key: string | null) => {
    if (key === 'orders') return orders.length || 3;
    if (key === 'memories') return 1;
    if (key === 'gifts') return 2;
    return null;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs lg:hidden z-40 transition-opacity" 
          onClick={onClose} 
        />
      )}
      
      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 xl:w-72 bg-[#2A2421] text-stone-100 transition-transform duration-300 lg:static lg:translate-x-0 lg:transform-none flex flex-col justify-between shrink-0 shadow-xl lg:shadow-none lg:rounded-3xl overflow-y-auto border-r lg:border border-[#3D3531] lg:my-1 lg:ml-1 my-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header */}
        <div>
          <div className="p-5 pb-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-stone-100 uppercase">
                ATELIÊ
              </span>
            </div>
            <button 
              className="lg:hidden p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 transition-all cursor-pointer" 
              onClick={onClose}
              aria-label="Fechar menu"
            >
              <X size={18}/>
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="mt-5 px-3 pb-5 space-y-1.5">
            {menuItems.map((item) => {
              const badge = getBadgeValue(item.badgeKey);
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/minha-experiencia'}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium transition-all duration-200 cursor-pointer group
                    ${isActive 
                      ? 'bg-[#FBF9F5] text-[#2A2421] font-bold shadow-sm transform translate-x-1' 
                      : 'text-stone-300 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'text-[#8C6D37]' : 'text-stone-400 group-hover:text-stone-200'} />
                        <span className="text-xs tracking-wide">{item.name}</span>
                      </div>
                      
                      {badge !== null && (
                        <span className={`
                          text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors
                          ${isActive 
                            ? 'bg-[#8C6D37]/15 text-[#8C6D37]' 
                            : 'bg-white/15 text-stone-300'
                          }
                        `}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

