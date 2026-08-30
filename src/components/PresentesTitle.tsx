import React from 'react';

export function PresentesTitle() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="presentes text-4xl md:text-6xl text-gray-900 mb-2 flex items-center gap-2">
        PRESENTES
        <span className="signature">✦</span>
      </h1>
      <h2 className="font-mea-culpa text-4xl md:text-6xl text-gray-800 -mt-2">
        Personalizados
      </h2>
    </div>
  );
}
