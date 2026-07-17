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
  limit,
  runTransaction,
  writeBatch,
  or
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sendTelegramNotification } from './telegramService';
import { createAuditLog } from './auditService';
import { Product, SaleNotification, CheckoutData, CompanyId, Order, CartItem, Insumo, Customer, FinanceEntry, SiteSettings, AppConfig, Coupon, ProductionBatch, AuditActionType, AuditLog, Campaign, OrderTimelineEvent, CrmSettings, Memory } from '../types';
import { eventBus } from './eventBus';
import { normalizeCustomerAddresses, syncAddressesToLegacy } from '../lib/addressUtils';
import { normalizePhone, isOrderFromCustomer } from '../utils/customerUtils';

// --- Smart Cache & Subscription Multiplexing Layer ---
class FirestoreMultiplexer<T> {
  private collectionName: string;
  private queryFn: () => any;
  private fallbackQueryFn?: () => any;
  private cache: T[] | null = null;
  private subscribers: Set<(data: T[]) => void> = new Set();
  private unsubscribeFromFirestore: (() => void) | null = null;
  private isPreloading: boolean = false;

  constructor(collectionName: string, queryFn: () => any, fallbackQueryFn?: () => any) {
    this.collectionName = collectionName;
    this.queryFn = queryFn;
    this.fallbackQueryFn = fallbackQueryFn;
  }

  hasCache(): boolean {
    return this.cache !== null;
  }

  getCache(): T[] {
    return this.cache || [];
  }

  subscribe(callback: (data: T[]) => void, companyIdFilter?: string, companyIdField: string = 'companyId'): () => void {
    const filteredCallback = (data: T[]) => {
      if (companyIdFilter) {
        callback(data.filter((item: any) => {
          const val = (item as any)[companyIdField];
          const secondaryVal = (item as any).company;
          return val === companyIdFilter || secondaryVal === companyIdFilter;
        }));
      } else {
        callback(data);
      }
    };

    this.subscribers.add(filteredCallback);

    // If cache already exists, return it IMMEDIATELY synchronously (zero frame layout delay)
    if (this.cache !== null) {
      filteredCallback(this.cache);
    }

    if (!this.unsubscribeFromFirestore) {
      this.startFirestoreListener();
    }

    return () => {
      this.subscribers.delete(filteredCallback);
    };
  }

  preload() {
    if (this.cache === null && !this.isPreloading && !this.unsubscribeFromFirestore) {
      this.isPreloading = true;
      this.startFirestoreListener();
    }
  }

  private notifyAll() {
    if (this.cache) {
      this.subscribers.forEach(cb => {
        try {
          cb(this.cache!);
        } catch (e) {
          console.error(`[Cache] Error notifying subscriber for ${this.collectionName}:`, e);
        }
      });
    }
  }

  private detectAndTriggerEvents(oldCache: T[], newCache: T[]) {
    try {
      if (this.collectionName === 'orders') {
        const oldMap = new Map(oldCache.map((x: any) => [x.id, x]));
        newCache.forEach((newItem: any) => {
          const oldItem = oldMap.get(newItem.id);
          if (!oldItem) {
            eventBus.emit('ORDER_CREATED', { order: newItem });
          } else {
            const statusChanged = oldItem.status !== newItem.status;
            const oldPaid = oldItem.status === 'paid' || oldItem.status === 'fully_paid' || oldItem.paymentStatus === 'paid';
            const newPaid = newItem.status === 'paid' || newItem.status === 'fully_paid' || newItem.paymentStatus === 'paid';
            
            if (newPaid && !oldPaid) {
              eventBus.emit('ORDER_PAID', { order: newItem });
            } else if (newItem.status === 'cancelled' && oldItem.status !== 'cancelled') {
              eventBus.emit('ORDER_CANCELLED', { order: newItem });
            } else if (statusChanged) {
              eventBus.emit('ORDER_UPDATED', { order: newItem, changes: ['status'] });
            }
          }
        });
      } else if (this.collectionName === 'products') {
        const oldMap = new Map(oldCache.map((x: any) => [x.id, x]));
        newCache.forEach((newItem: any) => {
          const oldItem = oldMap.get(newItem.id);
          if (!oldItem) {
            eventBus.emit('PRODUCT_CREATED', { product: newItem });
          } else {
            const oldStock = oldItem.stock ?? 0;
            const newStock = newItem.stock ?? 0;
            if (newStock !== oldStock) {
              eventBus.emit('STOCK_UPDATED', { product: newItem, oldStock, newStock });
              if (newStock <= 5 && oldStock > 5) {
                eventBus.emit('STOCK_LOW', { product: newItem, currentStock: newStock });
              }
            }
          }
        });
      } else if (this.collectionName === 'customers') {
        const oldMap = new Map(oldCache.map((x: any) => [x.id, x]));
        newCache.forEach((newItem: any) => {
          const oldItem = oldMap.get(newItem.id);
          if (!oldItem) {
            eventBus.emit('CLIENT_CREATED', { customer: newItem });
          }
        });
      }
    } catch (e) {
      console.error(`[Cache] Error detecting events for ${this.collectionName}:`, e);
    }
  }

  private startFirestoreListener() {
    console.log(`[Cache] Init multiplexed real-time listener: ${this.collectionName}`);
    let q;
    try {
      q = this.queryFn();
    } catch (e) {
      console.warn(`[Cache] Query builder failed for ${this.collectionName}, using fallback`, e);
      q = this.fallbackQueryFn ? this.fallbackQueryFn() : collection(db, this.collectionName);
    }

    this.unsubscribeFromFirestore = onSnapshot(q, (snapshot) => {
      this.isPreloading = false;
      const data = snapshot.docs.map(doc => {
        const docData = doc.data() as any;
        if (this.collectionName === 'orders' && docData.status) {
          docData.status = normalizeStatus(docData.status);
        }
        return { id: doc.id, ...docData } as any;
      });
      
      if (this.collectionName === 'orders') {
        data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });
      }
      
      const oldCache = this.cache;
      this.cache = data;
      this.notifyAll();

      if (oldCache !== null) {
        this.detectAndTriggerEvents(oldCache, data);
      }
    }, (error) => {
      console.warn(`[Cache] Listener failed on ${this.collectionName}`, error);
      if (this.fallbackQueryFn && this.unsubscribeFromFirestore) {
        if (typeof this.unsubscribeFromFirestore === 'function') {
          this.unsubscribeFromFirestore();
        }
        
        try {
          const fallbackQ = this.fallbackQueryFn();
          this.unsubscribeFromFirestore = onSnapshot(fallbackQ, (fallbackSnap) => {
            this.isPreloading = false;
            const data = fallbackSnap.docs.map(doc => {
              const docData = doc.data() as any;
              if (this.collectionName === 'orders' && docData.status) {
                docData.status = normalizeStatus(docData.status);
              }
              return { id: doc.id, ...docData } as any;
            });
            
            if (this.collectionName === 'orders') {
              data.sort((a: any, b: any) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                return timeB - timeA;
              });
            }
            
            const oldCache = this.cache;
            this.cache = data;
            this.notifyAll();

            if (oldCache !== null) {
              this.detectAndTriggerEvents(oldCache, data);
            }
          }, (fallbackError) => {
            this.isPreloading = false;
            handleFirestoreError(fallbackError, OperationType.LIST, this.collectionName, false);
          });
        } catch (fbErr) {
          this.isPreloading = false;
          handleFirestoreError(fbErr, OperationType.LIST, this.collectionName, false);
        }
      } else {
        this.isPreloading = false;
        handleFirestoreError(error, OperationType.LIST, this.collectionName, false);
      }
    });
  }
}

export const productsMultiplexer = new FirestoreMultiplexer<Product>(
  'products',
  () => collection(db, 'products')
);

export const salesMultiplexer = new FirestoreMultiplexer<Order>(
  'orders',
  () => query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500)),
  () => collection(db, 'orders')
);

export const customersMultiplexer = new FirestoreMultiplexer<Customer>(
  'customers',
  () => collection(db, 'customers')
);

export const memoriesMultiplexer = new FirestoreMultiplexer<Memory>(
  'memories',
  () => collection(db, 'memories')
);

export const preloadAdminData = () => {
  console.log('[Cache] Preloading administrative cache data...');
  productsMultiplexer.preload();
  salesMultiplexer.preload();
  customersMultiplexer.preload();
  memoriesMultiplexer.preload();
};
// ---------------------------------------------------

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow: boolean = false) {
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

  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

/**
 * Recursively removes all undefined values from an object or array.
 * Useful for cleaning data before sending to Firestore.
 */
function sanitize(data: any): any {
  try {
    if (data === undefined) return undefined;
    if (data === null) return null;

    if (Array.isArray(data)) {
      return data
        .map((item) => sanitize(item))
        .filter((item) => item !== undefined);
    }

    if (typeof data === 'object') {
      // Keep Dates
      if (data instanceof Date || Object.prototype.toString.call(data) === '[object Date]') {
        return data;
      }
      
      // Handle Firestore types (Timestamp, FieldValue) safely
      // We check for common properties as constructor names might change or be mangled
      if (
        data.constructor?.name === 'Timestamp' || 
        data.constructor?.name === 'FieldValueImpl' ||
        data.constructor?.name === 'FieldValue' ||
        (typeof data.seconds === 'number' && typeof data.nanoseconds === 'number') ||
        (typeof data.toMillis === 'function')
      ) {
        return data;
      }

      // Only recurse into plain objects
      if (Object.prototype.toString.call(data) === '[object Object]') {
        const cleaned: any = {};
        let hasProps = false;
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            const val = sanitize(data[key]);
            if (val !== undefined) {
              cleaned[key] = val;
              hasProps = true;
            }
          }
        }
        return hasProps ? cleaned : {};
      }
    }

    return data;
  } catch (e) {
    console.error('Sanitize error:', e);
    return data;
  }
}

