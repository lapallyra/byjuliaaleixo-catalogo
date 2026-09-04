import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AuditLog, AuditModule, AuditActionType, CompanyId } from '../types';
import { matchesAtelierScope } from './atelierScopePolicy';

/**
 * Creates a new audit log entry.
 * This is the central service for all module audit logging.
 */
export const createAuditLog = async (
  module: AuditModule,
  action: AuditActionType,
  resourceId: string,
  resourceName: string,
  data?: {
    oldData?: any;
    newData?: any;
    origin?: AuditLog['origin'];
    details?: any;
    correlationId?: string;
  },
  companyId?: CompanyId
) => {
  try {
    const user = auth.currentUser;
    const userId = user?.uid || 'system';
    const userEmail = user?.email || 'system@erp.com';
    const userName = user?.displayName || 'Sistema';
    const userRole = (user as any)?.role === 'admin' ? 'Administrador' : 'Funcionário';

    const now = new Date();
    
    const auditData: Omit<AuditLog, 'id'> = {
      correlationId: data?.correlationId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 12)),
      timestamp: serverTimestamp(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('pt-BR'),
      user: {
        uid: userId,
        email: userEmail,
        name: userName,
        role: userRole as any
      },
      module,
      action,
      resourceId,
      resourceName,
      oldData: data?.oldData || null,
      newData: data?.newData || null,
      origin: data?.origin || 'Web',
      details: data?.details || null,
      companyId
    };

    await addDoc(collection(db, 'audit_logs'), auditData);
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

/**
 * Subscribes to audit logs with real-time updates and filtering.
 */
export const subscribeToAuditLogs = (
  callback: (logs: AuditLog[]) => void, 
  filters?: {
    module?: AuditModule | '';
    action?: AuditActionType | '';
    companyId?: CompanyId | '';
    dateStart?: string;
    dateEnd?: string;
    resourceId?: string;
  } | CompanyId
) => {
  const normalizedFilters = typeof filters === 'string' ? { companyId: filters } : (filters || {});
  let q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(300));

  if (normalizedFilters.module) {
    q = query(q, where('module', '==', normalizedFilters.module));
  }
  if (normalizedFilters.action) {
    q = query(q, where('action', '==', normalizedFilters.action));
  }
  if (normalizedFilters.resourceId) {
    q = query(q, where('resourceId', '==', normalizedFilters.resourceId));
  }

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as AuditLog));
    
    let filteredLogs = logs;

    if (normalizedFilters.companyId && (normalizedFilters.companyId as string) !== 'all') {
      filteredLogs = filteredLogs.filter(log => matchesAtelierScope(log, normalizedFilters.companyId as CompanyId, 'auditoria'));
    }

    // Client-side date filtering since Firestore composite indexes are complex
    if (normalizedFilters.dateStart) {
      filteredLogs = filteredLogs.filter(log => log.date >= (normalizedFilters.dateStart || ''));
    }
    if (normalizedFilters.dateEnd) {
      filteredLogs = filteredLogs.filter(log => log.date <= (normalizedFilters.dateEnd || ''));
    }

    callback(filteredLogs);
  }, (error) => {
    console.warn('subscribeToAuditLogs snapshot warning:', error);
  });
};

/**
 * Helper to generate changes object for Audit details
 */
export const trackChanges = (oldData: any, newData: any) => {
  const changes: { field: string; from: any; to: any }[] = [];
  
  Object.keys(newData).forEach(key => {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes.push({
        field: key,
        from: oldData[key],
        to: newData[key]
      });
    }
  });
  
  return changes;
};
