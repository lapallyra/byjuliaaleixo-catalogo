
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  Gift, 
  Heart, 
  MapPin, 
  User,
  Menu,
  X
} from 'lucide-react';

const menuItems = [
  { name: 'Minha Experiência', icon: LayoutDashboard, path: '/minha-experiencia' },
  { name: 'Meus Pedidos', icon: ShoppingBag, path: '/minha-experiencia/pedidos' },
  { name: 'Minhas Memórias', icon: BookOpen, path: '/minha-experiencia/memorias' },
  { name: 'Meus Presentes Criados', icon: Gift, path: '/minha-experiencia/presentes' },
  { name: 'Favoritos', icon: Heart, path: '/minha-experiencia/favoritos' },
  { name: 'Meus Endereços', icon: MapPin, path: '/minha-experiencia/enderecos' },
  { name: 'Minha Conta', icon: User, path: '/minha-experiencia/minha-conta' },
];

export const SidebarCliente: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 lg:hidden z-40" onClick={onClose} />
      )}
      
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transition-transform duration-300 lg:static lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between lg:justify-start">
            <span className="font-parisienne text-2xl text-[#3A312D]">Ateliê</span>
            <button className="lg:hidden" onClick={onClose}><X size={20}/></button>
        </div>
        
        <nav className="mt-6 px-4 space-y-1">
          {menuItems.map((item) => (
              <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/minha-experiencia'}
              className={({ isActive }) => `
                btn-neumorph flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-3xl text-sm font-medium transition-all
                ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
              `}
            >
              <item.icon size={20} />
              <span className="hidden lg:inline">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};
