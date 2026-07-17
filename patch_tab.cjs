const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');
const lines = content.split('\n');
const insertIndex = lines.findIndex(l => l.includes('{drawerTab === "orders" && ('));

const intelTab = `
                {drawerTab === "intelligence" && (
                  <div className="p-6 space-y-6">
                    {/* Resumo Comercial */}
                    <div className="bg-gradient-to-r from-[#cca062]/10 to-transparent p-5 rounded-2xl border border-[#cca062]/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#cca062]/20 text-[#cca062] rounded-lg">
                          <Activity size={18} />
                        </div>
                        <h4 className="text-[#1C1C1E] font-bold uppercase tracking-wider text-xs">Resumo Comercial</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-[#E5E5EA] shadow-sm">
                          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Segmento</span>
                          <span className="text-sm font-bold text-[#1C1C1E] uppercase">{activeCustomerMetrics?.segment || "N/A"}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-[#E5E5EA] shadow-sm">
                          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Valor Acumulado (LTV)</span>
                          <span className="text-sm font-bold text-[#cca062] uppercase">R$ {(activeCustomerMetrics?.ltv || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-[#E5E5EA] shadow-sm">
                          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Ticket Médio</span>
                          <span className="text-sm font-bold text-[#1C1C1E] uppercase">R$ {(activeCustomerMetrics?.avgTicket || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-[#E5E5EA] shadow-sm">
                          <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Frequência</span>
                          <span className="text-sm font-bold text-[#1C1C1E] uppercase">{activeCustomerMetrics?.frequency ? \`A cada \${activeCustomerMetrics.frequency} dias\` : "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Comportamento */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-sm">
                      <h4 className="text-[#1C1C1E] font-bold uppercase tracking-wider text-xs mb-4">Comportamento de Compra</h4>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-2">Top 3 Produtos Favoritos</span>
                          {customerProducts.slice(0, 3).length > 0 ? (
                            <div className="space-y-2">
                              {customerProducts.slice(0, 3).map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-xs p-2 bg-[#F5F5F7] rounded-lg">
                                  <span className="font-bold text-[#1C1C1E] truncate">{p.name}</span>
                                  <span className="text-[#8E8E93] font-bold ml-2 shrink-0">{p.qty} un.</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-[#8E8E93]">Sem dados suficientes</span>
                          )}
                        </div>
                        
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-2">Relacionamento</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-3 bg-[#F5F5F7] rounded-lg">
                              <span className="block text-[#8E8E93] mb-1">Primeira Compra:</span>
                              <span className="font-bold text-[#1C1C1E]">
                                {customerOrders.length > 0 ? new Date(Math.min(...customerOrders.map(o => new Date(o.createdAt).getTime()))).toLocaleDateString("pt-BR") : "N/A"}
                              </span>
                            </div>
                            <div className="p-3 bg-[#F5F5F7] rounded-lg">
                              <span className="block text-[#8E8E93] mb-1">Última Compra:</span>
                              <span className="font-bold text-[#1C1C1E]">
                                {activeCustomerMetrics?.lastPurchaseDate ? activeCustomerMetrics.lastPurchaseDate.toLocaleDateString("pt-BR") : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
`;

lines.splice(insertIndex, 0, intelTab);
fs.writeFileSync('src/components/Admin/ClientsTab.tsx', lines.join('\n'));
