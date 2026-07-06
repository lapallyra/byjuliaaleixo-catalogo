import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { ErrorBoundary } from '../ErrorBoundary';
import { AdminDashboard } from '../AdminDashboard';
import { AdminLoginView } from '../AdminLoginView';

export function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginView />} />
      <Route path="" element={
        <ProtectedRoute>
          <ErrorBoundary fallback={
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-rose-500/20">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">Erro no Painel</h1>
              <p className="text-slate-400 mb-8 max-w-sm font-sans text-xs uppercase tracking-widest leading-loose">
                Ocorreu um erro crítico ao carregar o painel administrativo. Por favor, recarregue a página.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-white text-black font-bold py-4 px-10 rounded-2xl hover:scale-105 transition-all uppercase tracking-widest text-[10px]"
              >
                Recarregar Página
              </button>
            </div>
          }>
            <AdminDashboard onGoBack={() => window.history.back()} />
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
