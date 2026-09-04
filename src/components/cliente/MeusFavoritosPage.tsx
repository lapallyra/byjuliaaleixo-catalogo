import React from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { useProducts } from '../../hooks/useProducts';
import { updateCustomer } from '../../services/firebaseService';
import { Heart, Trash2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MeusFavoritosPage: React.FC = () => {
  const { customer } = useCustomer();
  const { products, loading: productsLoading } = useProducts();

  if (productsLoading) {
    return (
      <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#8C6D37] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#2A2421]">Carregando seus favoritos...</p>
      </div>
    );
  }

  const favoriteProducts = products.filter(p => customer?.favoriteProductIds?.includes(p.id));

  const removeFavorite = async (productId: string) => {
    if (!customer) return;
    const updatedIds = (customer.favoriteProductIds || []).filter(id => id !== productId);
    await updateCustomer(customer.id, { ...customer, favoriteProductIds: updatedIds });
  };

  return (
    <div className="space-y-5 pb-8 px-2 sm:px-3">
      <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2A2421] tracking-tight">Meus Favoritos</h1>
          <p className="text-xs text-[#6E645E] mt-0.5">Seus itens e kits prediletos do Ateliê VIP salvos para consulta</p>
        </div>
        <span className="text-xs font-bold bg-[#F5F1EB] text-[#8C6D37] px-3.5 py-1.5 rounded-full border border-stone-200/80">
          {favoriteProducts.length} {favoriteProducts.length === 1 ? 'favorito' : 'favoritos'}
        </span>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] flex items-center justify-center mx-auto">
            <Heart size={24} />
          </div>
          <h3 className="text-base font-bold text-[#2A2421]">Sua lista de favoritos está vazia</h3>
          <p className="text-xs text-[#6E645E] max-w-sm mx-auto">
            Explore nossos kits e caixas artesanais na loja e clique no ícone de coração para guardar aqui.
          </p>
          <Link
            to="/"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2A2421] hover:bg-[#8C6D37] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <span>Ver Produtos da Loja</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {favoriteProducts.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all">
              <Link to={`/product/${product.id}`} className="group space-y-3">
                <div className="overflow-hidden rounded-2xl bg-[#F5F1EB] aspect-square">
                  <img 
                    src={product.image} 
                    alt={product.product_name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#2A2421] truncate">{product.product_name}</h3>
                  <p className="text-[#8C6D37] font-bold text-sm mt-1">R$ {product.current_price.toFixed(2).replace('.', ',')}</p>
                </div>
              </Link>
              <button 
                onClick={() => removeFavorite(product.id)} 
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Remover</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
