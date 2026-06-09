import React, { useState } from 'react';
import { X, Download, Printer, Share2 } from 'lucide-react';

interface PDFPreviewModalProps {
  order: any;
  onClose: () => void;
  pdfDoc: any; // jsPDF instance
  fileName: string;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ order, onClose, pdfDoc, fileName }) => {
  const [pdfUrl] = useState(() => pdfDoc.output('bloburl'));

  const handleDownload = () => {
    pdfDoc.save(`${fileName}.pdf`);
  };

  const handleOpenPDF = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-sm font-black uppercase tracking-widest">Preview PDF</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-hidden p-2">
          <iframe src={pdfUrl} className="w-full h-full border-0" title="PDF Preview" />
        </div>
        <div className="p-4 border-t flex justify-around">
          <button onClick={handleDownload} className="flex flex-col items-center gap-1"><Download size={20} /> <span className="text-[10px]">Baixar</span></button>
          <button onClick={handleOpenPDF} className="flex flex-col items-center gap-1"><Printer size={20} /> <span className="text-[10px]">Abrir PDF</span></button>
          <button className="flex flex-col items-center gap-1 opacity-50 cursor-not-allowed" title="Em breve"><Share2 size={20} /> <span className="text-[10px]">Compartilhar</span></button>
        </div>
      </div>
    </div>
  );
};
