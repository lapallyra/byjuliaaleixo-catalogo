import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product, AppConfig, CompanyId, CartItem } from '../../types';
import { CatalogView } from '../CatalogView';
import { SuccessOverlay } from '../SuccessOverlay';
import { PrizeRouletteModal } from '../PrizeRouletteModal';
import { playSuccessSound } from '../../utils/audio';
import { sendNotifications } from '../../services/notificationService';
import { updateOrder } from '../../services/firebaseService';

export function CompanyCatalogWrapper({ 
  companyId, 
  config, 
  cart, 
  setCart, 
  giftList, 
  setGiftList, 
  favorites,
  setFavorites,
  allProducts,
  onOpenGlobalSearch
}: { 
  companyId: CompanyId, 
  config: AppConfig, 
  cart: CartItem[], 
  setCart: any, 
  giftList: Product[], 
  setGiftList: any, 
  favorites: Product[],
  setFavorites: any,
  allProducts: Product[],
  onOpenGlobalSearch?: () => void
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMPRoulette, setShowMPRoulette] = useState(false);
  const [mpPendingOrderData, setMpPendingOrderData] = useState<any>(null);
  const [orderCode, setOrderCode] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleClearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('collection_status') || params.get('payment_status') || params.get('status');
    const urlOrderId = params.get('order_id');
    const pendingOrderStr = localStorage.getItem('mp_pending_order');
    
    if (paymentStatus === 'approved') {
      if (urlOrderId) setOrderCode(urlOrderId);
      
      if (pendingOrderStr) {
        try {
          const pendingOrder = JSON.parse(pendingOrderStr);
          if (pendingOrder && pendingOrder.companyName) {
            handleClearCart();
            setMpPendingOrderData(pendingOrder);
            if (pendingOrder.orderId) setOrderCode(pendingOrder.orderId);
            setShowMPRoulette(true);
            playSuccessSound();
            localStorage.removeItem('mp_pending_order');
            navigate(location.pathname, { replace: true });
          }
        } catch(e) {
          console.error("Error parsing mp_pending_order", e);
        }
      } else {
        // Just show success if no pending order but approved in URL
        setShowSuccess(true);
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, config, navigate, location.pathname, handleClearCart]);
  
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    // Generate a unique ID for different configurations of variations or personalizations
    const variationKey = (product as any).selectedVariation || "";
    const personalizationKey = (product as any).personalizationValues 
      ? Object.entries((product as any).personalizationValues).map(([k, v]) => `${k}:${v}`).join(',')
      : "";
    const addonKey = (product as any).selectedAddons 
      ? (product as any).selectedAddons.join(',') 
      : "";
    
    // Create unique cart item ID
    const cartItemId = [product.id, variationKey, personalizationKey, addonKey]
      .filter(Boolean)
      .join('_');

    setCart((prev: CartItem[]) => {
      const existingIdx = prev.findIndex(item => item.id === cartItemId);
      if (existingIdx > -1) {
        return prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, id: cartItemId, productId: product.id, quantity }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev: CartItem[]) => prev.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev: CartItem[]) => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleSetQuantity = (productId: string, quantity: number) => {
    setCart((prev: CartItem[]) => {
      return prev.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: Math.max(0, quantity) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleAddToGiftList = (product: Product) => {
    setGiftList((prev: Product[]) => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const handleAddToFavorite = (product: Product) => {
    setFavorites((prev: Product[]) => {
      if (prev.find(item => item.id === product.id)) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleRemoveFromGiftList = (productId: string) => {
    setGiftList((prev: Product[]) => prev.filter(item => item.id !== productId));
  };

  return (
    <>
      <CatalogView
        companyId={companyId}
        config={config}
        allProducts={allProducts}
        cart={cart}
        giftList={giftList}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onSetQuantity={handleSetQuantity}
        onAddToGiftList={handleAddToGiftList}
        onRemoveFromGiftList={handleRemoveFromGiftList}
        onAddToFavorite={handleAddToFavorite}
        onGoBack={() => navigate('/')}
        onCheckoutComplete={() => setShowSuccess(true)}
        onOpenAdmin={() => navigate('/admin')}
        onOpenGlobalSearch={onOpenGlobalSearch}
      />
      {showSuccess && (
        <SuccessOverlay 
          orderCode={orderCode}
          onContinue={() => {
            setShowSuccess(false);
            setOrderCode(undefined);
            handleClearCart();
          }} 
        />
      )}
      {showMPRoulette && mpPendingOrderData && (
        <PrizeRouletteModal 
          isOpen={showMPRoulette}
          onClose={async () => {
            setShowMPRoulette(false);
            setShowSuccess(true);
            try {
              const url = await sendNotifications(mpPendingOrderData.config || config, mpPendingOrderData.cart, mpPendingOrderData.formData, mpPendingOrderData.total, mpPendingOrderData.companyName);
              if (url) {
                setTimeout(() => window.open(url, '_blank'), 1500);
              }
            } catch(e) {
              console.error("Error generating whatsapp", e);
            }
          }}
          onResult={async (prize) => {
            try {
              if (mpPendingOrderData.orderId) {
                await updateOrder(mpPendingOrderData.orderId, { giftInfo: prize });
              }
              if (mpPendingOrderData.formData) {
                mpPendingOrderData.formData.wonPrize = prize;
              }
            } catch(e) {
              console.error("Error updating prize", e);
            }
          }}
          prizes={mpPendingOrderData.config?.roulette_prizes || []}
          theme={{ accentColor: mpPendingOrderData.config?.theme?.primary_color || '#000000' }}
        />
      )}
    </>
  );
}
