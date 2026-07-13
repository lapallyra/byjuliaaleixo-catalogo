import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { PromotionalCampaign } from "../types";

const COLLECTION_NAME = "promotional_campaigns";

export const promotionalCampaignService = {
  subscribe: (callback: (campaigns: PromotionalCampaign[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("priority", "asc"));
    return onSnapshot(q, (snapshot) => {
      const campaigns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PromotionalCampaign[];
      callback(campaigns);
    });
  },

  subscribeActive: (callback: (campaigns: PromotionalCampaign[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), where("active", "==", true), orderBy("priority", "asc"));
    return onSnapshot(q, (snapshot) => {
      const now = new Date();
      const campaigns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PromotionalCampaign[];
      
      const activeCampaigns = campaigns.filter(campaign => {
        if (campaign.startDate && new Date(campaign.startDate) > now) return false;
        if (campaign.endDate && new Date(campaign.endDate) < now) return false;
        return true;
      });
      callback(activeCampaigns);
    });
  },

  getAll: async (): Promise<PromotionalCampaign[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("priority", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PromotionalCampaign[];
  },

  getBySlug: async (slug: string): Promise<PromotionalCampaign | null> => {
    const q = query(collection(db, COLLECTION_NAME), where("slug", "==", slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as PromotionalCampaign;
  },

  create: async (data: Omit<PromotionalCampaign, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    const docRef = doc(collection(db, COLLECTION_NAME));
    const now = serverTimestamp();
    const payload = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, payload);
    return docRef.id;
  },

  update: async (id: string, data: Partial<PromotionalCampaign>): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(docRef, payload);
  },

  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },
};
