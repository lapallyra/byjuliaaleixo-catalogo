
import React from 'react';
import { StudioLayout } from '../components/StudioLayout';
import { ProductLibrary } from '../components/ProductLibrary';
import { CanvasEditor } from '../components/CanvasEditor';

export const StudioPage: React.FC = () => {
  return (
    <StudioLayout>
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="font-poppins font-bold text-sm uppercase mb-4">Bibliotecas</h2>
          <ProductLibrary />
        </div>
        <div className="col-span-3 bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="font-poppins font-bold text-sm uppercase mb-4">Editor de Modelo</h2>
          <CanvasEditor />
        </div>
      </div>
    </StudioLayout>
  );
};
