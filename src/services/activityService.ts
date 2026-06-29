import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ActivityLog } from '../types';

export const logActivity = async (
  actionType: ActivityLog['actionType'],
  entityType: ActivityLog['entityType'],
  entityName: string,
  userId: string,
  userName: string,
  module: string,
  details?: string
) => {
  try {
    const logsRef = collection(db, 'activity_logs');
    await addDoc(logsRef, {
      actionType,
      entityType,
      entityName,
      userId,
      userName,
      module,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
