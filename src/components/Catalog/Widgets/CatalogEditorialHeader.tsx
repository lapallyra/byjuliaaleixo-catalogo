import React from 'react';

interface CatalogEditorialHeaderProps {
  theme: any;
  companyName: string;
}

export const CatalogEditorialHeader: React.FC<CatalogEditorialHeaderProps> = ({ theme, companyName }) => {
  return (
    <div className="text-center py-4 md:py-6 px-4">
      <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${theme.textPrimary}`}>
        {companyName}
      </h2>
      <p className={`mt-1 text-xs md:text-sm font-medium ${theme.textSecondary} opacity-70`}>
        Explore nossa curadoria de presentes personalizados
      </p>
    </div>
  );
};
