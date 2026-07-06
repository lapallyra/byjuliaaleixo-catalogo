import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminOrchestratorProvider } from './components/AdminOrchestratorSystem';
import { SiteApp } from './components/Site/SiteApp';
import { AdminApp } from './components/Admin/AdminApp';

function MainApp() {
  return (
    <Routes>
      {/* 
          Isolation Pattern:
          Admin and Catalog (SiteApp) are now fully encapsulated.
          This allows focused development on individual modules.
      */}
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<SiteApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-rose-500/20">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">Erro de Conexão ou Inicialização</h1>
          <p className="text-slate-400 mb-8 max-w-sm font-sans text-xs uppercase tracking-widest leading-loose">
            Ocorreu uma falha crítica ao iniciar. Por favor, tente recarregar ou verifique os serviços.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black font-bold py-4 px-10 rounded-2xl hover:scale-105 transition-all uppercase tracking-widest text-[10px]"
          >
            Recarregar Página
          </button>
        </div>
      }>
        <BrowserRouter>
          <AdminOrchestratorProvider>
            <MainApp />
          </AdminOrchestratorProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}
