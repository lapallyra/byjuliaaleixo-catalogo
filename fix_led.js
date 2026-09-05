const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/DashboardTab.tsx', 'utf8');

const regex = /<div className=\{`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-20 \$\{[\s\S]*?\)\} \/>/g;
const replacement = `<div className={\`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-20 \${
                      ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? 'bg-[#FFD100]' :
                      ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? 'bg-[#BD02FC]' :
                      ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? 'bg-[#0080FF]' :
                      ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? 'bg-[#FFFFFF]' :
                      ['novo pedido'].includes(order.status?.toLowerCase()) ? 'bg-[#37FD12]' :
                      'bg-[#7FFF00]'
                    }\`} style={{ 
                      boxShadow: \`0 0 12px 1px \${
                        ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? '#FFD10080' :
                        ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? '#BD02FC80' :
                        ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? '#0080FF80' :
                        ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? '#FFFFFF80' :
                        ['novo pedido'].includes(order.status?.toLowerCase()) ? '#37FD1280' :
                        '#7FFF0080'
                      }\`
                    }} />`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/Admin/DashboardTab.tsx', code);
