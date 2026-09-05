const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/Sidebar.tsx', 'utf8');

const regex = /<div className="flex items-center gap-2 mb-4 px-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

// Looking closely at lines 51-62:
// 51:         <div className="flex items-center gap-2 mb-4 px-2">
// 52:             <div className="w-9 h-9 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-200/50 shadow-sm">
// 53:                 <Crown className="text-pink-500" size={18} strokeWidth={1.5} />
// 54:             </div>
// 55:             {!isCollapsed && (
// 56:               <div className="flex flex-col">
// 57:                 <span className="font-bold text-[11px] leading-tight text-gray-800">Presentes Personalizados</span>
// 58:                 <span className="text-[9px] text-pink-500 font-bold tracking-wide mt-0.5">by Julia Aleixo</span>
// 59:               </div>
// 60:             )}
// 61:         </div>

code = code.replace(/<div className="flex items-center gap-2 mb-4 px-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '');

// Actually, let's just use string replacement
const searchStr = `        <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-9 h-9 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-200/50 shadow-sm">
                <Crown className="text-pink-500" size={18} strokeWidth={1.5} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[11px] leading-tight text-gray-800">Presentes Personalizados</span>
                <span className="text-[9px] text-pink-500 font-bold tracking-wide mt-0.5">by Julia Aleixo</span>
              </div>
            )}
        </div>`;

if(code.includes(searchStr)) {
  code = code.replace(searchStr, '');
  code = code.replace('flex flex-col gap-2', 'flex flex-col gap-1');
  
  // also change the mb-2 to mb-1 in the groups
  code = code.replace(/<div key=\{groupName\} className="mb-2">/g, '<div key={groupName} className="mb-1">');
  code = code.replace(/className="w-full flex items-center justify-between text-\[10px\] font-bold text-gray-500 hover:text-pink-600 uppercase tracking-widest mb-2 px-4 py-2 transition-all rounded-xl hover:bg-white\/40 text-left"/g, 
                      'className="w-full flex items-center justify-between text-[10px] font-bold text-gray-500 hover:text-pink-600 uppercase tracking-widest mb-1 px-4 py-1.5 transition-all rounded-xl hover:bg-white/40 text-left"');
  
  fs.writeFileSync('src/components/Admin/Sidebar.tsx', code);
  console.log('Fixed Sidebar!');
} else {
  console.log('Could not find search string');
}

