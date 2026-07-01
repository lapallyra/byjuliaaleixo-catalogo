import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { CompanyId, Order } from '../types';
import { subscribeToSales } from '../services/firebaseService';
import { useAuth } from './AuthProvider';

// Types of Orchestrated Events
export type EventPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type OrchestratedEventType = 
  | 'REAL_SALE' 
  | 'NEW_ORDER' 
  | 'STATUS_UPDATE' 
  | 'FEED_ANIMATION' 
  | 'SECONDARY_EFFECT';

export interface OrchestratedEvent {
  id: string;
  type: OrchestratedEventType;
  priority: EventPriority;
  timestamp: number;
  message: string;
  customerName: string;
  productName: string;
  companyId: CompanyId;
  location?: string;
  data?: any;
}

interface AdminOrchestratorContextType {
  // Global States
  hoverActive: boolean;
  activeHoversCount: number;
  performanceMode: boolean;
  firestoreStatus: 'connected' | 'failed' | 'blocked' | 'idle';
  events: OrchestratedEvent[];
  latestEvent: OrchestratedEvent | null;
  
  // Actions
  setHoverActive: (active: boolean) => void;
  registerInteraction: () => void;
  dispatchEvent: (event: Omit<OrchestratedEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
}

const AdminOrchestratorContext = createContext<AdminOrchestratorContextType | undefined>(undefined);

export const AdminOrchestratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  
  // State variables
  const [hoverActive, setHoverActiveState] = useState(false);
  const [activeHoversCount, setActiveHoversCount] = useState(0);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'failed' | 'blocked' | 'idle'>('idle');
  const [events, setEvents] = useState<OrchestratedEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<OrchestratedEvent | null>(null);

  // Refs for tracking performance, intervals and subscriptions
  const interactionCountRef = useRef(0);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const seenEventIds = useRef<Set<string>>(new Set());
  const pendingQueue = useRef<OrchestratedEvent[]>([]);

  // 1. Hover Tracking
  const setHoverActive = (active: boolean) => {
    setActiveHoversCount(prev => {
      const nextCount = active ? prev + 1 : Math.max(0, prev - 1);
      const isHovering = nextCount > 0;
      setHoverActiveState(isHovering);
      return nextCount;
    });
  };

