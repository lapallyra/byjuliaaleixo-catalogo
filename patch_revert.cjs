const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');

const regex = /<div className="flex-1 overflow-y-auto p-6 bg-\[\#FAF9F6\]\/30\">[\s\S]*?\{drawerTab === "intelligence" && \(/;

const replacement = `<div className="flex-1 overflow-y-auto p-6 bg-[#FAF9F6]/30">
                {drawerTab === "details" && (
                  <div className="space-y-6">
                    {/* Dados Principais */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-3xs">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-[#1C1C1E] font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                          <User size={14} className="text-[#cca062]" /> Dados Principais
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Nome</span>
                          <span className="text-sm font-semibold text-[#1C1C1E]">{activeCustomer.name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Contato</span>
                          <span className="text-sm font-semibold text-[#1C1C1E]">{activeCustomer.contact || "-"}</span>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Email</span>
                          <span className="text-sm font-semibold text-[#1C1C1E] break-all">{activeCustomer.email || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">CPF/CNPJ</span>
                          <span className="text-sm font-semibold text-[#1C1C1E]">{activeCustomer.cpfCnpj || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Aniversário</span>
                          <span className="text-sm font-semibold text-[#1C1C1E]">{activeCustomer.birthDate || "-"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-3xs">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-[#1C1C1E] font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                          <MapPin size={14} className="text-[#cca062]" /> Endereço
                        </h4>
                        <button 
                          className="text-[#cca062] hover:text-[#b08750] transition-colors"
                          onClick={() => {
                            if (activeCustomer.address) {
                              const search = \`\${activeCustomer.address}, \${activeCustomer.addressNumber || ""} - \${activeCustomer.city || ""}\`;
                              window.open(\`https://maps.google.com/?q=\${encodeURIComponent(search)}\`, '_blank');
                            }
                          }}
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div className="col-span-2">
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Endereço Completo</span>
                          <span className="text-sm font-semibold text-[#1C1C1E]">
                            {activeCustomer.address ? \`\${activeCustomer.address}, \${activeCustomer.addressNumber || "S/N"}\` : "-"}
                            {activeCustomer.addressComplement && \` (\${activeCustomer.addressComplement})\`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Bairro</span>
                          <span className="text-sm font-semibold text-[#1C1C1E]">{activeCustomer.neighborhood || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">Cidade/UF</span>
                          <span className="text-sm font-semibold text-[#1C1C1E]">{activeCustomer.city ? \`\${activeCustomer.city}/\${activeCustomer.state || ""}\` : "-"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-1">CEP</span>
                          <span className="text-sm font-semibold text-[#1C1C1E]">{activeCustomer.cep || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === "intelligence" && (`;

fs.writeFileSync('src/components/Admin/ClientsTab.tsx', content.replace(regex, replacement));
