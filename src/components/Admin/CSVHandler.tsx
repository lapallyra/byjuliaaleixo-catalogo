import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { 
  FileUp, 
  FileDown, 
  Download, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  RefreshCw, 
  AlertOctagon, 
  PlusCircle, 
  Copy, 
  TrendingUp, 
  Database,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { addCustomer, updateCustomer, recalculateCustomerIndicators } from '../../services/firebaseService';
import { createAuditLog } from '../../services/auditService';
import { CompanyId, AuditActionType } from '../../types';

interface CSVHandlerProps {
  moduleName: string;
  data: any[];
  fields: string[];
  onImport: (newData: any[]) => void;
  companyId?: CompanyId;
}

export const CSVHandler: React.FC<CSVHandlerProps> = ({ moduleName, data, fields, onImport, companyId }) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Pre-validation and Preview state
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationReport, setValidationReport] = useState<{
    total: number;
    validCount: number;
    duplicateCount: number;
    errorCount: number;
    errors: { line: number; name: string; message: string }[];
    duplicates: { row: any; existing: any }[];
    validRows: any[];
  } | null>(null);

  // Duplicate configuration policy
  const [duplicatePolicy, setDuplicatePolicy] = useState<'update' | 'ignore' | 'create'>('update');

  // Importing active state
  const [isImporting, setIsImporting] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentProcessingName, setCurrentProcessingName] = useState('');

  // Final Report state
  const [finalReport, setFinalReport] = useState<{
    imported: number;
    updated: number;
    ignored: number;
    errors: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download template CSV file
  const downloadTemplate = () => {
    const csv = Papa.unparse([fields]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Modelo_${moduleName}.csv`;
    link.click();
  };

  // Export current data list to CSV
  const exportCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${moduleName}_Export.csv`;
    link.click();
  };

  // Validation rules
  const validateRow = (row: any, lineNum: number) => {
    const errors: string[] = [];

    // 1. Mandatory Name
    const name = (row.name || '').trim();
    if (!name) {
      errors.push('Nome é obrigatório');
    }

    // 2. Mandatory Phone/Contact
    const contact = (row.contact || '').trim();
    if (!contact) {
      errors.push('Telefone/Contato está vazio');
    }

    // 3. Email verification
    const email = (row.email || '').trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('E-mail mal formatado');
      }
    }

    // 4. CPF/CNPJ validation
    const cpfCnpj = (row.cpfCnpj || '').trim();
    if (cpfCnpj) {
      const digits = cpfCnpj.replace(/\D/g, '');
      if (digits.length !== 11 && digits.length !== 14) {
        errors.push('CPF/CNPJ inválido (deve conter 11 ou 14 dígitos)');
      } else if (/^(\d)\1+$/.test(digits)) {
        errors.push('CPF/CNPJ inválido (todos os dígitos repetidos)');
      }
    }

    return errors;
  };

  // Duplicate finder helper
  const findDuplicateInList = (row: any, existingCustomers: any[]) => {
    const cleanPhone = (p?: string) => p ? p.replace(/\D/g, '') : '';
    const cleanCpfCnpj = (c?: string) => c ? c.replace(/\D/g, '') : '';

    const rowId = (row.id || row.customerId || row.code || '').toString().trim();
    const rowCpf = cleanCpfCnpj(row.cpfCnpj || row.cpf || row.cnpj);
    const rowPhone = cleanPhone(row.contact || row.telefone || row.phone || row.whatsapp);
    const rowEmail = (row.email || '').toLowerCase().trim();

    for (const cust of existingCustomers) {
      // Priority 1: customerId / code
      if (rowId && (cust.id === rowId || cust.code === rowId)) {
        return cust;
      }
      // Priority 2: CPF/CNPJ
      if (rowCpf && cleanCpfCnpj(cust.cpfCnpj) === rowCpf) {
        return cust;
      }
      // Priority 3: WhatsApp/Telefone
      if (rowPhone && cleanPhone(cust.contact) === rowPhone) {
        return cust;
      }
      // Priority 4: E-mail
      if (rowEmail && cust.email && cust.email.toLowerCase().trim() === rowEmail) {
        return cust;
      }
    }
    return null;
  };

  // Run in-memory pre-validation on all parsed lines
  const runPreValidation = async (rows: any[]) => {
    try {
      let existingCustomers: any[] = [];
      if (companyId) {
        const q = query(collection(db, 'customers'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        existingCustomers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      const errors: { line: number; name: string; message: string }[] = [];
      const duplicates: { row: any; existing: any }[] = [];
      const validRows: any[] = [];

      let errorCount = 0;
      let duplicateCount = 0;
      let validCount = 0;

      rows.forEach((row, idx) => {
        const lineNum = idx + 2; // header is row 1
        const rowErrors = validateRow(row, lineNum);
        const name = row.name || `Linha ${lineNum}`;

        if (rowErrors.length > 0) {
          errorCount++;
          errors.push({
            line: lineNum,
            name,
            message: rowErrors.join(', ')
          });
        } else {
          const existing = findDuplicateInList(row, existingCustomers);
          if (existing) {
            duplicateCount++;
            duplicates.push({ row, existing });
          } else {
            validCount++;
          }
          validRows.push(row);
        }
      });

      setValidationReport({
        total: rows.length,
        validCount,
        duplicateCount,
        errorCount,
        errors,
        duplicates,
        validRows
      });
    } catch (err) {
      console.error('Error pre-validating rows:', err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedRows(results.data);
        runPreValidation(results.data);
      }
    });
  };

  // Run the batch import sequentially
  const startImport = async () => {
    if (!validationReport || !companyId) return;

    setIsImporting(true);
    setProcessedCount(0);

    let successCreated = 0;
    let successUpdated = 0;
    let ignoredCount = 0;
    let errorCount = validationReport.errorCount; // Already counted rows with pre-validation errors

    const totalToProcess = validationReport.validRows.length;

    for (let i = 0; i < totalToProcess; i++) {
      const row = validationReport.validRows[i];
      setProcessedCount(i + 1);
      setCurrentProcessingName(row.name || 'Cliente');

      const dupInfo = validationReport.duplicates.find(d => d.row === row);

      try {
        if (dupInfo) {
          if (duplicatePolicy === 'ignore') {
            ignoredCount++;
            continue;
          } else if (duplicatePolicy === 'update') {
            const existingId = dupInfo.existing.id;
            const updatedData = {
              name: row.name || dupInfo.existing.name,
              contact: row.contact || dupInfo.existing.contact,
              email: row.email || dupInfo.existing.email || '',
              cpfCnpj: row.cpfCnpj || dupInfo.existing.cpfCnpj || '',
              birthDate: row.birthDate || dupInfo.existing.birthDate || '',
              address: row.address || dupInfo.existing.address || '',
              city: row.city || dupInfo.existing.city || '',
              state: row.state || dupInfo.existing.state || '',
              zipCode: row.zipCode || dupInfo.existing.zipCode || '',
              status: row.status || dupInfo.existing.status || 'Ativo',
              notes: row.notes || dupInfo.existing.notes || '',
              companyId
            };

            await updateCustomer(existingId, updatedData);

            // Recalculate indicators from database orders
            const custRef = doc(db, 'customers', existingId);
            await recalculateCustomerIndicators(custRef, companyId);

            successUpdated++;
          } else {
            // policy 'create'
            const newCustId = await addCustomer({
              name: row.name,
              contact: row.contact,
              email: row.email || '',
              cpfCnpj: row.cpfCnpj || '',
              birthDate: row.birthDate || '',
              address: row.address || '',
              city: row.city || '',
              state: row.state || '',
              zipCode: row.zipCode || '',
              status: row.status || 'Ativo',
              notes: row.notes || '',
              totalSpent: parseFloat(row.totalSpent) || 0,
              ordersCount: parseInt(row.ordersCount) || 0,
              companyId
            });

            if (newCustId) {
              const custRef = doc(db, 'customers', newCustId);
              await recalculateCustomerIndicators(custRef, companyId);
            }
            successCreated++;
          }
        } else {
          // New Customer
          const newCustId = await addCustomer({
            name: row.name,
            contact: row.contact,
            email: row.email || '',
            cpfCnpj: row.cpfCnpj || '',
            birthDate: row.birthDate || '',
            address: row.address || '',
            city: row.city || '',
            state: row.state || '',
            zipCode: row.zipCode || '',
            status: row.status || 'Ativo',
            notes: row.notes || '',
            totalSpent: parseFloat(row.totalSpent) || 0,
            ordersCount: parseInt(row.ordersCount) || 0,
            companyId
          });

          if (newCustId) {
            const custRef = doc(db, 'customers', newCustId);
            await recalculateCustomerIndicators(custRef, companyId);
          }
          successCreated++;
        }
      } catch (err) {
        console.error('Error in batch import step:', err);
        errorCount++;
      }
    }

    // Register all CSV actions in System Auditoria
    try {
      await createAuditLog(
        'Clientes',
        'Atualização',
        'import_' + Date.now(),
        `Importação de CSV (${validationReport.total} registros)`,
        {
          newData: {
            totalRecords: validationReport.total,
            imported: successCreated,
            updated: successUpdated,
            ignored: ignoredCount,
            errors: errorCount,
          }
        },
        companyId
      );
    } catch (auditErr) {
      console.error('Error logging import audit:', auditErr);
    }

    setFinalReport({
      imported: successCreated,
      updated: successUpdated,
      ignored: ignoredCount,
      errors: errorCount
    });

    setIsImporting(false);

    // Call onImport with empty array to trigger client-side reloads without running sequential loops
    onImport([]);
  };

  const handleCloseModal = () => {
    setIsImportModalOpen(false);
    setFile(null);
    setParsedRows([]);
    setValidationReport(null);
    setFinalReport(null);
  };

  return (
    <>
      <div className="flex gap-2">
        <button 
          onClick={downloadTemplate} 
          className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 text-[9px] uppercase font-black tracking-widest cursor-pointer active:scale-95 shadow-sm border-b-[3px] border-b-slate-200"
          id="btn-download-csv-template"
        >
          <Download size={14} /> Modelo
        </button>
        <button 
          onClick={exportCSV} 
          className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 text-[9px] uppercase font-black tracking-widest cursor-pointer active:scale-95 shadow-sm border-b-[3px] border-b-slate-200"
          id="btn-export-csv"
        >
          <FileDown size={14} /> Exportar
        </button>
        <button 
          onClick={() => setIsImportModalOpen(true)} 
          className="flex items-center gap-2 px-4 py-3 bg-pink-700 text-white rounded-xl hover:bg-pink-800 transition-all border border-pink-600 text-[9px] uppercase font-black tracking-widest cursor-pointer active:scale-95 shadow-md border-b-[3px] border-b-pink-800"
          id="btn-import-csv-trigger"
        >
          <FileUp size={14} /> Importar
        </button>
      </div>

      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col"
              id="csv-import-modal-container"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                    Importação Inteligente de {moduleName}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                    Processamento seguro em lotes e prevenção de duplicidades
                  </p>
                </div>
                <button 
                  onClick={handleCloseModal} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  id="csv-import-close-btn"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 1. Drag & Drop File Upload Stage */}
              {!validationReport && !isImporting && !finalReport && (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                    dragActive ? 'border-pink-500 bg-pink-50/55' : 'border-slate-200 hover:border-pink-300'
                  } cursor-pointer flex flex-col items-center justify-center min-h-[220px]`}
                  onClick={() => fileInputRef.current?.click()}
                  id="csv-drag-drop-zone"
                >
                  <Upload className="mx-auto text-slate-400 mb-4 animate-bounce" size={32} />
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block mb-1">
                    Arraste e solte seu arquivo CSV aqui
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">
                    ou clique para procurar no dispositivo
                  </span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    id="csv-file-input-field"
                  />
                </div>
              )}

              {/* 2. Pre-Import Review Stage */}
              {validationReport && !isImporting && !finalReport && (
                <div className="space-y-6 flex-1 flex flex-col" id="csv-preview-report-view">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Resumo do Arquivo</span>
                      <span className="text-xs font-black text-slate-800 font-mono">{file?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
                        <Database className="text-blue-500" size={18} />
                        <div>
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total de Registros</p>
                          <p className="text-sm font-black text-slate-800 font-mono">{validationReport.total}</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
                        <CheckCircle2 className="text-emerald-500" size={18} />
                        <div>
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Novos Válidos</p>
                          <p className="text-sm font-black text-emerald-600 font-mono">{validationReport.validCount}</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
                        <Copy className="text-amber-500" size={18} />
                        <div>
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Duplicatas Detectadas</p>
                          <p className="text-sm font-black text-amber-600 font-mono">{validationReport.duplicateCount}</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
                        <AlertOctagon className="text-rose-500" size={18} />
                        <div>
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Registros com Erro</p>
                          <p className="text-sm font-black text-rose-600 font-mono">{validationReport.errorCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Policy Choice */}
                  {validationReport.duplicateCount > 0 && (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4" id="csv-duplicate-policy-section">
                      <label className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block mb-2">
                        Tratamento de Duplicidades
                      </label>
                      <select 
                        value={duplicatePolicy}
                        onChange={(e) => setDuplicatePolicy(e.target.value as any)}
                        className="w-full bg-white border border-amber-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400"
                        id="csv-duplicate-policy-select"
                      >
                        <option value="update">Atualizar cadastro existente (Recomendado)</option>
                        <option value="ignore">Ignorar registros duplicados</option>
                        <option value="create">Criar novos cadastros duplicados</option>
                      </select>
                      <p className="text-[9px] text-amber-600 font-medium mt-1.5 uppercase tracking-wider">
                        A comparação prioriza ID/Código, CPF/CNPJ, WhatsApp/Telefone e E-mail.
                      </p>
                    </div>
                  )}

                  {/* Pre-validation Errors Listing */}
                  {validationReport.errors.length > 0 && (
                    <div className="border border-rose-100 rounded-2xl p-4 bg-rose-50/30 flex-1 max-h-[150px] overflow-y-auto" id="csv-validation-errors-section">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-rose-600" size={16} />
                        <span className="text-[10px] font-extrabold text-rose-950 uppercase tracking-widest">
                          Detalhes dos Registros Inválidos
                        </span>
                      </div>
                      <div className="space-y-1 text-left font-mono text-[9px] text-rose-800">
                        {validationReport.errors.map((err, i) => (
                          <div key={i} className="border-b border-rose-100/50 pb-1">
                            <span className="font-extrabold">Linha {err.line}:</span> <span className="font-bold text-rose-950">{err.name}</span> — <span className="italic">{err.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-100 mt-auto">
                    <button 
                      onClick={() => setValidationReport(null)}
                      className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black rounded-xl uppercase text-[10px] tracking-widest transition-all border border-slate-200 border-b-[3px]"
                      id="csv-back-to-upload-btn"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={startImport}
                      className="flex-1 py-3 bg-pink-700 hover:bg-pink-800 text-white font-black rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-md active:scale-95 border-b-[3px] border-b-pink-800"
                      id="csv-confirm-import-btn"
                    >
                      Iniciar Importação
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Progressive Batch Importing Progress Stage */}
              {isImporting && (
                <div className="py-10 text-center space-y-6" id="csv-importing-progress-view">
                  <div className="flex justify-center">
                    <RefreshCw className="animate-spin text-pink-700" size={36} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Processando Dados no Banco
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Gravando sequencialmente para evitar sobrecarga...
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        className="bg-pink-700 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((processedCount / (validationReport?.validRows.length || 1)) * 100)}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-wider">
                      <span>{processedCount} de {validationReport?.validRows.length}</span>
                      <span>{Math.round((processedCount / (validationReport?.validRows.length || 1)) * 100)}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl inline-flex items-center gap-2 max-w-full">
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Atual:</span>
                    <span className="text-[10px] text-slate-700 font-bold truncate max-w-[200px]">{currentProcessingName}</span>
                  </div>
                </div>
              )}

              {/* 4. Final Import Summary Report Stage */}
              {finalReport && (
                <div className="space-y-6" id="csv-final-report-view">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-full mb-2 border border-emerald-100 shadow-sm">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Importação Concluída com Sucesso!
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      O banco de dados do CRM foi sincronizado
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl shadow-sm text-center">
                      <p className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest mb-1">Importados (Criados)</p>
                      <p className="text-2xl font-black text-emerald-700 font-mono">{finalReport.imported}</p>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl shadow-sm text-center">
                      <p className="text-[9px] font-extrabold text-blue-800 uppercase tracking-widest mb-1">Atualizados (Mesclados)</p>
                      <p className="text-2xl font-black text-blue-700 font-mono">{finalReport.updated}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm text-center">
                      <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Ignorados (Duplicados)</p>
                      <p className="text-2xl font-black text-slate-600 font-mono">{finalReport.ignored}</p>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl shadow-sm text-center">
                      <p className="text-[9px] font-extrabold text-rose-800 uppercase tracking-widest mb-1">Erros de Linha</p>
                      <p className="text-2xl font-black text-rose-700 font-mono">{finalReport.errors}</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleCloseModal}
                    className="w-full py-3 bg-[#1C1C1E] hover:bg-black text-white font-black rounded-xl uppercase text-[10px] tracking-widest transition-all border-b-[3px] border-b-black mt-4 cursor-pointer"
                    id="csv-conclude-import-btn"
                  >
                    Concluir
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
