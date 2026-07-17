const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');

const regex = /\{metrics\?\.isRecurrent && \([\s\S]*?<\/span>\n[\s]*\)\}/m;

const match = content.match(regex);
if (match) {
  const replacement = match[0] + `
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.tags?.filter(t => t.active).map(t => (
                          <span key={t.id} style={{ backgroundColor: t.color }} className="text-[8px] font-black text-white px-1.5 py-[1px] rounded uppercase tracking-widest">
                            {t.name}
                          </span>
                        ))}
                      </div>`;
  fs.writeFileSync('src/components/Admin/ClientsTab.tsx', content.replace(regex, replacement));
}
