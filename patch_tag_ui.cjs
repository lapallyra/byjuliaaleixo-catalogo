const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');

const regex = /<div className="flex flex-wrap gap-2 mb-4">[\s\S]*?<\/div>/;

const match = content.match(regex);
if (match) {
  // We want to add a tag filter UI in the filter section
  const replacement = match[0] + `
        {/* Tags Filter */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Filtrar por Tag:</span>
          <button
            onClick={() => setSelectedTagFilter(null)}
            className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border \${
              selectedTagFilter === null
                ? "border-[#cca062] bg-[#cca062] text-white shadow-sm"
                : "border-[#E5E5EA] bg-white text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E]"
            }\`}
          >
            Todas
          </button>
          {Array.from(new Set(customers.flatMap(c => c.tags?.filter(t => t.active).map(t => t.name) || []))).map(tagName => (
            <button
              key={tagName}
              onClick={() => setSelectedTagFilter(tagName)}
              className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border \${
                selectedTagFilter === tagName
                  ? "border-[#cca062] bg-[#cca062] text-white shadow-sm"
                  : "border-[#E5E5EA] bg-white text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E]"
              }\`}
            >
              {tagName}
            </button>
          ))}
        </div>`;
  fs.writeFileSync('src/components/Admin/ClientsTab.tsx', content.replace(regex, replacement));
}
