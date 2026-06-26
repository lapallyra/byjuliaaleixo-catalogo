
import React from 'react';
import { ClienteLayout } from '../cliente/ClienteLayout';
import { DashboardCliente } from '../cliente/DashboardCliente';

export const MinhaExperienciaPage: React.FC = () => {
  return (
    <ClienteLayout>
      <DashboardCliente />
    </ClienteLayout>
  );
};
