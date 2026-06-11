import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { FileUp, FileDown, Download, X, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CSVHandlerProps {
  moduleName: string;
  data: any[];
  fields: string[];
  onImport: (newData: any[]) => void;
}

export const CSVHandler: React.FC<CSVHandlerProps> = ({ moduleName, data, fields, onImport }) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<{ found: number, new: number, updated: number, invalid: number } | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csv = Papa.unparse([fields]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Modelo_${moduleName}.csv`;
    link.click();
  };

  const exportCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${moduleName}_Export.csv`;
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            // Logic to validate
            const valid = results.data.filter((item: any) => fields.every(f => Object.keys(item).includes(f)));
            const invalidCount = results.data.length - valid.length;
            setParsedData(valid);
            setImportReport({
                found: results.data.length,
                new: valid.length, // Placeholder logic
                updated: 0, // Placeholder logic
                invalid: invalidCount
            });
        }
      });
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 text-[9px] uppercase font-black tracking-widest cursor-pointer">
            <Download size={14} /> Modelo
        </button>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 text-[9px] uppercase font-black tracking-widest">
            <FileDown size={14} /> Exportar
        </button>
        <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-4 py-3 bg-pink-700 text-white rounded-xl hover:bg-pink-800 transition-all border border-pink-600 text-[9px] uppercase font-black tracking-widest">
            <FileUp size={14} /> Importar
        </button>
      </div>

      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full">
                <h3 className="text-sm font-black uppercase text-slate-800 mb-6">Importar {moduleName}</h3>
                
                {!importReport ? (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-pink-300">
                        <Upload className="mx-auto text-slate-400 mb-2" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clique para selecionar CSV</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-[11px] font-bold text-slate-700">{importReport.found} registros encontrados</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] text-emerald-600"><CheckCircle size={14} /> {importReport.new} novos registros</div>
                            <div className="flex items-center gap-2 text-[10px] text-amber-600"><AlertTriangle size={14} /> {importReport.invalid} registros inválidos</div>
                        </div>
                        <button onClick={() => { onImport(parsedData); setIsImportModalOpen(false); setImportReport(null); }} className="w-full mt-6 bg-pink-700 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest">
                            Confirmar Importação
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
