const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/DashboardTab.tsx', 'utf8');

const regex = /<div className=\{`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-20 \$\{[\s\S]*?\} \/>/g;
const replacement = `<div className={\`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-20 \${
                      ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? 'bg-[#FFD100]' :
                      ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? 'bg-[#BD02FC]' :
                      ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? 'bg-[#0080FF]' :
                      ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? 'bg-[#FFFFFF]' :
                      ['novo pedido'].includes(order.status?.toLowerCase()) ? 'bg-[#37FD12]' :
                      'bg-[#7FFF00]'
                    }\`} style={{ 
                      boxShadow: \`0 0 12px 1px \${
                        ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? '#FFD10060' :
                        ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? '#BD02FC60' :
                        ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? '#0080FF60' :
                        ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? '#FFFFFF60' :
                        ['novo pedido'].includes(order.status?.toLowerCase()) ? '#37FD1260' :
                        '#7FFF0060'
                      }\`
                    }} />`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/Admin/DashboardTab.tsx', code);
