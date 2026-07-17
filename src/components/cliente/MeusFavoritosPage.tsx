import React from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { useProducts } from '../../hooks/useProducts';
import { updateCustomer } from '../../services/firebaseService';
import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MeusFavoritosPage: React.FC = () => {
  const { customer } = useCustomer();
  const { products, loading: productsLoading } = useProducts();

  if (productsLoading) return <div className="p-8 text-center text-gray-500">Carregando seus favoritos...</div>;

  const favoriteProducts = products.filter(p => customer?.favoriteProductIds?.includes(p.id));

  const removeFavorite = async (productId: string) => {
    if (!customer) return;
    const updatedIds = (customer.favoriteProductIds || []).filter(id => id !== productId);
    await updateCustomer(customer.id, { ...customer, favoriteProductIds: updatedIds });
  };

  if (favoriteProducts.length === 0) {
    return <div className="p-8 text-center text-gray-500">Você ainda não tem produtos favoritos.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-mea-culpa text-[#3A312D]">Meus Favoritos</h1>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {favoriteProducts.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <Link to={`/product/${product.id}`}>
              <img src={product.image} alt={product.product_name} className="w-full h-48 object-cover rounded-2xl mb-4" />
              <h3 className="font-bold text-gray-900 truncate">{product.product_name}</h3>
              <p className="text-[#cca062] font-bold">R$ {product.current_price.toFixed(2)}</p>
            </Link>
            <button onClick={() => removeFavorite(product.id)} className="w-full mt-4 flex items-center justify-center gap-2 text-red-500 hover:text-red-700 transition-colors">
              <Trash2 size={16} /> Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
