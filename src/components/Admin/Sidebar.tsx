import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, LogOut, LayoutDashboard, ShoppingBag, Box, User, Gift, Zap, Archive, Activity, Package, DollarSign, FileCheck, PackagePlus, TrendingUp, BarChart3, Megaphone, Layers, Star, Tag, Settings, Bell, Sparkles, Crown } from 'lucide-react';

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
  const effectiveActiveTab = React.useMemo(() => {
    if (activeTab === "novo-pedido") return "orders";
    if (activeTab === "novo-cliente") return "clients";
    if (activeTab === "novo-insumo") return "componentes";
    if (activeTab === "nova-compra") return "purchases";
    return activeTab;
  }, [activeTab]);

  const [expandedGroup, setExpandedGroup] = React.useState<string | null>(() => {
    const groupWithActive = menuGroups.find(groupName => {
      const items = groupedMenu[groupName] || [];
      return items.some(item => item.id === effectiveActiveTab);
    });
    return groupWithActive || menuGroups[0] || null;
  });

  React.useEffect(() => {
    const groupWithActive = menuGroups.find(groupName => {
      const items = groupedMenu[groupName] || [];
      return items.some(item => item.id === effectiveActiveTab);
    });
    if (groupWithActive) {
      setExpandedGroup(groupWithActive);
    }
  }, [effectiveActiveTab, menuGroups, groupedMenu]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroup(prev => (prev === groupName ? null : groupName));
  };

  return (
    <aside
      className={`bg-white/70 backdrop-blur-2xl border-r border-slate-200/50 flex flex-col hidden lg:flex flex-shrink-0 relative z-[60] transition-all duration-300 ${isCollapsed ? "w-20 items-center" : "w-64"} shadow-[0_10px_30px_rgba(142,142,147,0.03)]`}
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

      <div className={`flex flex-col flex-1 overflow-hidden p-4 ${isCollapsed ? "px-2" : ""}`}>


        <div className="flex-1 overflow-y-auto scrollbar-hide px-0 py-1 flex flex-col gap-1">
            {menuGroups.map((groupName) => {
                const items = groupedMenu[groupName] || [];
                const isExpanded = expandedGroup === groupName;

                if (groupName === "Dashboard") {
                    return items.map((item) => {
                        const Icon = item.icon;
                        const isActive = effectiveActiveTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative ${isActive ? "active-tab-btn bg-gradient-to-b from-pink-400 to-pink-500 text-white shadow-[0_4px_12px_rgba(255,20,147,0.15)] font-semibold" : "inactive-tab-btn text-gray-600 hover:bg-white/60 hover:text-pink-500"}`}
                            >
                                <Icon size={16} strokeWidth={1.5} className={isActive ? "text-white" : "text-pink-400"} />
                                {!isCollapsed && <span className="text-xs font-semibold">{item.label}</span>}
                            </button>
                        );
                    });
                }

                return (
                    <div key={groupName} className="mb-1">
                        {!isCollapsed ? (
                            <button
                                onClick={() => toggleGroup(groupName)}
                                className="w-full flex items-center justify-between text-[10px] font-bold text-gray-500 hover:text-pink-600 uppercase tracking-widest mb-1 px-4 py-1.5 transition-all rounded-xl hover:bg-white/40 text-left"
                            >
                                <span>{groupName}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        ) : null}
                        
                        <AnimatePresence initial={false}>
                          {(isCollapsed || isExpanded) && (
                            <motion.div key={`accordion-${groupName}`} initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="overflow-hidden flex flex-col gap-1"
                            >
                                
                            {items.map((item) => {
                                const Icon = item.icon;
                                const isActive = effectiveActiveTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative ${isActive ? "active-tab-btn bg-gradient-to-b from-pink-400 to-pink-500 text-white shadow-[0_4px_12px_rgba(255,20,147,0.15)] font-semibold" : "inactive-tab-btn text-gray-600 hover:bg-white/60 hover:text-pink-500"}`}
                                    >
                                        <Icon size={16} strokeWidth={1.5} className={isActive ? "text-white" : "text-pink-400"} />
                                        {!isCollapsed && <span className="text-xs font-semibold">{item.label}</span>}
                                    </button>
                                );
                            })}
                        
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
        
        <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all text-xs font-bold mt-2"
        >
            <LogOut size={16} strokeWidth={1.5} /> {!isCollapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
};