  // 2. Interaction Tracking & Focus/Performance Mode
  const registerInteraction = () => {
    interactionCountRef.current += 1;
    
    // Automatically evaluate interaction density
    if (interactionCountRef.current >= 8) {
      if (!performanceMode) {
        console.log('[Orchestrator] Intense interaction detected. Performance/Focus Mode ENABLED.');
        setPerformanceMode(true);
      }
    }

    // Reset interaction counter after 4 seconds of inactivity
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      interactionCountRef.current = 0;
      if (performanceMode && activeHoversCount <= 1) {
        console.log('[Orchestrator] Interaction stabilized. Performance/Focus Mode DISABLED.');
        setPerformanceMode(false);
      }
    }, 4000);
  };

  // Turn on Performance Mode automatically if multiple hovers are active
  useEffect(() => {
    if (activeHoversCount >= 2) {
      if (!performanceMode) {
        console.log('[Orchestrator] Multiple hovers active. Performance/Focus Mode ENABLED.');
        setPerformanceMode(true);
      }
    } else if (activeHoversCount <= 1 && interactionCountRef.current < 8) {
      if (performanceMode) {
        console.log('[Orchestrator] Multiple hovers cleared. Performance/Focus Mode DISABLED.');
        setPerformanceMode(false);
      }
    }
  }, [activeHoversCount, performanceMode]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  // 3. Dispatch & Priority Routing
  const processAndDispatch = (rawEvent: Omit<OrchestratedEvent, 'id' | 'timestamp'>) => {
    const eventId = crypto.randomUUID();
    const event: OrchestratedEvent = {
      ...rawEvent,
      id: eventId,
      timestamp: Date.now()
    };

    if (seenEventIds.current.has(event.id)) return;
    seenEventIds.current.add(event.id);

    // Apply Priority Logic
    if (event.priority === 'HIGH') {
      // HIGH: Never blocked. Dispatch immediately
      executeDispatch(event);
    } 
    else if (event.priority === 'MEDIUM') {
      // MEDIUM: Delayed if hover is active or performance mode is enabled
      if (hoverActive || performanceMode) {
        const delay = Math.floor(Math.random() * 4000) + 2000; // Delay by 2-6s
        console.log(`[Orchestrator] Delaying MEDIUM priority event (${event.customerName}) by ${delay}ms (Hover/Perf Active)`);
        setTimeout(() => executeDispatch(event), delay);
      } else {
        executeDispatch(event);
      }
    } 
    else if (event.priority === 'LOW') {
      // LOW: Suppressed or grouped if hover is active or performance mode is enabled
      if (hoverActive || performanceMode) {
        console.log(`[Orchestrator] Suppressing LOW priority event: ${event.message} (Hover/Perf Active)`);
        pendingQueue.current.push(event);
        if (pendingQueue.current.length > 5) {
          pendingQueue.current.shift();
        }
      } else {
        executeDispatch(event);
      }
    }
  };

  const executeDispatch = (event: OrchestratedEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 50));
    setLatestEvent(event);

    // Dispatch a browser-level custom event as well for backward compatibility / deep hooks
    const customEvent = new CustomEvent('orchestrated-admin-event', { detail: event });
    window.dispatchEvent(customEvent);

    // Also dispatch the classic iOS chime sale notification event for REAL sales
    if (event.type === 'REAL_SALE') {
      const legacyEvent = new CustomEvent('new-sale-notification', { 
        detail: {
          id: event.id,
          customerName: event.customerName,
          productName: event.productName,
          timeAgo: 'agora mesmo em ' + (event.location || 'São Paulo - SP'),
          companyId: event.companyId
        } 
      });
      window.dispatchEvent(legacyEvent);
    }
  };

  const dispatchEvent = (event: Omit<OrchestratedEvent, 'id' | 'timestamp'>) => {
    processAndDispatch(event);
  };

  const clearEvents = () => {
    setEvents([]);
    setLatestEvent(null);
  };

  // 4. Firestore Live Feed Subscription (Admin Only)
  useEffect(() => {
    let unsubscribeSales = () => {};
    let simulationInterval: NodeJS.Timeout | null = null;

    if (!isAdmin) {
      console.log('[Orchestrator] User is not Admin. Firestore live feed subscription is blocked.');
      setFirestoreStatus('blocked');
      return;
    }

    setFirestoreStatus('idle');

    try {
      console.log('[Orchestrator] Attaching Firestore subscription...');
      unsubscribeSales = subscribeToSales((loadedSales: Order[]) => {
        setFirestoreStatus('connected');
        
        if (loadedSales.length === 0) return;

        const sorted = [...loadedSales].sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        const newest = sorted[0];
        const now = Date.now();
        const saleTime = newest.createdAt?.toMillis?.() || 0;

        // If the sale is fresh (last 45 seconds) and we haven't processed it yet
        if (now - saleTime < 45000 && newest.id && !seenEventIds.current.has(newest.id)) {
          console.log('[Orchestrator] Real-time sale received from Firestore:', newest.id);
          
          processAndDispatch({
            type: 'REAL_SALE',
            priority: 'HIGH',
            message: `${newest.customerName} comprou ${newest.items?.[0]?.product_name || 'um produto exclusivo'}`,
            customerName: newest.customerName,
            productName: newest.items?.[0]?.product_name || 'um produto exclusivo',
            companyId: newest.companyId || 'pallyra',
            location: 'São Paulo - SP',
            data: newest
          });
        }
      }, undefined);

      // 5. Periodic Simulation (Purchase Toasts) removed - now handled independently in SiteApp
    } catch (err) {
      console.error('[Orchestrator] Failed to connect to Firestore.', err);
      setFirestoreStatus('failed');
    }

    return () => {
      unsubscribeSales();
      if (simulationInterval) clearInterval(simulationInterval);
    };
  }, [isAdmin, performanceMode]);

  // Expose context properties
  const value = useMemo(() => ({
    hoverActive,
    activeHoversCount,
    performanceMode,
    firestoreStatus,
    events,
    latestEvent,
    setHoverActive,
    registerInteraction,
    dispatchEvent,
    clearEvents
  }), [hoverActive, activeHoversCount, performanceMode, firestoreStatus, events, latestEvent]);

  return (
    <AdminOrchestratorContext.Provider value={value}>
      {children}
    </AdminOrchestratorContext.Provider>
  );
};

export const useAdminOrchestrator = () => {
  const context = useContext(AdminOrchestratorContext);
  if (context === undefined) {
    throw new Error('useAdminOrchestrator must be used within an AdminOrchestratorProvider');
  }
  return context;
};
