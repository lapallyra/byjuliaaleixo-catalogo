const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');

const regex = /const handleSaveNotes = async \(\) => {[\s\S]*?setSavingNotes\(false\);\n    }\n  };/;

const replacement = `const handleSaveNotes = async (internalNotes?: CustomerNote[], commercialNotes?: CustomerNote[]) => {
    if (!activeCustomer) return;
    setSavingNotes(true);
    try {
      const updates: any = {};
      
      if (internalNotes !== undefined) updates.internalNotes = internalNotes;
      if (commercialNotes !== undefined) updates.commercialNotes = commercialNotes;
      
      if (noteText !== activeCustomer.notes) {
        updates.notes = noteText;
      }

      await updateCustomer(activeCustomer.id, updates);
      
      setSelectedCustomer({
        ...activeCustomer,
        ...updates
      });

      orchestrator.dispatchEvent({
        type: 'FEEDBACK',
        message: 'Notas atualizadas com sucesso!',
        priority: 'HIGH',
        customerName: '',
        productName: '',
        companyId,
        data: { success: true, title: 'Sucesso' }
      });
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
        type: 'FEEDBACK',
        message: 'Erro ao salvar observações.',
        priority: 'HIGH',
        customerName: '',
        productName: '',
        companyId,
        data: { success: false, title: 'Erro' }
      });
    } finally {
      setSavingNotes(false);
    }
  };`;

fs.writeFileSync('src/components/Admin/ClientsTab.tsx', content.replace(regex, replacement));
