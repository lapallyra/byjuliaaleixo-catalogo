import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthProvider';
import { useAdminOrchestrator } from '../AdminOrchestratorSystem';
import { subscribeToAllSettings, subscribeToApprovedFeedbacks, subscribeToCampaigns } from '../../services/firebaseService';
import { commemorativeDateService } from '../../services/commemorativeDateService';
import { Product, SiteSettings, Campaign, CommemorativeDate } from '../../types';
import { DEFAULT_COMMEMORATIVE_DATES } from '../../lib/commemorativeDateUtils';

export function useHomeData(allProducts: Product[] = []) {
  const { user, isAdmin } = useAuth();
  const orchestrator = useAdminOrchestrator();
  const [customSettings, setCustomSettings] = useState<Record<string, SiteSettings | null>>({});
  const [realFeedbacks, setRealFeedbacks] = useState<any[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [commemorativeDates, setCommemorativeDates] = useState<CommemorativeDate[]>(DEFAULT_COMMEMORATIVE_DATES);

  // Anti-printscreen & Ctrl+P prevention effect
  useEffect(() => {
    const isUserAdmin = isAdmin || (user as any)?.role === "admin";
    if (isUserAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isAdmin, user]);

  useEffect(() => {
    const unsubSettings = subscribeToAllSettings((results) => setCustomSettings(results));
    const unsubFeedbacks = subscribeToApprovedFeedbacks((results) => setRealFeedbacks(results));
    const unsubCampaigns = subscribeToCampaigns((results) => setActiveCampaigns(results));
    
    // Subscribe to custom commemorative dates from Firestore and merge with defaults
    const unsubDates = commemorativeDateService.subscribe((firestoreDates) => {
      if (firestoreDates && firestoreDates.length > 0) {
        // Merge without duplicating IDs or slugs
        const mergedMap = new Map<string, CommemorativeDate>();
        
        // Add defaults first
        DEFAULT_COMMEMORATIVE_DATES.forEach(d => {
          mergedMap.set(d.id, d);
        });

        // Override or add with Firestore data
        firestoreDates.forEach(d => {
          mergedMap.set(d.id, {
            ...d,
            scope: d.scope || (d.is_national ? 'nacional' : 'regional')
          });
        });

        setCommemorativeDates(Array.from(mergedMap.values()));
      } else {
        setCommemorativeDates(DEFAULT_COMMEMORATIVE_DATES);
      }
    });

    return () => {
      unsubSettings();
      unsubFeedbacks();
      unsubCampaigns();
      unsubDates();
    };
  }, []);

  const kits = useMemo(() => {
    return allProducts.filter(p => p.isKit && p.isVisible !== false).slice(0, 4);
  }, [allProducts]);

  return {
    customSettings,
    realFeedbacks,
    activeCampaigns,
    commemorativeDates,
    kits
  };
}
