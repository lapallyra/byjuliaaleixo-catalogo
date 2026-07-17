const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');

const regex = /<div className="space-y-6">[\s\S]*?\}[\s]*<\/div>[\s]*<\/div>[\s]*\)}/m;

const replacement = `<div className="space-y-6">
                      <NotesSection 
                        notes={activeCustomer.internalNotes || []}
                        onChange={(internalNotes) => handleSaveNotes(internalNotes, activeCustomer.commercialNotes)}
                        type="internal"
                      />
                      
                      <NotesSection 
                        notes={activeCustomer.commercialNotes || []}
                        onChange={(commercialNotes) => handleSaveNotes(activeCustomer.internalNotes, commercialNotes)}
                        type="commercial"
                      />

                      {activeCustomer.notes && (
                        <div className="pt-4 border-t border-[#E5E5EA]">
                          <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#8E8E93] mb-2">Anotação Legada</h5>
                          <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E5EA] text-xs text-[#8E8E93]">
                            {activeCustomer.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}`;

fs.writeFileSync('src/components/Admin/ClientsTab.tsx', content.replace(regex, replacement));
