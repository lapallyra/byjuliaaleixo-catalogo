import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp, 
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CommemorativeDate } from '../types';
import { handleFirestoreError, OperationType } from './firebaseService';

const COLLECTION_NAME = 'datas_comemorativas';

export const commemorativeDateService = {
  subscribe(callback: (dates: CommemorativeDate[]) => void) {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(q, (snapshot) => {
      const dates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommemorativeDate));
      callback(dates);
    }, (error) => handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME));
  },

  async addDate(date: Omit<CommemorativeDate, 'id' | 'createdAt' | 'updatedAt'>) {
    return addDoc(collection(db, COLLECTION_NAME), {
      ...date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async updateDate(id: string, updates: Partial<CommemorativeDate>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteDate(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return deleteDoc(docRef);
  },

  async toggleActive(id: string, active: boolean) {
    return this.updateDate(id, { active });
  },
};
