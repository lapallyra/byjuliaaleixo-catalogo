import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, LogOut, LayoutDashboard, ShoppingBag, Box, User, Gift, Zap, Archive, Activity, Package, DollarSign, FileCheck, PackagePlus, TrendingUp, BarChart3, Megaphone, Layers, Star, Tag, Settings, Bell, Sparkles } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  menuGroups: string[];
  groupedMenu: Record<string, { id: string; label: string; icon: any }[]>;
  logout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse, activeTab, setActiveTab, menuGroups, groupedMenu, logout }) => {
  return (
    <aside
      className={`bg-[#F9F9F9] border-r border-[#E5E5EA] flex flex-col hidden lg:flex flex-shrink-0 relative z-[60] transition-all duration-300 ${isCollapsed ? "w-20 items-center" : "w-64"} shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}
    >
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-10 bg-white border border-[#E5E5EA] w-6 h-6 flex items-center justify-center rounded-full z-50 text-[#8E8E93] hover:text-[#1C1C1E] shadow-sm transition-all hover:bg-slate-50"
      >
        <ChevronRight
          size={12}
          className={`transition-transform duration-300 ${!isCollapsed ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`flex flex-col flex-1 overflow-hidden p-6 ${isCollapsed ? "px-4" : ""}`}>
        <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs"></span>
            </div>
            {!isCollapsed && <span className="font-bold text-sm tracking-tight text-[#1C1C1E]">WEBSITE LOGO</span>}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-0 py-2">
            {menuGroups.map((groupName) => {
                const items = groupedMenu[groupName] || [];
                return (
                    <div key={groupName} className="mb-6">
                        {!isCollapsed && <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-3 px-4">{groupName}</p>}
                        {items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative ${isActive ? "bg-orange-500 text-white shadow-3d-soft" : "text-[#8E8E93] hover:bg-[#F0F0F0] hover:text-[#1C1C1E]"}`}
                                >
                                    <Icon size={18} />
                                    {!isCollapsed && <span className="text-xs font-semibold">{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                );
            })}
        </div>
        
        <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-[#8E8E93] hover:bg-[#F0F0F0] hover:text-[#1C1C1E] transition-all text-xs font-bold"
        >
            <LogOut size={16} /> {!isCollapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
};
