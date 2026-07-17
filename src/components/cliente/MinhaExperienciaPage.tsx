
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClienteLayout } from './ClienteLayout';
import { DashboardCliente } from './DashboardCliente';
import { MeusPedidosPage } from './MeusPedidosPage';
import { MeusEnderecosPage } from './MeusEnderecosPage';
import { MeusFavoritosPage } from './MeusFavoritosPage';
import { MinhaContaPage } from './MinhaContaPage';
import { MemoriasPage } from './MemoriasPage';

export const MinhaExperienciaPage: React.FC = () => {
  return (
    <ClienteLayout>
      <Routes>
        <Route path="/" element={<DashboardCliente />} />
        <Route path="pedidos" element={<MeusPedidosPage />} />
        <Route path="enderecos" element={<MeusEnderecosPage />} />
        <Route path="favoritos" element={<MeusFavoritosPage />} />
        <Route path="minha-conta" element={<MinhaContaPage />} />
        <Route path="memorias" element={<MemoriasPage />} />
      </Routes>
    </ClienteLayout>
  );
};
