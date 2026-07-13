import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, LogOut, LayoutDashboard, ShoppingBag, Box, User, Gift, Zap, Archive, Activity, Package, DollarSign, FileCheck, PackagePlus, TrendingUp, BarChart3, Megaphone, Layers, Star, Tag, Settings, Bell, Sparkles, Crown } from 'lucide-react';

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
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuGroups.forEach((groupName, idx) => {
      const items = groupedMenu[groupName] || [];
      const hasActive = items.some(item => item.id === activeTab);
      initial[groupName] = hasActive || idx === 0;
    });
    return initial;
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <aside
      className={`bg-white/45 backdrop-blur-xl border-r border-white/50 flex flex-col hidden lg:flex flex-shrink-0 relative z-[60] transition-all duration-300 ${isCollapsed ? "w-20 items-center" : "w-64"} shadow-[0_10px_30px_rgba(142,142,147,0.02)]`}
    >
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-10 bg-white border border-white/80 w-6 h-6 flex items-center justify-center rounded-full z-50 text-gray-400 hover:text-pink-600 shadow-md transition-all hover:bg-gray-50"
      >
        <ChevronRight
          size={12}
          className={`transition-transform duration-300 ${!isCollapsed ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`flex flex-col flex-1 overflow-hidden p-5 ${isCollapsed ? "px-3" : ""}`}>
        <div className="flex items-center gap-2 mb-8 px-2">
            <div className="w-9 h-9 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-200/50 shadow-sm">
                <Crown className="text-pink-500" size={18} strokeWidth={1.5} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[11px] leading-tight text-gray-800">Presentes Personalizados</span>
                <span className="text-[9px] text-pink-500 font-bold tracking-wide mt-0.5">by Julia Aleixo</span>
              </div>
            )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-0 py-2 flex flex-col gap-3">
            {menuGroups.map((groupName) => {
                const items = groupedMenu[groupName] || [];
                const isExpanded = expandedGroups[groupName] ?? false;

                if (groupName === "Dashboard") {
                    return items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative ${isActive ? "active-tab-btn bg-gradient-to-b from-pink-400 to-pink-500 text-white shadow-[0_4px_12px_rgba(255,20,147,0.15)] font-semibold" : "inactive-tab-btn text-gray-600 hover:bg-white/60 hover:text-pink-500"}`}
                            >
                                <Icon size={16} strokeWidth={1.5} />
                                {!isCollapsed && <span className="text-xs font-semibold">{item.label}</span>}
                            </button>
                        );
                    });
                }

                return (
                    <div key={groupName} className="mb-2">
                        {!isCollapsed ? (
                            <button
                                onClick={() => toggleGroup(groupName)}
                                className="w-full flex items-center justify-between text-[10px] font-bold text-gray-500 hover:text-pink-600 uppercase tracking-widest mb-2 px-4 py-2 transition-all rounded-xl hover:bg-white/40 text-left"
                            >
                                <span>{groupName}</span>
                            </button>
                        ) : null}
                        
                        <motion.div
                            initial={false}
                            animate={{ 
                              height: isCollapsed || isExpanded ? 'auto' : 0, 
                              opacity: isCollapsed || isExpanded ? 1 : 0 
                            }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden flex flex-col gap-1"
                        >
                            {items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative ${isActive ? "active-tab-btn bg-gradient-to-b from-pink-400 to-pink-500 text-white shadow-[0_4px_12px_rgba(255,20,147,0.15)] font-semibold" : "inactive-tab-btn text-gray-600 hover:bg-white/60 hover:text-pink-500"}`}
                                    >
                                        <Icon size={16} strokeWidth={1.5} />
                                        {!isCollapsed && <span className="text-xs font-semibold">{item.label}</span>}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </div>
                );
            })}
        </div>
        
        <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all text-xs font-bold mt-4"
        >
            <LogOut size={16} strokeWidth={1.5} /> {!isCollapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
};
