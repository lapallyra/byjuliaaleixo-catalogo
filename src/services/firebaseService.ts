import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sendTelegramNotification } from './telegramService';
import { Product, SaleNotification, CheckoutData, CompanyId, Order, CartItem, Insumo, Customer, FinanceEntry, SiteSettings, AppConfig } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // Ignore abort errors from the browser/SDK
  if (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('abort'))) {
    console.warn('Firestore request was aborted (normal behavior):', path);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes all undefined values from an object or array.
 * Useful for cleaning data before sending to Firestore.
 */
function sanitize(data: any): any {
  if (data === undefined) return undefined;
  if (data === null) return null;

  if (Array.isArray(data)) {
    return data
      .map((item) => sanitize(item))
      .filter((item) => item !== undefined);
  }

  // Check if it's a plain object. This prevents recursing into 
  // Firestore special types like Timestamp, FieldValue, etc.
  if (typeof data === 'object') {
    // If it's a Firestore Timestamp or FieldValue, don't recurse
    if (data.constructor?.name === 'Timestamp' || 
        data.constructor?.name === 'FieldValueImpl' ||
        data instanceof Date) {
      return data;
    }

    // Only recurse into plain objects
    if (Object.prototype.toString.call(data) === '[object Object]') {
      const cleaned: any = {};
      let hasVisibleProps = false;
      Object.keys(data).forEach((key) => {
        const value = sanitize(data[key]);
        if (value !== undefined) {
          cleaned[key] = value;
          hasVisibleProps = true;
        }
      });
      return hasVisibleProps ? cleaned : {};
    }
  }

  return data;
}

export const getProducts = async (companyId?: CompanyId): Promise<Product[]> => {
  const path = 'products';
  try {
    const q = companyId 
      ? query(collection(db, path), where('company', '==', companyId))
      : collection(db, path);
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const addProduct = async (productData: Product) => {
  const path = 'products';
  try {
    const { id, ...data } = productData;
    const sanitizedData = sanitize({
      ...data,
      createdAt: serverTimestamp(),
      salesCount: 0,
      clicksCount: 0
    });

    if (id) {
      await setDoc(doc(db, path, id), sanitizedData);
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), sanitizedData);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateProduct = async (id: string, productData: Partial<Product>) => {
  const path = `products/${id}`;
  const { id: _, ...dataWithoutId } = productData as any;
  try {
    await updateDoc(doc(db, 'products', id), sanitize(dataWithoutId));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteProduct = async (id: string) => {
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getInsumos = async (): Promise<Insumo[]> => {
  const path = 'insumos';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insumo));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const addInsumo = async (data: Omit<Insumo, 'id'>) => {
  const path = 'insumos';
  try {
    const docRef = await addDoc(collection(db, path), sanitize({
      ...data,
      createdAt: serverTimestamp()
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateInsumo = async (id: string, data: Partial<Insumo>) => {
  const path = `insumos/${id}`;
  const { id: _, ...dataWithoutId } = data as any;
  try {
    await updateDoc(doc(db, 'insumos', id), sanitize(dataWithoutId));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteInsumo = async (id: string) => {
  const path = `insumos/${id}`;
  try {
    await deleteDoc(doc(db, 'insumos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToInsumos = (callback: (insumos: Insumo[]) => void) => {
  const path = 'insumos';
  return onSnapshot(collection(db, path), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insumo)));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const updateOrder = async (orderId: string, data: Partial<Order>) => {
  const path = `sales/${orderId}`;
  const { id: _, ...dataWithoutId } = data as any;
  try {
    let finalData = { ...dataWithoutId };
    
    const orderRef = doc(db, 'sales', orderId);
    let orderData = (data as Order); // Fallback
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      orderData = { ...orderSnap.data(), ...data } as Order; // Merged
    }

    // Automatic stock deduction when entering produced/completed statuses
    if (['ready', 'delivered', 'fully_paid', 'production'].includes(data.status || '')) {
      if (orderSnap.exists()) {
        const dbOrderData = orderSnap.data() as Order;
        if (!dbOrderData.insumosDeducted) {
          const items = data.items || dbOrderData.items || [];
          for (const item of items) {
            if (item.insumos && item.insumos.length > 0) {
              for (const req of item.insumos) {
                try {
                  const insumoRef = doc(db, 'insumos', req.insumoId);
                  const insumoSnap = await getDoc(insumoRef);
                  if (insumoSnap.exists()) {
                    const currentQty = insumoSnap.data().quantity || 0;
                    const reduction = req.quantity * item.quantity;
                    const newQty = Math.max(0, currentQty - reduction);
                    await updateDoc(insumoRef, { quantity: newQty });
                    
                    // Log movement
                    await addDoc(collection(db, 'insumo_movements'), sanitize({
                      insumoId: req.insumoId,
                      insumoName: insumoSnap.data().name || 'Material',
                      orderId: orderId,
                      orderCode: dbOrderData.code || orderId,
                      productName: item.product_name || 'Produto',
                      quantityDeducted: reduction,
                      timestamp: new Date().toISOString(),
                      type: 'out'
                    }));

                    // Low Stock Check
                    if (newQty <= 10) { // Default low stock threshold, can make dynamic if needed
                       try {
                         sendTelegramNotification('low_stock', `⚠️ ESTOQUE BAIXO\n\nProduto:\n${insumoSnap.data().name || 'Material'}\n\nQuantidade Atual:\n${newQty}`);
                       } catch(e){}
                    }
                  }
                } catch (err) {
                  console.warn(`Could not update stock for insumo ${req.insumoId}:`, err);
                }
              }
            }
          }
          finalData.insumosDeducted = true;
        }
      }
    }

    await updateDoc(doc(db, 'sales', orderId), sanitize(finalData));

    // Telegram Notifications for status change
    try {
      if (data.status && orderSnap.exists() && orderSnap.data().status !== data.status) {
        const baseUrl = window.location.origin;
        if (data.status === 'production' || data.status === 'paid' || data.status === 'fully_paid') {
          // Could be considered payment confirmed depending on previous state
          if (orderSnap.data().status === 'waiting_payment' || orderSnap.data().status === 'novo pedido') {
            sendTelegramNotification('payment_confirmed', `💰 PAGAMENTO CONFIRMADO\n\nPedido: #${orderData.code || orderId}\n\nCliente:\n${orderData.customerName || 'N/D'}\n\nValor:\nR$ ${(orderData.total || 0).toFixed(2).replace('.', ',')}\n\nForma:\n${(orderData as any).paymentMethod || (orderData as any).payment_method || 'N/D'}\n\nAbrir Pedido:\n${baseUrl}/admin/pedidos/${orderId}`);
          }
        } else if (data.status === 'cancelled' || (data.status as any) === 'cancelado') {
          sendTelegramNotification('order_canceled', `❌ PEDIDO CANCELADO\n\nPedido: #${orderData.code || orderId}\n\nCliente:\n${orderData.customerName || 'N/D'}\n\nAbrir Pedido:\n${baseUrl}/admin/pedidos/${orderId}`);
        } else if (data.status === 'delivered') {
          sendTelegramNotification('order_completed', `📦 PEDIDO FINALIZADO\n\nPedido: #${orderData.code || orderId}\n\nCliente:\n${orderData.customerName || 'N/D'}\n\nAbrir Pedido:\n${baseUrl}/admin/pedidos/${orderId}`);
        }
      }
    } catch(e) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateOrderStatus = async (orderId: string, newStatus: Order['status'], items?: CartItem[]) => {
  return updateOrder(orderId, { status: newStatus, items });
};

export const saveSale = async (data: any) => {
  const path = 'sales';
  try {
    const today = new Date();
    const deliveryDate = calculateDeliveryDate(today, 7);
    
    const saleData = sanitize({
      ...data,
      createdAt: serverTimestamp(),
      dateFormatted: formatDate(today),
      code: data.code || generateOrderCode(data.companyId),
      status: 'novo pedido',
      source: 'catalogo',
      deliveryDate: deliveryDate,
      estimatedDelivery: deliveryDate,
      insumosDeducted: true // Already deducted on catalog purchase below
    });
    
    let docRef = doc(db, 'sales', saleData.code);
    try {
      await setDoc(docRef, saleData);
      console.log('✅ Document successfully added to sales collection:', docRef.id);
    } catch (dbError) {
      console.error('❌ Firestore setDoc ERROR for path "sales":', dbError);
      throw dbError;
    }
    
    // Auto-register customer
    try {
      await handleCustomerOrder(saleData as Order);
    } catch (e) {
      console.warn('Non-blocking customer registration error:', e);
    }

    // Auto-register finance entry (Revenue)
    try {
      await addDoc(collection(db, 'finance'), sanitize({
        type: 'revenue',
        category: 'Venda de Produto',
        description: `Pedido ${saleData.code} - ${saleData.customerName}`,
        value: saleData.total,
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        companyId: saleData.companyId,
        orderId: docRef.id,
        marketplace: saleData.marketplace || '',
        marketplaceTax: saleData.marketplaceTax || 0,
        createdAt: serverTimestamp()
      }));
    } catch (e) {
      console.warn('Non-blocking finance registration error:', e);
    }

    // Automatic stock deduction for insumos
    if (saleData.items) {
      for (const item of saleData.items) {
        if (item.insumos && item.insumos.length > 0) {
          for (const requiredInsumo of item.insumos) {
            try {
              const insumoRef = doc(db, 'insumos', requiredInsumo.insumoId);
              const insumoSnap = await getDoc(insumoRef);
              if (insumoSnap.exists()) {
                const currentQty = insumoSnap.data().quantity || 0;
                const reduction = requiredInsumo.quantity * item.quantity;
                await updateDoc(insumoRef, { 
                    quantity: Math.max(0, currentQty - reduction) 
                });
                try {
                  await addDoc(collection(db, 'insumo_movements'), sanitize({
                    insumoId: requiredInsumo.insumoId,
                    insumoName: insumoSnap.data()?.name || 'Material',
                    orderId: docRef.id,
                    orderCode: saleData.code || docRef.id,
                    productName: item.product_name || 'Produto',
                    quantityDeducted: reduction,
                    timestamp: new Date().toISOString(),
                    type: 'out'
                  }));
                } catch (logErr) {
                  console.warn('Logging movement error:', logErr);
                }
              }
            } catch (err) {
              console.warn(`Could not update stock for insumo ${requiredInsumo.insumoId}:`, err);
            }
          }
        }
      }
    }
    
    // Telegram Notification
    try {
      const baseUrl = window.location.origin;
      sendTelegramNotification('new_order', `🛒 NOVO PEDIDO\n\nPedido: #${saleData.code || docRef.id}\n\nCliente:\n${saleData.customerName || 'N/D'}\n\nValor:\nR$ ${(saleData.total || 0).toFixed(2).replace('.', ',')}\n\nPagamento:\n${saleData.paymentMethod || 'N/D'}\n\nEntrega:\n${saleData.deliveryDate || 'N/D'}\n\nStatus:\n${saleData.status || 'N/D'}\n\nAbrir Pedido:\n${baseUrl}/admin/pedidos/${docRef.id}`);
    } catch (e) {}

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

function calculateDeliveryDate(startDate: Date, businessDays: number): string {
  let count = 0;
  let result = new Date(startDate);
  while (count < businessDays) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) { // Skip Saturday (6) and Sunday (0)
      count++;
    }
  }
  return formatDate(result);
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function generateOrderCode(companyId: CompanyId): string {
  const prefixMap: Record<string, string> = {
    'pallyra': 'LP',
    'guennita': 'CG',
    'mimada': 'MS',
    'tuttymimo': 'TM'
  };
  const prefix = prefixMap[companyId] || 'LP';
  const random = Math.floor(10000 + Math.random() * 90000).toString();
  return `${prefix}${random}`;
}

const handleCustomerOrder = async (orderData: Order) => {
  const path = 'customers';
  try {
    if (!orderData.customerCpfCnpj || !orderData.companyId) return;

    const q = query(
      collection(db, path), 
      where('cpfCnpj', '==', orderData.customerCpfCnpj),
      where('companyId', '==', orderData.companyId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      const customerCode = crypto.randomUUID().slice(0, 8).toUpperCase();
      await addDoc(collection(db, path), sanitize({
        code: customerCode,
        name: orderData.customerName || 'Cliente sem nome',
        contact: orderData.contact || 'S/C',
        cpfCnpj: orderData.customerCpfCnpj,
        totalSpent: orderData.total || 0,
        ordersCount: 1,
        companyId: orderData.companyId,
        createdAt: serverTimestamp(),
        birthDate: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
      }));

      // Telegram notification for new client
      try {
        sendTelegramNotification('new_client', `👤 NOVO CLIENTE\n\nNome:\n${orderData.customerName || 'Cliente sem nome'}\n\nContato:\n${orderData.contact || 'S/C'}`);
      } catch(e){}

    } else {
      const customerDoc = snapshot.docs[0];
      const data = customerDoc.data();
      await updateDoc(customerDoc.ref, {
        totalSpent: (data.totalSpent || 0) + orderData.total,
        ordersCount: (data.ordersCount || 0) + 1
      });
    }
  } catch (error) {
    console.warn('Failed to register customer:', error);
  }
};

export const addCustomer = async (data: Omit<Customer, 'id' | 'code' | 'createdAt'>) => {
  const path = 'customers';
  try {
    const customerCode = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
    const docRef = await addDoc(collection(db, path), sanitize({
      ...data,
      code: customerCode,
      createdAt: serverTimestamp(),
      totalSpent: data.totalSpent || 0,
      ordersCount: data.ordersCount || 0
    }));

    try {
      sendTelegramNotification('new_client', `👤 NOVO CLIENTE\n\nNome:\n${data.name || 'Cliente sem nome'}\n\nContato:\n${data.contact || 'S/C'}`);
    } catch(e){}

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToCustomers = (callback: (customers: Customer[]) => void, companyId?: CompanyId) => {
  const q = companyId 
    ? query(collection(db, 'customers'), where('companyId', '==', companyId))
    : collection(db, 'customers');
    
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));
};

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  const path = `customers/${id}`;
  const { id: _, ...dataWithoutId } = data as any;
  try {
    await updateDoc(doc(db, 'customers', id), sanitize(dataWithoutId));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteCustomer = async (id: string) => {
  const path = `customers/${id}`;
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToFinance = (callback: (entries: FinanceEntry[]) => void, companyId?: CompanyId) => {
  const q = companyId 
    ? query(collection(db, 'finance'), where('companyId', '==', companyId))
    : collection(db, 'finance');
    
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry)));
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'finance'));
};

export const updateFinanceEntry = async (id: string, data: Partial<FinanceEntry>) => {
  const path = `finance/${id}`;
  try {
    await updateDoc(doc(db, 'finance', id), sanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getOrderByCode = async (code: string): Promise<Order | null> => {
  try {
    const uppercaseCode = code.toUpperCase();
    
    try {
      const docSnap = await getDoc(doc(db, 'sales', uppercaseCode));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      return null;
    } catch (e) {
      console.warn("getDoc on sales failed", e);
      return null;
    }
  } catch (error: any) {
    // Suppress error so it doesn't crash the application
    console.error('getOrderByCode error:', error);
    return null;
  }
};

export const getSiteSettings = async (companyId: CompanyId): Promise<SiteSettings | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', companyId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SiteSettings;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const getGlobalSettings = async (): Promise<any> => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'global'));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching global settings:', error);
    return null;
  }
};

export const saveGlobalSettings = async (data: any) => {
  try {
    await setDoc(doc(db, 'settings', 'global'), data, { merge: true });
  } catch (error) {
    console.error('Error saving global settings:', error);
  }
};

export const saveSiteSettings = async (companyId: CompanyId, data: Partial<SiteSettings>) => {
  try {
    await setDoc(doc(db, 'settings', companyId), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `settings/${companyId}`);
  }
};

export const subscribeToTelegramLogs = (callback: (logs: any[]) => void) => {
  const path = 'telegram_logs';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const getSystemNotificationsConfig = async (): Promise<any> => {
  try {
    const docSnap = await getDoc(doc(db, 'system_notifications', 'settings'));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching system notifications config:', error);
    return null;
  }
};

export const saveSystemNotificationsConfig = async (data: any) => {
  try {
    const docRef = doc(db, 'system_notifications', 'settings');
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    if (!data.created_at) {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        updateData.created_at = new Date().toISOString();
      }
    }
    await setDoc(docRef, updateData, { merge: true });
  } catch (error) {
    console.error('Error saving system notifications config:', error);
  }
};

export const updateCompanyLogo = async (companyId: CompanyId, logoUrl: string | null) => {
  return saveSiteSettings(companyId, { store_logo: logoUrl });
};

export const deleteCompanyLogo = async (companyId: CompanyId) => {
  return saveSiteSettings(companyId, { store_logo: null });
};

export const subscribeToAllSettings = (callback: (settings: Record<string, SiteSettings>) => void) => {
  const path = 'settings';
  return onSnapshot(collection(db, path), (snapshot) => {
    const results: Record<string, SiteSettings> = {};
    snapshot.docs.forEach(doc => {
      results[doc.id] = { id: doc.id, ...doc.data() } as SiteSettings;
    });
    callback(results);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const saveAppConfig = async (data: Partial<AppConfig>) => {
  const path = 'appConfig/main';
  try {
    await setDoc(doc(db, 'appConfig', 'main'), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeToAppConfig = (callback: (config: AppConfig) => void) => {
  const path = 'appConfig/main';
  return onSnapshot(doc(db, 'appConfig', 'main'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as AppConfig);
    }
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveGiftList = async (list: { code: string; items: Product[]; companyId: string }) => {
  const path = 'giftLists';
  try {
    const payload = sanitize({
      ...list,
      createdAt: serverTimestamp()
    });
    await setDoc(doc(db, path, list.code), payload);
    return true;
  } catch (error) {
    console.error('Failed to save gift list:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const getGiftList = async (code: string) => {
  const path = `giftLists/${code}`;
  try {
    const docSnap = await getDoc(doc(db, 'giftLists', code));
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Check if list is older than 60 days
      if (data.createdAt) {
        let createdAt: Date;
        if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
           createdAt = data.createdAt.toDate();
        } else if (data.createdAt.seconds) {
           createdAt = new Date(data.createdAt.seconds * 1000);
        } else if (data.createdAt instanceof Date) {
           createdAt = data.createdAt;
        } else {
           createdAt = new Date(data.createdAt);
        }
        
        const now = new Date();
        const diffInMs = now.getTime() - createdAt.getTime();
        const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
        if (diffInMs > sixtyDaysInMs) {
          return null; // Expired
        }
      }
      return data;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const getCustomerByCpf = async (cpf: string, companyId: string): Promise<Customer | null> => {
  try {
    const q = query(
      collection(db, 'customers'),
      where('companyId', '==', companyId),
      where('cpfCnpj', '==', cpf)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as Customer;
    }
  } catch (error) {
    console.error('Error fetching customer by CPF:', error);
  }
  return null;
};

export const getGiftListWithStatus = async (code: string): Promise<{ data: any | null, status: 'found' | 'expired' | 'not_found' }> => {
  const path = `giftLists/${code}`;
  try {
    const docSnap = await getDoc(doc(db, 'giftLists', code));
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Check if list is older than 60 days
      if (data.createdAt) {
        let createdAt: Date;
        if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
           createdAt = data.createdAt.toDate();
        } else if (data.createdAt.seconds) {
           createdAt = new Date(data.createdAt.seconds * 1000);
        } else if (data.createdAt instanceof Date) {
           createdAt = data.createdAt;
        } else {
           createdAt = new Date(data.createdAt);
        }
        
        const now = new Date();
        const diffInMs = now.getTime() - createdAt.getTime();
        const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
        if (diffInMs > sixtyDaysInMs) {
          return { data: null, status: 'expired' };
        }
      }
      return { data, status: 'found' };
    }
    return { data: null, status: 'not_found' };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return { data: null, status: 'not_found' };
  }
};

export const subscribeToGiftLists = (callback: (lists: any[]) => void, companyId?: string) => {
  const path = 'giftLists';
  const q = companyId 
    ? query(collection(db, path), where('companyId', '==', companyId))
    : collection(db, path);

  return onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort in memory if needed
    const sorted = [...lists].sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    callback(sorted);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const subscribeToSales = (callback: (sales: any[]) => void, companyId?: CompanyId) => {
  const path = 'sales';
  let q;
  if (companyId) {
    q = query(collection(db, path), where('companyId', '==', companyId), orderBy('createdAt', 'desc'), limit(300));
  } else {
    q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(300));
  }

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    // Fallback to unstructured query if index is missing
    console.warn("Index missing, falling back to unstructured sales query", error);
    const fallbackQ = companyId ? query(collection(db, path), where('companyId', '==', companyId)) : collection(db, path);
    onSnapshot(fallbackQ, (fallbackSnap) => {
      callback(fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (fallbackError) => {
      handleFirestoreError(fallbackError, OperationType.LIST, path);
    });
  });
};

export const subscribeToProducts = (callback: (products: Product[]) => void, companyId?: CompanyId) => {
  const path = 'products';
  const q = companyId 
    ? query(collection(db, path), where('company', '==', companyId))
    : collection(db, path);

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const addSuggestion = async (companyId: CompanyId, message: string) => {
  const path = 'suggestions';
  try {
    await addDoc(collection(db, path), sanitize({
      companyId,
      message,
      createdAt: serverTimestamp(),
      read: false
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToSuggestions = (callback: (suggestions: any[]) => void, companyId?: CompanyId) => {
  const path = 'suggestions';
  const q = companyId 
    ? query(collection(db, path), where('companyId', '==', companyId))
    : collection(db, path);

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const markSuggestionAsRead = async (id: string) => {
  await updateDoc(doc(db, 'suggestions', id), { read: true });
};

export const addFeedback = async (name: string, text: string, stars: number) => {
  const path = 'feedbacks';
  try {
    await addDoc(collection(db, path), sanitize({
      name,
      text,
      stars,
      createdAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToFeedbacks = (callback: (feedbacks: any[]) => void) => {
  const path = 'feedbacks';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    console.warn("Ordered feedbacks failed, falling back to unordered", error);
    onSnapshot(collection(db, path), (fallbackSnap) => {
      const results = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      results.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(results);
    }, (fallbackError) => {
      handleFirestoreError(fallbackError, OperationType.GET, path);
    });
  });
};

export const subscribeToAddons = (callback: (addons: any[]) => void, companyId: CompanyId) => {
  const path = 'addons';
  const q = query(collection(db, path), where('companyId', '==', companyId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const saveAddon = async (data: any) => {
  const path = 'addons';
  try {
    if (data.id) {
      const { id, ...rest } = data;
      await setDoc(doc(db, path, id), sanitize(rest), { merge: true });
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), sanitize({
        ...data,
        createdAt: serverTimestamp()
      }));
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteAddon = async (id: string) => {
  const path = `addons/${id}`;
  try {
    await deleteDoc(doc(db, 'addons', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToPrizes = (callback: (prizes: any[]) => void, companyId: CompanyId) => {
  const path = 'prizes';
  const q = query(collection(db, path), where('companyId', '==', companyId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const savePrize = async (data: any) => {
  const path = 'prizes';
  try {
    if (data.id) {
      const { id, ...rest } = data;
      await setDoc(doc(db, path, id), sanitize(rest), { merge: true });
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), sanitize({
        ...data,
        createdAt: serverTimestamp()
      }));
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deletePrize = async (id: string) => {
  const path = `prizes/${id}`;
  try {
    await deleteDoc(doc(db, 'prizes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveMonthlyProfitHistory = async (companyId: CompanyId, data: { month: string; netProfit: number }) => {
  const path = 'monthly_profit_history';
  try {
    await addDoc(collection(db, path), sanitize({
      ...data,
      companyId,
      createdAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToMonthlyProfitHistory = (callback: (entries: any[]) => void, companyId: CompanyId) => {
  const path = 'monthly_profit_history';
  const q = query(collection(db, path), where('companyId', '==', companyId), orderBy('createdAt', 'desc'));
    
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const logCheckoutEvent = async (
  stepName: string, 
  data: { 
    companyId: string; 
    clientName?: string; 
    total?: number; 
    itemsCount?: number; 
    description?: string; 
  }
) => {
  const path = 'checkout_funnel_logs';
  try {
    await addDoc(collection(db, path), sanitize({
      ...data,
      stepName,
      createdAt: serverTimestamp()
    }));
  } catch (error) {
    console.warn("Could not log checkout event", error);
  }
};

export const subscribeToCheckoutEvents = (callback: (events: any[]) => void, companyId?: string) => {
  const path = 'checkout_funnel_logs';
  const q = companyId 
    ? query(collection(db, path), where('companyId', '==', companyId))
    : collection(db, path);
    
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    list.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const performSystemReset = async (): Promise<void> => {
  const collectionsToClear = [
    'customers',
    'products',
    'insumos',
    'insumo_movements',
    'sales',
    'finance',
    'monthly_profit_history',
    'checkout_funnel_logs',
    'giftLists'
  ];

  for (const colName of collectionsToClear) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const deletePromises = snapshot.docs.map((docSnap) => 
        deleteDoc(doc(db, colName, docSnap.id))
      );
      await Promise.all(deletePromises);
      console.log(`Cleared collection: ${colName}`);
    } catch (e) {
      console.error(`Error resetting collection ${colName}:`, e);
      throw e;
    }
  }
};

