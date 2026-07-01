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
      correlationId: data?.correlationId || crypto.randomUUID(),
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
  }
) => {
  let q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(200));

  if (filters?.module) {
    q = query(q, where('module', '==', filters.module));
  }
  if (filters?.companyId) {
    q = query(q, where('companyId', '==', filters.companyId));
  }
  if (filters?.action) {
    q = query(q, where('action', '==', filters.action));
  }
  if (filters?.resourceId) {
    q = query(q, where('resourceId', '==', filters.resourceId));
  }

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as AuditLog));
    
    // Client-side date filtering since Firestore composite indexes are complex
    let filteredLogs = logs;
    if (filters?.dateStart) {
      filteredLogs = filteredLogs.filter(log => log.date >= (filters.dateStart || ''));
    }
    if (filters?.dateEnd) {
      filteredLogs = filteredLogs.filter(log => log.date <= (filters.dateEnd || ''));
    }

    callback(filteredLogs);
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
