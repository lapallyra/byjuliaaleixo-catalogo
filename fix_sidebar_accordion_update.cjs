const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/Sidebar.tsx', 'utf8');

// Add ChevronDown to imports if not there
if (!code.includes('ChevronDown')) {
  code = code.replace('ChevronRight,', 'ChevronRight, ChevronDown,');
}

// Add useEffect to auto-expand active tab's group
const useEffectCode = `
  React.useEffect(() => {
    setExpandedGroups(prev => {
      const next = { ...prev };
      let changed = false;
      menuGroups.forEach((groupName) => {
        const items = groupedMenu[groupName] || [];
        const hasActive = items.some(item => item.id === activeTab);
        if (hasActive && !prev[groupName]) {
          next[groupName] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [activeTab, menuGroups, groupedMenu]);
`;

if (!code.includes('React.useEffect(() => {') || !code.includes('activeTab, menuGroups, groupedMenu')) {
  code = code.replace('const toggleGroup = (groupName: string) => {', useEffectCode + '\n  const toggleGroup = (groupName: string) => {');
}

// Add chevron to accordion button
const btnRegex = /<button\s*onClick=\{\(\) => toggleGroup\(groupName\)\}\s*className="w-full flex items-center justify-between text-\[10px\] font-bold text-gray-500 hover:text-pink-600 uppercase tracking-widest mb-1 px-4 py-1\.5 transition-all rounded-xl hover:bg-white\/40 text-left"\s*>\s*<span>\{groupName\}<\/span>\s*<\/button>/g;

const replacementBtn = `<button
                                onClick={() => toggleGroup(groupName)}
                                className="w-full flex items-center justify-between text-[10px] font-bold text-gray-500 hover:text-pink-600 uppercase tracking-widest mb-1 px-4 py-1.5 transition-all rounded-xl hover:bg-white/40 text-left"
                            >
                                <span>{groupName}</span>
                                <ChevronDown size={14} className={\`transition-transform duration-200 \${isExpanded ? 'rotate-180' : ''}\`} />
                            </button>`;

code = code.replace(btnRegex, replacementBtn);

fs.writeFileSync('src/components/Admin/Sidebar.tsx', code);
console.log('Fixed Sidebar Accordion!');
