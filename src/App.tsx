import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminOrchestratorProvider } from './components/AdminOrchestratorSystem';
import { SiteApp } from './components/Site/SiteApp';

import { checkIsAdminDomain } from './lib/utils';
import { LoadingScreen } from './components/LoadingScreen';

const AdminApp = lazy(() => import('./components/Admin/AdminApp').then(m => ({ default: m.AdminApp })));

function MainApp() {
  const isAdminDomain = checkIsAdminDomain();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {isAdminDomain ? (
          <>
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/*" element={<Navigate to="/" replace />} />
            <Route path="/*" element={<AdminApp />} />
          </>
        ) : (
          <>
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/*" element={<SiteApp />} />
          </>
        )}
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AdminOrchestratorProvider>
            <MainApp />
          </AdminOrchestratorProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}