export const getProducts = async (companyId?: CompanyId): Promise<Product[]> => {
  if (productsMultiplexer.hasCache()) {
    const cached = productsMultiplexer.getCache();
    if (companyId) {
      return cached.filter(p => p.company === companyId);
    }
    return cached;
  }
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
      await createAuditLog('Produtos', 'Criação', id, productData.product_name, { newData: sanitizedData }, productData.company);
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), sanitizedData);
      await createAuditLog('Produtos', 'Criação', docRef.id, productData.product_name, { newData: sanitizedData }, productData.company);
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
    const prodRef = doc(db, 'products', id);
    const snap = await getDoc(prodRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    await updateDoc(prodRef, sanitize(dataWithoutId));
    
    await createAuditLog(
      'Produtos', 
      'Alteração', 
      id, 
      (productData.product_name || oldData.product_name || id), 
      { 
        oldData: oldData, 
        newData: { ...oldData, ...dataWithoutId },
        details: {
          observations: productData.current_price !== undefined && oldData.current_price !== productData.current_price 
            ? `Alteração de preço: R$ ${oldData.current_price} -> R$ ${productData.current_price}` 
            : undefined
        }
      }, 
      (productData.company || oldData.company)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteProduct = async (id: string) => {
  const path = `products/${id}`;
  try {
    const prodRef = doc(db, 'products', id);
    const snap = await getDoc(prodRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    await deleteDoc(prodRef);
    
    await createAuditLog(
      'Produtos', 
      'Exclusão Lógica', 
      id, 
      (oldData.product_name || id), 
      { oldData: oldData }, 
      oldData.company
    );
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
    await createAuditLog('Estoque', 'Criação', docRef.id, data.name, { newData: data });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateInsumo = async (id: string, data: Partial<Insumo>) => {
  const path = `insumos/${id}`;
  const { id: _, ...dataWithoutId } = data as any;
  try {
    const insumoRef = doc(db, 'insumos', id);
    const snap = await getDoc(insumoRef);
    const oldData = snap.exists() ? snap.data() : {};

    await updateDoc(insumoRef, sanitize(dataWithoutId));
    
    const action: AuditActionType = data.quantity !== undefined ? 'Entrada de Estoque' : 'Alteração';

    await createAuditLog(
      'Estoque', 
      action, 
      id, 
      (data.name || oldData.name || id), 
      { 
        oldData: oldData, 
        newData: { ...oldData, ...dataWithoutId },
        details: { observations: data.quantity !== undefined ? `Alteração de estoque: ${oldData.quantity || 0} -> ${data.quantity}` : undefined }
      }
    );
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

export const addMemory = async (data: Omit<Memory, 'id'>) => {
  const path = 'memories';
  try {
    const docRef = await addDoc(collection(db, path), sanitize({ ...data, createdAt: serverTimestamp() }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateMemory = async (id: string, data: Partial<Memory>) => {
  const path = `memories/${id}`;
  try {
    await updateDoc(doc(db, path), sanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteMemory = async (id: string) => {
  const path = `memories/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToInsumos = (callback: (insumos: Insumo[]) => void) => {
  const path = 'insumos';
  return onSnapshot(collection(db, path), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insumo)));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path, false);
  });
};

export const normalizeStatus = (status: any): any => {
  if (!status) return 'novo pedido';
  if (typeof status !== 'string') return 'novo pedido';
  
  const s = status.trim().toLowerCase();
  
  switch (s) {
    // 1. Novo Pedido
    case 'novo':
    case 'novo_pedido':
    case 'novo-pedido':
    case 'novo pedido':
      return 'novo pedido';

    // 2. Orçamento
    case 'quote':
    case 'orcamento':
    case 'orçamento':
    case 'draft':
      return 'quote';

    // 3. Aguardando Pagamento / Pending
    case 'pending':
    case 'waiting_payment':
    case 'aguardando_pagamento':
    case 'aguardando pagamento':
      return 'waiting_payment';

    // 4. Aprovação Arte / Approved
    case 'approval':
    case 'aprovacao':
    case 'aprovação':
    case 'aprovacao_arte':
    case 'aprovacao de arte':
    case 'aprovado':
    case 'approved':
      return 'approval';

    // 5. Aguardando Sinal
    case 'waiting_deposit':
    case 'sinal_pendente':
    case 'aguardando_sinal':
    case 'aguardando sinal':
      return 'waiting_deposit';

    // 6. Aguardando Produção
    case 'waiting_production':
    case 'aguardando_producao':
    case 'aguardando produção':
    case 'aguardando producao':
      return 'waiting_production';

    // 7. Em Produção
    case 'production':
    case 'em_producao':
    case 'em produção':
    case 'producao':
    case 'produção':
    case 'in_production':
      return 'production';

    // 8. Montagem
    case 'assembly':
    case 'montagem':
    case 'em_montagem':
    case 'em montagem':
      return 'assembly';

    // 9. Conferência
    case 'conferencing':
    case 'conferencia':
    case 'conferência':
      return 'conferencing';

    // 10. Pronto para entrega
    case 'ready':
    case 'pronto':
    case 'pronto_entrega':
    case 'pronto para entrega':
    case 'pronto para retirada':
    case 'pronto_retirada':
      return 'ready';

    // 11. Embalagem
    case 'packaging':
    case 'embalagem':
    case 'em_embalagem':
    case 'em embalagem':
      return 'packaging';

    // 12. Em Entrega / Enviado
    case 'delivery':
    case 'enviado':
    case 'em entrega':
    case 'em_entrega':
    case 'shipped':
      return 'delivery';

    // 13. Entregue
    case 'delivered':
    case 'entregue':
      return 'delivered';

    // 14. Concluído / Finalizado
    case 'finalized':
    case 'finalizado':
      return 'finalized';

    // 15. Totalmente Pago / Pago
    case 'fully_paid':
    case 'concluido':
    case 'concluído':
    case 'paid':
      return 'fully_paid';

    // 16. Cancelado
    case 'cancelled':
    case 'cancelado':
      return 'cancelled';

    default:
      return status;
  }
};

export const DEDUCT_STATUSES = [
  'novo pedido', 'approval', 'production', 'conferencing', 'assembly', 
  'ready', 'packaging', 'delivered', 'delivery', 'paid', 'fully_paid', 
  'finalized', 'waiting_production'
];

const orderStockMutexes = new Map<string, Promise<any>>();

const runWithMutex = async (orderId: string, fn: () => Promise<any>) => {
  while (orderStockMutexes.has(orderId)) {
    try {
      await orderStockMutexes.get(orderId);
    } catch (e) {}
  }
  const promise = fn();
  orderStockMutexes.set(orderId, promise);
  try {
    return await promise;
  } finally {
    orderStockMutexes.delete(orderId);
  }
};

interface StockRequirement {
  products: { [productId: string]: number };
  insumos: { [insumoId: string]: number };
  addons: { [addonId: string]: number };
}

function getStockRequirements(items: CartItem[]): StockRequirement {
  const reqs: StockRequirement = { products: {}, insumos: {}, addons: {} };
  for (const item of items) {
    const qty = item.quantity || 1;
    if (item.productId && !item.isKit) {
      reqs.products[item.productId] = (reqs.products[item.productId] || 0) + qty;
      
      if (item.insumos && item.insumos.length > 0) {
        for (const req of item.insumos) {
          reqs.insumos[req.insumoId] = (reqs.insumos[req.insumoId] || 0) + (req.quantity * qty);
        }
      }
    }
    if (item.isKit && item.kitItems && item.kitItems.length > 0) {
      for (const ki of item.kitItems) {
        const itemQty = ki.quantity * qty;
        if (ki.type === 'product') {
          reqs.products[ki.id] = (reqs.products[ki.id] || 0) + itemQty;
        } else if (ki.type === 'insumo') {
          reqs.insumos[ki.id] = (reqs.insumos[ki.id] || 0) + itemQty;
        } else if (ki.type === 'addon') {
          reqs.addons[ki.id] = (reqs.addons[ki.id] || 0) + itemQty;
        }
      }
    }
  }
  return reqs;
}

export const adjustStockForOrderItems = async (orderId: string, orderCode: string, oldItems: CartItem[], newItems: CartItem[]) => {
  const oldReqs = getStockRequirements(oldItems);
  const newReqs = getStockRequirements(newItems);

  // 1. Adjust Products Stock
  const allProductIds = new Set([...Object.keys(oldReqs.products), ...Object.keys(newReqs.products)]);
  for (const prodId of allProductIds) {
    const oldQty = oldReqs.products[prodId] || 0;
    const newQty = newReqs.products[prodId] || 0;
    const delta = newQty - oldQty;
    if (delta !== 0) {
      try {
        const prodRef = doc(db, 'products', prodId);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const pData = prodSnap.data();
          if (typeof pData.stock === 'number') {
            const newStock = Math.max(0, pData.stock - delta);
            await updateDoc(prodRef, { stock: newStock });
          }
        }
      } catch (err) {
        console.warn(`Could not adjust stock for product ${prodId}:`, err);
      }
    }
  }

  // 2. Adjust Insumos Stock & Log movements
  const allInsumoIds = new Set([...Object.keys(oldReqs.insumos), ...Object.keys(newReqs.insumos)]);
  for (const insumoId of allInsumoIds) {
    const oldQty = oldReqs.insumos[insumoId] || 0;
    const newQty = newReqs.insumos[insumoId] || 0;
    const delta = newQty - oldQty;
    if (delta !== 0) {
      try {
        const insumoRef = doc(db, 'insumos', insumoId);
        const insumoSnap = await getDoc(insumoRef);
        if (insumoSnap.exists()) {
          const currentQty = insumoSnap.data().quantity || 0;
          const newQuantity = Math.max(0, currentQty - delta);
          await updateDoc(insumoRef, { quantity: newQuantity });

          try {
            await addDoc(collection(db, 'insumo_movements'), sanitize({
              insumoId: insumoId,
              insumoName: insumoSnap.data()?.name || 'Material',
              orderId: orderId,
              orderCode: orderCode || orderId,
              productName: 'Ajuste de Pedido',
              quantityDeducted: Math.abs(delta),
              timestamp: new Date().toISOString(),
              type: delta > 0 ? 'out' : 'in'
            }));
          } catch (logErr) {}

          if (newQuantity <= 10 && delta > 0) {
            try {
              sendTelegramNotification('low_stock', `⚠️ ESTOQUE BAIXO\n\nInsumo (Ajuste):\n${insumoSnap.data().name || 'Material'}\n\nQuantidade Atual:\n${newQuantity}`);
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn(`Could not adjust stock for insumo ${insumoId}:`, err);
      }
    }
  }

  // 3. Adjust Addons Stock
  const allAddonIds = new Set([...Object.keys(oldReqs.addons), ...Object.keys(newReqs.addons)]);
  for (const addonId of allAddonIds) {
    const oldQty = oldReqs.addons[addonId] || 0;
    const newQty = newReqs.addons[addonId] || 0;
    const delta = newQty - oldQty;
    if (delta !== 0) {
      try {
        const addonRef = doc(db, 'addons', addonId);
        const addonSnap = await getDoc(addonRef);
        if (addonSnap.exists()) {
          const aData = addonSnap.data();
          if (typeof aData.stock === 'number') {
            const newStock = Math.max(0, aData.stock - delta);
            await updateDoc(addonRef, { stock: newStock });
          }
        }
      } catch (err) {
        console.warn(`Could not adjust stock for addon ${addonId}:`, err);
      }
    }
  }
};

export const deductStockForOrder = async (orderId: string, orderData: Order) => {
  return runWithMutex(orderId, async () => {
    let alreadyDeducted = false;
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);
        if (orderSnap.exists() && orderSnap.data().insumosDeducted === true) {
          alreadyDeducted = true;
          return;
        }
        transaction.update(orderRef, { insumosDeducted: true });
      });
    } catch (txErr) {
      console.warn("Transaction failed in deductStockForOrder, assuming lock/concurrency conflict:", txErr);
      alreadyDeducted = true;
    }

    if (alreadyDeducted) {
      console.log(`[deductStockForOrder] Stock already deducted for order ${orderId}. Skipping.`);
      return;
    }

    const items = orderData.items || [];
    for (const item of items) {
      if (item.productId && !item.isKit) {
        try {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const pData = prodSnap.data();
            if (typeof pData.stock === 'number') {
              const newStock = Math.max(0, pData.stock - (item.quantity || 1));
              await updateDoc(prodRef, { stock: newStock });
            }
          }
        } catch (err) {
          console.warn('Could not deduct stock for product', item.productId, err);
        }
      }

      if (item.insumos && item.insumos.length > 0) {
        for (const requiredInsumo of item.insumos) {
          try {
            const insumoRef = doc(db, 'insumos', requiredInsumo.insumoId);
            const insumoSnap = await getDoc(insumoRef);
            if (insumoSnap.exists()) {
              const currentQty = insumoSnap.data().quantity || 0;
              const reduction = requiredInsumo.quantity * item.quantity;
              const newQty = Math.max(0, currentQty - reduction);
              await updateDoc(insumoRef, { quantity: newQty });

              try {
                await addDoc(collection(db, 'insumo_movements'), sanitize({
                  insumoId: requiredInsumo.insumoId,
                  insumoName: insumoSnap.data()?.name || 'Material',
                  orderId: orderId,
                  orderCode: orderData.code || orderId,
                  productName: item.product_name || 'Produto',
                  quantityDeducted: reduction,
                  timestamp: new Date().toISOString(),
                  type: 'out'
                }));
              } catch (logErr) {
                console.warn('Logging movement error:', logErr);
              }

              if (newQty <= 10) {
                try {
                  sendTelegramNotification('low_stock', `⚠️ ESTOQUE BAIXO\n\nProduto:\n${insumoSnap.data().name || 'Material'}\n\nQuantidade Atual:\n${newQty}`);
                } catch (e) {}
              }
            }
          } catch (err) {
            console.warn(`Could not deduct stock for insumo ${requiredInsumo.insumoId}:`, err);
          }
        }
      }

      if (item.isKit && item.kitItems && item.kitItems.length > 0) {
        for (const ki of item.kitItems) {
          const qtyToDeduct = ki.quantity * item.quantity;
          try {
            if (ki.type === 'product') {
              const prodRef = doc(db, 'products', ki.id);
              const prodSnap = await getDoc(prodRef);
              if (prodSnap.exists()) {
                const pData = prodSnap.data();
                if (typeof pData.stock === 'number') {
                  const newStock = Math.max(0, pData.stock - qtyToDeduct);
                  await updateDoc(prodRef, { stock: newStock });
                }
              }
            } else if (ki.type === 'insumo') {
              const insumoRef = doc(db, 'insumos', ki.id);
              const insumoSnap = await getDoc(insumoRef);
              if (insumoSnap.exists()) {
                const currentQty = insumoSnap.data().quantity || 0;
                const newQty = Math.max(0, currentQty - qtyToDeduct);
                await updateDoc(insumoRef, { quantity: newQty });

                try {
                  await addDoc(collection(db, 'insumo_movements'), sanitize({
                    insumoId: ki.id,
                    insumoName: insumoSnap.data()?.name || 'Material Kit',
                    orderId: orderId,
                    orderCode: orderData.code || orderId,
                    productName: `[Kit] ${item.product_name}`,
                    quantityDeducted: qtyToDeduct,
                    timestamp: new Date().toISOString(),
                    type: 'out'
                  }));
                } catch (logErr) {}

                if (newQty <= 10) {
                  try {
                    sendTelegramNotification('low_stock', `⚠️ ESTOQUE BAIXO\n\nInsumo do Kit:\n${insumoSnap.data().name || 'Material'}\n\nQuantidade Atual:\n${newQty}`);
                  } catch (e) {}
                }
              }
            } else if (ki.type === 'addon') {
              const addonRef = doc(db, 'addons', ki.id);
              const addonSnap = await getDoc(addonRef);
              if (addonSnap.exists()) {
                const aData = addonSnap.data();
                if (typeof aData.stock === 'number') {
                  const newStock = Math.max(0, aData.stock - qtyToDeduct);
                  await updateDoc(addonRef, { stock: newStock });
                }
              }
            }
          } catch (err) {
            console.warn(`Could not deduct stock for kit item ${ki.id}:`, err);
          }
        }
      }
    }
  });
};

export const restoreStockForOrder = async (orderId: string, orderData: Order) => {
  return runWithMutex(orderId, async () => {
    let alreadyRestored = false;
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists() || orderSnap.data().insumosDeducted !== true) {
          alreadyRestored = true;
          return;
        }
        transaction.update(orderRef, { insumosDeducted: false });
      });
    } catch (txErr) {
      console.warn("Transaction failed in restoreStockForOrder, assuming lock/concurrency conflict:", txErr);
      alreadyRestored = true;
    }

    if (alreadyRestored) {
      console.log(`[restoreStockForOrder] Stock already restored/not deducted for order ${orderId}. Skipping.`);
      return;
    }

    const items = orderData.items || [];
    for (const item of items) {
      if (item.productId && !item.isKit) {
        try {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const pData = prodSnap.data();
            if (typeof pData.stock === 'number') {
              const newStock = pData.stock + (item.quantity || 1);
              await updateDoc(prodRef, { stock: newStock });
            }
          }
        } catch (err) {
          console.warn('Could not restore stock for product', item.productId, err);
        }
      }

      if (item.insumos && item.insumos.length > 0) {
        for (const requiredInsumo of item.insumos) {
          try {
            const insumoRef = doc(db, 'insumos', requiredInsumo.insumoId);
            const insumoSnap = await getDoc(insumoRef);
            if (insumoSnap.exists()) {
              const currentQty = insumoSnap.data().quantity || 0;
              const addition = requiredInsumo.quantity * item.quantity;
              const newQty = currentQty + addition;
              await updateDoc(insumoRef, { quantity: newQty });

              try {
                await addDoc(collection(db, 'insumo_movements'), sanitize({
                  insumoId: requiredInsumo.insumoId,
                  insumoName: insumoSnap.data()?.name || 'Material',
                  orderId: orderId,
                  orderCode: orderData.code || orderId,
                  productName: item.product_name || 'Produto',
                  quantityDeducted: addition,
                  timestamp: new Date().toISOString(),
                  type: 'in'
                }));
              } catch (logErr) {
                console.warn('Logging movement error:', logErr);
              }
            }
          } catch (err) {
            console.warn(`Could not restore stock for insumo ${requiredInsumo.insumoId}:`, err);
          }
        }
      }

      if (item.isKit && item.kitItems && item.kitItems.length > 0) {
        for (const ki of item.kitItems) {
          const qtyToRestore = ki.quantity * item.quantity;
          try {
            if (ki.type === 'product') {
              const prodRef = doc(db, 'products', ki.id);
              const prodSnap = await getDoc(prodRef);
              if (prodSnap.exists()) {
                const pData = prodSnap.data();
                if (typeof pData.stock === 'number') {
                  const newStock = pData.stock + qtyToRestore;
                  await updateDoc(prodRef, { stock: newStock });
                }
              }
            } else if (ki.type === 'insumo') {
              const insumoRef = doc(db, 'insumos', ki.id);
              const insumoSnap = await getDoc(insumoRef);
              if (insumoSnap.exists()) {
                const currentQty = insumoSnap.data().quantity || 0;
                const newQty = currentQty + qtyToRestore;
                await updateDoc(insumoRef, { quantity: newQty });

                try {
                  await addDoc(collection(db, 'insumo_movements'), sanitize({
                    insumoId: ki.id,
                    insumoName: insumoSnap.data()?.name || 'Material Kit',
                    orderId: orderId,
                    orderCode: orderData.code || orderId,
                    productName: `[Kit] ${item.product_name}`,
                    quantityDeducted: qtyToRestore,
                    timestamp: new Date().toISOString(),
                    type: 'in'
                  }));
                } catch (logErr) {}
              }
            } else if (ki.type === 'addon') {
              const addonRef = doc(db, 'addons', ki.id);
              const addonSnap = await getDoc(addonRef);
              if (addonSnap.exists()) {
                const aData = addonSnap.data();
                if (typeof aData.stock === 'number') {
                  const newStock = aData.stock + qtyToRestore;
                  await updateDoc(addonRef, { stock: newStock });
                }
              }
            }
          } catch (err) {
            console.warn(`Could not restore stock for kit item ${ki.id}:`, err);
          }
        }
      }
    }
  });
};

export const updateOrder = async (orderId: string, data: Partial<Order>) => {
  const path = `sales/${orderId}`;
  const { id: _, ...dataWithoutId } = data as any;
  try {
    let finalData = { ...dataWithoutId };
    
    if (finalData.status) {
      finalData.status = normalizeStatus(finalData.status);
      if (finalData.status === 'fully_paid') {
        finalData.paymentStatus = 'paid';
      }
    }

    const orderRef = doc(db, 'orders', orderId);
    let orderData = (data as Order); // Fallback
    let orderSnap: any = null;
    
    try {
      orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const dbData = orderSnap.data() as any;
        if (dbData.status) {
          dbData.status = normalizeStatus(dbData.status);
        }
        orderData = { ...dbData, ...data } as Order; // Merged
        if (orderData.status) {
          orderData.status = normalizeStatus(orderData.status);
        }
        if (orderData.status === 'fully_paid') {
          orderData.paymentStatus = 'paid';
        }
      }
    } catch (err) {
      console.warn("Could not read order data for merging (expected if public user):", err);
    }

    // Real-time payment processing (ERP-101)
    if (typeof finalData.payAmount === 'number' && finalData.payAmount > 0) {
      const payAmount = finalData.payAmount;
      const paymentMethod = finalData.paymentMethod || 'Não informado';
      
      const items = orderData.items || [];
      const subtotal = items.reduce((sum: number, item: any) => sum + ((item.retail_price || item.current_price || 0) * (item.quantity || 1)), 0);
      const discount = orderData.discount || 0;
      const shipping = orderData.shippingCost || 0;
      const total = orderData.total || (subtotal + shipping - discount);
      
      const dbOrderData = orderSnap?.exists() ? (orderSnap.data() as Order) : null;
      let currentPaid = 0;
      if (dbOrderData) {
        if (typeof dbOrderData.signalValue === 'number') {
          currentPaid = dbOrderData.signalValue;
        } else if (dbOrderData.hasSignal) {
          // Histórico migrado: hasSignal é verdadeiro, mas signalValue não existe
          currentPaid = subtotal * 0.5;
        } else if (dbOrderData.paymentStatus === 'paid' || dbOrderData.status === 'fully_paid') {
          currentPaid = total;
        }
      }
      
      const newPaidTotal = currentPaid + payAmount;
      const fullyCleared = newPaidTotal >= total;
      
      finalData.hasSignal = true;
      finalData.signalValue = newPaidTotal;
      finalData.paymentStatus = fullyCleared ? "paid" : "partial";
      finalData.paymentMethod = paymentMethod;
      
      const oldStatus = dbOrderData ? normalizeStatus(dbOrderData.status) : 'novo pedido';
      if (fullyCleared) {
        finalData.status = 'fully_paid';
      } else {
        finalData.status = (oldStatus === 'waiting_payment') ? 'waiting_production' : (dbOrderData?.status || 'novo pedido');
      }
      
      try {
        await addDoc(collection(db, 'finance'), sanitize({
          type: 'revenue',
          category: 'Quitação de Parcela',
          description: `Quitação ${fullyCleared ? "Integral" : "Parcial"} Pedido ${orderData.code || orderId} - ${orderData.customerName || 'Cliente'}`,
          value: payAmount,
          date: new Date().toISOString().split('T')[0],
          status: 'paid',
          paymentMethod: paymentMethod,
          companyId: orderData.companyId || '',
          orderId: orderId,
          createdAt: serverTimestamp()
        }));
        console.log(`✅ Lançamento financeiro registrado automaticamente para o pedido ${orderId}`);
      } catch (e) {
        console.warn('Non-blocking finance registration error in updateOrder:', e);
      }
      
      delete finalData.payAmount;
      
      // Update orderData as well so subsequent stock/status checks use the updated status/paymentStatus
      orderData.hasSignal = true;
      orderData.signalValue = newPaidTotal;
      orderData.paymentStatus = finalData.paymentStatus;
      orderData.status = finalData.status;
    }

    // Centralized stock deduction or restore based on status transition (ERP-098)
    if (orderSnap?.exists?.()) {
      const dbOrderData = orderSnap.data() as Order;
      const oldStatus = normalizeStatus(dbOrderData.status);
      const newStatus = finalData.status || oldStatus;
      const wasDeducted = dbOrderData.insumosDeducted === true;
      const shouldBeDeducted = DEDUCT_STATUSES.includes(newStatus);

      if (shouldBeDeducted && !wasDeducted) {
        await deductStockForOrder(orderId, orderData);
        finalData.insumosDeducted = true;
      } else if (!shouldBeDeducted && wasDeducted) {
        await restoreStockForOrder(orderId, orderData);
        finalData.insumosDeducted = false;
      } else if (shouldBeDeducted && wasDeducted && (finalData.items || data.items)) {
        const oldItems = dbOrderData.items || [];
        const newItems = finalData.items || data.items || [];
        await adjustStockForOrderItems(orderId, dbOrderData.code || orderId, oldItems, newItems);
      }
    }

    // AUTOMATIC TIMELINE INTEGRATION
    if (orderSnap?.exists?.()) {
      const dbOrderData = orderSnap.data() as Order;
      
      let existingTimeline: OrderTimelineEvent[] = dbOrderData.timeline || [];
      if (!Array.isArray(existingTimeline)) {
        existingTimeline = [];
      }

      // Handle legacy orders with no history: prepend standard initial event
      if (existingTimeline.length === 0) {
        existingTimeline.push({
          id: 'imported_' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          description: "Pedido importado para o novo sistema de Timeline",
          user: "Sistema",
          timestamp: Date.now()
        });
      }

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const userStr = data.updatedBy || auth.currentUser?.email || auth.currentUser?.displayName || "Membro da Equipe";

      let timelineAdded = false;

      // 1. Status alteration
      if (finalData.status && finalData.status !== dbOrderData.status) {
        let desc = "Status alterado";
        const s = finalData.status.toLowerCase();
        if (s === 'production') {
          desc = "Pedido enviado para produção";
        } else if (s === 'delivered') {
          desc = "Pedido entregue";
        } else if (s === 'cancelled') {
          desc = "Pedido cancelado";
        } else if (s === 'fully_paid' || s === 'finalized') {
          desc = "Pedido finalizado";
        } else {
          const statusMap: Record<string, string> = {
            "novo pedido": "Novo Pedido",
            "quote": "Orçamento",
            "orçamento": "Orçamento",
            "waiting_payment": "Sinal",
            "waiting_deposit": "Sinal",
            "approval": "Aprovação",
            "assembly": "Montagem",
            "conferencing": "Conferência",
            "packaging": "Embalagem",
            "ready": "Pronto para Entregar",
            "delivery": "Enviado/Entrega",
            "delivered": "Entregue/Recebido",
            "fully_paid": "Entregue/Recebido",
            "cancelled": "Cancelado"
          };
          const label = statusMap[s] || finalData.status;
          desc = `Status alterado para: ${label}`;
        }

        existingTimeline.push({
          id: 'status_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          date: dateStr,
          time: timeStr,
          description: desc,
          user: userStr,
          timestamp: Date.now()
        });
        timelineAdded = true;
      }

      // 2. Payment registered
      const oldPaymentsCount = dbOrderData.payments?.length || 0;
      const newPaymentsCount = finalData.payments?.length || 0;
      if (newPaymentsCount > oldPaymentsCount) {
        const newPay = finalData.payments[finalData.payments.length - 1];
        const amountStr = newPay ? ` no valor de R$ ${newPay.amount.toFixed(2).replace('.', ',')}` : '';
        const methodStr = newPay ? ` via ${newPay.method.toUpperCase()}` : '';
        existingTimeline.push({
          id: 'payment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          date: dateStr,
          time: timeStr,
          description: `Pagamento registrado${amountStr}${methodStr}`,
          user: userStr,
          timestamp: Date.now()
        });
        timelineAdded = true;
      } else if (typeof data.payAmount === 'number' && data.payAmount > 0) {
        existingTimeline.push({
          id: 'payment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          date: dateStr,
          time: timeStr,
          description: `Pagamento registrado no valor de R$ ${data.payAmount.toFixed(2).replace('.', ',')} via ${(data.paymentMethod || 'PIX').toUpperCase()}`,
          user: userStr,
          timestamp: Date.now()
        });
        timelineAdded = true;
      }

      // 3. Other edits
      const isEditEvent = !timelineAdded && (
        (finalData.items && JSON.stringify(finalData.items) !== JSON.stringify(dbOrderData.items)) ||
        (finalData.deliveryDate && finalData.deliveryDate !== dbOrderData.deliveryDate) ||
        (finalData.customizationName && finalData.customizationName !== dbOrderData.customizationName) ||
        (finalData.customizationTheme && finalData.customizationTheme !== dbOrderData.customizationTheme) ||
        (finalData.customizationColors && finalData.customizationColors !== dbOrderData.customizationColors) ||
        (finalData.customizationArtText && finalData.customizationArtText !== dbOrderData.customizationArtText) ||
        (finalData.customizationNotes && finalData.customizationNotes !== dbOrderData.customizationNotes) ||
        (finalData.observations && finalData.observations !== dbOrderData.observations) ||
        (finalData.total !== undefined && finalData.total !== dbOrderData.total)
      );

      if (isEditEvent) {
        existingTimeline.push({
          id: 'edit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          date: dateStr,
          time: timeStr,
          description: "Pedido editado",
          user: userStr,
          timestamp: Date.now()
        });
        timelineAdded = true;
      }

      if (timelineAdded) {
        finalData.timeline = existingTimeline;
      }
    }

    await updateDoc(doc(db, 'orders', orderId), sanitize(finalData));

    if (orderSnap?.exists?.()) {
      const dbOrderData = orderSnap.data() as Order;
      await createAuditLog('Pedidos', 'Alteração', orderId, dbOrderData.code || orderId, { oldData: dbOrderData, newData: { ...dbOrderData, ...finalData } }, dbOrderData.companyId);
    }

    // Finance status synchronization, restoration and shielding (ERP-087, ERP-088, ERP-103)
    try {
      const dbOrderData = orderSnap?.exists() ? (orderSnap.data() as Order) : null;
      const oldStatus = dbOrderData ? normalizeStatus(dbOrderData.status) : 'novo pedido';
      const newStatus = finalData.status || oldStatus;
      
      const isReopened = (oldStatus === 'cancelled' && newStatus !== 'cancelled');
      const isCanceledNow = (newStatus === 'cancelled');
      
      const isPaidNow = (data.paymentStatus === 'paid' || finalData.paymentStatus === 'paid' || ['paid', 'fully_paid'].includes(newStatus));
      
      const orderCode = dbOrderData ? dbOrderData.code : null;
      
      // Find all finance entries matching orderId or orderCode
      const financeQuery1 = query(collection(db, 'finance'), where('orderId', '==', orderId));
      const financeSnap1 = await getDocs(financeQuery1);
      const docsToUpdate = new Map();
      for (const fDoc of financeSnap1.docs) {
        docsToUpdate.set(fDoc.id, fDoc);
      }
      if (orderCode && orderCode !== orderId) {
        const financeQuery2 = query(collection(db, 'finance'), where('orderId', '==', orderCode));
        const financeSnap2 = await getDocs(financeQuery2);
        for (const fDoc of financeSnap2.docs) {
          docsToUpdate.set(fDoc.id, fDoc);
        }
      }
      
      for (const [fDocId, fDoc] of docsToUpdate.entries()) {
        const fData = fDoc.data();
        
        if (isCanceledNow) {
          // If canceled, all docs go to cancelled status
          if (fData.status !== 'cancelled') {
            await updateDoc(doc(db, 'finance', fDocId), { status: 'cancelled' });
            console.log(`✅ Sincronização Financeira: Registro ${fDocId} atualizado para status "cancelled" para o pedido ${orderId}`);
          }
        } else if (isReopened) {
          // If reopened from cancelled, restore status
          let restoredStatus: 'paid' | 'pending' = 'pending';
          if (fData.category === 'Quitação de Parcela') {
            restoredStatus = 'paid';
          } else if (fData.category === 'Venda de Produto') {
            restoredStatus = isPaidNow ? 'paid' : 'pending';
          } else {
            restoredStatus = 'paid';
          }
          await updateDoc(doc(db, 'finance', fDocId), { status: restoredStatus });
          console.log(`✅ Sincronização Financeira: Registro ${fDocId} restaurado para status "${restoredStatus}" ao reabrir o pedido ${orderId}`);
        } else {
          // Regular status/payment changes (shielding against manual inconsistencies)
          if (isPaidNow) {
            // Update everything to paid
            if (fData.status !== 'paid') {
              await updateDoc(doc(db, 'finance', fDocId), { status: 'paid' });
              console.log(`✅ Sincronização Financeira: Registro ${fDocId} atualizado para status "paid" para o pedido ${orderId}`);
            }
          } else {
            // If the order is unpaid/partially paid, "Venda de Produto" should be pending,
            // but "Quitação de Parcela" should remain 'paid'.
            if (fData.category === 'Venda de Produto') {
              if (fData.status !== 'pending') {
                await updateDoc(doc(db, 'finance', fDocId), { status: 'pending' });
                console.log(`✅ Sincronização Financeira: Venda de Produto ${fDocId} atualizada para "pending" (pedido não integralmente pago)`);
              }
            } else if (fData.category === 'Quitação de Parcela') {
              if (fData.status !== 'paid') {
                await updateDoc(doc(db, 'finance', fDocId), { status: 'paid' });
                console.log(`✅ Sincronização Financeira: Quitação de Parcela ${fDocId} mantida/atualizada como "paid"`);
              }
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn("Error during finance status sync/restoration:", syncErr);
    }

    // Audit Log for status change
    if (data.status && orderSnap.exists() && orderSnap.data().status !== data.status) {
      await createAuditLog(
        'Pedidos', 
        'Mudança de Status', 
        orderId, 
        (orderData.code || orderId), 
        { 
          oldData: orderSnap.data().status, 
          newData: data.status,
          details: { observations: `Status alterado de ${orderSnap.data().status} para ${data.status}` }
        }, 
        orderData.companyId
      );
    } else {
      await createAuditLog(
        'Pedidos', 
        'Alteração', 
        orderId, 
        (orderData.code || orderId), 
        { 
          oldData: orderSnap?.exists?.() ? orderSnap.data() : {}, 
          newData: finalData 
        }, 
        orderData.companyId
      );
    }

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

    // Dynamic recalculation of CRM Indicators
    try {
      const dbOrderData = orderSnap?.exists() ? (orderSnap.data() as Order) : undefined;
      await syncCustomerIndicatorsForOrder(orderData, orderData.companyId, dbOrderData);
    } catch (e) {
      console.warn("Non-blocking customer CRM indicators sync error in updateOrder:", e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateOrderStatus = async (orderId: string, newStatus: Order['status'], items?: CartItem[]) => {
  return updateOrder(orderId, { status: newStatus, items });
};

export const saveSale = async (data: any) => {
  const path = 'orders';
  try {
    const today = new Date();
    const deliveryDate = calculateDeliveryDate(today, 7);
    
    const isKitOrder = data.items && data.items.some((item: any) => item.isKit);
    const code = data.code || (isKitOrder ? await generateUniqueKitCode() : generateOrderCode(data.companyId));
    
    const normalizedStatus = normalizeStatus(data.status || 'novo pedido');

    const now = new Date();
    const createdEvent: OrderTimelineEvent = {
      id: 'created_' + Date.now(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      description: "Pedido criado",
      user: data.updatedBy || data.customerName || "Sistema",
      timestamp: Date.now()
    };

    const saleData = sanitize({
      ...data,
      timeline: [createdEvent],
      createdAt: serverTimestamp(),
      dateFormatted: formatDate(today),
      code: code,
      status: normalizedStatus,
      source: 'catalogo',
      deliveryDate: deliveryDate,
      estimatedDelivery: deliveryDate,
      insumosDeducted: false
    });
    
    let docRef = doc(db, 'orders', saleData.code);
    try {
      await setDoc(docRef, saleData);
      console.log('✅ Document successfully added to sales collection:', docRef.id);
      
      await createAuditLog('Pedidos', 'Criação', docRef.id, saleData.code, { newData: saleData }, saleData.companyId);
      
      // Auto-update Gift List items to 'presenteado' if they originated from a list
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          if (item.giftListCode && item.id) {
            try {
              await updateGiftListItemStatusByCode(item.giftListCode, item.id, 'presenteado', data.customerName || "Convidado");
            } catch (giftError) {
              console.error('Error auto-updating gift list item on checkout:', giftError);
            }
          }
        }
      }
    } catch (dbError) {
      console.error('❌ Firestore setDoc ERROR for path "orders":', dbError);
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
      const isPaid = data.paymentStatus === 'paid' || data.status === 'paid' || data.status === 'fully_paid';
      await addDoc(collection(db, 'finance'), sanitize({
        type: 'revenue',
        category: 'Venda de Produto',
        description: `Pedido ${saleData.code} - ${saleData.customerName}`,
        value: saleData.total,
        date: new Date().toISOString().split('T')[0],
        status: isPaid ? 'paid' : 'pending',
        companyId: saleData.companyId,
        orderId: docRef.id,
        marketplace: saleData.marketplace || '',
        marketplaceTax: saleData.marketplaceTax || 0,
        createdAt: serverTimestamp()
      }));
    } catch (e) {
      console.warn('Non-blocking finance registration error:', e);
    }

    // Automatic stock deduction for products, insumos, and kits (ERP-098)
    const orderDataForDeduction = { ...saleData, id: docRef.id } as Order;
    if (DEDUCT_STATUSES.includes(normalizedStatus)) {
      await deductStockForOrder(docRef.id, orderDataForDeduction);
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

function generateKitOrderCode(): string {
  const random = Math.floor(10000 + Math.random() * 90000).toString();
  return `K${random}T`;
}

async function generateUniqueKitCode(): Promise<string> {
    while(true) {
        const code = generateKitOrderCode();
        const existing = await getOrderByCode(code);
        if (!existing) return code;
    }
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

export const findMatchingCustomer = async (orderData: Partial<Order>, companyId: string) => {
  const path = 'customers';
  
  // 1. Direct match by ID
  if (orderData.customerId) {
    const custRef = doc(db, path, orderData.customerId);
    const snap = await getDoc(custRef);
    if (snap.exists()) return snap;
  }

  // 2. Targeted search using identifiers
  const orderEmail = orderData.customerEmail?.toLowerCase().trim();
  const orderCpf = normalizePhone(orderData.customerCpfCnpj);
  const orderPhone = normalizePhone(orderData.contact);

  const conditions = [];
  if (orderEmail) conditions.push(where('email', '==', orderEmail));
  if (orderCpf) conditions.push(where('cpfCnpj', '==', orderCpf));
  if (orderPhone) conditions.push(where('contact', '==', orderPhone));

  if (conditions.length > 0) {
    try {
      const q = query(
        collection(db, path),
        where('companyId', '==', companyId),
        or(...conditions) as any
      );
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0];
    } catch (err) {
      console.warn("Failed targeted customer search, falling back to name match.", err);
    }
  }

  // 3. Last resort: Name match (avoid broad queries if possible)
  if (orderData.customerName) {
    const qName = query(
      collection(db, path),
      where('companyId', '==', companyId),
      where('name', '==', orderData.customerName)
    );
    const snap = await getDocs(qName);
    if (!snap.empty) return snap.docs[0];
  }

  return null;
};

export const recalculateCustomerIndicators = async (customerRef: any, companyId: string) => {
  try {
    const custSnap = await getDoc(customerRef);
    if (!custSnap.exists()) return;
    const customerId = customerRef.id;
    const customer = custSnap.data() as Customer;

    const custPhone = normalizePhone(customer.contact);
    const custCpf = normalizePhone(customer.cpfCnpj);
    const custEmail = customer.email?.toLowerCase().trim();

    // 1. Optimized Query: Targeted search instead of loading all orders
    const conditions = [
      where('customerId', '==', customerId)
    ];

    if (custEmail) conditions.push(where('customerEmail', '==', custEmail));
    if (custPhone) conditions.push(where('contact', '==', custPhone));
    if (custCpf) conditions.push(where('customerCpfCnpj', '==', custCpf));

    const qOrders = query(
      collection(db, 'orders'),
      where('companyId', '==', companyId),
      or(...conditions) as any
    );

    const ordersSnap = await getDocs(qOrders);

    let totalSpent = 0;
    let ordersCount = 0;
    let hasMigration = false;
    const batch = writeBatch(db);

    for (const orderDoc of ordersSnap.docs) {
      const o = orderDoc.data() as Order;
      
      // Use centralized matching logic
      if (isOrderFromCustomer(o, { ...customer, id: customerId })) {
        // SILENT MIGRATION: Update order with customerId if missing
        if (!o.customerId) {
          batch.update(orderDoc.ref, { customerId });
          hasMigration = true;
        }

        const status = o.status ? normalizeStatus(o.status) : '';
        if (status !== 'cancelled' && status !== 'quote') {
          totalSpent += Number(o.total) || 0;
          ordersCount += 1;
        }
      }
    }

    if (hasMigration) {
      await batch.commit();
      console.log(`Silent migration completed for customer ${customer.name}: linked orders.`);
    }

    const ticketMedio = ordersCount > 0 ? totalSpent / ordersCount : 0;

    await updateDoc(customerRef, {
      totalSpent,
      ordersCount,
      ticketMedio
    });

    console.log(`Updated customer ${customer.name} indicators: totalSpent=${totalSpent}, ordersCount=${ordersCount}, ticketMedio=${ticketMedio}`);
  } catch (err) {
    console.error("Error recalculating customer indicators:", err);
  }
};

export const syncCustomerIndicatorsForOrder = async (
  orderData: Partial<Order>,
  companyId: string,
  previousOrderData?: Partial<Order>
) => {
  try {
    if (previousOrderData) {
      const prevCustomerDoc = await findMatchingCustomer(previousOrderData, companyId);
      if (prevCustomerDoc) {
        await recalculateCustomerIndicators(prevCustomerDoc.ref, companyId);
      }
    }

    let currentCustomerDoc = await findMatchingCustomer(orderData, companyId);

    if (!currentCustomerDoc) {
      if (orderData.customerName && companyId) {
        const customerCode = crypto.randomUUID().slice(0, 8).toUpperCase();
        const newCustomerData = sanitize({
          code: customerCode,
          name: orderData.customerName,
          contact: orderData.contact || 'S/C',
          cpfCnpj: orderData.customerCpfCnpj || '',
          totalSpent: 0,
          ordersCount: 0,
          companyId: companyId,
          createdAt: serverTimestamp(),
          birthDate: '',
          address: '',
          city: '',
          state: '',
          zipCode: ''
        });
        const docRef = await addDoc(collection(db, 'customers'), newCustomerData);
        currentCustomerDoc = { ref: docRef, data: () => newCustomerData } as any;

        try {
          sendTelegramNotification('new_client', `👤 NOVO CLIENTE\n\nNome:\n${orderData.customerName || 'Cliente sem nome'}\n\nContato:\n${orderData.contact || 'S/C'}`);
        } catch(e){}
      }
    }

    if (currentCustomerDoc) {
      await recalculateCustomerIndicators(currentCustomerDoc.ref, companyId);
    }
  } catch (err) {
    console.error("Error syncing customer indicators for order:", err);
  }
};

const handleCustomerOrder = async (orderData: Order) => {
  try {
    await syncCustomerIndicatorsForOrder(orderData, orderData.companyId);
  } catch (err) {
    console.warn('Failed to register customer:', err);
  }
};

export const syncCustomerFromCheckout = async (companyId: CompanyId, data: Partial<Customer>) => {
  const path = 'customers';
  try {
    if (!data.contact) return;

    // Search by contact first
    const q = query(
      collection(db, path),
      where('contact', '==', data.contact),
      where('companyId', '==', companyId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const customerDoc = snapshot.docs[0];
      const existingData = customerDoc.data();
      
      // Update only if values are provided and more complete than existing
      const updateData: any = {};
      if (data.name && !existingData.name) updateData.name = data.name;
      if (data.cpfCnpj && !existingData.cpfCnpj) updateData.cpfCnpj = data.cpfCnpj;
      if (data.email && !existingData.email) updateData.email = data.email;
      if (data.address && !existingData.address) updateData.address = data.address;
      if (data.city && !existingData.city) updateData.city = data.city;
      if (data.state && !existingData.state) updateData.state = data.state;
      if (data.zipCode && !existingData.zipCode) updateData.zipCode = data.zipCode;
      if (data.number && !existingData.number) updateData.number = data.number;
      if (data.neighborhood && !existingData.neighborhood) updateData.neighborhood = data.neighborhood;

      if (Object.keys(updateData).length > 0) {
        await updateDoc(customerDoc.ref, updateData);
      }
    } else if (data.name) {
      // Create new if not found
      await addCustomer({
        name: data.name,
        contact: data.contact,
        companyId: companyId,
        cpfCnpj: data.cpfCnpj || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        number: data.number || '',
        neighborhood: data.neighborhood || '',
        totalSpent: 0,
        ordersCount: 0,
        birthDate: ''
      });
    }
  } catch (error) {
    console.error('Failed to sync customer from checkout:', error);
  }
};
export const addCustomer = async (data: Omit<Customer, 'id' | 'code' | 'createdAt'>) => {
  const settings = await getCrmSettings(data.companyId);
  
  if (settings.requireCpf && (!data.cpfCnpj || data.cpfCnpj.length < 11)) {
     throw new Error("CPF/CNPJ é obrigatório.");
  }
  
  if (settings.usePhoneId && data.contact) {
     const q = query(collection(db, 'customers'), where('companyId', '==', data.companyId), where('contact', '==', data.contact));
     const snap = await getDocs(q);
     if (!snap.empty) {
        throw new Error("Cliente com esse WhatsApp já cadastrado.");
     }
  }

  const path = 'customers';
  try {
    const customerCode = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
    const addresses = normalizeCustomerAddresses(data as Customer);
    const legacy = syncAddressesToLegacy(addresses);
    
    const docRef = await addDoc(collection(db, path), sanitize({
      ...data,
      ...legacy,
      addresses,
      code: customerCode,
      createdAt: serverTimestamp(),
      totalSpent: data.totalSpent || 0,
      ordersCount: data.ordersCount || 0
    }));

    await createAuditLog('Clientes', 'Criação', docRef.id, data.name, { newData: data }, data.companyId);

    try {
      sendTelegramNotification('new_client', `👤 NOVO CLIENTE\n\nNome:\n${data.name || 'Cliente sem nome'}\n\nContato:\n${data.contact || 'S/C'}`);
    } catch(e){}

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToCustomers = (callback: (customers: Customer[]) => void, companyId?: CompanyId) => {
  return customersMultiplexer.subscribe(callback, companyId, 'companyId');
};

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  const path = `customers/${id}`;
  
  let dataToUpdate = { ...data };
  if (dataToUpdate.addresses) {
    const legacy = syncAddressesToLegacy(dataToUpdate.addresses);
    dataToUpdate = { ...dataToUpdate, ...legacy };
  }
  
  const { id: _, ...dataWithoutId } = dataToUpdate as any;
  
  try {
    const custRef = doc(db, 'customers', id);
    const snap = await getDoc(custRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    await updateDoc(custRef, sanitize(dataWithoutId));
    
    await createAuditLog(
      'Clientes', 
      'Alteração', 
      id, 
      (data.name || oldData.name || id), 
      { oldData: oldData, newData: { ...oldData, ...dataWithoutId } }, 
      (data.companyId || oldData.companyId)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteCustomer = async (id: string) => {
  const path = `customers/${id}`;
  try {
    const custRef = doc(db, 'customers', id);
    const snap = await getDoc(custRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    // Delete related memories to prevent orphans
    const memoriesQuery = query(collection(db, 'memories'), where('customerId', '==', id));
    const memoriesSnap = await getDocs(memoriesQuery);
    
    if (!memoriesSnap.empty) {
      const batch = writeBatch(db);
      memoriesSnap.docs.forEach((memoryDoc) => {
        batch.delete(memoryDoc.ref);
      });
      await batch.commit();
    }
    
    await deleteDoc(custRef);
    
    await createAuditLog('Clientes', 'Exclusão Lógica', id, (oldData.name || id), { oldData: oldData }, oldData.companyId);
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
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'finance', false));
};

export const createFinanceEntry = async (data: Omit<FinanceEntry, 'id'>) => {
  const path = 'finance';
  try {
    const docRef = await addDoc(collection(db, 'finance'), sanitize({
      ...data,
      createdAt: serverTimestamp()
    }));
    await createAuditLog('Financeiro', 'Criação', docRef.id, `Lançamento ${docRef.id} - ${data.description}`, { newData: data }, data.companyId);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deleteFinanceEntry = async (id: string, companyId?: CompanyId) => {
  const path = `finance/${id}`;
  try {
    const finRef = doc(db, 'finance', id);
    const snap = await getDoc(finRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    await deleteDoc(finRef);
    await createAuditLog('Financeiro', 'Exclusão Lógica', id, `Lançamento ${id}`, { oldData: oldData }, companyId || (oldData as any).companyId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateFinanceEntry = async (id: string, data: Partial<FinanceEntry>) => {
  const path = `finance/${id}`;
  try {
    const finRef = doc(db, 'finance', id);
    const snap = await getDoc(finRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    await updateDoc(finRef, sanitize(data));
    
    await createAuditLog('Financeiro', 'Alteração', id, `Lançamento ${id}`, { oldData: oldData, newData: { ...oldData, ...data } }, (data.companyId || (oldData as any).companyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getOrderByCode = async (code: string): Promise<Order | null> => {
  try {
    const uppercaseCode = code.toUpperCase();
    
    try {
      const docSnap = await getDoc(doc(db, 'orders', uppercaseCode));
      if (docSnap.exists()) {
        const orderData = docSnap.data() as any;
        if (orderData.status) {
          orderData.status = normalizeStatus(orderData.status);
        }
        return { id: docSnap.id, ...orderData } as Order;
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
    const settingsRef = doc(db, 'settings', 'global');
    const snap = await getDoc(settingsRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    await setDoc(settingsRef, sanitize(data), { merge: true });
    
    await createAuditLog('Configurações', 'Alteração', 'global', 'Configurações Globais', { oldData: oldData, newData: data });
  } catch (error) {
    console.error('Error fetching global settings:', error);
  }
};

export const getCrmSettings = async (companyId: CompanyId): Promise<CrmSettings> => {
  try {
    const docSnap = await getDoc(doc(db, 'crmSettings', companyId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CrmSettings;
    }
    return {
      companyId,
      usePhoneId: true,
      requireCpf: false,
      alertIncomplete: true,
      allowEditCheckout: false
    };
  } catch (error) {
    console.error('Error fetching CRM settings:', error);
    return {
      companyId,
      usePhoneId: true,
      requireCpf: false,
      alertIncomplete: true,
      allowEditCheckout: false
    };
  }
};

export const saveCrmSettings = async (companyId: CompanyId, settings: CrmSettings): Promise<void> => {
  try {
    await setDoc(doc(db, 'crmSettings', companyId), settings, { merge: true });
    await createAuditLog('Clientes', 'Atualização', companyId, 'Atualização de configurações de CRM', { details: settings });
  } catch (error) {
    console.error('Error saving CRM settings:', error);
    throw error;
  }
};

export const saveSiteSettings = async (companyId: CompanyId, data: Partial<SiteSettings>) => {
  try {
    const settingsRef = doc(db, 'settings', companyId);
    const snap = await getDoc(settingsRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    await setDoc(settingsRef, sanitize(data), { merge: true });
    
    await createAuditLog('Configurações', 'Alteração', companyId, `Configurações ${companyId}`, { oldData: oldData, newData: data }, companyId);
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
    const updateData = sanitize({
      ...data,
      updated_at: new Date().toISOString()
    });
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
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
};

export const saveAppConfig = async (data: Partial<AppConfig>) => {
  const path = 'appConfig/main';
  try {
    await setDoc(doc(db, 'appConfig', 'main'), sanitize(data), { merge: true });
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
  }, (error) => handleFirestoreError(error, OperationType.GET, path, false));
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

export const updateGiftListItemStatusByCode = async (
  code: string,
  itemId: string,
  status: 'disponivel' | 'reservado' | 'presenteado',
  name?: string
) => {
  const path = `giftLists/${code}`;
  try {
    const docRef = doc(db, 'giftLists', code);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedItems = (data.items || []).map((item: any) => {
        if (item.id === itemId) {
          return {
            ...item,
            status,
            reservedBy: status === 'reservado' ? (name || null) : (status === 'disponivel' ? null : (item.reservedBy || null)),
            giftedBy: status === 'presenteado' ? (name || null) : (status === 'disponivel' ? null : (item.giftedBy || null))
          };
        }
        return item;
      });
      await updateDoc(docRef, { items: updatedItems });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to update gift list item:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
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
  if (customersMultiplexer.hasCache()) {
    const cached = customersMultiplexer.getCache();
    const found = cached.find(c => c.cpfCnpj === cpf && c.companyId === companyId);
    if (found) return found;
  }
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
  return salesMultiplexer.subscribe(callback, companyId, 'companyId');
};

export const subscribeToProducts = (callback: (products: Product[]) => void, companyId?: CompanyId) => {
  return productsMultiplexer.subscribe(callback, companyId, 'company');
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
    handleFirestoreError(error, OperationType.GET, path, false);
  });
};

export const markSuggestionAsRead = async (id: string) => {
  await updateDoc(doc(db, 'suggestions', id), { read: true });
};

export const addFeedback = async (name: string, text: string, stars: number, status: 'pending' | 'approved' = 'approved') => {
  const path = 'feedbacks';
  try {
    await addDoc(collection(db, path), sanitize({
      name,
      text,
      stars,
      status,
      createdAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateFeedbackStatus = async (id: string, status: 'pending' | 'approved') => {
  const path = `feedbacks/${id}`;
  try {
    await updateDoc(doc(db, 'feedbacks', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteFeedback = async (id: string) => {
  const path = `feedbacks/${id}`;
  try {
    await deleteDoc(doc(db, 'feedbacks', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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
      handleFirestoreError(fallbackError, OperationType.GET, path, false);
    });
  });
};

export const subscribeToApprovedFeedbacks = (callback: (feedbacks: any[]) => void) => {
  const path = 'feedbacks';
  const q = query(collection(db, path), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    console.warn("Ordered approved feedbacks failed, falling back to client filter", error);
    // If composite index is missing, we fallback to all and let client filter if needed, 
    // but better to just try without order first
    const fallbackQ = query(collection(db, path), where('status', '==', 'approved'));
    onSnapshot(fallbackQ, (fallbackSnap) => {
      const results = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      results.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(results);
    }, (fallbackError) => {
      handleFirestoreError(fallbackError, OperationType.GET, path, false);
    });
  });
};

export const subscribeToAddons = (callback: (addons: any[]) => void, companyId: CompanyId) => {
  const path = 'addons';
  const q = query(collection(db, path), where('companyId', '==', companyId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
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

export const getAddons = async (companyId?: CompanyId): Promise<any[]> => {
  const path = 'addons';
  try {
    const coll = collection(db, path);
    const q = companyId ? query(coll, where('companyId', '==', companyId)) : coll;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
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
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
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
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
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
    handleFirestoreError(error, OperationType.LIST, path, false);
  });
};

export const performSystemReset = async (): Promise<void> => {
  const collectionsToClear = [
    'customers',
    'products',
    'insumos',
    'insumo_movements',
    'orders',
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

export const subscribeToCollections = (callback: (collections: any[]) => void) => {
  const path = 'product_collections';
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
};

export const saveCollection = async (data: any) => {
  const path = 'product_collections';
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

export const deleteCollection = async (id: string) => {
  const path = `product_collections/${id}`;
  try {
    await deleteDoc(doc(db, 'product_collections', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ----------------------------------------------------
// MEDIA CENTER (FOLDERS & FILES)
// ----------------------------------------------------

export const subscribeToMediaFolders = (callback: (folders: any[]) => void) => {
  const path = 'media_folders';
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
};

export const saveMediaFolder = async (data: any) => {
  const path = 'media_folders';
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

export const deleteMediaFolder = async (id: string) => {
  const path = `media_folders/${id}`;
  try {
    await deleteDoc(doc(db, 'media_folders', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToMediaFiles = (callback: (files: any[]) => void) => {
  const path = 'media_files';
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
};

export const saveMediaFile = async (data: any) => {
  const path = 'media_files';
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

export const deleteMediaFile = async (id: string) => {
  const path = `media_files/${id}`;
  try {
    await deleteDoc(doc(db, 'media_files', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ----------------------------------------------------
// CAMPAIGNS (CAMPANHAS)
// ----------------------------------------------------

export const subscribeToCampaigns = (callback: (campaigns: Campaign[]) => void, companyId?: CompanyId) => {
  const path = 'campaigns';
  let q = query(collection(db, path));
  
  if (companyId && (companyId as string) !== 'all') {
    q = query(collection(db, path), where('companyId', 'in', [companyId, 'all']));
  }
  
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
    // Sort manually if orderBy is suspected to cause issues
    results.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    callback(results);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
};

export const saveCampaign = async (data: Partial<Campaign>) => {
  const path = 'campaigns';
  try {
    if (data.id) {
      const { id, ...rest } = data;
      const camRef = doc(db, path, id);
      const snap = await getDoc(camRef);
      const oldData = snap.exists() ? snap.data() : {};
      
      await setDoc(camRef, sanitize({ ...rest, updatedAt: serverTimestamp() }), { merge: true });
      await createAuditLog('Configurações', 'Alteração', id, data.title || 'Campanha', { oldData: oldData, newData: data }, data.companyId as CompanyId);
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), sanitize({
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
      await createAuditLog('Configurações', 'Criação', docRef.id, data.title || 'Campanha', { newData: data }, data.companyId as CompanyId);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteCampaign = async (id: string) => {
  const path = `campaigns/${id}`;
  try {
    await deleteDoc(doc(db, 'campaigns', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ----------------------------------------------------
// COUPONS (CUPONS)
// ----------------------------------------------------

export const subscribeToCoupons = (callback: (coupons: Coupon[]) => void, companyId?: CompanyId) => {
  const path = 'coupons';
  const q = companyId && (companyId as string) !== 'all'
    ? query(collection(db, path), where('companyId', '==', companyId))
    : query(collection(db, path));
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
};

export const saveCoupon = async (data: Partial<Coupon>) => {
  const path = 'coupons';
  try {
    if (data.id) {
      const { id, ...rest } = data;
      const coupRef = doc(db, path, id);
      const snap = await getDoc(coupRef);
      const oldData = snap.exists() ? snap.data() : {};
      
      await setDoc(coupRef, sanitize(rest), { merge: true });
      await createAuditLog('Configurações', 'Alteração', id, data.code || 'Cupom', { oldData: oldData, newData: data }, data.companyId);
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), sanitize({
        ...data,
        createdAt: serverTimestamp()
      }));
      await createAuditLog('Configurações', 'Criação', docRef.id, data.code || 'Cupom', { newData: data }, data.companyId);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteCoupon = async (id: string) => {
  const path = `coupons/${id}`;
  try {
    await deleteDoc(doc(db, 'coupons', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getCoupons = async (companyId?: CompanyId): Promise<Coupon[]> => {
  const path = 'coupons';
  try {
    const q = companyId && (companyId as string) !== 'all'
      ? query(collection(db, path), where('companyId', '==', companyId))
      : query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
  } catch (error) {
    console.error("Erro ao carregar cupons:", error);
    return [];
  }
};

export const createProductionBatch = async (batch: Omit<ProductionBatch, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'productionBatches'), {
      ...batch,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update linked orders with the batchId
    for (const orderId of batch.orderIds) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { batchId: docRef.id });
    }
    
    await createAuditLog('Produção', 'Criação', docRef.id, `Lote #${docRef.id.substring(0,6)}`, { newData: batch }, batch.companyId);
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'productionBatches');
    return null;
  }
};

export const updateProductionBatch = async (batchId: string, data: Partial<ProductionBatch>) => {
  try {
    const docRef = doc(db, 'productionBatches', batchId);
    const snap = await getDoc(docRef);
    const oldData = snap.exists() ? snap.data() : {};
    
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    await createAuditLog('Produção', 'Alteração', batchId, `Lote #${batchId.substring(0,6)}`, { oldData: oldData, newData: { ...oldData, ...data } });
    
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `productionBatches/${batchId}`);
    return false;
  }
};

export const subscribeToProductionBatches = (companyId: CompanyId, callback: (batches: ProductionBatch[]) => void) => {
  const q = companyId === 'all' as any 
    ? collection(db, 'productionBatches')
    : query(collection(db, 'productionBatches'), where('companyId', '==', companyId));
    
  return onSnapshot(q, (snapshot) => {
    const batches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductionBatch));
    callback(batches);
  });
};

export const subscribeToAuditLogs = (callback: (logs: AuditLog[]) => void, companyId?: CompanyId) => {
  const path = 'audit_logs';
  const q = companyId && (companyId as string) !== 'all'
    ? query(collection(db, path), where('companyId', '==', companyId), orderBy('createdAt', 'desc'))
    : query(collection(db, path), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path, false));
};




