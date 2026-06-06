import React, { useState, useEffect } from 'react';

export const CookieBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookieAccepted');
    if (!accepted) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookieAccepted', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-2xl z-[9999] flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center md:text-left">
        Utilizamos cookies para personalizar sua experiência. Ao continuar, você concorda com nossa política.
      </p>
      <button 
        onClick={accept}
        className="bg-black text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
      >
        Entendi & Aceito
      </button>
    </div>
  );
};
